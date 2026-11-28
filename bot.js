const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

// ==========================================
// 1. 天気位置データ（地方・都道府県・座標）
// ==========================================

const WEATHER_REGIONS = {
  '北海道': ['札幌市', '稚内市', '福島町', '陸別町', 'えりも町', '中標津町'],
  '東北': ['青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  '関東': ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
  '中部': ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
  '近畿': ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
  '中国': ['鳥取県', '島根県', '岡山県', '広島県', '山口県'],
  '四国': ['徳島県', '香川県', '愛媛県', '高知県'],
  '九州': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'],
  '沖縄': ['沖縄県']
};

const PREF_CAPITALS = {
  '青森県': '青森市', '岩手県': '盛岡市', '宮城県': '仙台市', '秋田県': '秋田市', '山形県': '山形市', '福島県': '福島市',
  '茨城県': '水戸市', '栃木県': '宇都宮市', '群馬県': '前橋市', '埼玉県': 'さいたま市', '千葉県': '千葉市', '東京都': '新宿区', '神奈川県': '横浜市',
  '新潟県': '新潟市', '富山県': '富山市', '石川県': '金沢市', '福井県': '福井市', '山梨県': '甲府市', '長野県': '長野市', '岐阜県': '岐阜市', '静岡県': '静岡市', '愛知県': '名古屋市',
  '三重県': '津市', '滋賀県': '大津市', '京都府': '京都市', '大阪府': '大阪市', '兵庫県': '神戸市', '奈良県': '奈良市', '和歌山県': '和歌山市',
  '鳥取県': '鳥取市', '島根県': '松江市', '岡山県': '岡山市', '広島県': '広島市', '山口県': '山口市',
  '徳島県': '徳島市', '香川県': '高松市', '愛媛県': '松山市', '高知県': '高知市',
  '福岡県': '福岡市', '佐賀県': '佐賀市', '長崎県': '長崎市', '熊本県': '熊本市', '大分県': '大分市', '宮崎県': '宮崎市', '鹿児島県': '鹿児島市', '沖縄県': '那覇市'
};

const WEATHER_LOCATIONS = {
  '札幌市': { label: '北海道 札幌市', lat: 43.0642, lon: 141.3469 },
  '稚内市': { label: '北海道 稚内市', lat: 45.4156, lon: 141.6731 },
  '福島町': { label: '北海道 福島町', lat: 41.4819, lon: 140.2519 },
  '陸別町': { label: '北海道 陸別町', lat: 43.4678, lon: 143.7431 },
  'えりも町': { label: '北海道 えりも町', lat: 42.0167, lon: 143.1500 },
  '中標津町': { label: '北海道 中標津町', lat: 43.5539, lon: 144.9711 },
  '青森県': { label: '青森県（青森市）', lat: 40.8244, lon: 140.7400 },
  '青森市': { label: '青森県 青森市', lat: 40.8244, lon: 140.7400 },
  '岩手県': { label: '岩手県（盛岡市）', lat: 39.7036, lon: 141.1525 },
  '盛岡市': { label: '岩手県 盛岡市', lat: 39.7036, lon: 141.1525 },
  '宮城県': { label: '宮城県（仙台市）', lat: 38.2689, lon: 140.8719 },
  '仙台市': { label: '宮城県 仙台市', lat: 38.2689, lon: 140.8719 },
  '秋田県': { label: '秋田県（秋田市）', lat: 39.7186, lon: 140.1025 },
  '秋田市': { label: '秋田県 秋田市', lat: 39.7186, lon: 140.1025 },
  '山形県': { label: '山形県（山形市）', lat: 38.2406, lon: 140.3633 },
  '山形市': { label: '山形県 山形市', lat: 38.2406, lon: 140.3633 },
  '福島県': { label: '福島県（福島市）', lat: 37.7500, lon: 140.4678 },
  '福島市': { label: '福島県 福島市', lat: 37.7500, lon: 140.4678 },
  '茨城県': { label: '茨城県（水戸市）', lat: 36.3414, lon: 140.4467 },
  '水戸市': { label: '茨城県 水戸市', lat: 36.3414, lon: 140.4467 },
  '栃木県': { label: '栃木県（宇都宮市）', lat: 36.5658, lon: 139.8836 },
  '宇都宮市': { label: '栃木県 宇都宮市', lat: 36.5658, lon: 139.8836 },
  '群馬県': { label: '群馬県（前橋市）', lat: 36.3911, lon: 139.0608 },
  '前橋市': { label: '群馬県 前橋市', lat: 36.3911, lon: 139.0608 },
  '埼玉県': { label: '埼玉県（さいたま市）', lat: 35.8569, lon: 139.6489 },
  'さいたま市': { label: '埼玉県 さいたま市', lat: 35.8569, lon: 139.6489 },
  '千葉県': { label: '千葉県（千葉市）', lat: 35.6047, lon: 140.1233 },
  '千葉市': { label: '千葉県 千葉市', lat: 35.6047, lon: 140.1233 },
  '東京都': { label: '東京都（新宿区）', lat: 35.6895, lon: 139.6917 },
  '新宿区': { label: '東京都 新宿区', lat: 35.6895, lon: 139.6917 },
  '神奈川県': { label: '神奈川県（横浜市）', lat: 35.4478, lon: 139.6425 },
  '横浜市': { label: '神奈川県 横浜市', lat: 35.4478, lon: 139.6425 },
  '新潟県': { label: '新潟県（新潟市）', lat: 37.9022, lon: 139.0236 },
  '新潟市': { label: '新潟県 新潟市', lat: 37.9022, lon: 139.0236 },
  '富山県': { label: '富山県（富山市）', lat: 36.6953, lon: 137.2114 },
  '富山市': { label: '富山県 富山市', lat: 36.6953, lon: 137.2114 },
  '石川県': { label: '石川県（金沢市）', lat: 36.5944, lon: 136.6256 },
  '金沢市': { label: '石川県 金沢市', lat: 36.5944, lon: 136.6256 },
  '福井県': { label: '福井県（福井市）', lat: 36.0653, lon: 136.2219 },
  '福井市': { label: '福井県 福井市', lat: 36.0653, lon: 136.2219 },
  '山梨県': { label: '山梨県（甲府市）', lat: 35.6639, lon: 138.5683 },
  '甲府市': { label: '山梨県 甲府市', lat: 35.6639, lon: 138.5683 },
  '長野県': { label: '長野県（長野市）', lat: 36.6514, lon: 138.1811 },
  '長野市': { label: '長野県 長野市', lat: 36.6514, lon: 138.1811 },
  '岐阜県': { label: '岐阜県（岐阜市）', lat: 35.3911, lon: 136.7222 },
  '岐阜市': { label: '岐阜県 岐阜市', lat: 35.3911, lon: 136.7222 },
  '静岡県': { label: '静岡県（静岡市）', lat: 34.9769, lon: 138.3831 },
  '静岡市': { label: '静岡県 静岡市', lat: 34.9769, lon: 138.3831 },
  '愛知県': { label: '愛知県（名古屋市）', lat: 35.1803, lon: 136.9067 },
  '名古屋市': { label: '愛知県 名古屋市', lat: 35.1803, lon: 136.9067 },
  '三重県': { label: '三重県（津市）', lat: 34.7303, lon: 136.5086 },
  '津市': { label: '三重県 津市', lat: 34.7303, lon: 136.5086 },
  '滋賀県': { label: '滋賀県（大津市）', lat: 35.0044, lon: 135.8683 },
  '大津市': { label: '滋賀県 大津市', lat: 35.0044, lon: 135.8683 },
  '京都府': { label: '京都府（京都市）', lat: 35.0214, lon: 135.7556 },
  '京都市': { label: '京都府 京都市', lat: 35.0214, lon: 135.7556 },
  '大阪府': { label: '大阪府（大阪市）', lat: 34.6864, lon: 135.5200 },
  '大阪市': { label: '大阪府 大阪市', lat: 34.6864, lon: 135.5200 },
  '兵庫県': { label: '兵庫県（神戸市）', lat: 34.6914, lon: 135.1831 },
  '神戸市': { label: '兵庫県 神戸市', lat: 34.6914, lon: 135.1831 },
  '奈良県': { label: '奈良県（奈良市）', lat: 34.6853, lon: 135.8328 },
  '奈良市': { label: '奈良県 奈良市', lat: 34.6853, lon: 135.8328 },
  '和歌山県': { label: '和歌山県（和歌山市）', lat: 34.2261, lon: 135.1675 },
  '和歌山市': { label: '和歌山県 和歌山市', lat: 34.2261, lon: 135.1675 },
  '鳥取県': { label: '鳥取県（鳥取市）', lat: 35.5036, lon: 134.2383 },
  '鳥取市': { label: '鳥取県 鳥取市', lat: 35.5036, lon: 134.2383 },
  '島根県': { label: '島根県（松江市）', lat: 35.4722, lon: 133.0506 },
  '松江市': { label: '島根県 松江市', lat: 35.4722, lon: 133.0506 },
  '岡山県': { label: '岡山県（岡山市）', lat: 34.6617, lon: 133.9350 },
  '岡山市': { label: '岡山県 岡山市', lat: 34.6617, lon: 133.9350 },
  '広島県': { label: '広島県（広島市）', lat: 34.3964, lon: 132.4594 },
  '広島市': { label: '広島県 広島市', lat: 34.3964, lon: 132.4594 },
  '山口県': { label: '山口県（山口市）', lat: 34.1858, lon: 131.4714 },
  '山口市': { label: '山口県 山口市', lat: 34.1858, lon: 131.4714 },
  '徳島県': { label: '徳島県（徳島市）', lat: 34.0658, lon: 134.5594 },
  '徳島市': { label: '徳島県 徳島市', lat: 34.0658, lon: 134.5594 },
  '香川県': { label: '香川県（高松市）', lat: 34.3403, lon: 134.0433 },
  '高松市': { label: '香川県 高松市', lat: 34.3403, lon: 134.0433 },
  '愛媛県': { label: '愛媛県（松山市）', lat: 33.8417, lon: 132.7661 },
  '松山市': { label: '愛媛県 松山市', lat: 33.8417, lon: 132.7661 },
  '高知県': { label: '高知県（高知市）', lat: 33.5597, lon: 133.5311 },
  '高知市': { label: '高知県 高知市', lat: 33.5597, lon: 133.5311 },
  '福岡県': { label: '福岡県（福岡市）', lat: 33.6064, lon: 130.4181 },
  '福岡市': { label: '福岡県 福岡市', lat: 33.6064, lon: 130.4181 },
  '佐賀県': { label: '佐賀県（佐賀市）', lat: 33.2494, lon: 130.2989 },
  '佐賀市': { label: '佐賀県 佐賀市', lat: 33.2494, lon: 130.2989 },
  '長崎県': { label: '長崎県（長崎市）', lat: 32.7447, lon: 129.8736 },
  '長崎市': { label: '長崎県 長崎市', lat: 32.7447, lon: 129.8736 },
  '熊本県': { label: '熊本県（熊本市）', lat: 32.7897, lon: 130.7417 },
  '熊本市': { label: '熊本県 熊本市', lat: 32.7897, lon: 130.7417 },
  '大分県': { label: '大分県（大分市）', lat: 33.2381, lon: 131.6125 },
  '大分市': { label: '大分県 大分市', lat: 33.2381, lon: 131.6125 },
  '宮崎県': { label: '宮崎県（宮崎市）', lat: 31.9111, lon: 131.4239 },
  '宮崎市': { label: '宮崎県 宮崎市', lat: 31.9111, lon: 131.4239 },
  '鹿児島県': { label: '鹿児島県（鹿児島市）', lat: 31.5603, lon: 130.5581 },
  '鹿児島市': { label: '鹿児島県 鹿児島市', lat: 31.5603, lon: 130.5581 },
  '沖縄県': { label: '沖縄県（那覇市）', lat: 26.2125, lon: 127.6811 },
  '那覇市': { label: '沖縄県 那覇市', lat: 26.2125, lon: 127.6811 }
};

// ここでわける（第1弾終了）
// ==========================================
// 2. てとくじデータ（全12パターン・確率配分パターンB）
// ==========================================

const TETOKUJI_LIST = [
  {
    weight: 0.3,
    text: '【隠れ超大吉】Oミノを回し続けたら溶けてIミノの形になってるかも\nあなたをミノで例えると？「溶けるOミノ」'
  },
  {
    weight: 2.3,
    text: '【隠れ大吉】途中でPCが取れるかも・・・！\nあなたをミノで例えると？「7ミノぜんぶ」'
  },
  {
    weight: 5.4,
    text: '【超特大吉】TSDとTSTがたくさん、大火力を出せるかも\nあなたをミノで例えると「Tミノ」'
  },
  {
    weight: 9.0,
    text: '【超大吉】Iミノがテンポ良くたくさん来て中火力を出せるかも？\nあなたをミノで例えると「Iミノ」'
  },
  {
    weight: 12.0,
    text: '【大吉】ちょうどいいところに2マスの平らな地形があるかも\nあなたをミノで例えると？「Oミノ」'
  },
  {
    weight: 14.0,
    text: '【中吉】Zミノが2~3連続（ホールド含む）でめちゃ高い4列ができるかも\nあなたをミノで例えると「Zミノ」'
  },
  {
    weight: 21.0,
    text: '【吉】ちょうど6combo以上ができる4列ができてるかも\nあなたをミノで例えると？「Sミノ」'
  },
  {
    weight: 11.0,
    text: '【小吉】あと1ピースで高さ4マスの穴ができたらIミノがちょうどくるかも\nあなたをミノで例えると？「Jミノ」'
  },
  {
    weight: 10.0,
    text: '【未吉】ホールドに来てほしいミノがたくさん来て火力を出せるかも\nあなたをミノで例えると？「Lミノ」'
  },
  {
    weight: 7.0,
    text: '【凶】SミノとZミノが連続で来てどこに置けばいいのかわからなくなっちゃう\nあなたをミノで例えると?「うねうね正反対なミノ」\n一言アドバイス:Tミノが埋まる地形を作っていれば綺麗にできるかも'
  },
  {
    weight: 5.0,
    text: '【大凶】ピンチな状態でミスってゲームオーバーになるかも・・・?\nあなたをミノで例えると?「急ぎすぎなテトリミノ」\n一言アドバイス:慎重にスピードを下げて掘ろう'
  },
  {
    weight: 3.0,
    text: '【極大凶】地形がぐちゃぐちゃになってゲームオーバーになるかも・・・\nあなたをミノで例えると?「想定していない場所へ進むIミノ」\n一言アドバイス:運も実力のうち'
  }
];

// ここでわける（第2弾終了）
// ==========================================
// 3. 絵文字データ（変な記号を除外＋肌色パーツ含む約760種）
// ==========================================

const EMOJI_POOL = (() => {
  const list = [];
  const isPictographic = /\p{Extended_Pictographic}/u;

  for (let cp = 0x1F300; cp <= 0x1F9FF; cp++) {
    const ch = String.fromCodePoint(cp);
    const isSkinTone = (cp >= 0x1F3FB && cp <= 0x1F3FF);
    if (isPictographic.test(ch) || isSkinTone) {
      list.push(ch);
    }
  }
  return list;
})();

// ここでわける（第3弾終了）
// ==========================================
// 4. ユーティリティ関数群（時刻・進行度ゲージ・交代時刻・テトくじ抽選）
// ==========================================

const getJstNow = () => new Date(Date.now() + 9 * 60 * 60 * 1000);

const formatJstDateTime = (jstDate) => {
  const yyyy = jstDate.getUTCFullYear();
  const mm = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(jstDate.getUTCDate()).padStart(2, '0');
  const hh = String(jstDate.getUTCHours()).padStart(2, '0');
  const min = String(jstDate.getUTCMinutes()).padStart(2, '0');
  const ss = String(jstDate.getUTCSeconds()).padStart(2, '0');
  return yyyy + '/' + mm + '/' + dd + ' ' + hh + ':' + min + ':' + ss;
};

const formatDurationHms = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return h + ':' + m + ':' + s;
};

