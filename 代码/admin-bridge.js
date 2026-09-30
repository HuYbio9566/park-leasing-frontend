document.querySelector('.topright').insertAdjacentHTML('afterbegin','<a class="portal-back" href="index.html">切换入口 ↗</a>');
document.querySelector('.demo').textContent='园区管理端 · 演示数据';
document.title='星桥科创园 · 园区管理';
function loadLatestPortalData(){try{const next=ParkStore.read();if(JSON.stringify(next)!==JSON.stringify(db)){db=next;render()}}catch{}}
window.addEventListener('storage',e=>{if(e.key===ParkStore.key)loadLatestPortalData()});
window.addEventListener('focus',loadLatestPortalData);
