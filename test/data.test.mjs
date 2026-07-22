// ボドゲ図鑑 — データ整合テスト（node:test・追加依存なし）。
// data/games.json はこの製品の中核資産。スキーマ・一意性・値域・出典の存在を機械検査し、
// 壊れたデータ（重複ID・人数逆転・出典なし・空の紹介文 等）を回帰で弾く。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const games = JSON.parse(
  readFileSync(new URL("../data/games.json", import.meta.url), "utf8"),
);

const TYPES = new Set(["商業", "同人・インディー"]);
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

const isNonEmptyString = (v) => typeof v === "string" && v.trim() !== "";
const isHttpUrl = (v) =>
  typeof v === "string" && /^https?:\/\//.test(v) && !/\s/.test(v);
const isIntInRange = (v, lo, hi) =>
  typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi;

test("データは非空の配列", () => {
  assert.ok(Array.isArray(games));
  assert.ok(games.length >= 1, "最低1件は必要");
});

test("id は半角スラグ形式で一意", () => {
  const seen = new Set();
  for (const g of games) {
    assert.match(g.id, ID_RE, `不正な id: ${g.id}`);
    assert.ok(!seen.has(g.id), `id が重複: ${g.id}`);
    seen.add(g.id);
  }
});

test("各作品が必須スキーマ・値域を満たす", () => {
  for (const g of games) {
    const where = g.id ?? JSON.stringify(g);

    assert.ok(isNonEmptyString(g.title), `${where}: title`);
    assert.ok(isNonEmptyString(g.reading), `${where}: reading`);
    // 読みは検索のかな正規化前提。ASCII 英字を含めない。
    assert.ok(!/[a-z]/i.test(g.reading), `${where}: reading に英字混入`);

    assert.ok(TYPES.has(g.type), `${where}: type`);

    assert.ok(
      g.designer === null || isNonEmptyString(g.designer),
      `${where}: designer`,
    );
    assert.ok(
      g.publisher === null || isNonEmptyString(g.publisher),
      `${where}: publisher`,
    );

    // 人数・時間レンジ（min<=max、妥当な値域）
    assert.ok(isIntInRange(g.players.min, 1, 20), `${where}: players.min`);
    assert.ok(isIntInRange(g.players.max, 1, 20), `${where}: players.max`);
    assert.ok(g.players.min <= g.players.max, `${where}: players min>max`);
    assert.ok(isIntInRange(g.time.min, 1, 600), `${where}: time.min`);
    assert.ok(isIntInRange(g.time.max, 1, 600), `${where}: time.max`);
    assert.ok(g.time.min <= g.time.max, `${where}: time min>max`);

    assert.ok(
      g.minAge === null || isIntInRange(g.minAge, 1, 18),
      `${where}: minAge`,
    );
    assert.ok(
      g.year === null || isIntInRange(g.year, 1980, 2026),
      `${where}: year`,
    );
    assert.ok(
      g.firstEvent === null || isNonEmptyString(g.firstEvent),
      `${where}: firstEvent`,
    );

    assert.ok(
      Array.isArray(g.mechanics) &&
        g.mechanics.length >= 1 &&
        g.mechanics.every(isNonEmptyString),
      `${where}: mechanics`,
    );
    assert.ok(
      Array.isArray(g.categories) &&
        g.categories.length >= 1 &&
        g.categories.every(isNonEmptyString),
      `${where}: categories`,
    );

    // 紹介文は自社執筆の実体がある（プレースホルダ放置を弾く）
    assert.ok(
      isNonEmptyString(g.description) && g.description.length >= 20,
      `${where}: description が短すぎる`,
    );

    assert.ok(
      g.officialUrl === null || isHttpUrl(g.officialUrl),
      `${where}: officialUrl`,
    );

    // 出典は一次情報の裏付け。最低1件の実在しうる http(s) URL を要求する。
    assert.ok(
      Array.isArray(g.sources) &&
        g.sources.length >= 1 &&
        g.sources.every(isHttpUrl),
      `${where}: sources`,
    );

    assert.ok(Array.isArray(g.shops), `${where}: shops は配列`);
    for (const s of g.shops) {
      assert.ok(isNonEmptyString(s.name), `${where}: shop.name`);
      assert.ok(isHttpUrl(s.url), `${where}: shop.url`);
    }
  }
});
