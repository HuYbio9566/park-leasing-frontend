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
    const factsLayout = await page.locator('#home .facts').evaluate(el => ({
      padding: getComputedStyle(el).padding,
      height: el.getBoundingClientRect().height,
      width: el.getBoundingClientRect().width
    }));
    assert.equal(factsLayout.padding, '8px');
    assert(Math.abs(factsLayout.height - 68.890625) < 0.1);
    assert.equal(factsLayout.width, 342);
    const titles = ['星桥科创园', '灵活办公空间', '多规格会议空间'];
    for (let i = 0; i < titles.length; i++) {
      await page.locator('.hero-dot').nth(i).click();
      await page.waitForTimeout(100);
      assert(await page.locator('#home').isVisible());
      await page.locator('.hero-slide').nth(i).click({ position: { x: 180, y: 90 } });
      assert(await page.locator('#banner-detail').isVisible());
      assert.equal(await page.locator('#banner-detail h1').textContent(), titles[i]);
      assert(await page.locator('#banner-detail img').evaluate(img => img.complete && img.naturalWidth > 0));
      await page.locator('#banner-detail button').click();
      assert(await page.locator(i === 2 ? '#meeting' : '#spaces').isVisible());
      await page.evaluate(() => window.__showMiniPage('home'));
    }
    await page.locator('.hero-dot').first().click();
    await page.waitForTimeout(100);
    const box = await page.locator('.hero-track').boundingBox();
    await page.mouse.move(box.x + 300, box.y + 90);
    await page.mouse.down();
    await page.mouse.move(box.x + 40, box.y + 90, { steps: 15 });
    await page.mouse.up();
    assert(await page.locator('#home').isVisible());
    await page.locator('.hero-dot').first().click();
    await page.waitForTimeout(100);
    await page.locator('.hero-slide').first().focus();
    await page.keyboard.press('Enter');
    assert(await page.locator('#banner-detail').isVisible());
    await page.locator('.nav-back').click();
    assert(await page.locator('#home').isVisible());
    for (let i = 0; i < titles.length; i++) {
      await page.locator('.hero-dot').nth(i).click();
      await page.waitForTimeout(100);
      for (let item = 0; item < 3; item++) {
        await page.locator('.hero .facts [role="link"]').nth(item).click();
        assert(await page.locator('#banner-detail').isVisible());
        assert.equal(await page.locator('#banner-detail h1').textContent(), titles[i]);
        await page.locator('.nav-back').click();
      }
    }
    await page.locator('.hero .facts [role="link"]').first().focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#banner-detail h1').textContent(), titles[2]);
    await page.locator('.nav-back').click();
    await page.locator('.hero-dot').first().click();
    await page.locator('.hero-dot').first().blur();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForTimeout(4700);
    assert.equal(await page.locator('.hero-dot').nth(1).getAttribute('aria-current'), 'true');
    const touch = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await touch.goto(pathToFileURL(path.join(__dirname, 'miniprogram-view.html')).href);
    const touchBox = await touch.locator('.hero-track').boundingBox();
    const cdp = await touch.context().newCDPSession(touch);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchBox.x + 280, y: touchBox.y + 90 }] });
    for (let x = 250; x >= 40; x -= 30) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchBox.x + x, y: touchBox.y + 90 }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await touch.waitForTimeout(400);
    assert(await touch.locator('#home').isVisible());
    await touch.locator('.hero-dot').first().tap();
    await touch.waitForTimeout(100);
    await touch.touchscreen.tap(touchBox.x + 160, touchBox.y + 90);
    assert(await touch.locator('#banner-detail').isVisible());
    assert(await touch.locator('#banner-detail').evaluate(el => el.scrollWidth <= el.clientWidth));
    assert.deepEqual(errors, []);
    console.log('PASS: banner click, CTA, back, keyboard, drag, autoplay and touch');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
