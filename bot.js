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

  // 0. HuyuBotアカウントにログイン
  if (process.env.BOT_EMAIL && process.env.BOT_PASS) {
    console.log('HuyuBotアカウントでログインを試みます...');
    const loginUrl = 'https://' + 'www.x-feeder.info/account/login.php';
    await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
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

  // 1. 部屋にアクセス
  const roomUrl = 'https://' + 'www1.x-feeder.info/huyu_praviteroom/';
  await page.goto(roomUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // 2. 部屋のパスワードを入れて入室
  const roomPassInput = page.locator('input[type="password"]:visible').first();
  if (await roomPassInput.isVisible()) {
    await roomPassInput.fill('HuyuTetr1s2o26');
    await page.waitForTimeout(500);
    const loginForm = roomPassInput.locator('xpath=ancestor::form');
    await loginForm.locator('input[type="submit"], button').first().click();
    await page.waitForTimeout(6000);
  }

  // 3. 未ログイン時のみ名前入力
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

  // ★ 特定したID「#input_type」をクリックして複数行モード（#post_form_multi）へ切り替え！
  const multiInput = page.locator('#post_form_multi');
  if (!(await multiInput.isVisible())) {
    await page.locator('#input_type').click({ force: true });
    await page.waitForTimeout(500);
    console.log('複数行モード（#post_form_multi）に切り替えました！');
  }

  // ★ #post_form_multi に改行入りで入力し、#post_btn で確実に送信する関数
  const sendChat = async (text) => {
    if (!(await multiInput.isVisible())) {
      await page.locator('#input_type').click({ force: true });
      await page.waitForTimeout(300);
    }

    await multiInput.fill('', { force: true });

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].length > 0) {
        await multiInput.type(lines[i]);
      }
      if (i < lines.length - 1) {
        await multiInput.press('Enter');
        await page.waitForTimeout(150);
      }
    }

    await page.waitForTimeout(300);
    await page.locator('#post_btn').click({ force: true });
  };

  // ★ 日本時間（JST）の「YYYY/MM/DD HH:MM:SS」を作る関数
  const getJstDateTime = () => {
    const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const min = String(now.getUTCMinutes()).padStart(2, '0');
    const ss = String(now.getUTCSeconds()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}`;
  };

  // ★ 投稿テキストの中から「発言者の名前」を抜き出す関数
  const extractSenderName = (postText) => {
    const lines = postText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (const line of lines) {
      if (line === 'huyubot/test') continue;
      if (/^\d+$/.test(line)) continue;
      if (line.includes('huyubot/test')) continue;
      return line;
    }
    return '名無し';
  };

  // 入室時のバイリンガル挨拶（1つの吹き出しの中で綺麗に2行改行されます！）
  await sendChat('こんにちは、私はfeeder huyubotです、コマンド一覧を見たい場合は「huyubot/help」と打ってください。\nHi! im feeder huyubot. To view the list of commands, please type "huyubot/help".');
  await page.waitForTimeout(2000);

  // ==========================================
  // 5. 常駐監視ループ（testキュー＋bye管理者判定）
  // ==========================================
  console.log('監視モード開始！コマンドを待機します...');

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

  const initialPosts = await getPosts();
  let prevTestCount = initialPosts.filter(t => t.split('\n').some(line => line.trim() === 'huyubot/test')).length;
  let prevByeCount = initialPosts.filter(t => t.split('\n').some(line => line.trim() === 'huyubot/bye')).length;

  // 誰がtestを打ったかを順番に覚えておくキュー（配列）
  const testQueue = [];
  let cooldownStartTime = 0;

  const endTime = Date.now() + 30 * 60 * 1000;

  while (Date.now() < endTime) {
    const posts = await getPosts();

    // --- A. 「huyubot/bye」のチェック（最優先） ---
    const byePosts = posts.filter(t => t.split('\n').some(line => line.trim() === 'huyubot/bye'));
    if (byePosts.length > prevByeCount) {
      prevByeCount = byePosts.length;
      const latestByePost = byePosts.at(0) || '';

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

    // --- B. 「huyubot/test」のチェック（10秒クールタイム＋発言者記録キュー） ---
    const testPosts = posts.filter(t => t.split('\n').some(line => line.trim() === 'huyubot/test'));
    if (testPosts.length > prevTestCount) {
      const added = testPosts.length - prevTestCount;
      prevTestCount = testPosts.length;

      if (testQueue.length === 0 && cooldownStartTime === 0) {
        cooldownStartTime = Date.now();
      }

      // 新しく増えた投稿（上から順に新しい）から発言者の名前を取り出してキューに入れる
      for (let i = added - 1; i >= 0; i--) {
        const sender = extractSenderName(testPosts[i] || '');
        testQueue.push(sender);
      }
      console.log(`testコマンド検知！(＋${added}回 / 待機数: ${testQueue.length}回)`);
    }

    if (testQueue.length > 0 && Date.now() - cooldownStartTime >= 10000) {
      const targetUser = testQueue.shift();
      const dateTimeStr = getJstDateTime();
      console.log(`10秒経過！test返信を実行します（対象: ${targetUser}）`);

      await sendChat(`この投稿はテストです\nThis is a test post.\n${targetUser} ${dateTimeStr}`);
      cooldownStartTime = testQueue.length > 0 ? Date.now() : 0;
    }

    await page.waitForTimeout(2500);
  }

  await browser.close();
})();
