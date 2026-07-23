// ボドゲ図鑑 — 検索・絞り込みの純ロジック（DOM 非依存・node:test で回帰）。
//
// なぜ .mjs（プレーン JS）か:
//   検索の正規化や絞り込みは「データの正しさ」と並ぶ製品の中核。TS をそのまま
//   node の標準テストランナーに載せられないため、純ロジックを素の ESM に
//   切り出し、UI とテストの双方が同じ実体を import する（外部ライブラリ不使用）。
//   JSDoc で型を付けてあるので TS 側からも型付きで使える。

/** @typedef {import("./types").Game} Game */
/** @typedef {import("./types").Filters} Filters */
/** @typedef {import("./types").Facets} Facets */
/** @typedef {import("./types").TagCount} TagCount */

/** 人数フィルタの選択肢（この人数で「遊べる」作品を絞る）。 */
export const PLAYER_CHOICES = [2, 3, 4, 5, 6, 7, 8];

/** プレイ時間フィルタのバケット（互いに排他・各作品はちょうど1つに属す）。 */
export const TIME_BUCKETS = [
  { key: "u15", label: "〜15分" },
  { key: "u30", label: "16〜30分" },
  { key: "u60", label: "31〜60分" },
  { key: "o60", label: "60分以上" },
];

/**
 * 文字列を検索用に正規化する。
 * - NFKC で全角英数→半角・半角カナ→全角カナへ寄せる
 * - 小文字化
 * - カタカナ→ひらがな（かな表記ゆれを吸収）
 * - 空白を除去
 * @param {string | null | undefined} input
 * @returns {string}
 */
export function normalizeText(input) {
  if (!input) return "";
  const s = String(input).normalize("NFKC").toLowerCase();
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    // カタカナ（ァ〜ヶ）をひらがなに変換（長音符 ー は共通なのでそのまま）
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCodePoint(code - 0x60);
    } else {
      out += ch;
    }
  }
  return out.replace(/\s+/g, "");
}

/**
 * 作品の検索対象テキスト（タイトル・読み・デザイナー・メーカー）を正規化して連結。
 * データは静的なので id をキーに正規化結果をキャッシュし、キー入力ごとの
 * 全件再正規化を避ける（収録拡大時のフィルタ体感を保つ）。
 * @param {Game} game
 * @returns {string}
 */
const searchTextCache = new Map();
export function searchText(game) {
  const cached = searchTextCache.get(game.id);
  if (cached !== undefined) return cached;
  const text = normalizeText(
    [game.title, game.reading, game.designer ?? "", game.publisher ?? ""].join(
      " ",
    ),
  );
  searchTextCache.set(game.id, text);
  return text;
}

/**
 * 作品のタグ（カテゴリ＋メカニクスの重複排除）。絞り込みと表示に使う。
 * @param {Game} game
 * @returns {string[]}
 */
export function gameTags(game) {
  return Array.from(new Set([...game.categories, ...game.mechanics]));
}

/**
 * 作品が属するプレイ時間バケットの key を返す（time.max で分類）。
 * @param {Game} game
 * @returns {string}
 */
export function timeBucketKey(game) {
  const t = game.time.max;
  if (t <= 15) return "u15";
  if (t <= 30) return "u30";
  if (t <= 60) return "u60";
  return "o60";
}

/**
 * フィルタを適用して該当作品だけを返す。
 * カテゴリ間は AND、同カテゴリ内の複数選択は OR。
 * @param {Game[]} games
 * @param {Partial<Filters>} [filters]
 * @returns {Game[]}
 */
export function filterGames(games, filters) {
  const f = filters ?? {};
  const nq = normalizeText(f.query ?? "");
  const players = f.players ?? [];
  const buckets = f.timeBuckets ?? [];
  const types = f.types ?? [];
  const tags = f.tags ?? [];

  return games.filter((g) => {
    if (nq && !searchText(g).includes(nq)) return false;
    if (
      players.length &&
      !players.some((n) => g.players.min <= n && n <= g.players.max)
    ) {
      return false;
    }
    if (buckets.length && !buckets.includes(timeBucketKey(g))) return false;
    if (types.length && !types.includes(g.type)) return false;
    if (tags.length) {
      const gt = gameTags(g);
      if (!tags.some((t) => gt.includes(t))) return false;
    }
    return true;
  });
}

/**
 * 件数付きのファセット（種別・人数・タグ）を集計する。
 * @param {Game[]} games
 * @returns {Facets}
 */
