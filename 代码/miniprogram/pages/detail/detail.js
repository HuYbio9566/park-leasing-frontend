const { spaces } = require('../../data')
Page({
  data: { space: null, showForm: false, form: { name: '', phone: '', date: '', need: '' } },
  onLoad(q) { const space = spaces.find(s => s.id === q.id) || spaces[0]; this.setData({ space, 'form.date': '2026-09-16' }) },
  showForm() { this.setData({ showForm: true }) },
  hideForm() { this.setData({ showForm: false }) },
  dateChange(e) { this.setData({ 'form.date': e.detail.value }) },
  input(e) { this.setData({ [`form.${e.currentTarget.dataset.key}`]: e.detail.value }) },
  submit() { const f = this.data.form; if (!f.name || !/^1[3-9]\d{9}$/.test(f.phone) || !f.date) return wx.showToast({ title: '请完善联系人和手机号', icon: 'none' }); const app = getApp(); app.globalData.applications.unshift({ ...f, room: this.data.space.id, type: '看房申请', status: '已提交' }); app.save(); this.setData({ showForm: false }); wx.showToast({ title: '申请已提交' }) },
  backSpaces() { wx.switchTab({ url: '/pages/spaces/spaces' }) }
})
