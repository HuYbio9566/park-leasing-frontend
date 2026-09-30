/* 本地演示数据桥；正式身份验证和数据授权须由服务端实现。 */
window.ParkStore=(()=>{
 const key='park-leasing-v4';let memory=null;
 function fresh(){let d=ParkModel.init(PARK_SEED),available=d.rooms.filter(r=>r.status==='空置');d.ads=available.slice(0,4).map((r,i)=>({id:200+i,title:['让团队在这里生长','为下一次突破留足空间','小而完整的创作主场','面向未来的研发办公室'][i],sub:['通透采光 · 灵活布局','研发办公 · 园区服务','独立空间 · 精装交付','宽敞开间 · 团队成长'][i],room:r.id,status:'已发布',views:0,intents:0,submissions:0}));d.rules.sources+=',招商门户';return d}
 function read(){try{let value=localStorage.getItem(key);memory=value?JSON.parse(value):(memory||fresh())}catch{memory??=fresh()}ParkModel.sync(memory);return memory}
 function write(d){ParkModel.sync(d);memory=d;try{localStorage.setItem(key,JSON.stringify(d))}catch{}return d}
 let initial=read();write(initial);
 return {key,read,write};
})();
