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

  // 0. 正しいログインURL「www.x-feeder.info/account/login.php」でHuyuBotアカウントにログイン
  if (process.env.BOT_EMAIL && process.env.BOT_PASS) {
    console.log('HuyuBotアカウントでログインを試みます...');
    await page.goto('https://www.x-feeder.info/account/login.php', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);

    const emailInput = page.locator('input[type="text"]:visible, input[type="email"]:visible').first();
    const accPassInput = page.locator('input[type="password"]:visible').first();
    if (await emailInput.isVisible() && await accPassInput.isVisible()) {
      await emailInput.fill(process.env.BOT_EMAIL);
      await accPassInput.fill(process.env.BOT_PASS);
      await page.waitForTimeout(500);
      const accForm = accPassInput.locator('xpath=ancestor::form');
      await accForm.locator('input[type="submit"], button').first().click();
      await page.waitForTimeout(5000);
      console.log('ログイン処理完了！現在のURL:', page.url());
    }
  }

  // 1. 部屋にアクセス（部屋サーバーは www1 のまま！）
  const roomUrl = 'https://' + 'www1.x-feeder.info/' + 'huyu_praviteroom/';
  await page.goto(roomUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // 2. 部屋のパスワード（HuyuTetr1s2o26）を入れて入室
  const roomPassInput = page.locator('input[type="password"]:visible').first();
  if (await roomPassInput.isVisible()) {
    await roomPassInput.fill('HuyuTetr1s2o26');
    await page.waitForTimeout(500);
    const loginForm = roomPassInput.locator('xpath=ancestor::form');
    await loginForm.locator('input[type="submit"], button').first().click();
    await page.waitForTimeout(6000);
  }

  // 3. もし未ログイン（ゲスト状態）になった場合だけ「名前を入力」を入れる
  const nameInput = page.getByPlaceholder('名前を入力');
  if (await nameInput.isVisible()) {
    await nameInput.fill('huyubot test');
    await nameInput.press('Enter');
    await page.waitForTimeout(8000);
  }

  // 4. 初回チュートリアルを消す
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const skipBtn = page.locator('.introjs-skipbutton, .introjs-donebutton').first();
  if (await skipBtn.isVisible()) {
    await skipBtn.click({ force: true });
    await page.waitForTimeout(500);
  }

  // ★ここを追加！左上の「一行／複数行 入力切替」ボタンを押して改行(\n)を有効化！
  const multiLineBtn = page.locator('[title*="一行／複数行"], [title*="入力切替"]').first();
  if (await multiLineBtn.isVisible()) {
    await multiLineBtn.click({ force: true });
    await page.waitForTimeout(500);
    console.log('複数行入力モードに切り替えました！');
  }

  const chatInput = page.getByPlaceholder(/発言内容を入力/).first();

  // メッセージ送信用の共通関数（複数行モードなので常に Shift+Enter または 投稿ボタン で送信）
  const sendChat = async (text) => {
    await chatInput.fill(text, { force: true });
    await page.waitForTimeout(300);
    await chatInput.press('Shift+Enter');
    await page.waitForTimeout(300);
    if ((await chatInput.inputValue()).length > 0) {
      const postBtn = page.getByRole('button', { name: '投稿' }).first();
      if (await postBtn.isVisible()) {
        await postBtn.click({ force: true });
      }
    }
  };

  // 入室時のバイリンガル挨拶（複数行モードなので \n でしっかり2行改行される！）
  await sendChat('こんにちは、私はfeeder huyubotです、コマンド一覧を見たい場合は「huyubot/help」と打ってください。\nHi! im feeder huyubot. To view the list of commands, please type "huyubot/help".');
  await page.waitForTimeout(2000);

  // ==========================================
  // 5. 常駐監視ループ（testキュー＋bye管理者判定）
  // ==========================================
  console.log('監視モード開始！コマンドを待機します...');

  // 画面上の投稿を「1投稿＝1要素」で重複なく取得する関数
  const getPosts = async () => {
    return await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div, li, tr'));
      const postBlocks = allDivs.filter(el => {
        const txt = el.innerText || '';
        const timeMatches = txt.match(/\d{2}:\d{2}:\d{2}/g);
        return timeMatches && timeMatches.length === 1 && txt.length < 400;
      });

      const uniquePosts = postBlocks.filter((el, _, arr) => {
        return !arr.some(other => other !== el && other.contains(el) && other.innerText.includes('\n'));
      });

      return uniquePosts.map(el => el.innerText.trim());
    });
  };

  // 入室前から画面にある投稿数を記録（過去ログ反応防止）
  const initialPosts = await getPosts();
  let prevTestCount = initialPosts.filter(t => t.split('\n').some(line => line.trim() === 'huyubot/test')).length;
  let prevByeCount = initialPosts.filter(t => t.split('\n').some(line => line.trim() === 'huyubot/bye')).length;

  let pendingReplies = 0;
  let cooldownStartTime = 0;

  // 30分間ループ
  const endTime = Date.now() + 30 * 60 * 1000;

  while (Date.now() < endTime) {
    const posts = await getPosts();

    // --- A. 「huyubot/bye」のチェック（最優先） ---
    const byePosts = posts.filter(t => t.split('\n').some(line => line.trim() === 'huyubot/bye'));
    if (byePosts.length > prevByeCount) {
      prevByeCount = byePosts.length;
      const latestByePost = byePosts.at(0);

      // 個人トリップ「tetrio」が含まれていれば管理者本人と判定！
      const hasValidTrip = latestByePost.includes('tetrio');

      if (hasValidTrip) {
        console.log('管理者本人からの bye コマンドを確認！退室します。');
        await sendChat('I am removing the bot; this may take a moment. Goodbye.');
        await page.waitForTimeout(2000);
        break;
      } else {
        console.log('権限のないユーザーからの bye コマンドを拒否しました。');
        await sendChat('You are not an administrator or a designated person.');
      }
    }

    // --- B. 「huyubot/test」のチェック（10秒クールタイム＋キュー） ---
    const currentTestCount = posts.filter(t => t.split('\n').some(line => line.trim() === 'huyubot/test')).length;
    if (currentTestCount > prevTestCount) {
      const added = currentTestCount - prevTestCount;
      prevTestCount = currentTestCount;
      if (pendingReplies === 0 && cooldownStartTime === 0) {
        cooldownStartTime = Date.now();
      }
      pendingReplies += added;
      console.log(`testコマンド検知！(＋${added}回 / 待機数: ${pendingReplies}回)`);
    }

    if (pendingReplies > 0 && Date.now() - cooldownStartTime >= 10000) {
      console.log('10秒経過！test返信を実行します');
      await sendChat('This is a test post.');
      pendingReplies -= 1;
      cooldownStartTime = pendingReplies > 0 ? Date.now() : 0;
    }

    // 規約とサーバーに優しい2.5秒間隔で監視
    await page.waitForTimeout(2500);
  }

  await browser.close();
})();
