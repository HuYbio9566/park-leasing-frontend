(()=>{
'use strict';
const customPages=new Set(['cockpit','enterprise','matching','tourquote','broker']);
const money4=n=>'¥ '+Math.round(Number(n)||0).toLocaleString('zh-CN');
let matchCriteria={enterprise:501,area:280,budget:75,industry:'新能源',power:'需要',move:'2026-11'};
function ensureV4(){
 db.enterprises??=[
  {id:501,name:'森禾新能源',industry:'新能源储能',city:'苏州',staff:86,stage:'B轮',score:92,growth:'A',risk:'低',needArea:280,budget:75,power:'需要',move:'2026-11',owner:'林晓',labels:['专精特新','研发型','高成长'],reason:['产业匹配 28/30','成长能力 24/25','履约稳定 21/25','入园协同 19/20']},
  {id:502,name:'北辰机器人',industry:'智能制造',city:'上海',staff:120,stage:'A轮',score:87,growth:'A',risk:'低',needArea:190,budget:72,power:'需要',move:'2026-12',owner:'陈予',labels:['机器人','研发中心'],reason:['产业匹配 27/30','成长能力 22/25','履约稳定 20/25','入园协同 18/20']},
  {id:503,name:'苏州一隅设计',industry:'数字创意',city:'苏州',staff:28,stage:'稳定经营',score:74,growth:'B',risk:'中',needArea:130,budget:65,power:'不需要',move:'2027-01',owner:'陈予',labels:['设计服务','轻办公'],reason:['产业匹配 21/30','成长能力 17/25','履约稳定 19/25','入园协同 17/20']},
  {id:504,name:'澄光智能科技',industry:'人工智能',city:'杭州',staff:64,stage:'A轮',score:89,growth:'A',risk:'低',needArea:320,budget:78,power:'不需要',move:'2026-10',owner:'林晓',labels:['人工智能','研发型','融资企业'],reason:['产业匹配 29/30','成长能力 23/25','履约稳定 20/25','入园协同 17/20']}
 ];
 db.policies??=[
  {id:1,name:'科技企业研发空间支持',industries:['新能源','人工智能','智能制造'],benefit:'最高 12 万元装修支持',threshold:85},
  {id:2,name:'高成长企业租金扶持',industries:['新能源','人工智能'],benefit:'首年租金 95 折',threshold:88},
  {id:3,name:'专精特新入园服务包',industries:['新能源','智能制造'],benefit:'政策申报与人才服务',threshold:80}
 ];
 db.tours??=[
  {id:701,date:'2026-09-12',slot:'10:00',company:'北辰机器人',room:'A-503',owner:'陈予',status:'待带看',source:'智能匹配'},
  {id:702,date:'2026-09-11',slot:'15:00',company:'澄光智能科技',room:'A-403',owner:'林晓',status:'已完成',source:'小程序预约'}
 ];
 db.quotes??=[
  {id:801,no:'BJ-2026-018',company:'澄光智能科技',created:'2026-09-11',status:'方案沟通',options:[
   {room:'A-403',years:3,discount:98,free:30,total:683452,label:'均衡方案'},
   {room:'A-503',years:3,discount:95,free:45,total:642180,label:'成本优先'},
   {room:'A-601',years:2,discount:100,free:15,total:412760,label:'快速入驻'}
  ]}
 ];
 db.brokerReports??=[
  {id:901,broker:'汇园产业服务',contact:'许经理',phone:'13880001001',company:'新链智造',clientPhone:'13920001001',need:'200–300㎡研发办公',room:'A-504',created:'2026-09-10',until:'2026-10-10',status:'保护中'},
  {id:902,broker:'城际招商伙伴',contact:'韩经理',phone:'13880001002',company:'北辰机器人',clientPhone:'13920001002',need:'约180㎡',room:'A-503',created:'2026-09-11',until:'—',status:'待判定'}
 ];
 db.channelStats??=[{name:'官网/小程序',leads:42,tours:18,deals:5,cost:18000},{name:'汇园产业服务',leads:18,tours:11,deals:4,cost:42000},{name:'平台招商会',leads:25,tours:9,deals:2,cost:26000},{name:'老客户推荐',leads:12,tours:8,deals:3,cost:6000}];
}
ensureV4();
if(!navs.some(n=>n[1]==='cockpit')){
 navs.unshift(['经营分析','cockpit','◫','经营驾驶舱','TOP']);
 navs.splice(3,0,['招商决策','enterprise','◎','企业研判','TOP'],['','matching','⌁','智能匹配','TOP'],['','tourquote','▣','带看与报价','TOP'],['','broker','◇','渠道报备','TOP']);
}
function navHtml(){
 return navs.map(n=>(n[0]?'<div class="navlabel">'+n[0]+'</div>':'')+'<button class="'+(page===n[1]?'active':'')+'" onclick="go(\''+n[1]+'\')"><i aria-hidden="true">'+n[2]+'</i>'+n[3]+'</button>').join('');
}
function conversion(){
 const leads=db.leads.length+18,opps=db.opps.length+8,tours=db.tours.length+5,deals=db.contracts.filter(c=>c.status!=='已退租').length;
 return [{name:'有效线索',n:leads,rate:100},{name:'已转商机',n:opps,rate:Math.round(opps/leads*100)},{name:'完成带看',n:tours,rate:Math.round(tours/leads*100)},{name:'签约成交',n:deals,rate:Math.round(deals/leads*100)}];
}
function cockpitPage(){
 const total=db.rooms.reduce((n,r)=>n+r.area,0),occupied=db.rooms.filter(r=>['已出租','临期'].includes(r.status)).reduce((n,r)=>n+r.area,0),rent=db.contracts.filter(c=>c.status!=='已退租').reduce((n,c)=>n+c.price*c.area,0),pipeline=db.opps.length*168000+db.quotes.length*320000;
 return heading('经营驾驶舱','从流量、商机、带看到签约与收入，统一查看经营结果。',btn('生成招商简报','brief()')+btn('进入智能匹配',"go('matching')",true))+
 '<div class="insight-banner"><div><strong>本周经营洞察：高分企业带看转化更快，但 250㎡以上空间供给偏紧</strong><p>建议优先推进森禾新能源与澄光智能科技，同时评估大面积房源拆分策略。</p></div>'+btn('查看企业研判',"go('enterprise')")+'</div>'+
 '<div class="metrics">'+metric('面积出租率',(occupied/total*100).toFixed(1),'%','已出租 '+occupied.toLocaleString()+' / '+total.toLocaleString()+' ㎡')+metric('月度合同租金',(rent/10000).toFixed(1),'万元','按有效合同条款口径')+metric('加权商机预测',(pipeline/10000).toFixed(1),'万元','按阶段概率测算')+metric('平均成交周期','38','天','较上月缩短 6 天')+'</div>'+
 '<div class="cockpit-grid"><section class="v4-panel"><div class="panelhead"><div><h2>招商转化漏斗</h2><small>最近 90 天 · 可追溯到获客来源</small></div><span class="score">18.6%</span></div>'+conversion().map((x,i)=>'<div class="funnel-row"><span>'+x.name+'</span><div class="funnel-track"><div class="funnel-fill '+(i>1?'gold':i?'blue':'')+'" style="width:'+Math.max(12,x.rate)+'%"></div></div><b>'+x.n+'</b></div>').join('')+'</section>'+
 '<section class="v4-panel"><h2>风险与机会</h2><div class="risk-list"><div class="risk-item"><span class="risk-mark">3</span><div><b>临期合同待续约</b><p>其中 1 份低于 30 天，需要负责人确认。</p></div></div><div class="risk-item"><span class="risk-mark">7</span><div><b>高分企业待推进</b><p>评分 ≥ 85，预计需求面积 1,640㎡。</p></div></div><div class="risk-item"><span class="risk-mark">2</span><div><b>渠道撞单待判定</b><p>需在 24 小时内完成归属审核。</p></div></div></div></section></div>'+
 '<div class="cockpit-grid"><section class="v4-panel"><div class="panelhead"><div><h2>渠道投入产出</h2><small>线索、带看、成交与获客成本</small></div>'+btn('渠道报备',"go('broker')")+'</div>'+table(['渠道','线索','带看','成交','单成交成本'],db.channelStats.map(c=>tr([esc(c.name),c.leads,c.tours,c.deals,money4(c.cost/Math.max(1,c.deals))])))+'</section>'+
 '<section class="v4-panel"><h2>未来 90 天预测</h2><div class="forecast"><div><span>预计签约</span><strong>5</strong><small>份合同</small></div><div><span>预计去化</span><strong>1,180</strong><small>㎡</small></div><div><span>预计新增年租</span><strong>286</strong><small>万元</small></div></div><div class="v4-note">预测由当前商机阶段、报价金额和历史转化率生成，原型仅展示产品逻辑。</div></section></div>';
}
function enterprisePage(){
 const list=db.enterprises.filter(e=>JSON.stringify(e).toLowerCase().includes(keyword.toLowerCase())&&(listFilter==='全部状态'||e.risk===listFilter));
 return heading('企业研判','把企业画像、产业准入、成长性和履约风险合并为招商优先级。',btn('导入企业名单',"toast('已模拟导入 12 家企业')")+btn('批量智能评分',"toast('企业评分已刷新')",true))+
 '<div class="metrics">'+metric('重点企业',db.enterprises.filter(e=>e.score>=85).length,'家','综合评分 ≥ 85')+metric('产业匹配',db.enterprises.filter(e=>e.score>=80).length,'家','符合园区主导产业')+metric('风险待核验',db.enterprises.filter(e=>e.risk!=='低').length,'家','需补充经营与信用材料')+metric('预计需求',db.enterprises.reduce((n,e)=>n+e.needArea,0).toLocaleString(),'㎡','企业当前选址需求')+'</div>'+
 '<div class="panel">'+searchFilters(['低','中','高'])+table(['企业 / 行业','招商评分','成长阶段','需求','适配标签','负责人','操作'],list.map(e=>tr(['<div class="company-cell"><b>'+esc(e.name)+'</b><small>'+esc(e.industry)+' · '+esc(e.city)+'</small></div>','<span class="score '+(e.score<80?'mid':'')+'">'+e.score+'</span>',esc(e.stage)+' / '+e.growth,e.needArea+'㎡ · ≤'+e.budget+'元','<div class="fit-tags">'+e.labels.map(t=>'<span>'+esc(t)+'</span>').join('')+'</div>',esc(e.owner),btn('查看研判','enterpriseDetail('+e.id+')')])))+'</div>';
}
window.enterpriseDetail=function(id){
 const e=db.enterprises.find(x=>x.id===id),policies=db.policies.filter(p=>p.threshold<=e.score&&p.industries.some(i=>e.industry.includes(i)));
 drawer('企业研判 · '+esc(e.name),'<div class="profile-hero"><span class="profile-score">'+e.score+'</span><h2>'+esc(e.name)+'</h2><p>'+esc(e.industry)+' · '+e.staff+' 人 · '+esc(e.stage)+' · 风险 '+e.risk+'</p></div><h3 class="section-title">评分解释</h3><div class="reason-grid">'+e.reason.map((r,i)=>'<div><span>'+['产业准入','成长能力','履约稳定','入园协同'][i]+'</span><b>'+esc(r.split(' ')[1])+'</b></div>').join('')+'</div><h3 class="section-title">可匹配政策</h3>'+table(['政策','企业收益'],policies.map(p=>tr([esc(p.name),esc(p.benefit)])))+'<div class="v4-note">系统建议：'+(e.score>=88?'列为 A 级重点商机，48 小时内安排带看与方案。':'补充经营材料后推进带看。')+'</div>',btn('进入智能匹配','startEnterpriseMatch('+id+')',true));
};
window.startEnterpriseMatch=function(id){const e=db.enterprises.find(x=>x.id===id);matchCriteria={enterprise:id,area:e.needArea,budget:e.budget,industry:e.industry,power:e.power,move:e.move};closeModal();go('matching')};
function scoreRoom(r,c){
 let s=100,why=[];
 const areaGap=Math.abs(r.area-c.area)/c.area;s-=Math.min(32,Math.round(areaGap*45));
 if(r.price>c.budget){s-=Math.min(28,(r.price-c.budget)*4);why.push('租金高于预算')}else why.push('租金在预算内');
 if(c.power==='需要'&&r.area<180){s-=12;why.push('动力条件需复核')}else if(c.power==='需要')why.push('适合研发用房');
 if(r.status!=='空置')s-=35;
 why.push('面积偏差 '+Math.round(areaGap*100)+'%');
 return {room:r,score:Math.max(28,Math.round(s)),why};
}
function matchedRooms(){return db.rooms.map(r=>scoreRoom(r,matchCriteria)).sort((a,b)=>b.score-a.score).slice(0,6)}
function matchingPage(){
 const e=db.enterprises.find(x=>x.id===+matchCriteria.enterprise)||db.enterprises[0],rooms=matchedRooms();
 return heading('智能匹配','把企业需求同时匹配到空间、价格与产业政策，并解释推荐原因。',btn('企业研判',"go('enterprise')"))+
 '<div class="match-workspace"><form class="v4-panel match-form" id="match-form" onsubmit="event.preventDefault();runMatch()"><h2>选址需求</h2><div class="field"><label>目标企业</label><select name="enterprise">'+db.enterprises.map(x=>'<option value="'+x.id+'" '+(x.id===+matchCriteria.enterprise?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></div><div class="field"><label>需求面积（㎡）</label><input name="area" type="number" min="50" value="'+matchCriteria.area+'"></div><div class="field"><label>租金上限（元/㎡/月）</label><input name="budget" type="number" min="1" value="'+matchCriteria.budget+'"></div><div class="field"><label>行业方向</label><input name="industry" value="'+esc(matchCriteria.industry)+'"></div><div class="field"><label>研发动力条件</label><select name="power"><option '+(matchCriteria.power==='需要'?'selected':'')+'>需要</option><option '+(matchCriteria.power==='不需要'?'selected':'')+'>不需要</option></select></div><button class="primary btn-primary" type="submit">重新计算匹配</button><div class="v4-note">评分综合面积、预算、可租状态、研发条件与园区产业规则。</div></form>'+
 '<section><div class="panelhead"><div><h2>'+esc(e.name)+' · 推荐结果</h2><small>'+matchCriteria.area+'㎡ · ≤ '+matchCriteria.budget+'元/㎡/月 · '+esc(matchCriteria.industry)+'</small></div><span class="score">'+rooms[0].score+'</span></div><div class="match-list">'+rooms.map((x,i)=>'<article class="match-card"><div class="match-rank">推荐 '+(i+1)+'<strong>'+x.score+'</strong></div><div><b>'+x.room.id+' · '+x.room.area+'㎡ · '+x.room.price+'元/㎡/月</b><p>'+x.why.map(esc).join('；')+'；'+(x.score>=80?'匹配研发空间支持政策':'建议人工复核')+'</p><div class="fit-tags"><span>'+esc(x.room.status)+'</span><span>'+esc(x.room.tag)+'</span><span>参考月租 '+money4(x.room.area*x.room.price)+'</span></div></div><div class="match-actions">'+btn('查看房源','roomDetail('+JSON.stringify(x.room.id)+')')+btn('安排带看','createTour('+JSON.stringify(x.room.id)+')',i===0)+'</div></article>').join('')+'</div></section></div>';
}
window.runMatch=function(){const d=Object.fromEntries(new FormData(document.querySelector('#match-form')));matchCriteria={...matchCriteria,...d,enterprise:+d.enterprise,area:+d.area,budget:+d.budget};render();toast('已根据最新需求重新排序')};
window.createTour=function(room){const e=db.enterprises.find(x=>x.id===+matchCriteria.enterprise)||db.enterprises[0];form('安排带看 · '+room,field('企业名称','company',e.name)+field('带看日期','date','2026-09-13','date')+field('到访时间','slot','10:00','time')+field('负责人','owner',e.owner,'text',db.staff.map(s=>s.name)),'saveTour('+JSON.stringify(room)+')','确认安排')};
window.saveTour=function(room){const d=data();db.tours.unshift({...d,id:Date.now(),room,status:'待带看',source:'智能匹配'});save();closeModal();page='tourquote';render();toast('带看已创建，并同步到商机协同')};
function tourQuotePage(){
 return heading('带看与报价','将预约、到访反馈、多个租赁方案和客户选择连在一起。',btn('新建带看',"createTour('A-504')")+btn('新建报价','quoteForm()',true))+
 '<div class="cockpit-grid"><section class="v4-panel"><div class="panelhead"><div><h2>带看日程</h2><small>招商员、客户和房源共享同一安排</small></div><span class="score">'+db.tours.filter(t=>t.status==='待带看').length+'</span></div>'+db.tours.map(t=>'<div class="calendar-day"><b>'+t.date+'<br><small>'+t.slot+'</small></b><div><strong>'+esc(t.company)+' · '+esc(t.room)+'</strong><small>'+esc(t.owner)+' · '+esc(t.source)+'</small></div>'+btn(t.status,t.status==='待带看'?'finishTour('+t.id+')':'toast(\'已记录带看反馈\')')+'</div>').join('')+'</section>'+
 '<section class="v4-panel"><h2>本周带看质量</h2><div class="forecast"><div><span>到访率</span><strong>83%</strong></div><div><span>二次沟通</span><strong>67%</strong></div><div><span>转报价</span><strong>42%</strong></div></div><div class="v4-note">完成带看后记录关注点、异议和下一步，自动更新商机阶段。</div></section></div>'+
 db.quotes.map(q=>'<section class="v4-panel" style="margin-bottom:18px"><div class="panelhead"><div><h2>'+q.no+' · '+esc(q.company)+'</h2><small>'+q.created+' · '+q.status+' · 多方案对比</small></div>'+btn('发送客户确认',"toast('已生成客户方案链接（原型）')",true)+'</div>'+q.options.map(o=>'<div class="quote-option"><div><strong>'+esc(o.label)+' · '+esc(o.room)+'</strong><span>'+o.years+' 年租期 · 免租 '+o.free+' 天</span></div><div><strong>'+o.discount+' 折</strong><span>租金折扣</span></div><div><strong>'+money4(o.total)+'</strong><span>租期总租金</span></div><div><strong>'+money4(o.total/(o.years*12))+'</strong><span>月均成本</span></div>'+btn('选为意向','chooseQuote('+q.id+','+JSON.stringify(o.room)+')')+'</div>').join('')+'</section>').join('');
}
window.finishTour=function(id){const t=db.tours.find(x=>x.id===id);form('完成带看 · '+esc(t.company),field('客户反馈','feedback','关注交付周期和会议室配置')+field('下一步','next','制作报价方案','text',['制作报价方案','安排二次带看','暂缓跟进']),'completeTour('+id+')','保存反馈')};
window.completeTour=function(id){const t=db.tours.find(x=>x.id===id),d=data();Object.assign(t,{status:'已完成',feedback:d.feedback,next:d.next});save();closeModal();render();toast('带看反馈已保存')};
window.quoteForm=function(){form('新建多方案报价',field('客户企业','company',db.enterprises[0].name,'text',db.enterprises.map(e=>e.name))+field('候选房源','room','A-504','text',db.rooms.filter(r=>r.status==='空置').map(r=>r.id))+field('租期（年）','years',3,'number')+field('折扣（折）','discount',98,'number')+field('免租期（天）','free',30,'number')+'<div class="field full spec">将自动生成主方案、成本优先和快速入驻三个可比方案。</div>','createQuote()','生成报价')};
window.createQuote=function(){const d=data(),r=db.rooms.find(x=>x.id===d.room),base=r.area*r.price*12*(+d.years)*(+d.discount/100);db.quotes.unshift({id:Date.now(),no:'BJ-2026-'+String(db.quotes.length+19).padStart(3,'0'),company:d.company,created:db.today,status:'待发送',options:[{room:r.id,years:+d.years,discount:+d.discount,free:+d.free,total:Math.round(base),label:'主推方案'},{room:r.id,years:+d.years,discount:Math.max(90,+d.discount-3),free:+d.free+15,total:Math.round(base*.95),label:'成本优先'},{room:r.id,years:2,discount:100,free:15,total:Math.round(r.area*r.price*24),label:'快速入驻'}]});save();closeModal();render();toast('已生成三个可比较方案')};
window.chooseQuote=function(id,room){const q=db.quotes.find(x=>x.id===id);q.status='客户意向 · '+room;save();render();toast('客户意向方案已记录')};
function brokerPage(){
 const pending=db.brokerReports.filter(r=>r.status==='待判定').length;
 return heading('渠道报备','统一处理客户报备、撞单判定、保护期与后续佣金依据。',btn('渠道与分佣标准',"go('commission')"))+
 '<div class="metrics">'+metric('保护中客户',db.brokerReports.filter(r=>r.status==='保护中').length,'个','保护期内保持渠道归属')+metric('待判定撞单',pending,'个','建议 24 小时内处理')+metric('本月渠道带看','11','次','较上月增加 3 次')+metric('渠道成交率','22.2','%','报备到签约口径')+'</div>'+
 '<div class="panel"><div class="panelhead"><div><h2>客户报备清单</h2><small>报备时间、手机号、渠道和客户名称联合查重</small></div><span class="badge warn">'+pending+' 个待处理</span></div>'+table(['渠道 / 联系人','客户企业','需求 / 房源','报备时间','保护期','状态','操作'],db.brokerReports.map(r=>tr(['<b>'+esc(r.broker)+'</b><br><small>'+esc(r.contact)+' '+esc(r.phone)+'</small>',esc(r.company)+'<br><small>'+esc(r.clientPhone)+'</small>',esc(r.need)+'<br><small>'+esc(r.room||'待匹配')+'</small>',r.created,r.until,'<span class="channel-state '+(r.status==='待判定'?'collision':'')+'">'+esc(r.status)+'</span>',r.status==='待判定'?btn('判定归属','judgeReport('+r.id+')'):btn('查看','reportDetail('+r.id+')')])))+'</div>';
}
window.judgeReport=function(id){const r=db.brokerReports.find(x=>x.id===id);form('撞单判定 · '+esc(r.company),'<div class="field full spec">系统发现园区已有同名企业或相近手机号。请结合首次有效接触记录判定归属。</div>'+field('判定结果','status','保护中','text',['保护中','撞单退回'])+field('处理说明','note','渠道提供了更早的有效接触证明'),'applyReportJudge('+id+')','确认判定')};
window.applyReportJudge=function(id){const r=db.brokerReports.find(x=>x.id===id),d=data();r.status=d.status;r.note=d.note;r.until=d.status==='保护中'?ParkModel.add(db.today,30):'—';save();closeModal();render();toast('渠道归属判定已保存')};
window.reportDetail=function(id){const r=db.brokerReports.find(x=>x.id===id);drawer('渠道报备 · '+esc(r.company),rows({渠道:r.broker,联系人:r.contact,客户电话:r.clientPhone,空间需求:r.need,意向房源:r.room||'待匹配',保护截止:r.until,当前状态:r.status,处理说明:r.note||'—'}))};
const previousRender=window.render;
window.render=function(){
 ensureV4();
 if(!customPages.has(page)){previousRender();return}
 document.querySelector('#nav').innerHTML=navHtml();
 const views={cockpit:cockpitPage,enterprise:enterprisePage,matching:matchingPage,tourquote:tourQuotePage,broker:brokerPage};
 document.querySelector('#app').innerHTML=views[page]();
 document.querySelector('#bell').textContent=db.notifications.length||'';
};
save();
page='cockpit';
render();
window.TopTierDemo={ensureV4,matchedRooms};
})();
