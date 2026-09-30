(()=>{
'use strict';
const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let criteria={area:220,budget:72,industry:'科技研发',move:'2026-11',power:'需要'},selected=[];
function data(){const d=ParkStore.read();d.brokerReports??=[];return d}
function route(){return location.hash.slice(1)||'home'}
function openPage(hash){location.hash=hash}
function available(d=data()){return d.ads.filter(a=>a.status==='已发布').map(a=>({ad:a,room:d.rooms.find(r=>r.id===a.room)})).filter(x=>x.room&&x.room.status==='空置')}
function score(r){
 let s=100,why=[],gap=Math.abs(r.area-criteria.area)/criteria.area;s-=Math.min(35,Math.round(gap*48));
 if(r.price<=criteria.budget)why.push('租金符合预算');else{s-=Math.min(28,(r.price-criteria.budget)*4);why.push('租金略高于预算')}
 if(criteria.power==='需要'&&r.area>=180)why.push('适合研发场景');else if(criteria.power==='需要'){s-=10;why.push('动力条件需确认')}
 why.push('面积偏差 '+Math.round(gap*100)+'%');
 return {room:r,score:Math.max(35,Math.round(s)),why};
}
function results(){return available().map(x=>score(x.room)).sort((a,b)=>b.score-a.score)}
function smartPage(){
 const list=results();
 return '<main><section class="smart-hero"><div class="wrap"><span class="eyebrow">SMART SPACE MATCHING</span><h1>告诉我们团队需要什么，快速找到更合适的空间</h1><p>综合面积、预算、研发条件与可租状态进行推荐，并说明匹配原因。</p></div></section><div class="wrap smart-shell"><form class="smart-form" id="smart-form"><h2>团队选址需求</h2><p>约 1 分钟，生成可比较的空间清单。</p><label>期望面积（㎡）</label><input name="area" type="number" min="30" value="'+criteria.area+'" required><label>租金上限（元/㎡/月）</label><input name="budget" type="number" min="1" value="'+criteria.budget+'" required><label>企业方向</label><select name="industry">'+['科技研发','智能制造','数字创意','专业服务'].map(x=>'<option '+(x===criteria.industry?'selected':'')+'>'+x+'</option>').join('')+'</select><label>预计入驻月份</label><input name="move" type="month" value="'+criteria.move+'" required><label>研发动力条件</label><select name="power"><option '+(criteria.power==='需要'?'selected':'')+'>需要</option><option '+(criteria.power==='不需要'?'selected':'')+'>不需要</option></select><button class="primary" type="submit">生成匹配结果 →</button></form><section><div class="section-head"><div><span class="eyebrow">MATCHED FOR YOU</span><h2>推荐空间</h2><p>共 '+list.length+' 个可预约结果，最多选择 3 个方案对比。</p></div></div><div class="smart-results">'+list.map((x,i)=>'<article class="smart-card"><div class="smart-score">'+x.score+'<small>MATCH SCORE</small></div><div><h3>'+x.room.id+' · '+x.room.area+'㎡ '+esc(x.room.tag)+'</h3><p>'+x.why.map(esc).join(' · ')+'</p><p>'+x.room.price+' 元/㎡/月 · 参考月租 ¥'+(x.room.area*x.room.price).toLocaleString()+'</p></div><button class="button '+(selected.includes(x.room.id)?'primary':'')+'" data-v4="toggle-compare" data-room="'+esc(x.room.id)+'">'+(selected.includes(x.room.id)?'已加入对比 ✓':'加入对比')+'</button></article>').join('')+'</div>'+(selected.length?'<div class="compare-bar"><div><strong>已选择 '+selected.length+' 个空间</strong><span> '+selected.join(' · ')+'</span></div><button class="button primary" data-v4="show-compare">查看方案对比 →</button></div>':'')+'</section></div></main>';
}
function partnerPage(){
 const d=data(),mine=d.brokerReports.filter(r=>r.broker==='汇园产业服务');
 return '<main><div class="wrap page-top"><span class="eyebrow">BROKER COOPERATION</span><h1>渠道合作与客户报备</h1><p>在线报备客户，系统自动查重并生成保护期，后续带看、签约和佣金有据可查。</p></div><div class="wrap partner-layout"><section><h2>合作规则清晰，进度随时可查</h2><div class="partner-value"><div><b>自动查重</b><span>客户名称与手机号联合校验</span></div><div><b>30 天保护</b><span>有效报备生成客户保护期</span></div><div><b>结果可追踪</b><span>带看、签约、结佣状态贯通</span></div></div><h2>我的报备</h2>'+(mine.length?mine.map(r=>'<div class="report-status"><b>'+esc(r.company)+' · '+esc(r.room||'待匹配')+'</b><span>'+esc(r.status)+(r.until&&r.until!=='—'?' · 保护至 '+r.until:'')+'</span><small>'+r.created+' · '+esc(r.need)+'</small></div>').join(''):'<p class="muted">暂无报备记录。</p>')+'</section><form class="partner-form" id="partner-form"><h2>提交客户报备</h2><p class="muted">演示渠道：汇园产业服务 · 许经理</p><div class="field"><label>客户企业名称</label><input name="company" required placeholder="请输入完整工商名称"></div><div class="field"><label>客户手机号</label><input name="clientPhone" type="tel" required pattern="1[3-9][0-9]{9}" placeholder="用于查重"></div><div class="field"><label>空间需求</label><textarea name="need" rows="3" required placeholder="面积、用途、计划入驻时间"></textarea></div><div class="field"><label>意向房源</label><select name="room"><option value="">待园区匹配</option>'+available(d).map(x=>'<option>'+esc(x.room.id)+'</option>').join('')+'</select></div><label class="consent"><input type="checkbox" required><span>确认已获得客户授权，并同意按园区渠道规则报备。</span></label><button class="primary" type="submit">提交并校验 →</button></form></div></main>';
}
function compareDialog(){
 const d=data(),rooms=selected.map(id=>d.rooms.find(r=>r.id===id)).filter(Boolean);
 const root=$('#dialog-root');root.innerHTML='<dialog aria-label="空间方案对比"><div class="dialog-head"><h2>空间方案对比</h2><button data-v4="close-dialog">✕</button></div><div class="dialog-body"><p class="form-note">以下费用为挂牌口径估算，最终以园区正式报价为准。</p><div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr><th>对比项</th>'+rooms.map(r=>'<th>'+esc(r.id)+'</th>').join('')+'</tr></thead><tbody><tr><td>面积</td>'+rooms.map(r=>'<td>'+r.area+'㎡</td>').join('')+'</tr><tr><td>挂牌租金</td>'+rooms.map(r=>'<td>'+r.price+' 元/㎡/月</td>').join('')+'</tr><tr><td>参考月租</td>'+rooms.map(r=>'<td>¥'+(r.area*r.price).toLocaleString()+'</td>').join('')+'</tr><tr><td>空间标签</td>'+rooms.map(r=>'<td>'+esc(r.tag)+'</td>').join('')+'</tr><tr><td>匹配分</td>'+rooms.map(r=>'<td><strong>'+score(r).score+'</strong></td>').join('')+'</tr></tbody></table></div><button class="primary" data-v4="compare-apply" style="width:100%;margin-top:22px">选择首选空间并预约 →</button></div></dialog>';root.querySelector('dialog').showModal();
}
function closeDialog(){const d=$('#dialog-root dialog');d?.close();$('#dialog-root').innerHTML=''}
function notify(text){const t=$('#customer-toast');t.textContent=text;t.hidden=false;clearTimeout(window.v4ToastTimer);window.v4ToastTimer=setTimeout(()=>t.hidden=true,3200)}
function submitPartner(form){
 const d=data(),v=Object.fromEntries(new FormData(form)),duplicate=d.leads.some(l=>(l.phone===v.clientPhone||l.name===v.company)&&l.status!=='无效')||d.brokerReports.some(r=>(r.clientPhone===v.clientPhone||r.company===v.company)&&r.status==='保护中');
 const record={id:Date.now(),broker:'汇园产业服务',contact:'许经理',phone:'13880001001',company:v.company.trim(),clientPhone:v.clientPhone,need:v.need.trim(),room:v.room,created:d.today,until:duplicate?'—':ParkModel.add(d.today,30),status:duplicate?'待判定':'保护中'};
 d.brokerReports.unshift(record);
 if(!duplicate)ParkModel.lead(d,{name:record.company,contact:'渠道客户',phone:record.clientPhone,need:record.need,source:'渠道报备'});
 ParkStore.write(d);renderV4();notify(duplicate?'已提交，发现疑似撞单，等待园区判定。':'报备成功，客户保护期已生成。');
}
function enhanceNav(){
 const nav=document.querySelector('.site-nav');if(!nav)return;
 const applications=nav.querySelector('a[href="#applications"]');
 const match=document.createElement('a');match.href='#match';match.textContent='智能找房';if(route()==='match')match.className='active';
 const partner=document.createElement('a');partner.href='#partner';partner.textContent='渠道合作';if(route()==='partner')partner.className='active';
 nav.insertBefore(match,applications);nav.insertBefore(partner,applications);
}
function renderV4(){
 CustomerDemo.render();enhanceNav();
 const r=route(),main=document.querySelector('#customer-app main');
 if(r==='match'&&main)main.outerHTML=smartPage();
 if(r==='partner'&&main)main.outerHTML=partnerPage();
}
document.addEventListener('submit',e=>{
 if(e.target.id==='smart-form'){e.preventDefault();const d=Object.fromEntries(new FormData(e.target));criteria={...d,area:+d.area,budget:+d.budget};renderV4();window.scrollTo({top:260,behavior:'smooth'})}
 if(e.target.id==='partner-form'){e.preventDefault();submitPartner(e.target)}
});
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-v4]');if(!t)return;
 if(t.dataset.v4==='toggle-compare'){const id=t.dataset.room;if(selected.includes(id))selected=selected.filter(x=>x!==id);else if(selected.length<3)selected.push(id);else{notify('最多对比 3 个空间');return}renderV4()}
 if(t.dataset.v4==='show-compare')compareDialog();
 if(t.dataset.v4==='close-dialog')closeDialog();
 if(t.dataset.v4==='compare-apply'){const id=selected[0];closeDialog();openPage('space/'+encodeURIComponent(id))}
});
window.addEventListener('hashchange',()=>setTimeout(renderV4,0));
window.addEventListener('focus',()=>{if(['match','partner'].includes(route()))renderV4()});
renderV4();
window.CustomerTopTier={render:renderV4,results,selected:()=>selected};
})();