// 次の定時交代時刻（日本時間 00:04, 06:04, 12:04, 18:04）のUTCタイムスタンプを自動計算
const getNextShiftEndUtcMs = () => {
  const nowUtc = Date.now();
  const jst = new Date(nowUtc + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth();
  const d = jst.getUTCDate();

  const shiftHours = Array.of(0, 6, 12, 18);
  for (const h of shiftHours) {
    const candidateUtc = Date.UTC(y, m, d, h - 9, 4, 0);
    if (candidateUtc > nowUtc + 2 * 60 * 1000) {
      return candidateUtc;
    }
  }
  return Date.UTC(y, m, d + 1, 0 - 9, 4, 0);
};

const buildTimeReport = (endTimeUtcMs) => {
  const jst = getJstNow();
  const yyyy = jst.getUTCFullYear();
  const mm = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(jst.getUTCDate()).padStart(2, '0');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const w = weekdays.at(jst.getUTCDay());
  const hh = String(jst.getUTCHours()).padStart(2, '0');
  const min = String(jst.getUTCMinutes()).padStart(2, '0');
  const ss = String(jst.getUTCSeconds()).padStart(2, '0');

  const nowMs = jst.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const startOfDay = Date.UTC(yyyy, jst.getUTCMonth(), jst.getUTCDate(), 0, 0, 0);
  const endOfDay = Date.UTC(yyyy, jst.getUTCMonth(), jst.getUTCDate() + 1, 0, 0, 0);
  const dayPct = ((nowMs - startOfDay) / (endOfDay - startOfDay)) * 100;
  const remainTodayStr = formatDurationHms(endOfDay - nowMs);

  const startOfMonth = Date.UTC(yyyy, jst.getUTCMonth(), 1, 0, 0, 0);
  const endOfMonth = Date.UTC(yyyy, jst.getUTCMonth() + 1, 1, 0, 0, 0);
  const monthPct = ((nowMs - startOfMonth) / (endOfMonth - startOfMonth)) * 100;
  const remainMonthDays = Math.ceil((endOfMonth - nowMs) / oneDayMs);

  const startOfYear = Date.UTC(yyyy, 0, 1, 0, 0, 0);
  const endOfYear = Date.UTC(yyyy + 1, 0, 1, 0, 0, 0);
  const yearPct = ((nowMs - startOfYear) / (endOfYear - startOfYear)) * 100;
  const remainYearDays = Math.ceil((endOfYear - nowMs) / oneDayMs);

  const remainShiftStr = endTimeUtcMs ? formatDurationHms(endTimeUtcMs - Date.now()) : '--:--:--';

  const makeBar = (pct) => {
    const filled = Math.min(10, Math.max(0, Math.floor(pct / 10)));
    return '■'.repeat(filled) + '□'.repeat(10 - filled);
  };

  return [
    "🕒 現在は''" + yyyy + "/" + mm + "/" + dd + "''（" + w + "）　''" + hh + ":" + min + ":" + ss + "''",
    "⏳ 今日の残り時間：''" + remainTodayStr + "''",
    "📅 今月残りの日数はあと''" + remainMonthDays + "日''",
    "🎍 今年残りの日数はあと''" + remainYearDays + "日''",
    "🤖 次のBot交代まで：''" + remainShiftStr + "''",
    "☀️ 今日 " + dayPct.toFixed(2) + "% " + makeBar(dayPct),
    "🗓️ 今月 " + monthPct.toFixed(2) + "% " + makeBar(monthPct),
    "🌏 今年 " + yearPct.toFixed(2) + "% " + makeBar(yearPct)
  ].join('\n');
};

const drawTetokuji = () => {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const item of TETOKUJI_LIST) {
    cumulative += item.weight;
    if (rand < cumulative) {
      return item.text;
    }
  }
  return TETOKUJI_LIST.at(-1).text;
};

