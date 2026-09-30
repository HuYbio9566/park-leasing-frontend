App({
  globalData: {
    selectedSpace: null,
    applications: [],
    meetings: []
  },
  onLaunch() {
    const saved = wx.getStorageSync('starbridge-demo')
    if (saved) this.globalData = { ...this.globalData, ...saved }
  },
  save() { wx.setStorageSync('starbridge-demo', this.globalData) }
})
