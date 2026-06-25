// ボドゲ図鑑 — next.config の basePath 解決の回帰テスト（node:test）。
// 「サブパス配信なのに basePath 未設定」「ローカル/コンソールに basePath が漏れる」を防ぐ。
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveBasePath } from "../next.config.mjs";

test("resolveBasePath: 未設定はルート相対（basePath なし）", () => {
  // ローカル/動作確認コンソールのビルドはルート直下配信なので basePath を付けない。
  assert.deepEqual(resolveBasePath({}), {});
  assert.deepEqual(resolveBasePath({ GA_BASE_PATH: "" }), {});
  assert.deepEqual(resolveBasePath({ GA_BASE_PATH: "   " }), {});
});

test("resolveBasePath: GA_BASE_PATH があれば basePath/assetPrefix を導出", () => {
  // Pages 公開ビルドはサブパス配信なので basePath を付ける（未設定だとアセット 404）。
  assert.deepEqual(resolveBasePath({ GA_BASE_PATH: "/bgzukan" }), {
    basePath: "/bgzukan",
    assetPrefix: "/bgzukan/",
  });
  // 先頭スラッシュ補完・末尾スラッシュ除去
  assert.deepEqual(resolveBasePath({ GA_BASE_PATH: "bgzukan/" }), {
    basePath: "/bgzukan",
    assetPrefix: "/bgzukan/",
  });
});
