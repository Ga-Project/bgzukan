// ボドゲ図鑑 — 共有カード（og:image）の置き場所と公開 URL。
//
// なぜ作品ごとにカードを持つか:
//   ボードゲームは「この作品どう？」と1作品単位でリンクが回る。トップと同じ
//   絵が出るだけでは、どの作品の話か分からないまま流れてしまう。作品名・人数・
//   時間が見えるカードを作品ごとに用意する。
//
// カードは tools/og/render.mjs が public/og/ に PNG として書き出し、コミットする
// （CI では描画しない＝日本語フォントを CI に持ち込まない）。描画の入力と PNG の
// ハッシュは lib/og-manifest.mjs に残り、test/og.test.mjs が突き合わせる。
//
// このモジュールはページの metadata から読まれる。Node 専用の API（crypto・fs）を
// 持ち込まないこと（ハッシュ計算は tools/og/cards.mjs 側）。

import { absoluteUrl } from "./site.mjs";
import manifest from "./og-manifest.mjs";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** ?v= に載せる PNG ハッシュの桁数。 */
export const OG_VERSION_LENGTH = 12;

/** サイト全体のカード（トップ・このサイトについて・404 で使う）。public/ からの相対。 */
export const SITE_OG_PATH = "og/site.png";

/** @param {{id: string}} game */
export function gameOgPath(game) {
  return `og/games/${game.id}.png`;
}

/**
 * カードの公開 URL。PNG の内容ハッシュを ?v= に付ける。
 * SNS は og:image を URL 単位でキャッシュするので、描き直したら URL も変えないと
 * 既に共有されたリンクに古いカードが出続ける。
 * manifest に無いカードを指そうとしたらビルドを止める（存在しない画像を公開しない）。
 * @param {string} path public/ からの相対パス
 */
export function ogUrl(path) {
  const entry = /** @type {Record<string, {png: string}>} */ (manifest)[path];
  if (!entry) throw new Error(`共有カード ${path} が lib/og-manifest.mjs に無い`);
  return `${absoluteUrl(path)}?v=${entry.png.slice(0, OG_VERSION_LENGTH)}`;
}

export function siteOgUrl() {
  return ogUrl(SITE_OG_PATH);
}

/** @param {{id: string}} game */
export function gameOgUrl(game) {
  return ogUrl(gameOgPath(game));
}

/**
 * metadata の openGraph.images に渡す1枚分。寸法と代替テキストを必ず添える。
 * @param {string} url 絶対 URL
 * @param {string} alt
 */
export function ogImage(url, alt) {
  return { url, width: OG_WIDTH, height: OG_HEIGHT, alt };
}

export const SITE_OG_ALT = "ボドゲ図鑑 — 国内ボードゲームの日本語カタログ";

/** @param {{title: string}} game */
export function gameOgAlt(game) {
  return `${game.title}（ボドゲ図鑑）— 人数・プレイ時間・中身の表記`;
}
