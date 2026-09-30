/* 招商与合同业务演示模型。所有操作只修改本地演示数据。 */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),round=x=>Math.round((x+Number.EPSILON)*100)/100;
const date=s=>new Date(s+'T00:00:00Z'),iso=d=>d.toISOString().slice(0,10),add=(s,n)=>iso(new Date(+date(s)+n*86400000));
const fail=m=>{throw new Error(m)},uid=()=>Date.now()+Math.floor(Math.random()*10000);
function init(seed){
 const d=clone(seed);d.today='2026-09-11';d.schema=2;d.audit=[];d.ruleVersions=[];d.staff=[{name:'林晓',present:true},{name:'陈予',present:true},{name:'何川',present:false}];
 d.rules.version=1;d.rules.effective=d.today;
 d.channels=[{id:1,name:'汇园产业服务',no:'ZJ-2026-001',rate:1},{id:2,name:'城际招商伙伴',no:'ZJ-2026-002',rate:.8}];
 d.rulesHistory=[];d.holds=[];d.rules.rate=1;
 d.contracts.forEach(c=>{c.area=d.rooms.find(r=>r.id===c.room).area;c.versions=[];c.attachments=[];c.adjustments=[];c.bills=bills(c);});
 let next=3;
 d.rooms.forEach((r,i)=>{
  r.changes=[];r.initialPrice=r.price;
  if(!d.contracts.some(c=>c.room===r.id)&&['已出租','临期'].includes(r.status)){
   const c={id:next,no:'HT-2026-'+String(next++).padStart(3,'0'),name:r.client,room:r.id,area:r.area,start:'2025-10-01',end:r.status==='临期'?'2026-10-15':'2027-09-30',price:r.price,deposit:r.area*r.price*3,free:0,increase:3,status:'履约中',history:['2025-09-20 合同签约归档'],versions:[],attachments:[],adjustments:[]};c.bills=bills(c);d.contracts.push(c);
  }
  if(r.status==='待签约'&&!d.contracts.some(c=>c.room===r.id))d.holds.push({id:uid(),room:r.id,owner:'林晓',client:r.client,until:'2026-09-18',status:'有效'});
 });
 d.leads.forEach(l=>{l.applications=[{date:d.today,source:l.source,need:l.need}];l.assignedAt=d.today;l.assignment='V1 · 按排班轮询';});
 d.ads.forEach((a,i)=>{a.room=d.rooms.filter(r=>!d.contracts.some(c=>c.room===r.id)&&!d.holds.some(h=>h.room===r.id))[i].id;a.views=0;a.intents=0;a.submissions=0;});
 d.commissions=d.commissions.map((x,i)=>{let c=d.contracts[i%d.contracts.length],ch=d.channels[i%2];let amount=round(c.area*c.price*ch.rate);return {...x,contract:c.no,agencyContract:ch.no,channel:ch.name,area:c.area,rooms:1,amount,paid:x.status==='已结算'?amount:0,rate:ch.rate,base:round(c.area*c.price),history:[]};});
 d.ruleVersions.push({version:1,effective:d.today,scope:'仅新线索、新预占及新佣金；存量合同不追溯',rules:clone(d.rules)});
 sync(d);return d;
}
function bills(c){
 const result=[];let start=date(c.start),end=date(c.end);if(!Number.isFinite(+start)||!Number.isFinite(+end)||start>end)fail('合同日期无效');
 if((end-start)/86400000>3660)fail('原型最多支持 10 年租期');
 let current=new Date(start),freeEnd=add(c.start,Number(c.free||0));let raw={};
 while(current<=end){
  let s=iso(current),month=s.slice(0,7),dim=new Date(Date.UTC(current.getUTCFullYear(),current.getUTCMonth()+1,0)).getUTCDate();
  let years=current.getUTCFullYear()-start.getUTCFullYear();if(s.slice(5)<c.start.slice(5))years--;
  let original=Number(c.price)*Math.pow(1+Number(c.increase||0)/100,Math.max(years,0));
  let price=Number(c.changeDate&&s>=c.changeDate?c.changedPrice:original);
  let b=raw[month]??={month,days:0,freeDays:0,rent:0,unit:price};b.days++;if(s<freeEnd)b.freeDays++;else b.rent+=Number(c.area)*price/dim;
  current.setUTCDate(current.getUTCDate()+1);
 }
 Object.values(raw).forEach(b=>result.push({...b,rent:round(b.rent),unit:round(b.unit)}));
 return result;
}
function sync(d){
 d.holds.forEach(h=>{if(h.status==='有效'&&h.until<d.today)h.status='已到期'});
 for(const r of d.rooms){
  const contracts=d.contracts.filter(c=>c.room===r.id&&c.status!=='已退租');
  const pending=contracts.find(c=>c.status==='待退租结算');
  const current=contracts.find(c=>c.start<=d.today&&c.end>=d.today);
  const future=contracts.find(c=>c.start>d.today);
  const expired=contracts.find(c=>c.end<d.today);
  const hold=d.holds.find(h=>h.room===r.id&&h.status==='有效');
  r.status=pending?'待释放':current?(diff(d.today,current.end)<=d.rules.days&&!current.next?'临期':'已出租'):future?'待入驻':expired?'待释放':hold?'预占':'空置';
  r.client=(pending||current||future||expired)?.name||hold?.client||'';
 }
 const names=new Set([...d.leads.map(x=>x.name),...d.contracts.map(x=>x.name)]);
 names.forEach(name=>{if(!d.clients.some(c=>c.name===name))d.clients.push({id:uid(),name,type:'企业客户',contact:d.leads.find(l=>l.name===name)?.contact||'待完善',service:'',note:'',history:[]})});
 d.clients.forEach(client=>{
  const cs=d.contracts.filter(c=>c.name===client.name),active=cs.filter(c=>c.status!=='已退租'),prev=client.status;
  if(cs.length)client.status=active.length?(active.some(c=>c.start<=d.today)&&client.service?'已入驻':'待入驻'):'已搬离';
  else client.status='未成交';
  client.history??=[];if(prev!==client.status)client.history.push(d.today+' '+(prev||'新建')+' → '+client.status);
 });
}
function diff(a,b){return Math.ceil((date(b)-date(a))/86400000)}
function stamp(d,action,entity){d.audit.unshift({date:d.today,action,entity});sync(d)}
function hold(d,room,client,owner){
 sync(d);let r=d.rooms.find(x=>x.id===room);if(r?.status!=='空置')fail('房源已被占用，请刷新房态');
 if(!client.trim())fail('请填写预占客户');let h={id:uid(),room,client,owner,until:add(d.today,d.rules.lock),status:'有效',ruleVersion:d.rules.version};d.holds.push(h);stamp(d,'房源预占',room);return h;
}
function cancelHold(d,id){let h=d.holds.find(x=>x.id===id);if(!h||h.status!=='有效')fail('预占已失效');h.status='已释放';stamp(d,'释放预占',h.room)}
function lead(d,input){
 if(!input.name.trim()||!/^1[3-9]\d{9}$/.test(input.phone))fail('请填写客户名称和有效的 11 位手机号');
 const existing=d.leads.find(l=>l.phone===input.phone);
 const app={date:d.today,source:input.source,adId:input.adId||null,need:input.need};
 if(existing){existing.applications.push(app);stamp(d,'合并重复申请',existing.name);return {record:existing,merged:true};}
 const staff=d.staff.filter(s=>s.present);if(!staff.length)fail('当前无在岗招商员，请先调整排班');
 let owner=staff[d.cursor++%staff.length].name;
 const l={...input,id:uid(),status:'待跟进',owner,applications:[app],assignedAt:d.today,assignment:'V'+d.rules.version+' · 排班轮询，跳过缺席人员'};
 d.leads.unshift(l);stamp(d,'线索分派至 '+owner,l.name);return {record:l,merged:false};
}
function convert(d,id){let l=d.leads.find(x=>x.id===id);if(l?.status!=='待跟进')fail('此线索已处理，不能重复转商机');l.status='已转商机';let o={id:uid(),name:l.name,area:'待确认',owner:l.owner,source:l.source,stage:'初步接洽',room:'',log:[d.today+' 线索转商机'],leadId:l.id};d.opps.unshift(o);stamp(d,'转商机',l.name);return o;}
function available(d,room,start,end,ignore){
 return !d.contracts.some(c=>c.room===room&&c.id!==ignore&&c.status!=='已退租'&&start<=c.end&&end>=c.start);
}
function sign(d,input,oppId=0,previous=0){
 sync(d);let r=d.rooms.find(r=>r.id===input.room);if(!r)fail('请选择房源');
 if(!input.name.trim()||input.start>=input.end)fail('客户必填，结束日期必须晚于开始日期');
 if(!available(d,r.id,input.start,input.end))fail('该房源在所选租期已存在合同，不可重复签约');
 if(r.status==='待释放')fail('房源尚未完成退租结算，暂不能重新签约');
 let hold=d.holds.find(h=>h.room===r.id&&h.status==='有效');if(hold&&hold.client!==input.name)fail('房源已由其他客户预占');
 if(+input.price<r.price*d.rules.discount/100&&!previous)fail('报价低于当前折扣底线，请调整报价或规则');
 let c={...input,id:uid(),no:'HT-2026-'+String(d.contracts.length+1).padStart(3,'0'),area:r.area,status:'已签约',versions:[],attachments:[],adjustments:[],history:[d.today+' 合同签约 · 规则 V'+d.rules.version],ruleVersion:d.rules.version};
 ['price','deposit','free','increase'].forEach(k=>{c[k]=Number(c[k]);if(!Number.isFinite(c[k])||c[k]<0)fail('合同金额及计租参数不能为负')});
 c.bills=bills(c);if(previous){c.previous=previous;d.contracts.find(x=>x.id===previous).next=c.id;}
 d.contracts.unshift(c);if(hold)hold.status='已签约';
 if(oppId){let o=d.opps.find(o=>o.id===oppId);if(o){o.stage='已签约';o.room=c.room;o.log.push(d.today+' 签约 '+c.no)}}
 stamp(d,previous?'新建续约合同':'合同签约',c.no);return c;
}
function amend(d,id,values){
 let c=d.contracts.find(c=>c.id===id);if(!c||['已退租','待退租结算'].includes(c.status))fail('当前合同不可变更');
 if(values.effective<=d.today||values.effective<c.start||values.effective>c.end)fail('变更生效日须晚于演示日且在合同租期内');
 if(c.changeDate)fail('当前版本已有待生效调价，请先核对该版本');
 const price=Number(values.price);if(!Number.isFinite(price)||price<0||!values.reason.trim())fail('请填写有效租金及变更原因');
 const snapshot=clone(c);delete snapshot.versions;c.versions.push({version:c.versions.length+1,savedAt:d.today,snapshot});
 c.changeDate=values.effective;c.changedPrice=price;const proposed=bills(c);
 c.adjustments=proposed.filter(b=>b.rent!==c.bills.find(x=>x.month===b.month)?.rent).map(b=>({month:b.month,old:c.bills.find(x=>x.month===b.month)?.rent||0,next:b.rent,diff:round(b.rent-(c.bills.find(x=>x.month===b.month)?.rent||0))}));
 c.history.push(d.today+' 变更V'+(c.versions.length+1)+'，'+values.effective+'起单价 '+price+'；原因：'+values.reason+'；原始账单保留，差额单独列示');
 stamp(d,'保存合同版本及调整单',c.no);
}
function requestExit(d,id,values){
 let c=d.contracts.find(c=>c.id===id);if(!c||c.next||['已退租','待退租结算'].includes(c.status))fail('存在续约合同或已提交退租，不能重复办理');
 if(values.date< c.start||values.date>d.today)fail('退租日须在起租日至当前演示日之间');
 let due=Number(values.due),refund=Number(values.refund);if(due<0||refund<0||refund>c.deposit||!values.reason.trim())fail('请核对欠款、押金退款及退租原因');
 c.exit={...values,due,refund,settled:false};c.status='待退租结算';c.history.push(d.today+' 提交退租，等待结清');stamp(d,'退租待结算',c.no);
}
function settleExit(d,id,receipt){
 let c=d.contracts.find(c=>c.id===id);if(c?.status!=='待退租结算'||c.exit.settled)fail('此退租单已处理');if(!receipt.trim())fail('请填写结算凭证');
 c.exit.settled=true;c.exit.receipt=receipt;c.status='已退租';c.history.push(d.today+' 欠款收取 ¥'+c.exit.due+'，押金退款 ¥'+c.exit.refund+'，凭证 '+receipt+'；完成退租结算');stamp(d,'结算后释放房源',c.room);
}
function resource(d,id,input){
 let r=d.rooms.find(r=>r.id===id);if(!Number.isFinite(+input.price)||+input.price<0||!Number.isFinite(+input.area)||+input.area<=0)fail('面积须大于零，租金不得为负');
 r.changes.push({date:d.today,old:{area:r.area,price:r.price,operator:r.operator,tag:r.tag},next:clone(input)});Object.assign(r,input,{price:+input.price,area:+input.area});stamp(d,'更新挂牌资源，合同快照保持',id);
}
function rules(d,input){
 const old=clone(d.rules);let next={...input};['days','repeat','rate','discount','lock'].forEach(k=>{next[k]=+next[k];if(!Number.isFinite(next[k])||next[k]<0)fail('规则数值无效')});
 if(!next.days||!next.repeat||!next.lock||next.discount<1||next.discount>100||!next.notify.trim())fail('请核对预警天数、折扣和接收方');
 const order=next.order.split(',').map(x=>x.trim()).filter(Boolean);if(!order.length||new Set(order).size!==order.length)fail('排班名单不能为空或重复');
 next.sources=next.sources.split(',').map(x=>x.trim()).filter(Boolean).join(',');if(!next.sources)fail('至少配置一个来源');
 next.version=old.version+1;next.effective=d.today;next.order=order.join(',');d.rules=next;d.staff=order.map(name=>d.staff.find(s=>s.name===name)||{name,present:true});d.cursor=0;
 d.ruleVersions.unshift({version:next.version,effective:d.today,scope:'新线索、新预占及新申请使用本版本；合同和既有分派不追溯',rules:clone(next)});
 stamp(d,'规则发布 V'+next.version,'招商规则');
}
function remind(d,simulateFail=false){
 let made=0;d.contracts.filter(c=>c.status!=='已退租'&&c.status!=='待退租结算'&&!c.next&&diff(d.today,c.end)<=d.rules.days).forEach(c=>{
  let key=c.id+'|'+c.end+'|'+d.rules.notify;
  if(d.notifications.some(n=>n.key===key))return;
  d.notifications.unshift({id:uid(),key,contract:c.id,end:c.end,time:d.today,text:c.name+' / '+c.no+' 将于 '+c.end+' 到期',receiver:d.rules.notify,status:simulateFail?'发送失败':'已送达（模拟）',attempts:1});made++;
 });stamp(d,'运行临期检查，新增 '+made+' 条','通知');return made;
}
function retry(d,id){let n=d.notifications.find(n=>n.id===id);if(n?.status!=='发送失败')fail('该通知无需重试');n.attempts++;n.status='已送达（模拟）';stamp(d,'通知重试成功',n.text)}
function commission(d,input){
 let c=d.contracts.find(c=>c.no===input.contract),ch=d.channels.find(c=>c.id===+input.channelId);if(!c||c.status==='已退租'||!ch)fail('请选择有效合同和渠道');
 if(d.commissions.some(x=>x.contract===c.no&&x.status!=='已驳回'))fail('该租赁合同已有佣金申请，不能重复申请');
 let amount=round(c.area*c.price*ch.rate),x={id:uid(),channel:ch.name,agencyContract:ch.no,contract:c.no,month:input.month,rooms:1,area:c.area,rate:ch.rate,base:round(c.area*c.price),amount,paid:0,status:'待审批',history:[d.today+' 申请，标准快照 '+ch.rate+' 个月租金']};d.commissions.unshift(x);stamp(d,'佣金申请',c.no);return x;
}
function pay(d,id,receipt){
 let c=d.commissions.find(c=>c.id===id);if(c?.status!=='待结算'||c.paid)fail('审批未通过或已发放，不能重复结算');if(!receipt.trim())fail('发放凭证必填');c.paid=c.amount;c.status='已结算';c.result=d.today+' / '+receipt;c.history.push(c.result);stamp(d,'佣金发放',c.contract);
}
const api={init,bills,sync,diff,add,hold,cancelHold,lead,convert,sign,amend,requestExit,settleExit,resource,rules,remind,retry,commission,pay,available,clone,round,stamp};
if(typeof module!=='undefined')module.exports=api;root.ParkModel=api;
})(typeof window==='undefined'?globalThis:window);
