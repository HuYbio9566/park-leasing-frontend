Page({
  data: { applications: [], meetings: [] },
  onShow() { const app = getApp(); this.setData({ applications: app.globalData.applications || [], meetings: app.globalData.meetings || [] }) },
  goSpaces() { wx.switchTab({ url: '/pages/spaces/spaces' }) },
  goMeeting() { wx.switchTab({ url: '/pages/meeting/meeting' }) },
  call() { wx.showModal({ title: '联系园区', content: '招商咨询 0512-8888 3600，服务时间 09:00–18:00', showCancel: false }) }
})
