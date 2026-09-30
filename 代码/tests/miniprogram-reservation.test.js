const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  try {
    const page = await browser.newPage();
    await page.clock.setFixedTime(new Date('2026-09-17T12:00:00+08:00'));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(__dirname, '../miniprogram-view.html')).href);
    const show = () => page.evaluate(() => window.__showMiniPage('my-bookings'));
    await show();
    const cards = page.locator('#my-bookings .reservation-card');
    assert.equal(await cards.count(), 2);
    assert.deepEqual(await cards.locator('.reservation-name').allTextContents(), ['榫卯会议室', '云杉会议室']);
    assert.deepEqual(await cards.locator('.reservation-status').allTextContents(), ['未开始', '已结束']);
    assert.deepEqual(await cards.locator('.reservation-price').allTextContents(), ['¥160', '¥120']);
    assert.deepEqual(await cards.locator('.reservation-price').evaluateAll(els => els.map(el => getComputedStyle(el).fontSize)), ['18px', '18px']);
    assert.match(await cards.last().locator('.reservation-date').textContent(), /9月16日 周三$/);
    assert.match(await cards.first().locator('.reservation-date').textContent(), /9月18日 周五$/);
    assert.equal(await cards.first().locator('.is-multiple .reservation-time').count(), 2);
    assert.equal(await page.locator('#my-bookings .reservation-notice').count(), 0);
    assert.equal(await cards.first().evaluate(el => getComputedStyle(el).padding), '12px 12px 0px');
    assert.equal(await cards.first().evaluate(el => getComputedStyle(el).borderRadius), '8px');
    assert.equal(await cards.first().locator('.reservation-times').evaluate(el => getComputedStyle(el).color), 'rgb(62, 79, 69)');
    assert.deepEqual(await cards.locator('.reservation-image').evaluateAll(els => els.map(el => el.getAttribute('src'))), ['miniprogram/assets/meeting-01.jpg','miniprogram/assets/meeting-03.jpg']);
    assert.equal(await cards.last().locator('.reservation-image').evaluate(el => getComputedStyle(el).filter), 'none');
    assert.deepEqual(await cards.last().evaluate(el => {
      const style = getComputedStyle(el);
      return [style.backgroundColor, style.boxShadow];
    }), await cards.first().evaluate(el => {
      const style = getComputedStyle(el);
      return [style.backgroundColor, style.boxShadow];
    }), 'completed cards retain the original background and shadow');
    assert.equal(await cards.first().locator('.reservation-image').evaluate(el => getComputedStyle(el).filter), 'none');
    assert(await cards.last().locator('.reservation-name,.reservation-date,.reservation-times,.reservation-price,.reservation-action,.reservation-status').evaluateAll(els => els.every(el => getComputedStyle(el).color === 'rgb(112, 112, 112)')));
    assert.equal(await cards.last().isEnabled(), true);
    assert(await cards.locator('.reservation-image').evaluateAll(els => els.every(el => el.complete && el.naturalWidth > 0)));
    assert.equal(await cards.locator('.reservation-status svg').count(), 0);
    assert.equal(await cards.first().locator('.reservation-action').evaluate(el => getComputedStyle(el).fontSize), '12px');
    assert.equal(await cards.first().locator('.reservation-time').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(252, 243, 233)');
    for (const width of [320, 375, 750, 1085]) {
      await page.setViewportSize({ width, height: 922 });
      assert.deepEqual(await cards.locator('.reservation-image').evaluateAll(els => els.map(el => {
        const rect = el.getBoundingClientRect();
        return [rect.width, rect.height];
      })), Array(2).fill(width < 374 ? [62, 62] : [82, 82]), `square image dimensions at ${width}px`);
      assert(await cards.evaluateAll(els => els.every(el => {
        const image = el.querySelector('.reservation-image').getBoundingClientRect();
        const copy = el.querySelector('.reservation-copy').getBoundingClientRect();
        const name = el.querySelector('.reservation-name').getBoundingClientRect();
        const badge = el.querySelector('.reservation-status').getBoundingClientRect();
        return el.scrollWidth <= el.clientWidth && image.right <= copy.left && name.right <= badge.left && Math.abs(image.width - image.height) < 1 && Math.abs((name.top + name.bottom) / 2 - (badge.top + badge.bottom) / 2) < 1;
      })), `sample card layout at ${width}px`);
    }
    await cards.last().locator('.reservation-main').click();
    assert(await page.locator('#meeting-detail').isVisible());
    assert.equal(await page.locator('#meeting-detail-name').textContent(), '云杉会议室');
    assert.match(await page.locator('#meeting-detail .detail-price').textContent(), /120/);
    await page.locator('.nav-back').click();
    assert(await page.locator('#my-bookings').isVisible());
    await cards.first().locator('.reservation-main').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#meeting-detail-name').textContent(), '榫卯会议室');
    assert.match(await page.locator('#meeting-detail .detail-price').textContent(), /80/);
    await page.getByRole('button', {name:'查看本次预约',exact:true}).click();
    assert.match(await page.locator('#booking-record-detail').textContent(), /榫卯会议室/);
    await page.locator('.nav-back').click();
    await show();

    // Isolated browser data only: exercise every presentation state and long content.
    await page.evaluate(() => {
      MiniStore.data.bookings = ['待确认','已确认','已完成','已取消','预约失败','进行中','无权限查看 · 示例','本地演示预约'].map((status, i) => ({
        id: 'TEST-' + i, status, sample: true, room: status.startsWith('无权限') ? '敏感会议室' : '超长会议室名称用于验证移动端多行布局',
        meta: 'A座 2F', date: '2027-01-02', price: 123,
        times: ['09:00–10:00','10:00–11:00','11:00–12:00','12:00–13:00'],
        name: '敏感联系人', phone: '13812345678', purpose: ''
      }));
      window.dispatchEvent(new Event('mini-records-change'));
    });
    assert.deepEqual(await cards.evaluateAll(els => els.map(el => el.dataset.state)), ['pending','restricted','pending','failed','cancelled','pending','pending','pending']);
    assert.equal(await page.locator('#my-bookings .reservation-notice').count(), 0);
    assert.match(await cards.first().locator('.reservation-date').textContent(), /2027年1月2日 周六/);
    assert.equal(await cards.first().locator('.reservation-price').textContent(), '¥492');
    const restricted = page.locator('.reservation-card[data-state="restricted"]');
    assert.equal(await restricted.locator('.reservation-price,.reservation-date,.reservation-times,.reservation-image').count(), 0);
    assert.doesNotMatch(await restricted.textContent(), /敏感会议室|492|13812345678/);
    await restricted.locator('.reservation-main').click();
    assert.equal(await page.locator('#booking-record-detail').textContent(), '无权限查看该预约的详细信息。');
    await show();
    for (const width of [320, 375, 750, 1085]) {
      await page.setViewportSize({ width, height: 922 });
      const layout = await cards.first().evaluate(el => {
        const card = el.getBoundingClientRect();
        const head = el.querySelector('.reservation-name').getBoundingClientRect();
        const badge = el.querySelector('.reservation-status').getBoundingClientRect();
        const times = [...el.querySelectorAll('.reservation-time')].map(t => t.getBoundingClientRect());
        return {
          noOverflow: el.scrollWidth <= el.clientWidth && document.querySelector('.screen').scrollWidth <= document.querySelector('.screen').clientWidth,
          separated: head.right <= badge.left,
          contained: times.every(t => t.left >= card.left && t.right <= card.right),
          wrapped: times.some(t => t.top > times[0].top)
        };
      });
      assert.deepEqual(layout, { noOverflow: true, separated: true, contained: true, wrapped: true }, `viewport ${width}`);
    }
    assert.deepEqual(errors, []);
    for (const [time, state] of [['08:59:59','未开始'],['09:00:00','进行中'],['10:00:00','进行中'],['13:00:00','已结束']]) {
      await page.clock.setFixedTime(new Date('2027-01-02T'+time+'+08:00'));
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      assert.equal(await cards.first().locator('.reservation-status').textContent(), state);
      assert.equal(await page.locator('[data-state="cancelled"]').count(), 1);
      assert.equal(await cards.first().locator('.reservation-price').evaluate(el => getComputedStyle(el).color), state === '已结束' ? 'rgb(112, 112, 112)' : 'rgb(56, 114, 90)');
    }
    await page.evaluate(() => {
      MiniStore.data.bookings[7].times = ['09:00–10:00','12:00–13:00'];
      window.dispatchEvent(new Event('mini-records-change'));
    });
    await page.clock.setFixedTime(new Date('2027-01-02T11:00:00+08:00'));
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    assert.equal(await cards.first().locator('.reservation-status').textContent(), '未开始');
    await page.evaluate(() => {
      const base = MiniStore.data.bookings[0];
      MiniStore.data.bookings = [
        {...base, id:'OLDER', room:'较早日期', date:'2027-01-01', times:['15:00–16:00']},
        {...base, id:'LATER-TIME', room:'同日晚场', date:'2027-01-02', times:['14:00–15:00']},
        {...base, id:'NEWEST', room:'最新日期', date:'2027-01-03', times:['09:00–10:00']},
        {...base, id:'EARLIER-TIME', room:'同日早场', date:'2027-01-02', times:['16:00–17:00','09:00–10:00']}
      ];
      window.dispatchEvent(new Event('mini-records-change'));
    });
    assert.deepEqual(await cards.locator('.reservation-name').allTextContents(), ['最新日期','同日晚场','同日早场','较早日期']);
    assert.deepEqual(await page.evaluate(() => MiniStore.data.bookings.map(item => item.id)), ['OLDER','LATER-TIME','NEWEST','EARLIER-TIME']);
    console.log('PASS: reservation card hierarchy, all states, privacy display, keyboard/detail navigation, and responsive wrapping');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