// ここでわける（第4弾終了）
// ==========================================
// 5. 天気API処理 ＆ アカウントログイン処理
// ==========================================

const resolveLocationKey = (rawInput) => {
  if (!rawInput) return null;
  if (WEATHER_LOCATIONS[rawInput]) return rawInput;
  if (rawInput === '北海道') return '北海道';
  const suffixes = Array.of('都', '府', '県', '市', '区', '町');
  for (const s of suffixes) {
    if (WEATHER_LOCATIONS[rawInput + s]) return rawInput + s;
  }
  return null;
};

const weatherCodeToEmojiJa = (code) => {
  if (code === 0) return '☀️ 快晴';
  if (code === 1 || code === 2) return '🌤️ 晴れ時々曇り';
  if (code === 3) return '☁️ 曇り';
  if (code === 45 || code === 48) return '🌫️ 霧';
  if (code >= 51 && code <= 57) return '🌦️ 霧雨';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '☔ 雨';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '❄️ 雪';
  if (code >= 95 && code <= 99) return '⛈️ 雷雨';
  return '❓ 不明';
};

const weatherCodeToShortEmoji = (code) => {
  if (code === 0) return '☀️';
  if (code === 1 || code === 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '☔';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '❄️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '❓';
};

const windDegToJa = (deg) => {
  if (deg === undefined || deg === null) return '';
  const dirs = Array.of('北', '北東', '東', '南東', '南', '南西', '西', '北西');
  return dirs.at(Math.round(deg / 45) % 8);
};

const fetchWeatherText = async (locKey) => {
  const loc = WEATHER_LOCATIONS[locKey];
  if (!loc) return null;

  try {
    const apiBase = 'https://' + 'api' + '.open-meteo' + '.com/v1/forecast';
    const url = apiBase
      + '?latitude=' + loc.lat
      + '&longitude=' + loc.lon
      + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,sunrise,sunset,uv_index_max'
      + '&timezone=Asia%2FTokyo&forecast_days=2';
    const res = await fetch(url);
    if (!res.ok) throw new Error('APIエラー');
    const data = await res.json();

    const c = data.current || {};
    const d = data.daily || {};
    const jst = getJstNow();
    const nowTimeStr = String(jst.getUTCMonth() + 1).padStart(2, '0') + '/' + String(jst.getUTCDate()).padStart(2, '0')
      + ' ' + String(jst.getUTCHours()).padStart(2, '0') + ':' + String(jst.getUTCMinutes()).padStart(2, '0');

    const curWeather = weatherCodeToEmojiJa(c.weather_code ?? -1);
    const curTemp = c.temperature_2m ?? '--';
    const appTemp = c.apparent_temperature ?? '--';
    const hum = c.relative_humidity_2m ?? '--';
    const windDir = windDegToJa(c.wind_direction_10m);
    const windSpd = c.wind_speed_10m !== undefined ? (c.wind_speed_10m / 3.6).toFixed(1) : '--';
    const press = c.pressure_msl ? Math.round(c.pressure_msl) : '--';

    const todayMax = d.temperature_2m_max ? d.temperature_2m_max.at(0) : '--';
    const todayMin = d.temperature_2m_min ? d.temperature_2m_min.at(0) : '--';
    const todayPop = d.precipitation_probability_max ? d.precipitation_probability_max.at(0) : '--';
    const todayRain = d.precipitation_sum ? d.precipitation_sum.at(0) : '--';
    const sunrise = d.sunrise && d.sunrise.at(0) ? d.sunrise.at(0).slice(-5) : '--:--';
    const sunset = d.sunset && d.sunset.at(0) ? d.sunset.at(0).slice(-5) : '--:--';
    const uvMax = d.uv_index_max ? d.uv_index_max.at(0) : '--';

    const tomWeather = weatherCodeToEmojiJa(d.weather_code ? d.weather_code.at(1) : -1);
    const tomMax = d.temperature_2m_max ? d.temperature_2m_max.at(1) : '--';
    const tomMin = d.temperature_2m_min ? d.temperature_2m_min.at(1) : '--';
    const tomPop = d.precipitation_probability_max ? d.precipitation_probability_max.at(1) : '--';

    return [
      '【📍' + loc.label + 'の天気 | ' + nowTimeStr + '現在】',
      '現在：' + curWeather + ' ' + curTemp + '℃（体感 ' + appTemp + '℃ / 💧 ' + hum + '%）',
      '風・圧：🍃 ' + windDir + ' ' + windSpd + 'm/s / 気圧 ' + press + 'hPa',
      '今日：最高 ' + todayMax + '℃ / 最低 ' + todayMin + '℃（☔ ' + todayPop + '% / 降水量 ' + todayRain + 'mm）',
      '日照：🌅 ' + sunrise + ' / 🌇 ' + sunset + ' / ☀️ UV ' + uvMax,
      '明日：' + tomWeather + '（最高 ' + tomMax + '℃ / 最低 ' + tomMin + '℃ / ☔ ' + tomPop + '%）',
      'Weather data by Open-Meteo.com'
    ].join('\n');
  } catch (e) {
    return '【📍' + loc.label + 'の天気】\n天気データの取得に失敗しました。少し時間をおいて再度お試しください。';
  }
};

const fetchTimelineWeatherText = async (locKey) => {
  const loc = WEATHER_LOCATIONS[locKey];
  if (!loc) return null;

  try {
    const apiBase = 'https://' + 'api' + '.open-meteo' + '.com/v1/forecast';
    const url = apiBase
      + '?latitude=' + loc.lat
      + '&longitude=' + loc.lon
      + '&current=temperature_2m,weather_code'
      + '&minutely_15=temperature_2m,weather_code,precipitation'
      + '&hourly=temperature_2m,weather_code,precipitation_probability'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
      + '&past_hours=3&forecast_hours=13&forecast_minutely_15=4&forecast_days=7&timezone=Asia%2FTokyo';
    const res = await fetch(url);
    if (!res.ok) throw new Error('APIエラー');
    const data = await res.json();

    const h = data.hourly || {};
    const m15 = data.minutely_15 || {};
    const d = data.daily || {};
    const c = data.current || {};

    // 1〜3時間前（hourlyの0,1,2番目）
    const pastItems = Array.of(0, 1, 2).map(idx => {
      const hr = 3 - idx;
      const ico = weatherCodeToShortEmoji(h.weather_code ? h.weather_code.at(idx) : -1);
      const tmp = h.temperature_2m ? h.temperature_2m.at(idx) : '--';
      return hr + 'h前:' + ico + tmp + '℃';
    });

    // 15分・30分・45分後（minutely_15の1,2,3番目）
    const minItems = Array.of(1, 2, 3).map(idx => {
      const mins = idx * 15;
      const ico = weatherCodeToShortEmoji(m15.weather_code ? m15.weather_code.at(idx) : -1);
      const tmp = m15.temperature_2m ? m15.temperature_2m.at(idx) : '--';
      const rain = m15.precipitation ? m15.precipitation.at(idx) : 0;
      return mins + '分後:' + ico + tmp + '℃(' + rain + 'mm)';
    });

    // 1〜12時間後（hourlyの4〜15番目）
    const futureH1 = [];
    const futureH2 = [];
    for (let step = 1; step <= 12; step++) {
      const idx = 3 + step;
      const ico = weatherCodeToShortEmoji(h.weather_code ? h.weather_code.at(idx) : -1);
      const tmp = h.temperature_2m ? h.temperature_2m.at(idx) : '--';
      const pop = h.precipitation_probability ? h.precipitation_probability.at(idx) : '--';
      const entry = step + 'h後:' + ico + tmp + '℃(' + pop + '%)';
      if (step <= 6) futureH1.push(entry);
      else futureH2.push(entry);
    }

    // 1〜7日間（dailyの0〜6番目）
    const dayItems = [];
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const dateLabel = d.time && d.time.at(dayIdx) ? d.time.at(dayIdx).slice(5).replace('-', '/') : (dayIdx + 1) + '日';
      const ico = weatherCodeToShortEmoji(d.weather_code ? d.weather_code.at(dayIdx) : -1);
      const maxT = d.temperature_2m_max ? d.temperature_2m_max.at(dayIdx) : '--';
      const minT = d.temperature_2m_min ? d.temperature_2m_min.at(dayIdx) : '--';
      const pop = d.precipitation_probability_max ? d.precipitation_probability_max.at(dayIdx) : '--';
      dayItems.push(dateLabel + ':' + ico + maxT + '/' + minT + '℃(' + pop + '%)');
    }

    const curIco = weatherCodeToEmojiJa(c.weather_code ?? -1);
    const curTmp = c.temperature_2m ?? '--';

    return [
      '【⏱️' + loc.label + ' 時系列天気】',
      '過去：' + pastItems.join(' / '),
      '現在：' + curIco + ' ' + curTmp + '℃',
      '直近：' + minItems.join(' / '),
      '1〜6h後：' + futureH1.join(' '),
      '7〜12h後：' + futureH2.join(' '),
      '週間(7日)：' + dayItems.join(' / '),
      'Weather data by Open-Meteo.com'
    ].join('\n');
  } catch (e) {
    return '【⏱️' + loc.label + ' 時系列天気】\n時系列データの取得に失敗しました。少し時間をおいて再度お試しください。';
  }
};

