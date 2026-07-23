// ボドゲ図鑑 — 関連作品（棚の隣）と公開 URL / 構造化データの回帰テスト（node:test）。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { relatedGames } from "../lib/catalog.mjs";
import {
  SITE_URL,
  absoluteUrl,
  gameUrl,
  gameJsonLd,
  breadcrumbJsonLd,
  catalogJsonLd,
} from "../lib/site.mjs";

const games = JSON.parse(
  readFileSync(new URL("../data/games.json", import.meta.url), "utf8"),
);
const byId = (id) => games.find((g) => g.id === id);

/** テスト専用の最小データ（スコア規則そのものを固定する）。 */
const mk = (id, over = {}) => ({
  id,
  title: id,
  reading: id,
  type: "商業",
  designer: null,
  publisher: null,
  players: { min: 2, max: 4 },
  time: { min: 30, max: 30 },
  minAge: null,
  year: null,
  firstEvent: null,
  mechanics: [],
  categories: [],
  description: "",
  officialUrl: null,
  sources: [],
  shops: [],
  ...over,
});

test("relatedGames: 自分自身は返さない", () => {
  for (const g of games) {
    assert.ok(
      !relatedGames(g, games, 4).some((r) => r.id === g.id),
      `${g.id} が自分を関連に含めている`,
    );
  }
});

test("relatedGames: limit を超えて返さない", () => {
  for (const g of games) {
    assert.ok(relatedGames(g, games, 4).length <= 4);
    assert.ok(relatedGames(g, games, 2).length <= 2);
  }
});

test("relatedGames: 同じデザイナーはタグ1個一致より強い", () => {
  const base = mk("base", { designer: "カナイセイジ", mechanics: ["推理"] });
  const sameDesigner = mk("same-designer", { designer: "カナイセイジ" });
  const oneTag = mk("one-tag", { mechanics: ["推理"] });
  const ranked = relatedGames(base, [base, oneTag, sameDesigner], 2);
  assert.equal(ranked[0].id, "same-designer");
  assert.equal(ranked[1].id, "one-tag");
});

test("relatedGames: 共有タグが多いほど上位", () => {
  const base = mk("base", { mechanics: ["推理", "心理戦", "ブラフ"] });
  const three = mk("three", { mechanics: ["推理", "心理戦", "ブラフ"] });
  const one = mk("one", { mechanics: ["推理"] });
  const ranked = relatedGames(base, [base, one, three], 2);
  assert.deepEqual(
    ranked.map((g) => g.id),
    ["three", "one"],
  );
});

test("relatedGames: 接点が無い作品は返さない", () => {
  // 種別も人数も重ならず、タグ共有もデザイナー一致も無い＝スコア0。
  const base = mk("base", { type: "商業", players: { min: 2, max: 3 } });
  const unrelated = mk("unrelated", {
    type: "同人・インディー",
    players: { min: 6, max: 8 },
  });
  assert.deepEqual(relatedGames(base, [base, unrelated], 4), []);
});

test("relatedGames: タグもデザイナーも一致しない作品は埋め草として出さない", () => {
  // 同種別(+1) と 人数レンジ重複(+1) だけ＝score 2。
  // 「遊び味が近い」と言えないので閾値(3)で落とす。
  const base = mk("base", { type: "同人・インディー", mechanics: ["推理"] });
  const weak = mk("weak", { type: "同人・インディー" });
  assert.deepEqual(relatedGames(base, [base, weak], 4), []);

  // タグを1つ共有すれば +2 で 4 点となり採用される。
  const shares = mk("shares", {
    type: "同人・インディー",
    mechanics: ["推理"],
  });
  assert.deepEqual(
    relatedGames(base, [base, weak, shares], 4).map((g) => g.id),
    ["shares"],
  );
});

test("relatedGames: 実データでも弱い関連(score<3)を返さない", () => {
  for (const g of games) {
    const baseTags = new Set([...g.categories, ...g.mechanics]);
    for (const r of relatedGames(g, games, 4)) {
      const sharesTag = [...r.categories, ...r.mechanics].some((t) =>
        baseTags.has(t),
      );
      const sameDesigner = Boolean(g.designer) && r.designer === g.designer;
      assert.ok(
        sharesTag || sameDesigner,
        `${g.id} の関連 ${r.id} はタグ共有もデザイナー一致もない`,
      );
    }
  }
});

test("relatedGames: 既定 limit は 4", () => {
  const base = mk("base", { mechanics: ["推理"] });
  const pool = [base];
  for (let i = 0; i < 8; i++) {
    pool.push(mk(`g${i}`, { mechanics: ["推理"] }));
  }
  assert.equal(relatedGames(base, pool).length, 4);
});

