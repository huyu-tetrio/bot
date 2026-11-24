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

  // 3. 画面に見えている1番目の入力欄（名前欄）に直接入力！
  const nameInput = page.locator('input[type="text"]:visible').first();
  await nameInput.fill('huyubot test');

  // 4. 画面に見えている発言欄（textarea）に直接入力してEnterで投稿！
  const chatInput = page.locator('textarea:visible').first();
  await chatInput.fill('GitHubボットのテスト発言です！');
  await chatInput.press('Enter');

  await page.waitForTimeout(3000);
  await browser.close();
})();
