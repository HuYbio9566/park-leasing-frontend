const { meetings } = require('../../data')
const dates = [
  { label: '今天', day: '14', value: '2026-09-14' },
  { label: '周二', day: '15', value: '2026-09-15' },
  { label: '周三', day: '16', value: '2026-09-16' },
  { label: '周四', day: '17', value: '2026-09-17' },
  { label: '周五', day: '18', value: '2026-09-18' }
]
const slots = [
  { time: '09:00–10:00', status: 'available' },
  { time: '10:00–11:00', status: 'booked' },
  { time: '11:00–12:00', status: 'available' },
  { time: '13:30–14:30', status: 'available' },
  { time: '14:30–15:30', status: 'booked' },
  { time: '15:30–16:30', status: 'available' },
  { time: '16:30–17:30', status: 'available' },
  { time: '17:30–18:30', status: 'available' }
]
Page({
  data: { meetings, filteredMeetings: meetings, filters: { area: '全部', capacity: '全部', type: '全部' }, areas: ['全部', 'A区', 'C区'], capacities: ['全部', '8人以内', '9-16人', '17人以上'], types: ['全部', '小会议室', '中会议室', '路演厅'], detailId: '', booking: false, roomIndex: 0, dateIndex: 0, dates, slots, selected: '', showForm: false, title: '' },
  filterPick(e) {
    const key = e.currentTarget.dataset.key, value = e.currentTarget.dataset.value
    const filters = { ...this.data.filters, [key]: value }
    const filteredMeetings = meetings.filter(room => {
      const capacity = Number(room.capacity.replace('人', ''))
      return (filters.area === '全部' || room.area === filters.area) && (filters.type === '全部' || room.type === filters.type) && (filters.capacity === '全部' || (filters.capacity === '8人以内' ? capacity <= 8 : filters.capacity === '9-16人' ? capacity <= 16 && capacity > 8 : capacity > 16))
    })
    this.setData({ filters, filteredMeetings })
  },
  pickerChange(e) {
    const key = e.currentTarget.dataset.key
    const ranges = { area: this.data.areas, capacity: this.data.capacities, type: this.data.types }
    this.filterPick({ currentTarget: { dataset: { key, value: ranges[key][Number(e.detail.value)] } } })
  },
  openDetail(e) { this.setData({ detailId: e.currentTarget.dataset.id }) },
  closeDetail() { this.setData({ detailId: '' }) },
  closeBooking() { this.setData({ booking: false }) },
  reserveRoom(e) { const id = e.currentTarget.dataset.id, roomIndex = meetings.findIndex(room => room.id === id); this.setData({ detailId: '', booking: true, roomIndex, selected: '' }) },
  roomChange(e) { this.setData({ roomIndex: Number(e.detail.value), selected: '' }) },
  datePick(e) { this.setData({ dateIndex: Number(e.currentTarget.dataset.index), selected: '' }) },
  slotPick(e) { if (e.currentTarget.dataset.status === 'booked') return; this.setData({ selected: e.currentTarget.dataset.time }) },
  reserve() { if (!this.data.selected) return wx.showToast({ title: '请先选择可用时段', icon: 'none' }); this.setData({ showForm: true }) },
  hideForm() { this.setData({ showForm: false }) },
  titleInput(e) { this.setData({ title: e.detail.value }) },
  confirm() {
    if (!this.data.title.trim()) return wx.showToast({ title: '请填写会议名称', icon: 'none' })
    const app = getApp(), room = meetings[this.data.roomIndex], date = dates[this.data.dateIndex]
    app.globalData.meetings.unshift({ type: '会议预约', room: room.name, date: date.value, time: this.data.selected, title: this.data.title, status: '待使用', fee: 0 })
    app.save()
    this.setData({ showForm: false, selected: '', title: '' })
    wx.showToast({ title: '预约成功' })
  }
})
