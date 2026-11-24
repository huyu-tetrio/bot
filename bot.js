const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  // 日本のWindowsパソコンのChromeになりすます設定
  const context = await browser.newContext({
    locale: 'ja-JP',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // 1. 部屋にアクセス
  await page.goto('https://www1.x-feeder.info/huyu_praviteroom/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  // デバッグ用：今開いているページのタイトルを表示
  console.log('ページタイトル:', await page.title());

  // 2. パスワードを入れてログイン
  const passInput = page.locator('input').first();
  await passInput.fill('HuyuTetr1s2o26');
  await passInput.press('Enter');
  await page.waitForTimeout(4000);

  // 3. ボットの名前を入れる
  await page.getByPlaceholder('名前').fill('huyubot test');

  // 4. 発言欄に文字を入れてEnterで投稿
  const chatInput = page.locator('textarea').first();
  await chatInput.fill('GitHubボットのテスト発言です！');
  await chatInput.press('Enter');

  await page.waitForTimeout(2000);
  await browser.close();
})();
