const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. 部屋にアクセス
  await page.goto('https://www1.x-feeder.info/huyu_praviteroom/');
  await page.waitForTimeout(3000);

  // 2. パスワードを入れてログイン
  await page.getByPlaceholder('入室用パスワード').fill('HuyuTetr1s2o26');
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForTimeout(4000);

  // 3. 初回アクセスなので「名前」を入れる
  await page.getByPlaceholder('名前').fill('huyubot (テスト中）');

  // 4. 発言欄に文字を入れて、初回モード通り「Enter」で投稿する
  const chatInput = page.locator('textarea').first();
  await chatInput.fill('GitHubボットのテスト発言です！');
  await chatInput.press('Enter');

  await page.waitForTimeout(2000);
  await browser.close();
})();
