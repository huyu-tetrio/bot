const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. 部屋にアクセス
  await page.goto('https://www1.x-feeder.info/huyu_praviteroom/');
  await page.waitForTimeout(2000);

  // 2. パスワードを入れてログインボタンを押す
  // （※もし名前も入れる場合は後で調整できます）
  await page.fill('input[type="password"], input[type="text"]', 'HuyuTetr1s2o26');
  await page.click('input[type="submit"], button:has-text("ログイン")');
  await page.waitForTimeout(3000);

  // 3. チャット画面で発言する（最初のテスト）
  const chatInput = page.locator('input[type="text"], textarea').first();
  await chatInput.fill('GitHubボットのテスト発言です！');
  await chatInput.press('Enter');

  await page.waitForTimeout(2000);
  await browser.close();
})();
