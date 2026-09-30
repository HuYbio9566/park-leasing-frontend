const assert = require('assert')
const path = require('path')

const root = path.join(__dirname, '../miniprogram')
const saved = { applications: [], meetings: [] }
const app = { globalData: saved, saveCalled: 0, save() { this.saveCalled++ } }
let toast = ''
global.getApp = () => app
global.wx = {
  showToast({ title }) { toast = title },
  navigateTo() {},
  switchTab() {},
  showModal() {}
}

function load(relativePath) {
  let config
  global.Page = value => { config = value }
  const file = path.join(root, relativePath)
  delete require.cache[require.resolve(file)]
  require(file)
  config.setData = function (next) {
    for (const [key, value] of Object.entries(next)) {
      if (!key.includes('.')) this.data[key] = value
      else {
        const parts = key.split('.')
        let target = this.data
        for (const part of parts.slice(0, -1)) target = target[part]
        target[parts.at(-1)] = value
      }
    }
  }
  return config
}

const spaces = load('pages/spaces/spaces.js')
spaces.choose({ currentTarget: { dataset: { key: 'building', value: 'B座' } } })
assert.equal(spaces.data.filtered.length, 1, 'B座应有可展示房源')
assert.equal(spaces.data.filtered[0].id, 'B-503')
spaces.reset()
spaces.sortChange({ detail: { value: 1 } })
assert.equal(spaces.data.filtered[0].price, 65, '租金排序应从低到高')

const detail = load('pages/detail/detail.js')
detail.onLoad({ id: 'A-605' })
detail.data.form = { name: '陈女士', phone: '123', date: '2026-09-16', need: '研发办公' }
detail.submit()
assert.equal(toast, '请完善联系人和手机号', '无效手机号应被拦截')
detail.data.form.phone = '13800000001'
detail.submit()
assert.equal(saved.applications.length, 1, '有效看房申请应保存')
assert.equal(saved.applications[0].room, 'A-605')

const meeting = load('pages/meeting/meeting.js')
meeting.slotPick({ currentTarget: { dataset: { time: '10:00–11:00', status: 'booked' } } })
assert.equal(meeting.data.selected, '', '已预订时段不能选择')
meeting.slotPick({ currentTarget: { dataset: { time: '11:00–12:00', status: 'available' } } })
meeting.reserve()
assert.equal(meeting.data.showForm, true, '选择空闲时段后应进入确认流程')
meeting.data.title = '产品周会'
meeting.confirm()
assert.equal(saved.meetings.length, 1, '会议预约应保存')
assert.equal(saved.meetings[0].fee, 0, '免费配额内费用应为零')
assert.equal(app.saveCalled, 2, '两类预约都应触发本地持久化')

console.log(JSON.stringify({ checks: 10, applications: saved.applications.length, meetings: saved.meetings.length }))
