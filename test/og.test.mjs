// ボドゲ図鑑 — 共有カード（og:image）の回帰テスト（node:test）。
//
// カードは手元で描いてコミットする成果物なので、壊れ方は3通りある:
//   (1) データを変えたのに描き直していない（古い作品名・人数のカードが出る）
//   (2) 作品を足した/外したのにカードの集合が追従していない
//   (3) ページの og:image が存在しないファイルや別作品のカードを指している
//   (4) PNG と manifest が別々の変更から来ている（マージで片方だけ取り込まれた等）
// (1)(2)(4) は manifest と public/og/ の実物で、(3) は out/ の実物で確かめる。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import gamesData from "../data/games.json" with { type: "json" };
import {
  OG_HEIGHT,
  OG_VERSION_LENGTH,
  OG_WIDTH,
  SITE_OG_PATH,
  gameOgPath,
} from "../lib/og.mjs";
import manifest from "../lib/og-manifest.mjs";
import {
  TITLE_BREAKS,
  expectedInputs,
  gameCardFields,
  sha256,
} from "../tools/og/cards.mjs";
import { SITE_URL } from "../lib/site.mjs";
import { gameCardHtml } from "../tools/og/card-html.mjs";

const games = /** @type {import("../lib/types").Game[]} */ (gamesData);
const publicDir = new URL("../public/", import.meta.url);

/** @param {URL} dir @returns {string[]} dir からの相対パス */
function listFiles(dir, prefix = "") {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? listFiles(new URL(`${e.name}/`, dir), `${prefix}${e.name}/`)
      : [`${prefix}${e.name}`],
  );
}

/** @param {Buffer} png */
function pngSize(png) {
  assert.equal(
    png.subarray(0, 8).toString("hex"),
    "89504e470d0a1a0a",
    "PNG の署名ではない",
  );
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

const entries = /** @type {Record<string, {input: string, png: string}>} */ (manifest);

test("manifest: 描画の入力（データ＋テンプレート）が現在と一致する（描き直し忘れの検出）", () => {
  const expected = expectedInputs(games);
  for (const [path, input] of Object.entries(expected)) {
    assert.equal(
      entries[path]?.input,
      input,
      `${path} が古い。node tools/og/render.mjs で描き直すこと`,
    );
  }
  assert.deepEqual(
    Object.keys(entries).sort(),
    Object.keys(expected).sort(),
    "manifest に収録外のカードがある",
  );
});

test("manifest: PNG の実体が manifest の png ハッシュと一致する", () => {
  for (const [path, { png }] of Object.entries(entries)) {
    assert.equal(
      sha256(readFileSync(new URL(path, publicDir))),
      png,
      `${path} の PNG が manifest と別の描画から来ている`,
    );
  }
});

test("題字の折り返し指定: 収録作品を指し、作品名と一致する", () => {
  for (const id of Object.keys(TITLE_BREAKS)) {
    const game = games.find((g) => g.id === id);
    assert.ok(game, `TITLE_BREAKS に収録外の作品 ${id}`);
    assert.doesNotThrow(() => gameCardFields(game));
  }
});

test("public/og: カードの集合が収録作品＋サイトカードと一致し、全て 1200x630 の PNG", () => {
  const files = listFiles(new URL("og/", publicDir)).map((f) => `og/${f}`);
  const expected = [SITE_OG_PATH, ...games.map(gameOgPath)];
  assert.deepEqual(files.sort(), [...expected].sort());
  for (const rel of expected) {
    const size = pngSize(readFileSync(new URL(rel, publicDir)));
    assert.deepEqual(size, { width: OG_WIDTH, height: OG_HEIGHT }, rel);
  }
});

test("カード HTML: 作品データの文字列はエスケープして差し込む", () => {
  const base = games[0];
  const html = gameCardHtml(
    gameCardFields({
      ...base,
      title: `<img src=x onerror="alert(1)">&'`,
      reading: "<b>よみ</b>",
      categories: ["<script>"],
      mechanics: [],
    }),
  );
  assert.ok(!html.includes("<img src=x"), "題字が生の HTML として入っている");
  assert.ok(!html.includes("<b>よみ</b>"), "読みが生の HTML として入っている");
  assert.ok(!html.includes('<span class="chip"><script>'), "タグが生の HTML として入っている");
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;&#39;"));
});

// ── ビルド成果物の突き合わせ ──
// CI は build の後に test を実行するので必ず走る（pages.yml のステップ順）。
// skip するのは out/ を作らずに手元で pnpm test だけ回したときだけ。
test("out/: 全ページの og:image が実在するカードを指し、作品ページは自分のカードを指す", (t) => {
  const outDir = new URL("../out/", import.meta.url);
  if (!existsSync(new URL("index.html", outDir))) {
    // CI では build の後に走るので out/ が無いのは異常。黙って skip しない。
    assert.ok(!process.env.CI, "CI なのに out/ が無い（build より前に test が走っている）");
    t.skip("out/ が未生成（build 前）");
    return;
  }

  const pages = listFiles(outDir).filter(
    (f) =>
      !f.startsWith("_next/") && (f.endsWith("/index.html") || f === "index.html" || f === "404.html"),
  );
  assert.ok(pages.length >= games.length + 2, `HTML が少なすぎる: ${pages.length}`);

  for (const page of pages) {
    const html = readFileSync(new URL(page, outDir), "utf8");
    const meta = (/** @type {string} */ key) =>
      [...html.matchAll(new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`, "g"))].map(
        (m) => m[1],
      );

    const images = meta("og:image");
    assert.equal(images.length, 1, `${page}: og:image が ${images.length} 個`);
    const url = images[0];
    assert.ok(url.startsWith(SITE_URL), `${page}: og:image が公開 URL 外 ${url}`);

    const [rel, query] = url.slice(SITE_URL.length).split("?");
    // SNS のキャッシュを描き直しで確実に外すため、URL は PNG の内容ハッシュで版を持つ。
    assert.equal(
      query,
      `v=${entries[rel]?.png.slice(0, OG_VERSION_LENGTH)}`,
      `${page}: og:image の版が PNG と一致しない`,
    );
    assert.ok(existsSync(new URL(rel, outDir)), `${page}: og:image の実体が無い ${rel}`);

    const game = page.match(/^games\/([^/]+)\/index\.html$/);
    assert.equal(
      rel,
      game ? `og/games/${game[1]}.png` : SITE_OG_PATH,
      `${page}: 別のカードを指している`,
    );

    assert.deepEqual(meta("og:image:width"), [String(OG_WIDTH)], page);
    assert.deepEqual(meta("og:image:height"), [String(OG_HEIGHT)], page);
    assert.equal(meta("og:image:alt").length, 1, `${page}: og:image:alt が無い`);
    assert.deepEqual(meta("twitter:card"), ["summary_large_image"], page);
  }
});