test("relatedGames: 同点は決定的に並ぶ（年の新しい順 → id 昇順）", () => {
  const base = mk("base", { mechanics: ["推理"] });
  const older = mk("a-older", { mechanics: ["推理"], year: 2010 });
  const newer = mk("z-newer", { mechanics: ["推理"], year: 2020 });
  const noYear = mk("b-noyear", { mechanics: ["推理"] });
  const pool = [base, older, newer, noYear];
  const ranked = relatedGames(base, pool, 4).map((g) => g.id);
  assert.deepEqual(ranked, ["z-newer", "a-older", "b-noyear"]);
  // 入力順を変えても同じ並びになる（比較子が NaN を返さないことの担保）。
  const shuffled = relatedGames(base, [noYear, newer, base, older], 4).map(
    (g) => g.id,
  );
  assert.deepEqual(shuffled, ranked);
});

test("absoluteUrl: サブパス /bgzukan を落とさない", () => {
  assert.equal(absoluteUrl(), "https://ga-project.github.io/bgzukan/");
  assert.equal(
    absoluteUrl("games/ito/"),
    "https://ga-project.github.io/bgzukan/games/ito/",
  );
  // 先頭スラッシュ付きでも同じ結果になる（呼び出し側の表記ゆれで壊れない）。
  assert.equal(absoluteUrl("/about/"), `${SITE_URL}about/`);
});

test("gameUrl: 全作品が公開 URL に解決できる", () => {
  for (const g of games) {
    assert.match(
      gameUrl(g),
      /^https:\/\/ga-project\.github\.io\/bgzukan\/games\/[a-z0-9-]+\/$/,
    );
  }
});

test("gameJsonLd: 必須項目が入り、欠損はキーごと落ちる", () => {
  const ld = gameJsonLd(byId("ito"));
  assert.equal(ld["@type"], "Game");
  assert.equal(ld.name, "ito");
  assert.equal(ld.url, "https://ga-project.github.io/bgzukan/games/ito/");
  assert.equal(ld.numberOfPlayers.minValue, 2);
  assert.ok(Array.isArray(ld.genre) && ld.genre.length > 0);

  const bare = gameJsonLd(mk("bare"));
  for (const key of [
    "author",
    "publisher",
    "datePublished",
    "typicalAgeRange",
    "sameAs",
  ]) {
    assert.ok(!(key in bare), `${key} が null のまま出力されている`);
  }
});

test("構造化データ: 全作品ぶんが JSON として直列化できる", () => {
  for (const g of games) {
    assert.doesNotThrow(() => JSON.stringify(gameJsonLd(g)));
    assert.doesNotThrow(() => JSON.stringify(breadcrumbJsonLd(g)));
  }
  const catalog = catalogJsonLd(games);
  assert.equal(catalog.mainEntity.numberOfItems, games.length);
  assert.equal(catalog.mainEntity.itemListElement.length, games.length);
  assert.equal(catalog.mainEntity.itemListElement[0].position, 1);
});

// ── ビルド成果物の突き合わせ ──
// sitemap に載せた URL と、実際に canonical を宣言しているページの集合が
// 一致していることを out/ の実物で確認する。sitemap.ts と各ページの
// generateMetadata は今たまたま同じ gameUrl を呼んでいるだけなので、
// 片方だけ増減したとき（about/ を sitemap から外した等）を構造では検出できない。
// out/ が無い環境（CI の test は build より前）ではスキップする。
test("out/: sitemap の URL 集合と canonical 宣言ページの集合が一致する", (t) => {
  const outDir = new URL("../out/", import.meta.url);
  let sitemapXml;
  try {
    sitemapXml = readFileSync(new URL("sitemap.xml", outDir), "utf8");
  } catch {
    t.skip("out/ が未生成（build 前）");
    return;
  }

  const sitemapUrls = new Set(
    [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]),
  );

  // out/ 配下の index.html を全部たどり、canonical を集める。
  const canonicals = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const child = new URL(
        entry.name + (entry.isDirectory() ? "/" : ""),
        dir,
      );
      if (entry.isDirectory()) {
        if (entry.name === "_next") continue;
        walk(child);
      } else if (entry.name === "index.html") {
        const html = readFileSync(child, "utf8");
        const m = html.match(/rel="canonical" href="([^"]+)"/);
        if (m) canonicals.add(m[1]);
      }
    }
  };
  walk(outDir);

  assert.deepEqual(
    [...sitemapUrls].sort(),
    [...canonicals].sort(),
    "sitemap 掲載 URL と canonical 宣言ページが食い違っている",
  );
});
