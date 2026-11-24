const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    locale: 'ja-JP',
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // 1. 部屋にアクセス
  const roomUrl = 'https://' + 'www1.x-feeder.info/' + 'huyu_praviteroom/';
  await page.goto(roomUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(6000);

  // 2. パスワードを入れてログイン
  const passInput = page.locator('input[type="password"], input[type="text"]').first();
  await passInput.fill('HuyuTetr1s2o26');
  await passInput.press('Enter');
  await page.waitForTimeout(5000);

  // 3. 「名前を入力」にボット名を入れてEnter、入室完了まで10秒待つ！
  const nameInput = page.getByPlaceholder('名前を入力');
  await nameInput.fill('huyubot test');
  await nameInput.press('Enter');
  await page.waitForTimeout(10000);

    // 4. 初回チュートリアルをスキップ＆入力欄へ直接打ち込んでEnter！
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // もしチュートリアルのスキップボタン等があれば押す
  const skipBtn = page.locator('.introjs-skipbutton, .introjs-donebutton').first();
  if (await skipBtn.isVisible()) {
    await skipBtn.click({ force: true });
    await page.waitForTimeout(500);
  }

  // 初回用の「発言内容を入力」を含む欄を取得（Enterで投稿でもShift+Enterでも両方対応！）
  const chatInput = page.getByPlaceholder(/発言内容を入力/).first();
  
  // チュートリアルが残っていても強制的にフォーカスして文字を入れる
  await chatInput.fill('0円ステルス突破成功！！', { force: true });
  await page.waitForTimeout(500);

  // 初回仕様の Enter で投稿！
  await chatInput.press('Enter');

  await page.waitForTimeout(3000);
  await browser.close();
})();
