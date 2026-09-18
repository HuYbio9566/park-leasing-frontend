const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(__dirname, 'miniprogram-view.html')).href);
    const show = id => page.evaluate(id => window.__showMiniPage(id), id);
    const audit = async () => {
      assert.doesNotMatch(await page.locator('body').innerText(), /演示|示例|样例|本机|未发送|非真实|仅供预览|仅作展示/);
      const attributes = await page.locator('[title],[placeholder],[aria-label],img[alt]').evaluateAll(elements =>
        elements.filter(el => el.getClientRects().length).map(el =>
          ['title','placeholder','aria-label','alt'].map(attr => el.getAttribute(attr) || '').join(' ')).join('\n'));
      assert.doesNotMatch(attributes, /演示|示例|样例|本机|未发送/);
    };
    for (const id of await page.locator('.screen > section').evaluateAll(items => items.map(el => el.id))) {
      await show(id);
      await audit();
    }
    for (const id of ['visitor-records', 'repair-records']) {
      for (let i = 0; i < 2; i++) {
        await show(id);
        await page.locator(`#${id} .service-record-button`).nth(i).click();
        await audit();
      }
    }
    for (let i = 0; i < 2; i++) {
      await show('my-bookings');
      await page.locator('#my-bookings .reservation-action').nth(i).click();
      await audit();
    }
    await show('meeting');
    await page.locator('.meeting-card-detail[data-room-detail="远山路演厅"]').click();
    await audit();
    await page.locator('#meeting-detail .primary-button').click();
    await audit();
    assert.equal(await page.locator('.quick-booking-footer button').innerText(), '保存预约');
    await page.locator('.quick-booking-close').click();
    for (let i = 0; i < await page.locator('#notices .list-row').count(); i++) {
      await show('notices');
      await page.locator('#notices .list-row').nth(i).click();
      await audit();
    }
    for (let i = 0; i < 3; i++) {
      await show('home');
      await page.locator('.hero-dot').nth(i).click();
      await page.locator('.hero-slide').nth(i).click({ position: { x: 180, y: 90 } });
      await audit();
    }
    await show('home');
    await page.locator('#home-consult-open').click();
    await audit();
    await page.locator('#contact-close').click();
    await show('profile');
    await page.locator('.profile-login').click();
    await audit();
    await show('profile');
    await page.getByRole('button', { name: /隐私与授权/ }).click();
    await audit();
    assert.match(await page.locator('#local-privacy').innerText(), /浏览器|无法恢复/);

    // Old saved records retain their original data; only system copy is normalized.
    const original = { id: 'OLD-1', title: '园区咨询', state: '本机已保存 · 未发送', created: '2026-09-18T09:00:00+08:00', fields: [['留言备注', '演示活动场地咨询']] };
    await page.evaluate(record => {
      MiniStore.data.consultations = [record];
      MiniStore.save();
    }, original);
    await page.reload();
    await show('consultation-records');
    assert.doesNotMatch(await page.locator('#consultation-records').innerText(), /本机|未发送/);
    await page.locator('#consultation-records .service-record-button').click();
    const text = await page.locator('#service-record-detail').innerText();
    assert.match(text, /已保存/);
    assert.match(text, /演示活动场地咨询/);
    assert.deepEqual(await page.evaluate(() => MiniStore.data.consultations[0]), original);
    assert.deepEqual(errors, []);
    console.log('PASS: page and dynamic detail copy, accessible labels, legacy record display, privacy text and unmodified user content.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
