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

   // 2. 「type="password"」の欄だけを狙い撃ちしてパスワードを入れ、「ログイン」ボタンを押す！
  const passInput = page.locator('input[type="password"]').first();
  await passInput.fill('HuyuTetris2026');
  await page.waitForTimeout(500);

  // Enterではなく「ログイン」ボタンを確実にクリック！
  const loginBtn = page.locator('input[type="submit"], button:has-text("ログイン"), input[value="ログイン"]').first();
  await loginBtn.click();
  await page.waitForTimeout(6000);

  // 3. 「名前を入力」があれば入力する（もし無ければスキップして次へ！）
  const nameInput = page.getByPlaceholder('名前を入力');
  if (await nameInput.isVisible()) {
    await nameInput.fill('huyubot test');
    await nameInput.press('Enter');
    await page.waitForTimeout(10000);
  } else {
    console.log('「名前を入力」が見当たらないためスキップします');
  }

  // 4. 初回チュートリアルを消して最初の挨拶を投稿（初回はEnter）
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const skipBtn = page.locator('.introjs-skipbutton, .introjs-donebutton').first();
  if (await skipBtn.isVisible()) {
    await skipBtn.click({ force: true });
    await page.waitForTimeout(500);
  }

  const chatInput = page.getByPlaceholder(/発言内容を入力/).first();
  await chatInput.fill('0円ステルス突破成功！！', { force: true });
  await page.waitForTimeout(500);
  await chatInput.press('Enter');
  await page.waitForTimeout(2000);

  // ==========================================
  // 5. 常駐監視ループ（キュー＋10秒クールタイム制）
  // ==========================================
  console.log('監視モード開始！huyubot/test を待機します...');

  const getChatLines = async () => {
    return await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      return bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    });
  };

  // 入室直後の既存コマンド数を記録
  let prevCount = (await getChatLines()).filter(line => line === 'huyubot/test').length;

  // 返信待ちの回数（キュー）と、10秒計測用のタイマー
  let pendingReplies = 0;
  let cooldownStartTime = 0;

  // 30分間ループ
  const endTime = Date.now() + 30 * 60 * 1000;

  while (Date.now() < endTime) {
    const lines = await getChatLines();
    const currentCount = lines.filter(line => line === 'huyubot/test').length;

    // 新しい「huyubot/test」が打たれたら、増えた回数分だけ待機リストに積む
    if (currentCount > prevCount) {
      const added = currentCount - prevCount;
      prevCount = currentCount;

      if (pendingReplies === 0 && cooldownStartTime === 0) {
        cooldownStartTime = Date.now();
      }
      pendingReplies += added;
      console.log(`コマンド検知！(＋${added}回 / 現在の待機数: ${pendingReplies}回)`);
    }

    // 待機リストに1回以上あり、カウント開始から10秒以上経過していたら1回投稿
    if (pendingReplies > 0 && Date.now() - cooldownStartTime >= 10000) {
      console.log(`10秒経過！返信を実行します（残り待機数: ${pendingReplies - 1}回）`);

      await chatInput.fill('This is a test post.', { force: true });
      await page.waitForTimeout(300);
      await chatInput.press('Shift+Enter');

      // 送信保険（「投稿」ボタンクリック）
      await page.waitForTimeout(300);
      if ((await chatInput.inputValue()).length > 0) {
        const postBtn = page.getByRole('button', { name: '投稿' }).first();
        if (await postBtn.isVisible()) {
          await postBtn.click({ force: true });
        }
      }

      pendingReplies -= 1;

      if (pendingReplies > 0) {
        cooldownStartTime = Date.now();
      } else {
        cooldownStartTime = 0;
      }
    }

    await page.waitForTimeout(1000);
  }

  await browser.close();
})();