const parseScheduleJstMs = (dateStr, timeStr) => {
  const dMatch = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  const tMatch = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!dMatch || !tMatch) return null;

  const year = Number(dMatch.at(1));
  const month = Number(dMatch.at(2));
  const day = Number(dMatch.at(3));
  const hour = Number(tMatch.at(1));
  const minute = Number(tMatch.at(2));

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  return Date.UTC(year, month - 1, day, hour - 9, minute, 0);
};

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

  if (process.env.BOT_EMAIL && process.env.BOT_PASS) {
    console.log('HuyuBotアカウントでログインを試みます...');
    const loginUrl = 'https://' + 'www' + '.x-feeder' + '.info/account/login.php';
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
// ここでわける（第5弾終了）
// ==========================================
// 6. 部屋への入室・ステータス設定・送信準備・入室挨拶
// ==========================================

  const roomUrl = process.env.ROOM_URL;
  await page.goto(roomUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  const roomPassInput = page.locator('input[type="password"]:visible').first();
  if (await roomPassInput.isVisible()) {
    await roomPassInput.fill(process.env.ROOM_PASS || '');
    await page.waitForTimeout(500);
    const loginForm = roomPassInput.locator('xpath=ancestor::form');
    await loginForm.locator('input[type="submit"], button').first().click();
    await page.waitForTimeout(6000);
  }

  const nameInput = page.getByPlaceholder('名前を入力');
  if (await nameInput.isVisible()) {
    await nameInput.fill('Huyubot');
    await nameInput.press('Enter');
    await page.waitForTimeout(8000);
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  const skipBtn = page.locator('.introjs-skipbutton, .introjs-donebutton').first();
  if (await skipBtn.isVisible()) {
    await skipBtn.click({ force: true });
    await page.waitForTimeout(500);
  }

  // 右側オンライン欄の「今なにしてる？」を huyubot/help | 2.1.0 に自動設定
  const statusInput = page.getByPlaceholder('今なにしてる？');
  if (await statusInput.isVisible().catch(() => false)) {
    await statusInput.fill('huyubot/help | 2.1.0');
    await page.waitForTimeout(300);
    const statusSetBtn = page.locator('button:has-text("設定"), input[value="設定"]').first();
    if (await statusSetBtn.isVisible().catch(() => false)) {
      await statusSetBtn.click({ force: true });
      await page.waitForTimeout(500);
    }
  }

  const multiInput = page.locator('#post_form_multi');
  if (!(await multiInput.isVisible())) {
    await page.locator('#input_type').click({ force: true });
    await page.waitForTimeout(500);
    console.log('複数行モード（#post_form_multi）に切り替えました！');
  }

  const sendChat = async (text) => {
    if (!(await multiInput.isVisible())) {
      await page.locator('#input_type').click({ force: true });
      await page.waitForTimeout(300);
    }

    await multiInput.click({ force: true });
    await multiInput.fill(text, { force: true });
    await multiInput.press('Space');
    await multiInput.press('Backspace');
    await page.waitForTimeout(300);
    await page.locator('#post_btn').click({ force: true });
  };

  const extractSenderName = (postText) => {
    const lines = postText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (const line of lines) {
      if (line.startsWith('huyubot/') || /^\d+$/.test(line) || line.includes('huyubot/')) continue;
      return line;
    }
    return '名無し';
  };

  await sendChat('こんにちは、私はfeeder huyubotです、コマンド一覧を見たい場合は「huyubot/help」と打ってください。\nHi! im feeder huyubot. To view the list of commands, please type "huyubot/help".');
  await page.waitForTimeout(2000);
  console.log('Huyubot Version 2.1.0 監視モード開始！');

// ここでわける（第6弾終了）
// ==========================================
// 7. 常駐監視ループ（全コマンド・個チャ定期パトロール・時間制交代）
// ==========================================

  const getPosts = async () => {
    return await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div, li, tr'));
      const postBlocks = allDivs.filter(el => {
        const txt = el.innerText || '';
        const timeMatches = txt.match(/\d{2}:\d{2}:\d{2}/g);
        return timeMatches && timeMatches.length === 1 && txt.length < 500;
      });
      return postBlocks.filter((el, _, arr) => !arr.some(o => o !== el && o.contains(el) && o.innerText.includes('\n'))).map(el => el.innerText.trim());
    });
  };

  const extractCommandLine = (postText) => postText.split('\n').map(l => l.trim()).find(l => l === 'huyubot' || l.startsWith('huyubot/')) || null;

  const processCommand = async (cmdLine, fullPost, sender, isAdmin, endTime) => {
    const parts = cmdLine.replace(/\/+$/, '').split('/');
    const sub = parts.at(1) || '';

    if (sub === 'test') {
      return 'この投稿はテストです\nThis is a test post.\n' + sender + ' ' + formatJstDateTime(getJstNow());
    }
    if (sub === 'help') {
      return '【Huyubot コマンド一覧】\n・huyubot/help : コマンド一覧\n・huyubot/test\n・huyubot/weather\n・huyubot/tetokuji\n・huyubot/emoji　（/1~100）\n・huyubot/time\n・huyubot/update\n・huyubot/about\n・huyubot/ver\n・huyubot/say\n・huyubot/bye（管理者専用）';
    }
    if (sub === 'ver') {
      return 'Huyubot Version 2.1.0';
    }
    if (sub === 'update') {
      const verArg = parts.at(2) || '';
      if (!verArg) {
        return '過去のアップデートを確認するにはhuyubot/update/（バージョン)と打ってください\n1.0.0 | 2026-11-27\n2.0.0 | 2026-11-28\n2.1.0 | 2026-11-29';
      }
      if (verArg === '1.0.0') {
        return '【Update 1.0.0 | 2026-11-27】\n・Huyubot 初代リリース\n・help / test / weather / tetokuji / emoji / time / say / about / ver / bye を実装';
      }
      if (verArg === '2.0.0' || verArg === '1.1.0') {
        return '【Update 2.0.0 | 2026-11-28】\n・クールタイムを3秒に短縮\n・時間制の自動交代＆退室挨拶を実装\n・個チャ（個人メッセージ）でのコマンド応答に対応\n・絵文字を700種類＆最大100個指定に拡大\n・天気API修正＆クレジット表記追加、updateコマンド実装';
      }
      if (verArg === '2.1.0') {
        return '【Update 2.1.0 | 2026-11-29】\n・絵文字プールから未定義記号を除外（肌色パーツ残し）\n・個チャの受信トレイ定期確認修正\n・huyubot/time に残り時間・残り日数・Bot交代カウントダウンと絵文字を追加\n・天気絵文字化、都道府県省略入力、weather/地域/time 時系列予報を実装\n・入室時のオンラインステータス自動設定を追加';
      }
      return '指定されたバージョン「' + verArg + '」の履歴は見つかりませんでした。\n「huyubot/update」で一覧を確認してください。';
    }
    if (sub === 'about') {
      return '【About Huyubot】\nName: feeder huyubot (Version 2.1.0)\nCreator: huyu_\nたくさんの機能があるチャットBotです！\nもしバグや問題、提案などがあった場合は本人や\nhttps://github.com！\nWeather data by Open-Meteo.com';
    }
    if (sub === 'time') {
      return buildTimeReport(endTime);
    }
    if (sub === 'tetokuji') {
      return '【' + sender + ' さんのテトくじ結果】\n' + drawTetokuji();
    }
    if (sub === 'emoji') {
      let count = 3;
      if (parts.at(2) !== undefined) {
        const parsed = Number(parts.at(2));
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
          return '個数は 1〜100 の数字で指定してください。（例：huyubot/emoji/10）';
        }
        count = parsed;
      }
      const picked = [];
      for (let k = 0; k < count; k++) picked.push(EMOJI_POOL.at(Math.floor(Math.random() * EMOJI_POOL.length)));
      return picked.join(' ');
    }
    if (sub === 'weather') {
      const isTimeMode = parts.at(-1) === 'time';
      const locParts = isTimeMode ? parts.slice(2, -1) : parts.slice(2);
      const arg1 = locParts.at(0) || '';
      const arg2 = locParts.at(1) || '';
      const rawLoc = arg2 || arg1;

      if (!arg1) {
        return '【天気予報：地方を選択してください】\n' + Object.keys(WEATHER_REGIONS).join('・') + '\n例：huyubot/weather/東京 または huyubot/weather/東京/time';
      }
      if (WEATHER_REGIONS[arg1] && !arg2 && !isTimeMode) {
        return '【' + arg1 + '地方のエリア一覧】\n' + WEATHER_REGIONS[arg1].join('・') + '\n例：huyubot/weather/' + WEATHER_REGIONS[arg1].at(0);
      }

      const resolvedKey = resolveLocationKey(rawLoc);
      if (resolvedKey) {
        if (isTimeMode) {
          return await fetchTimelineWeatherText(resolvedKey);
        }
        if (PREF_CAPITALS[resolvedKey] && !arg2) {
          return '※' + resolvedKey + 'の県庁所在地（' + PREF_CAPITALS[resolvedKey] + '）の天気を表示します\n' + (await fetchWeatherText(resolvedKey));
        }
        return await fetchWeatherText(resolvedKey);
      }
      return '指定された地域「' + rawLoc + '」は見つかりませんでした。\n「huyubot/weather」で一覧を確認してください。';
    }
    return null;
  };

  let pmCheckCounter = 0;

  const checkPrivateMessages = async (adminTrip, endTime) => {
    pmCheckCounter++;
    const noticeBar = page.locator('text=メッセージが届きました').first();
    const hasNotice = await noticeBar.isVisible().catch(() => false);

    if (!hasNotice && pmCheckCounter % 8 !== 0) return;

    if (hasNotice) {
      console.log('個チャ通知バーを検知！受信トレイを開きます...');
      await noticeBar.click({ force: true }).catch(() => {});
    } else {
      const inboxBtn = page.locator('button:has-text("受信トレイ"), a:has-text("受信トレイ"), input[value="受信トレイ"]').first();
      if (!(await inboxBtn.isVisible().catch(() => false))) return;
      await inboxBtn.click({ force: true }).catch(() => {});
    }
    await page.waitForTimeout(2000);

    try {
      const newBadge = page.locator('text=NEW').first();
      if (await newBadge.isVisible().catch(() => false)) {
        console.log('未読(NEW)メッセージを発見！内容を読み取ります...');
        const row = newBadge.locator('xpath=ancestor::tr | ancestor::div').last();
        const rowText = (await row.innerText().catch(() => '')) || '';
        const cmdLine = extractCommandLine(rowText);
        const sender = extractSenderName(rowText);
        const isAdmin = adminTrip ? rowText.includes(adminTrip) : false;

        if (cmdLine) {
          const replyText = await processCommand(cmdLine, rowText, sender, isAdmin, endTime);
          const replyBtn = page.locator('button:has-text("返信"), a:has-text("返信"), input[value="返信"]').first();
          if (replyText && (await replyBtn.isVisible().catch(() => false))) {
            await replyBtn.click({ force: true });
            await page.waitForTimeout(1500);
            const pmInput = page.locator('textarea:visible').last();
            if (await pmInput.isVisible().catch(() => false)) {
              await pmInput.fill(replyText);
              await page.waitForTimeout(300);
              const sendPmBtn = page.locator('button:has-text("送信"), input[value="送信"]').last();
              await sendPmBtn.click({ force: true });
              await page.waitForTimeout(1500);
              console.log('個チャに返信を送信しました！');
            }
          }
        } else {
          const ignoreBtn = page.locator('button:has-text("無視"), a:has-text("無視"), input[value="無視"]').first();
          if (await ignoreBtn.isVisible().catch(() => false)) {
            await ignoreBtn.click({ force: true });
            await page.waitForTimeout(1000);
          }
        }
      }
    } catch (e) {
      console.log('個チャ処理中にスキップ:', e.message);
    }

    const closeBtn = page.locator('button:has-text("閉じる"), input[value="閉じる"]').last();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
  };

