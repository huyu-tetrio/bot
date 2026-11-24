const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    locale: 'ja-JP',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // 1. 部屋にアクセス
  const roomUrl = 'https://' + 'www1.x-feeder.info/' + 'huyu_praviteroom/';
  await page.goto(roomUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // 2. パスワードを入れてログイン
  const passInput = page.locator('input').first();
  await passInput.fill('HuyuTetr1s2o26');
  await passInput.press('Enter');
  await page.waitForTimeout(5000);

  // 3. 今見えている画面の「文字」と「入力欄の正体」を全部表示する！
  console.log('=== 画面のテキスト一部 ===');
  console.log((await page.locator('body').innerText()).slice(0, 300));

  console.log('=== 入力欄のリスト ===');
  const inputs = await page.locator('input, textarea, [contenteditable="true"]').all();
  for (let i = 0; i < inputs.length; i++) {
    const tag = await inputs[i].evaluate(el => el.outerHTML);
    console.log(i + ':', tag);
  }

  console.log('=== iframeの数 ===', page.frames().length);
  await browser.close();
})();
