// ボドゲ図鑑 — 検索/絞り込みロジックの回帰テスト（node:test）。
// lib/catalog.mjs を UI と同じ実体で検証する。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  normalizeText,
  searchText,
  filterGames,
  collectFacets,
  gameTags,
  timeBucketKey,
  formatPlayers,
  formatTime,
  formatAge,
  formatYear,
  PLAYER_CHOICES,
} from "../lib/catalog.mjs";

const games = JSON.parse(
  readFileSync(new URL("../data/games.json", import.meta.url), "utf8"),
);
const byId = (id) => games.find((g) => g.id === id);

test("normalizeText: カタカナ→ひらがな・全角→半角・小文字・空白除去", () => {
  assert.equal(normalizeText("ラブレター"), "らぶれたー");
  assert.equal(normalizeText("ＡＢ Ｃ"), "abc");
  assert.equal(normalizeText("  Deep  Sea  "), "deepsea");
  assert.equal(normalizeText(null), "");
  assert.equal(normalizeText(undefined), "");
});

test("searchText: カナ表記ゆれを吸収して横断検索できる", () => {
  const love = byId("love-letter");
  assert.ok(love, "love-letter が存在する");
  const text = searchText(love);
  // ひらがなでもカタカナでもヒットする（正規化で同一視）
  assert.ok(text.includes(normalizeText("らぶ")));
  assert.ok(text.includes(normalizeText("ラブ")));
});

test("filterGames: クエリでタイトル/読み/デザイナーを横断", () => {
  const r = filterGames(games, { query: "らぶれたー" });
  assert.ok(r.some((g) => g.id === "love-letter"));
  // デザイナー名でもヒット
  const r2 = filterGames(games, { query: "カナイ" });
  assert.ok(r2.some((g) => g.id === "love-letter"));
});

test("filterGames: 人数は『その人数で遊べる』作品に絞る（OR）", () => {
  const r = filterGames(games, { players: [8] });
  // 2-10人の ito は含む、2-4人の love-letter は含まない
  assert.ok(r.some((g) => g.id === "ito"));
  assert.ok(!r.some((g) => g.id === "love-letter"));
  for (const g of r) assert.ok(g.players.min <= 8 && 8 <= g.players.max);
});

test("filterGames: 種別フィルタ（OR）", () => {
  const r = filterGames(games, { types: ["同人・インディー"] });
  assert.ok(r.length >= 1);
  for (const g of r) assert.equal(g.type, "同人・インディー");
});

test("filterGames: タグフィルタはカテゴリ・メカニクスを横断（OR）", () => {
  // 全作品から実在するタグを1つ取り、それで絞ると全件がそのタグを持つ
  const someTag = gameTags(games[0])[0];
  const r = filterGames(games, { tags: [someTag] });
  assert.ok(r.length >= 1);
  for (const g of r) assert.ok(gameTags(g).includes(someTag));
});

test("filterGames: カテゴリ間は AND（人数×種別）", () => {
  const r = filterGames(games, { players: [2], types: ["商業"] });
  for (const g of r) {
    assert.ok(g.players.min <= 2 && 2 <= g.players.max);
    assert.equal(g.type, "商業");
  }
});

test("filterGames: 空フィルタは全件を返す", () => {
  assert.equal(filterGames(games, {}).length, games.length);
  assert.equal(filterGames(games).length, games.length);
});

test("timeBucketKey: 上限時間で排他バケットに分類", () => {
  assert.equal(timeBucketKey({ time: { min: 5, max: 10 } }), "u15");
  assert.equal(timeBucketKey({ time: { min: 30, max: 30 } }), "u30");
  assert.equal(timeBucketKey({ time: { min: 45, max: 45 } }), "u60");
  assert.equal(timeBucketKey({ time: { min: 60, max: 240 } }), "o60");
});

test("collectFacets: 種別件数の合計は総数、人数は選択肢の部分集合", () => {
  const f = collectFacets(games);
  const sum = f.types.reduce((a, t) => a + t.count, 0);
  assert.equal(sum, games.length);
  for (const n of f.players) assert.ok(PLAYER_CHOICES.includes(n));
  assert.ok(f.tags.length >= 1);
  // タグは件数の降順
  for (let i = 1; i < f.tags.length; i += 1) {
    assert.ok(f.tags[i - 1].count >= f.tags[i].count);
  }
});

test("format ヘルパ: レンジと欠損値の表示", () => {
  assert.equal(formatPlayers({ players: { min: 2, max: 4 } }), "2–4人");
  assert.equal(formatPlayers({ players: { min: 4, max: 4 } }), "4人");
  assert.equal(formatTime({ time: { min: 30, max: 30 } }), "30分");
  assert.equal(formatTime({ time: { min: 60, max: 240 } }), "60–240分");
  assert.equal(formatAge({ minAge: 10 }), "10歳〜");
  assert.equal(formatAge({ minAge: null }), "—");
  assert.equal(formatYear({ year: 2014 }), "2014年");
  assert.equal(formatYear({ year: null }), "—");
});
