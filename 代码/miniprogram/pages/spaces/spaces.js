const { spaces } = require('../../data')
Page({
  data: {
    spaces, filtered: spaces, building: '全部楼宇', finish: '全部装修', sort: '推荐', sortIndex: 0,
    buildingOptions: ['全部楼宇', 'A座', 'B座', 'C座', 'D座', 'E座'],
    finishOptions: ['全部装修', '精装修', '可分割'],
    sortOptions: ['推荐', '租金最低', '面积最大']
  },
  onShow() { this.apply() },
  open(e) { wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` }) },
  pickerChange(e) { const key = e.currentTarget.dataset.key; const index = Number(e.detail.value); const options = this.data[`${key}Options`]; const data = {}; data[key] = options[index]; if (key === 'sort') data.sortIndex = index; this.setData(data); this.apply() },
  apply() { const { building, finish, sort } = this.data; let filtered = spaces.filter(s => (building === '全部楼宇' || s.building === building) && (finish === '全部装修' || s.finish === finish)); if (sort === '租金最低') filtered.sort((a,b) => a.price-b.price); if (sort === '面积最大') filtered.sort((a,b) => b.area-a.area); this.setData({ filtered }) }
})
