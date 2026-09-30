const {chromium}=require('C:/Users/sunlei-it/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://127.0.0.1:8765/admin.html');await page.waitForSelector('h1');await page.screenshot({path:'admin-cockpit-v4.png',fullPage:true});
 await page.goto('http://127.0.0.1:8765/customer.html#match');await page.waitForSelector('.smart-card');await page.screenshot({path:'customer-smart-match-v4.png',fullPage:true});
 const mobile=await browser.newPage({viewport:{width:390,height:844}});
 await mobile.goto('http://127.0.0.1:8765/customer.html#partner');await mobile.waitForSelector('#partner-form');await mobile.screenshot({path:'customer-partner-mobile-v4.png',fullPage:true});
 await browser.close();
 console.log('captured');
})();
