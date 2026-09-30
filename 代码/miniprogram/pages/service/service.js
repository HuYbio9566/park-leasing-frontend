const serviceTitles = {
  vehicle: '车辆管理',
  restaurant: '园区餐厅',
  repair: '报修工单',
  visitor: '访客登记',
  notices: '通知公告',
  feedback: '投诉建议'
}

Page({
  data: {
    type: '',
    title: '园区服务',
    agreed: false,
    menus: [
      { name: '商务套餐', detail: '荤素搭配 · 米饭 · 例汤', price: 28 },
      { name: '轻食套餐', detail: '时蔬 · 鸡胸 · 水果', price: 32 }
    ],
    notices: [
      { title: '关于园区消防演练的通知', date: '09月15日', detail: '本周五下午开展消防演练，请各企业提前安排。' },
      { title: '中秋节园区服务安排', date: '09月12日', detail: '假期门禁、餐厅及物业值班时间说明。' },
      { title: '地下车库维护提醒', date: '09月08日', detail: 'B区部分车位将临时封闭，请按指引停放。' }
    ]
  },
  onLoad(options) {
    const type = serviceTitles[options.type] ? options.type : 'notices'
    const title = serviceTitles[type]
    this.setData({ type, title })
    wx.setNavigationBarTitle({ title })
  },
  agreementChange(e) { this.setData({ agreed: e.detail.checked }) },
  submit() {
    if (this.data.type === 'visitor' && !this.data.agreed) {
      return wx.showToast({ title: '请先同意免责协议', icon: 'none' })
    }
    wx.showToast({ title: '提交成功' })
  },
  reserveMeal() { wx.showToast({ title: '已加入预订', icon: 'success' }) }
})
