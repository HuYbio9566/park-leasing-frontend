// Local DOM tests only. Requires jsdom 26+ and jsqr 1.4 on NODE_PATH; no network or browser.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM,VirtualConsole,ResourceLoader}=require('jsdom'),jsQR=require('jsqr');
const base=path.resolve(__dirname,'../../02-前端版本/V03-2026-09-25-权限版本起点');
const errors=[],vc=new VirtualConsole();
vc.on('jsdomError',error=>{if(!error.message.includes('Could not parse CSS'))errors.push(error.message)});
let downloaded=null,printed=false,blob=null;
const delayed=process.env.VISITOR_DELAY_SCRIPTS==='1';
class LocalScripts extends ResourceLoader{
  fetch(url,options){
    if(options.element.localName!=='script')return null;
    const resource=new URL(url);
    assert.equal(resource.origin,'https://local-source-test.invalid');
    const source=fs.readFileSync(path.join(base,decodeURIComponent(resource.pathname.slice(1))));
    const delay=resource.pathname.endsWith('/miniprogram-services.js')?150:10;
    return new Promise(resolve=>setTimeout(()=>resolve(source),delay));
  }
}
const dom=new JSDOM(fs.readFileSync(path.join(base,'miniprogram-view-v3.html'),'utf8'),{
  runScripts:delayed?'dangerously':'outside-only',resources:delayed?new LocalScripts():undefined,
  url:'https://local-source-test.invalid',pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(w){
    w.matchMedia=()=>({matches:false,addListener(){},addEventListener(){},removeEventListener(){}});
    w.alert=()=>{};w.HTMLMediaElement.prototype.pause=function(){};
    w.URL.createObjectURL=value=>{blob=value;return 'blob:local-test'};w.URL.revokeObjectURL=()=>{};
    w.HTMLAnchorElement.prototype.click=function(){downloaded={href:this.href,name:this.download}};
    w.print=()=>{printed=!!w.document.querySelector('body.visitor-print>#visitor-print-sheet svg')};
  }
});
const w=dom.window,d=w.document;
const pause=()=>new Promise(resolve=>setTimeout(resolve,30));
const submit=id=>d.getElementById(id).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
const set=(key,value)=>{d.getElementById('visit-'+key).value=value};
const current=step=>assert.equal(d.querySelector('.visit-steps [aria-current]').textContent.trim().charAt(0),String(step));
const code=()=>d.getElementById('visit-demo-code').textContent;
const msg=()=>d.getElementById('visit-status').textContent;
const local=date=>new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
function readBlob(value){return new Promise(resolve=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.readAsText(value)})}
function decodeSvg(svg){
  const count=Number(svg.getAttribute('viewBox').split(' ')[2]),scale=6,size=count*scale;
  const pixels=new Uint8ClampedArray(size*size*4).fill(255);
  for(const match of svg.querySelector('path').getAttribute('d').matchAll(/M(\d+) (\d+)h1v1h-1z/g)){
    const x=Number(match[1])*scale,y=Number(match[2])*scale;
    for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){
      const i=((y+dy)*size+x+dx)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;
    }
  }
  const decoded=jsQR(pixels,size,size);assert.ok(decoded,'QR should decode');return JSON.parse(decoded.data);
}
(async()=>{
  // Parser-driven local resource loading preserves DOMContentLoaded ordering;
  // synchronous eval alone hides timers running before the homepage rebuild.
  if(delayed){
    if(d.readyState!=='complete')await new Promise(resolve=>w.addEventListener('load',resolve,{once:true}));
  }else{
    for(const script of d.scripts){
      const text=script.src?fs.readFileSync(path.join(base,script.getAttribute('src').split('?')[0]),'utf8'):script.textContent;
      new vm.Script(text);w.eval(text);
    }
  }
  await pause();
  assert.equal(d.querySelector('#leasing-chat .chat-notice'),null);
  assert.ok(!d.querySelector('#leasing-chat').textContent.includes('演示'));
  assert.equal(d.querySelector('#leasing-chat .chat-agent p').textContent,'自助咨询 · 自动回复');
  assert.equal(d.querySelector('#meeting .meeting-results > .field-title').textContent.trim(),'会议室列表');
  assert.equal(d.querySelector('#meeting .my-bookings-button'),null);
  assert.equal(d.querySelector('#profile [data-page="my-bookings"] .mp-service-title').textContent,'我的会议');
  assert.equal(d.querySelector('#profile [data-page="visitor-records"] .mp-service-title').textContent,'我的访客');
  assert.deepEqual(Array.from(d.querySelectorAll('#profile .mp-my-services [data-profile-entry]'),node=>node.dataset.profileEntry),['我的会议','我的访客','我的收藏','我的申请','空间咨询','报修与服务']);
  assert.equal(d.querySelector('#profile [data-profile-entry="报修与服务"]').dataset.page,'repair-records');
  assert.equal(d.querySelector('#profile [data-profile-entry="我的收藏"]').dataset.profileNotice,'我的收藏暂未开放');
  assert.deepEqual(Array.from(d.querySelectorAll('#home-park-services .home-park-service-grid button b'),node=>node.textContent),['车辆服务','物业报修','订餐服务','物品放行','装修申请','反馈通道','水电缴费','更多服务']);
  d.querySelector('#home-park-services [data-page="feedback"]').click();
  assert.equal(d.getElementById('feedback').classList.contains('hidden'),false);
  d.querySelector('#home-park-services [data-park-unavailable="水电缴费"]').click();
  assert.equal(d.querySelector('.home-park-service-notice').textContent,'水电缴费暂未开放');
  assert.equal(d.querySelector('.home-park-service-notice').hidden,false);
  assert.equal(d.querySelector('#home-park-services [data-page="my-bookings"],#home-park-services [data-page="visitor"]'),null);
  const RealDate=w.Date;let offset=0;
  const initialRole=d.getElementById('profile').dataset.role;
  for(const [role,hidden] of [['employee',true],['admin',false],['internal',true],['property',false],['guest',true]]){
    d.querySelector('.role-switch [data-role="'+role+'"]').click();
    assert.equal(d.querySelector('#profile [data-profile-todos]').hidden,hidden,'todo visibility for '+role);
    const badges=d.querySelectorAll('#profile .mp-profile-card .mp-badge');
    assert.equal(badges.length,1,'single identity badge for '+role);
    assert.equal(badges[0].textContent,{guest:'未认证',employee:'企业员工',admin:'管理员',internal:'已认证',property:'物业人员'}[role]);
    assert.equal(badges[0].previousElementSibling.className,'mp-name');
    assert.equal(d.querySelector('#profile .mp-badges'),null);
  }
  d.querySelector('.role-switch [data-role="'+initialRole+'"]').click();
  await pause();
  w.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[RealDate.now()+offset]))}static now(){return RealDate.now()+offset}};
  const homeEntry=d.querySelector('#home .home-new-quick button');
  assert.equal(homeEntry.textContent.includes('访客预约'),true);assert.equal(homeEntry.dataset.page,'visitor');homeEntry.click();
  assert.equal(d.getElementById('visitor').classList.contains('hidden'),false);current(1);
  assert.equal(d.querySelector('#visitor .visit-notice'),null);
  assert.equal(d.querySelector('#visitor .visit-intro'),null);
  assert.ok(d.getElementById('visitor').firstElementChild.classList.contains('visit-steps'));
  assert.equal(d.querySelector('#visitor .visit-steps').nextElementSibling.id,'visit-info');
  submit('visit-info');assert.match(msg(),/访客姓名/);
  function fill(){
    for(const [key,value] of Object.entries({name:'测试访客',phone:'13812345678',company:'虚构企业',host:'<img src=x onerror=alert(1)>',email:'host@example.test',reason:'商务沟通',start:local(new w.Date(w.Date.now()+3600000)),end:local(new w.Date(w.Date.now()+7200000))}))set(key,value);
    d.getElementById('visit-consent').checked=true;
  }
  fill();set('phone','123');submit('visit-info');assert.match(msg(),/手机/);
  fill();set('email','invalid');submit('visit-info');assert.match(msg(),/邮箱/);
  fill();set('reason',' ');submit('visit-info');assert.match(msg(),/访问原因/);
  fill();set('start',local(new w.Date(w.Date.now()-3600000)));submit('visit-info');assert.match(msg(),/未来/);
  fill();set('end',d.getElementById('visit-start').value);submit('visit-info');assert.match(msg(),/晚于/);
  fill();d.getElementById('visit-consent').checked=false;submit('visit-info');assert.match(msg(),/同意/);
  fill();submit('visit-info');current(2);assert.match(msg(),/没有发送真实邮件/);
  assert.equal(d.querySelector('#visit-host-copy img'),null);assert.equal(d.getElementById('visit-host-copy').textContent,'<img src=x onerror=alert(1)>');
  const old=code();assert.match(old,/^\d{6}$/);assert.equal(d.getElementById('visit-resend').disabled,true);
  d.getElementById('visit-resend').onclick();assert.equal(code(),old);
  set('code','000000');submit('visit-verify');current(2);assert.match(msg(),/不正确/);
  offset+=31000;d.getElementById('visit-resend').onclick();assert.notEqual(code(),old);
  set('code',old);submit('visit-verify');assert.match(msg(),/不正确/);
  const expiring=code();offset+=301000;set('code',expiring);submit('visit-verify');assert.match(msg(),/过期/);
  d.getElementById('visit-resend').onclick();
  const invalidated=code();d.getElementById('visit-back').click();current(1);assert.equal(code(),'');
  set('company','另一家虚构企业');submit('visit-info');current(2);assert.ok(code());
  const save=w.MiniStore.save;w.MiniStore.save=()=>false;
  const before=w.MiniStore.data.visitors.length;set('code',code());submit('visit-verify');assert.match(msg(),/保存失败/);current(2);assert.equal(w.MiniStore.data.visitors.length,before);
  w.MiniStore.save=save;submit('visit-verify');current(3);assert.equal(w.MiniStore.data.visitors.length,before+1);
  assert.equal(d.getElementById('visit-demo-code').textContent,'');
  const payload=decodeSvg(d.querySelector('#visit-qr svg'));assert.equal(payload.type,'DEMO_ONLY_NOT_FOR_ENTRY');assert.equal(payload.id,d.getElementById('visit-pass-id').textContent);
  assert.equal(payload.from,new RealDate(d.getElementById('visit-start').value).toISOString());
  assert.deepEqual(Object.keys(payload).sort(),['from','id','type','until']);
  const stored=JSON.stringify(w.MiniStore.data.visitors[0]);assert.ok(!stored.includes('13812345678')&&!stored.includes('host@example.test')&&!stored.includes('测试访客'));
  assert.ok(d.querySelector('#visitor-records').textContent.includes('演示凭证'));
  submit('visit-verify');assert.equal(w.MiniStore.data.visitors.length,before+1);
  d.getElementById('visit-download').click();assert.equal(downloaded.name,payload.id+'.svg');assert.ok(blob);
  const savedSvg=await readBlob(blob),xml=new w.DOMParser().parseFromString(savedSvg,'image/svg+xml');
  assert.equal(xml.querySelector('parsererror'),null);assert.match(savedSvg,/不可用于门禁通行/);assert.deepEqual(decodeSvg(xml.querySelector('svg svg')),payload);
  d.getElementById('visit-print').click();assert.equal(printed,true);assert.equal(d.querySelectorAll('#visit-ticket').length,1);
  w.dispatchEvent(new w.Event('afterprint'));assert.equal(d.getElementById('visitor-print-sheet'),null);
  offset+=7200000;w.__showMiniPage('home');w.__showMiniPage('visitor');await pause();
  assert.match(d.getElementById('visit-validity').textContent,/已过期/);assert.equal(d.getElementById('visit-qr').hidden,true);assert.equal(d.getElementById('visit-print').disabled,true);
  d.getElementById('visit-download').onclick();assert.match(msg(),/失效/);
  d.getElementById('visit-new').click();current(1);assert.equal(d.getElementById('visit-name').value,'');
  fill();submit('visit-info');current(2);d.getElementById('profile').setAttribute('data-role','visitor-test-role');await pause();current(1);assert.equal(code(),'');assert.equal(d.getElementById('visit-email').value,'');
  fill();submit('visit-info');d.querySelector('#home .home-new-park b').textContent='另一个演示园区';await pause();current(1);assert.equal(d.getElementById('visit-name').value,'');
  fill();submit('visit-info');set('code',code());submit('visit-verify');current(3);
  w.MiniStore.data.visitors.length=0;w.dispatchEvent(new w.Event('mini-records-change'));current(1);assert.equal(d.querySelector('#visit-qr svg'),null);
  w.__showMiniPage('home');d.querySelector('#home .home-new-quick button:nth-child(2)').click();assert.equal(d.getElementById('meeting').classList.contains('hidden'),false);
  w.__showMiniPage('repair');assert.ok(d.querySelector('#repair .primary-button').onclick);
  assert.deepEqual(errors,[]);
  console.log('PASS: full-page initialization, visitor routing, required fields, dates, consent, safe text, code errors/expiry/resend/back, save rollback, deduplication, QR decode, private-data minimization, SVG export, print hooks, pass expiry, identity/park/record clearing, meeting and repair smoke checks. Browser layout and real email/access control are not tested.');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>w.close());
