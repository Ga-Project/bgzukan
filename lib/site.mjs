// ボドゲ図鑑 — 公開 URL と構造化データの組み立て（DOM 非依存・node:test で回帰）。
//
// なぜ絶対 URL を自前で組むか:
//   本サイトは GitHub Pages のプロジェクトページ配信で、公開 URL に `/bgzukan`
//   というサブパスが挟まる。Next の metadata は相対値を metadataBase で解決するが、
//   その解決は `new URL(path, base)` と同じ規則なので、`/games/ito/` のように
//   先頭スラッシュを付けた瞬間にサブパスが消えて `https://…/games/ito/` になる。
//   canonical と sitemap と JSON-LD の url が食い違うと検索側で正規化に失敗するため、
//   ここで1か所に寄せて組み立て、テストで固定する。

/** 公開サイトの基点（末尾スラッシュ必須）。 */
export const SITE_ORIGIN = "https://ga-project.github.io";
export const SITE_BASE_PATH = "/bgzukan";
export const SITE_URL = `${SITE_ORIGIN}${SITE_BASE_PATH}/`;

export const SITE_NAME = "ボドゲ図鑑";
export const SITE_DESCRIPTION =
  "国内の商業・同人・インディーのボードゲームを、人数・プレイ時間・メカニクス・デザイナー・サークルで検索・絞り込みできる日本語のデータカタログ。";
export const PUBLISHER_NAME = "株式会社Ga Project";
export const PUBLISHER_URL = "https://ga-project.net";

/**
 * サイト内パス（先頭スラッシュ有無どちらでも可）を公開絶対 URL にする。
 * @param {string} [path] 例: "games/ito/" / "/about/" / "" (トップ)
 * @returns {string}
 */
export function absoluteUrl(path = "") {
  const clean = String(path).replace(/^\/+/, "");
  return `${SITE_URL}${clean}`;
}

/** @param {{id: string}} game */
export function gameUrl(game) {
  return absoluteUrl(`games/${game.id}/`);
}

/**
 * 作品1点の JSON-LD（schema.org/Game）。
 * 図鑑の中身そのもの＝人数・時間・デザイナー・発表年を機械可読にして、
 * 検索側が「4人・30分・協力」といった条件で本サイトの作品を扱えるようにする。
 * 値が無い項目はキーごと落とす（null を出すと構造化データの検証で警告になる）。
 * @param {import("./types").Game} game
 * @returns {Record<string, unknown>}
 */
export function gameJsonLd(game) {
  /** @type {Record<string, unknown>} */
  const node = {
    "@context": "https://schema.org",
    "@type": "Game",
    name: game.title,
    alternateName: game.reading,
    url: gameUrl(game),
    description: game.description,
    inLanguage: "ja",
    numberOfPlayers: {
      "@type": "QuantitativeValue",
      minValue: game.players.min,
      maxValue: game.players.max,
    },
    genre: Array.from(new Set([...game.categories, ...game.mechanics])),
  };

  if (game.designer) node.author = { "@type": "Person", name: game.designer };
  if (game.publisher) {
    node.publisher = { "@type": "Organization", name: game.publisher };
  }
  if (game.year != null) node.datePublished = String(game.year);
  if (game.minAge != null) node.typicalAgeRange = `${game.minAge}-`;
  if (game.officialUrl) node.sameAs = game.officialUrl;

  return node;
}

/**
 * 詳細ページのパンくず（トップ → 作品）の JSON-LD。
 * @param {import("./types").Game} game
 * @returns {Record<string, unknown>}
 */
export function breadcrumbJsonLd(game) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: SITE_NAME,
        item: absoluteUrl(),
      },
      { "@type": "ListItem", position: 2, name: game.title, item: gameUrl(game) },
    ],
  };
}

/**
 * トップ（目録）の JSON-LD。収録作品を ItemList として並べる。
 *
 * 収録が増えたときの目安: **200件を超えたら** ItemList を上位N件に切るか、
 * トップをページングする。ただし先に破綻するのは ItemList ではなく、
 * トップ1枚に全件のカードを埋め込んでいる既存構造のほう（22件で index.html が
 * 約89KB）。順序としては、まずトップのページングを検討し、ItemList の
 * 打ち切りはその設計に合わせる。
 *
 * @param {import("./types").Game[]} games
 * @returns {Record<string, unknown>}
 */
export function catalogJsonLd(games) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: SITE_NAME,
    url: absoluteUrl(),
    description: SITE_DESCRIPTION,
    inLanguage: "ja",
    publisher: {
      "@type": "Organization",
      name: PUBLISHER_NAME,
      url: PUBLISHER_URL,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: games.length,
      itemListElement: games.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: g.title,
        url: gameUrl(g),
      })),
    },
  };
}
