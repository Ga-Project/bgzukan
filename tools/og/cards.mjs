// ボドゲ図鑑 — 共有カードに刷る中身と、描画の入力ハッシュ（描画・検査専用。ページからは読まない）。
//
// 鮮度の検査は2段:
//   input: カードに刷る値 ＋ テンプレート（card-html.mjs）のソース ＋ 描画パラメータ。
//          データかテンプレートを変えたのに描き直していなければ食い違う。
//   png  : 書き出した PNG のバイト列。PNG と manifest が別々の変更から来ていれば食い違う
//          （マージで片方だけ取り込まれた場合など）。公開 URL の ?v= にもこれを使う。

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { formatPlayers, formatTime, gameTags } from "../../lib/catalog.mjs";
import { OG_HEIGHT, OG_WIDTH, SITE_OG_PATH, gameOgPath } from "../../lib/og.mjs";

/** カードに載せる中身表記の数（棚の箱と同じ3つ）。 */
export const OG_MAX_TAGS = 3;

/** 題字の書体。無い環境では描画を止める（別書体で黙って描かない）。 */
export const OG_FONT = "Hiragino Sans";

/** Chrome の描画フラグ（描画結果に効くもの）。変えたら全カードが描き直し対象になる。 */
export const CHROME_FLAGS = [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--force-device-scale-factor=1",
  `--window-size=${OG_WIDTH},${OG_HEIGHT}`,
];

/** 作品 id として許す形（public/og/games/<id>.png のファイル名になる）。 */
export const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

/**
 * 自動の語境界では不自然に割れる題字の、折り返し位置の指定（「｜」で区切る）。
 * 「｜」を取り除いた文字列が作品名と一致しなければ例外にする
 * （作品名を直したのに指定が古いまま、を描画前に止める）。
 * @type {Record<string, string>}
 */
export const TITLE_BREAKS = {
  "a-fake-artist-goes-to-new-york": "エセ芸術家｜ニューヨークへ行く",
  "cat-and-chocolate": "キャット＆チョコレート ｜日常編 新装版",
};

/**
 * 題字の行。指定が無ければ1要素（折り返しは描画側の語境界に任せる）。
 * @param {{id: string, title: string}} game
 * @returns {string[]}
 */
export function titleLines(game) {
  const spec = TITLE_BREAKS[game.id];
  if (spec === undefined) return [game.title];
  if (spec.replaceAll("｜", "") !== game.title) {
    throw new Error(`TITLE_BREAKS[${game.id}] が作品名「${game.title}」と一致しない`);
  }
  return spec.split("｜").map((l) => l.trim());
}

/** @param {string} s */
export function isKatakanaOnly(s) {
  return /^[゠-ヿ・＆ 　]+$/.test(s);
}

/**
 * 作品カードに刷る値。描画と鮮度検査の両方がここだけを見る
 * （描画側で別の値を足すと、検査をすり抜けて古いカードが残るため）。
 * @param {import("../../lib/types").Game} game
 */
export function gameCardFields(game) {
  if (!ID_RE.test(game.id)) throw new Error(`作品 id が不正: ${game.id}`);
  return {
    kind: "game",
    id: game.id,
    title: game.title,
    titleLines: titleLines(game),
    // 題字がカタカナだけなら読みは情報を足さないので刷らない。
    reading: isKatakanaOnly(game.title) ? null : game.reading,
    type: game.type,
    year: game.year == null ? null : `${game.year}年`,
    players: formatPlayers(game),
    time: formatTime(game),
    tags: gameTags(game).slice(0, OG_MAX_TAGS),
  };
}

/**
 * サイトカードに刷る値。収録数と棚に並べる題字が変わったら刷り直しになる。
 * @param {import("../../lib/types").Game[]} games
 */
export function siteCardFields(games) {
  return {
    kind: "site",
    count: games.length,
    doujin: games.filter((g) => g.type === "同人・インディー").length,
    spines: games.slice(0, 7).map((g) => ({ title: g.title, type: g.type })),
  };
}

/** @param {string | Buffer} data */
export function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

/** テンプレートのソースと描画パラメータ。どれかが変われば全カードが描き直し対象になる。 */
function renderContext() {
  const template = readFileSync(new URL("./card-html.mjs", import.meta.url), "utf8");
  return {
    template: sha256(template),
    width: OG_WIDTH,
    height: OG_HEIGHT,
    font: OG_FONT,
    flags: CHROME_FLAGS,
  };
}

/**
 * 1枚分の入力ハッシュ。
 * @param {unknown} fields
 * @param {ReturnType<typeof renderContext>} [ctx]
 */
export function inputHash(fields, ctx = renderContext()) {
  return sha256(JSON.stringify({ fields, ctx })).slice(0, 16);
}

/**
 * 描くべきカードの一覧（パス → 刷る値）。
 * @param {import("../../lib/types").Game[]} games
 * @returns {{path: string, fields: ReturnType<typeof gameCardFields> | ReturnType<typeof siteCardFields>}[]}
 */
export function expectedCards(games) {
  return [
    { path: SITE_OG_PATH, fields: siteCardFields(games) },
    ...games.map((g) => ({ path: gameOgPath(g), fields: gameCardFields(g) })),
  ];
}

/**
 * manifest の input の期待値（パス → 入力ハッシュ）。
 * @param {import("../../lib/types").Game[]} games
 * @returns {Record<string, string>}
 */
export function expectedInputs(games) {
  const ctx = renderContext();
  return Object.fromEntries(
    expectedCards(games).map(({ path, fields }) => [path, inputHash(fields, ctx)]),
  );
}
