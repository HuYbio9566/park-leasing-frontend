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
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-09-18T09:30:00+08:00'));
    await page.goto(pathToFileURL(path.join(__dirname, '../miniprogram-view.html')).href);
    const show = () => page.evaluate(() => window.__showMiniPage('my-bookings'));
    const cards = page.locator('#my-bookings .reservation-card');
    const manage = page.locator('#booking-record-detail');
    const edit = () => page.getByRole('button', { name: '编辑预约', exact: true }).click();
    const save = () => page.getByRole('button', { name: '保存修改', exact: true }).click();
    const cancel = page.getByRole('button', { name: '取消预约', exact: true });
    const consent = page.locator('#quick-booking-form input[type="checkbox"]');
    const changeDate = value => page.locator('#quick-date').evaluate((el, value) => {
      el.value = value; el.dispatchEvent(new Event('change'));
    }, value);
    await show();
    assert.equal(await cards.locator('button button').count(), 0);
    await cards.first().locator('.reservation-price').click();
    assert(await page.locator('#my-bookings').isVisible(), 'price is not a navigation target');
    await cards.first().locator('.reservation-main').click();
    assert(await page.locator('#meeting-detail').isVisible());
    assert.equal(await page.locator('#meeting-detail-name').textContent(), '榫卯会议室');
    await page.locator('.nav-back').click();
    await cards.first().locator('.reservation-action').focus();
    await page.keyboard.press('Enter');
    assert(await manage.isVisible());
    assert.equal(await page.locator('.navbar > span').first().textContent(), '管理预约');
    assert.match(await manage.textContent(), /进行中/);
    await edit();
    assert(await page.locator('#quick-date-trigger').isDisabled());
    assert.equal(await page.locator('.quick-booking .slot:not(:disabled)').count(), 0);
    assert.equal(await page.locator('#quick-total').textContent(), '¥160');
    await page.locator('#quick-phone').fill('13800000000');
    await page.locator('#quick-purpose').fill('进行中更新备注');
    await consent.check();
    await page.evaluate(() => { window.originalSave = MiniStore.save; MiniStore.save = () => false; });
    await save();
    assert.match(await page.locator('.quick-booking [role="status"]').textContent(), /无法保存修改/);
    assert.equal(await page.evaluate(() => MiniStore.data.bookings.length), 0);
    assert.equal(await page.evaluate(() => MiniStore.displayRecords('bookings')[0].purpose), '团队例会');
    await page.evaluate(() => { MiniStore.save = window.originalSave; });
    await save();
    assert(await manage.isVisible());
    assert.match(await manage.textContent(), /进行中更新备注/);
    assert.equal(await page.evaluate(() => MiniStore.data.bookings.length), 2, 'sample edit preserves other samples without duplicating the target');
    page.once('dialog', dialog => dialog.dismiss());
    await cancel.click();
    assert.doesNotMatch(await manage.textContent(), /已取消/);
    page.once('dialog', dialog => dialog.accept());
    await cancel.click();
    assert.match(await manage.textContent(), /已取消/);
    assert.equal(await manage.getByRole('button', { name: '编辑预约', exact: true }).count(), 0);
    await page.reload();
    await show();
    assert.equal(await cards.first().locator('.reservation-status').textContent(), '已取消');
    await cards.last().locator('.reservation-action').click();
    assert.match(await manage.textContent(), /已结束/);
    assert.equal(await manage.getByRole('button').count(), 0);

    // Pending records reuse the booking form, keep identity, and exclude their own slots.
    await page.evaluate(() => {
      MiniStore.data.bookings = [
        {id:'EDIT-1',room:'榫卯会议室',meta:'A座 2F',date:'2027-01-02',times:['09:00–10:00','10:00–11:00'],price:80,name:'原联系人',phone:'13800000000',purpose:'原备注',status:'本地演示预约'},
        {id:'OTHER',room:'榫卯会议室',meta:'A座 2F',date:'2027-01-03',times:['11:00–12:00'],price:80,name:'其他人',phone:'13800000000',purpose:'',status:'本地演示预约'}
      ];
      MiniStore.save();
      window.dispatchEvent(new Event('mini-records-change'));
    });
    await show();
    await cards.last().locator('.reservation-action').click();
    await edit();
    assert.equal(await page.locator('.quick-booking .slot.selected').count(), 2);
    assert.equal(await page.locator('.quick-booking .slot.selected:disabled').count(), 0);
    assert.equal(await page.locator('#quick-name').inputValue(), '原联系人');
    await page.locator('#quick-purpose').fill('放弃的修改');
    await page.locator('.quick-booking-close').click();
    assert.equal(await page.evaluate(() => MiniStore.data.bookings[0].purpose), '原备注');
    await edit();
    await changeDate('2027-01-03');
    const slot = text => page.locator('.quick-booking .slot').filter({ hasText: text });
    assert(await slot('11:00–12:00').isDisabled());
    await slot('13:30–14:30').click();
    assert.equal(await page.locator('#quick-total').textContent(), '¥80');
    await page.locator('#quick-name').fill('新联系人');
    await page.locator('#quick-purpose').fill('修改后的预约');
    await consent.check();
    // A conflict created after opening the form is revalidated on save.
    await page.evaluate(() => { MiniStore.data.bookings[1].times.push('13:30–14:30'); });
    await save();
    assert.match(await page.locator('.quick-booking [role="status"]').textContent(), /占用/);
    assert.equal(await page.evaluate(() => MiniStore.data.bookings[0].date), '2027-01-02');
    await page.evaluate(() => { MiniStore.data.bookings[1].times.pop(); });
    await changeDate('2027-01-03');
    await slot('13:30–14:30').click();
    await save();
    assert(await manage.isVisible());
    assert.match(await manage.textContent(), /修改后的预约/);
    const saved = await page.evaluate(() => MiniStore.data.bookings);
    assert.equal(saved.length, 2);
    assert.equal(saved[0].id, 'EDIT-1');
    assert.equal(saved[0].name, '新联系人');
    assert.equal(saved[0].date, '2027-01-03');
    assert.deepEqual(saved[0].times, ['13:30–14:30']);
    await page.reload();
    await show();
    assert.equal(await cards.first().locator('.reservation-price').textContent(), '¥80');
    await cards.first().locator('.reservation-action').click();
    assert.match(await manage.textContent(), /修改后的预约/);
    await edit();
    await consent.check();
    await page.clock.setFixedTime(new Date('2027-01-03T13:30:00+08:00'));
    await save();
    assert.match(await page.locator('.quick-booking [role="status"]').textContent(), /状态已变化/);
    await page.locator('.quick-booking-close').click();
    page.once('dialog', dialog => dialog.accept());
    await cancel.click();
    assert.match(await manage.textContent(), /已取消/);
    assert.deepEqual(errors, []);
    console.log('PASS: split targets, keyboard management, edit/persistence, own-slot exclusion, conflict recheck, state limits, sample editing, rollback and cancellation');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