export function collectFacets(games) {
  /** @type {Record<string, number>} */
  const typeCounts = {};
  /** @type {Record<string, number>} */
  const tagCounts = {};
  for (const g of games) {
    typeCounts[g.type] = (typeCounts[g.type] ?? 0) + 1;
    for (const t of gameTags(g)) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  }

  /** @type {TagCount[]} */
  const types = Object.entries(typeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));

  const players = PLAYER_CHOICES.filter((n) =>
    games.some((g) => g.players.min <= n && n <= g.players.max),
  );

  /** @type {TagCount[]} */
  const tags = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja"));

  return { types, players, tags };
}

/** 値が未設定（null）なら「—」、あればフォーマットして返す小物。 */

/**
 * @param {Game} game
 * @returns {string}
 */
export function formatPlayers(game) {
  const { min, max } = game.players;
  return min === max ? `${min}人` : `${min}–${max}人`;
}

/**
 * @param {Game} game
 * @returns {string}
 */
export function formatTime(game) {
  const { min, max } = game.time;
  return min === max ? `${min}分` : `${min}–${max}分`;
}

/**
 * @param {Game} game
 * @returns {string}
 */
export function formatAge(game) {
  return game.minAge == null ? "—" : `${game.minAge}歳〜`;
}

/**
 * @param {Game} game
 * @returns {string}
 */
export function formatYear(game) {
  return game.year == null ? "—" : `${game.year}年`;
}

/**
 * 関連作品として採用する最低スコア。
 *
 * 3 は「タグを1つ以上共有している」か「デザイナーが一致する」ことを意味する
 * （同種別 +1 と人数レンジ重複 +1 だけでは 2 にしかならない）。閾値が無いと
 * 「同人で人数が被るだけ」の作品が『遊び味が近い作品』として並び、図鑑の
 * 記述が信用できなくなる。件数が減るページは減ったまま出すほうが誠実。
 */
export const RELATED_MIN_SCORE = 3;

/**
 * 「棚の隣に並べるべき作品」を選ぶ。
 *
 * 図鑑は1作品を引いて終わりではなく、隣を辿って知らない作品に出会う道具なので、
 * 詳細から関連作品へ渡る動線を作る。近さは次の重みで測る（合計点の降順）:
 *   - 同じデザイナー          … 6（作家買いは最も強い動機）
 *   - 共有するタグ1つにつき   … 2（メカニクス・カテゴリ＝遊び味の近さ）
 *   - 同じ種別               … 1（商業／同人の棚が揃う）
 *   - 遊べる人数が重なる      … 1（同じ卓に出せる）
 * 同点は 発表年の新しい順 → id 昇順 で決める（生成のたびに並びが変わらないよう完全に決定的にする）。
 * RELATED_MIN_SCORE 未満は「関連」と言えないので落とす（埋め草を出さない）。
 *
 * @param {Game} game 基準の作品
 * @param {Game[]} games 全作品（基準自身を含んでいてよい。除外して返す）
 * @param {number} [limit] 返す上限件数
 * @returns {Game[]} RELATED_MIN_SCORE 以上の作品を近い順に、最大 limit 件
 */
export function relatedGames(game, games, limit = 4) {
  const baseTags = new Set(gameTags(game));

  const scored = [];
  for (const other of games) {
    if (other.id === game.id) continue;

    let score = 0;
    if (game.designer && other.designer === game.designer) score += 6;
    for (const t of gameTags(other)) {
      if (baseTags.has(t)) score += 2;
    }
    if (other.type === game.type) score += 1;
    // 人数レンジが1人でも重なれば「同じ卓に出せる」。
    if (
      other.players.min <= game.players.max &&
      game.players.min <= other.players.max
    ) {
      score += 1;
    }

    if (score >= RELATED_MIN_SCORE) scored.push({ game: other, score });
  }

  // 年の欠損は -1 に寄せる（発表年は正の数なので必ず最後に回る）。
  // Infinity を使うと「両方欠損」で NaN になり、比較子が NaN を返した時点で
  // 並び順が未定義になる＝ビルドのたびに関連作品の順序が変わりうるので使わない。
  const year = (g) => g.year ?? -1;
  // id は ASCII スラグ確定なのでコードポイント比較にする。localeCompare を
  // ロケール無指定で呼ぶと実行環境の既定ロケールに依存し、「決定的」という
  // この関数の約束が CI とローカルで揺れうる基盤の上に乗ってしまう。
  const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      year(b.game) - year(a.game) ||
      byId(a.game, b.game),
  );

  return scored.slice(0, limit).map((s) => s.game);
}