// ここでわける（第7弾半分終了）
  const initialPosts = await getPosts();
  const seenPosts = new Set(initialPosts);
  const replyQueue = [];
  let cooldownStartTime = 0;
  const scheduledPosts = [];
  const adminTrip = process.env.ADMIN_TRIP;
  const endTime = getNextShiftEndUtcMs();

  console.log('次の自動交代時刻（JST）:', formatJstDateTime(new Date(endTime + 9 * 60 * 60 * 1000)));

  while (Date.now() < endTime) {
    await checkPrivateMessages(adminTrip, endTime);

    const posts = await getPosts();
    const newCommandPosts = posts.filter(t => {
      if (seenPosts.has(t)) return false;
      seenPosts.add(t);
      return extractCommandLine(t) !== null;
    });

    if (newCommandPosts.length > 0) {
      for (let i = newCommandPosts.length - 1; i >= 0; i--) {
        const fullPost = newCommandPosts.at(i) || '';
        const cmdLine = extractCommandLine(fullPost);
        if (!cmdLine) continue;

        const sender = extractSenderName(fullPost);
        const isAdmin = fullPost.includes(adminTrip);
        const parts = cmdLine.replace(/\/+$/, '').split('/');
        const sub = parts.at(1) || '';

        if (sub === 'bye') {
          if (isAdmin) {
            await sendChat('I am removing the bot, this may take a moment. Goodbye.');
            await page.waitForTimeout(2000);
            await browser.close();
            return;
          }
          replyQueue.push('You are not an administrator or a designated person.');
        } else if (sub === 'say') {
          if (!isAdmin) {
            replyQueue.push('You are not an administrator or a designated person.');
          } else if (parts.length >= 5) {
            const targetUtcMs = parseScheduleJstMs(parts.at(2), parts.at(3));
            const msgPart = parts.slice(4).join('/');
            if (!targetUtcMs) replyQueue.push('形式エラー：huyubot/say/YYYY-MM-DD/HH:MM/文字 の形式で指定してください。');
            else if (msgPart.startsWith('huyubot/')) replyQueue.push('コマンド文字列は予約できません。');
            else if (targetUtcMs <= Date.now()) replyQueue.push('過去の時刻は指定できません。未来の日本時間を指定してください。');
            else if (targetUtcMs > endTime) replyQueue.push('次の自動交代時刻（1分前）より先の時刻は予約できません。');
            else {
              scheduledPosts.push({ targetMs: targetUtcMs, text: msgPart });
              replyQueue.push('予約を受け付けました！\n予定日時：' + parts.at(2) + ' ' + parts.at(3) + '（JST）');
            }
          } else if (parts.length === 3 && (parts.at(2) || '').length > 0 && !parts.at(2).startsWith('huyubot/')) {
            replyQueue.push(parts.at(2));
          } else {
            replyQueue.push('使い方：huyubot/say/2026-11-26/23:10/喋らせたい文字');
          }
        } else {
          const resText = await processCommand(cmdLine, fullPost, sender, isAdmin, endTime);
          if (resText) replyQueue.push(resText);
        }
      }
      if (replyQueue.length > 0 && cooldownStartTime === 0) cooldownStartTime = Date.now();
    }

    for (let i = scheduledPosts.length - 1; i >= 0; i--) {
      const item = scheduledPosts.at(i);
      if (item && Date.now() >= item.targetMs) {
        scheduledPosts.splice(i, 1);
        await sendChat(item.text);
        await page.waitForTimeout(1000);
      }
    }

    if (replyQueue.length > 0 && Date.now() - cooldownStartTime >= 3000) {
      await sendChat(replyQueue.shift());
      cooldownStartTime = replyQueue.length > 0 ? Date.now() : 0;
    }

    await page.waitForTimeout(2000);
  }

  // 時間制交代（1分前：00:04, 06:04, 12:04, 18:04）の退室挨拶
  await sendChat('定期交代時間になったため一度退室します。またすぐ戻ります!');
  await page.waitForTimeout(2000);
  await browser.close();
})();
