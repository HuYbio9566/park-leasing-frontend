const assert = require('assert')
const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '../miniprogram')
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))

assert.equal(app.pages.length, 5, '应声明 5 个页面')
assert.equal(app.tabBar.list.length, 4, '应声明 4 个一级入口')
for (const page of app.pages) {
  for (const extension of ['js', 'json', 'wxml', 'wxss']) {
    assert(fs.existsSync(path.join(root, `${page}.${extension}`)), `缺少 ${page}.${extension}`)
  }
}
for (const tab of app.tabBar.list) assert(app.pages.includes(tab.pagePath), `${tab.pagePath} 未在页面清单中`)

const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(directory, entry.name)
  return entry.isDirectory() ? walk(target) : [target]
})
for (const file of walk(root).filter(file => file.endsWith('.wxml'))) {
  const source = fs.readFileSync(file, 'utf8')
  assert(!source.includes('campus-hero.png'), `${file} 仍引用未压缩图片`)
  assert(!source.includes('bindchange="{{'), `${file} 含无效事件绑定`)
  for (const match of source.matchAll(/src="(\/assets\/[^"]+)"/g)) {
    assert(fs.existsSync(path.join(root, match[1])), `缺少资源 ${match[1]}`)
  }
}
console.log(JSON.stringify({ pages: app.pages.length, tabs: app.tabBar.list.length, assets: 'ok' }))
