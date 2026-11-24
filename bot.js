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
  const passInput = page.locator('input[type="password"]:visible').first();
  await passInput.fill('HuyuTetr1s2o26');
  await page.waitForTimeout(500);
  const loginForm = passInput.locator('xpath=ancestor::form');
  await loginForm.locator('input[type="submit"], button').first().click();
  await page.waitForTimeout(6000);

  // 3. 「名前を入力」にボット名を入れてEnter
  const nameInput = page.getByPlaceholder('名前を入力');
  if (await nameInput.isVisible()) {
    await nameInput.fill('huyubot test');
    await nameInput.press('Enter');
    await page.waitForTimeout(10000);
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

  // メッセージ送信用の共通関数（初回と2回目以降の両方に対応）
  const sendChat = async (text, isFirst = false) => {
    await chatInput.fill(text, { force: true });
    await page.waitForTimeout(300);
    if (isFirst) {
      await chatInput.press('Enter');
    } else {
      await chatInput.press('Shift+Enter');
      await page.waitForTimeout(300);
      if ((await chatInput.inputValue()).length > 0) {
        const postBtn = page.getByRole('button', { name: '投稿' }).first();
        if (await postBtn.isVisible()) {
          await postBtn.click({ force: true });
        }
      }
    }
  };

  await sendChat('0円ステルス突破成功！！', true);
  await page.waitForTimeout(2000);

  // ==========================================
  // 5. 常駐監視ループ（testキュー＋bye管理者判定）
  // ==========================================
  console.log('監視モード開始！コマンドを待機します...');

  // 画面上の投稿一覧（投稿ID、本文、名前、トリップなどを含むブロック）を取得
  const getPosts = async () => {
    return await page.evaluate(() => {
      // feederの各投稿ブロック（吹き出し＋アイコン＋名前を含む親要素）を抽出
      // 投稿番号（例: 1313）や時刻を含む要素の親をたどって1投稿ずつまとめる
      const blocks = Array.from(document.querySelectorAll('div, li, tr')).filter(el => {
        const txt = el.innerText || '';
        return /\d{2}:\d{2}:\d{2}/.test(txt) && txt.length < 500;
      });
      return blocks.map(el => el.innerText.trim());
    });
  };

  // 入室前から画面にある投稿数を記録（過去ログへの誤反応防止）
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
      // 一番新しく投稿された「huyubot/bye」の投稿ブロック（feederは上が最新か下が最新か両方対応できるよう最新を取得）
      const latestByePost = byePosts[0];
      const lines = latestByePost.split('\n').map(l => l.trim());

      // 名前が「ℎ𝑢𝑦𝑢_」または「huyu_」で、かつトリップ「tetrio」が含まれているか判定
      const hasValidName = lines.some(l => l === 'ℎ𝑢𝑦𝑢_' || l === 'huyu_');
      const hasValidTrip = latestByePost.includes('tetrio');

      if (hasValidName && hasValidTrip) {
        console.log('管理者本人からの bye コマンドを確認！退室します。');
        await sendChat('I am removing the bot; this may take a moment. Goodbye.');
        await page.waitForTimeout(2000);
        break; // ループを抜けてブラウザを閉じる（退室）！
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
