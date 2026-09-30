const { spaces } = require('../../data')
Page({
  data: {
    heroIndex: 0,
    heroSlides: [
      {
        image: '/assets/campus-hero.jpg',
        title: '星桥科创园',
        subtitle: '五栋科创楼宇，从灵活办公到研发空间。',
        facts: [{ value: '5', label: '栋楼宇' }, { value: '12', label: '处在租' }, { value: '24h', label: '在线预约' }]
      },
      {
        image: '/assets/meeting-04.jpg',
        title: '灵活办公空间',
        subtitle: '精装与毛坯房源，满足不同规模团队。',
        facts: [{ value: '5', label: '栋楼宇' }, { value: '320㎡', label: '灵活空间' }, { value: '预约', label: '专人接待' }]
      },
      {
        image: '/assets/meeting-02.jpg',
        title: '多规格会议空间',
        subtitle: '从小型会议到路演活动，按需预约。',
        facts: [{ value: '3', label: '种规格' }, { value: '¥80', label: '每小时起' }, { value: '4h', label: '每周配额' }]
      }
    ],
    featured: spaces.slice(0, 3),
    services: [
      { key: 'vehicle', name: '车辆管理', icon: '/assets/icons/vehicle.svg' },
      { key: 'spaces', name: '空间浏览', icon: '/assets/icons/spaces.svg' },
      { key: 'meeting', name: '会议预约', icon: '/assets/icons/meeting.svg' },
      { key: 'restaurant', name: '园区餐厅', icon: '/assets/icons/restaurant.svg' },
      { key: 'repair', name: '报修工单', icon: '/assets/icons/repair.svg' },
      { key: 'visitor', name: '访客登记', icon: '/assets/icons/visitor.svg' },
      { key: 'notices', name: '通知公告', icon: '/assets/icons/notices.svg' },
      { key: 'feedback', name: '投诉建议', icon: '/assets/icons/feedback.svg' }
    ]
  },
  heroChange(e) { this.setData({ heroIndex: e.detail.current }) },
  goSpaces() { wx.switchTab({ url: '/pages/spaces/spaces' }) },
  goMeeting() { wx.switchTab({ url: '/pages/meeting/meeting' }) },
  goProfile() { wx.switchTab({ url: '/pages/profile/profile' }) },
  openService(e) {
    const type = e.currentTarget.dataset.type
    if (type === 'spaces') return this.goSpaces()
    if (type === 'meeting') return this.goMeeting()
    wx.navigateTo({ url: `/pages/service/service?type=${type}` })
  },
  openSpace(e) { wx.navigateTo({ url: `/pages/detail/detail?id=${e.currentTarget.dataset.id}` }) }
})
