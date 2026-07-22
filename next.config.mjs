/** @type {import('next').NextConfig} */

/**
 * GitHub Pages のプロジェクトページ（サブパス `/bgzukan/` 配信）と、ローカル/動作確認
 * コンソールのルート配信を両立させるため、basePath は環境変数 GA_BASE_PATH が
 * 与えられたときだけ適用する。
 * - Pages 公開ビルド（.github/workflows/pages.yml が GA_BASE_PATH=/bgzukan を設定）
 *   → `/bgzukan` 配下にアセット・内部リンクを出力。
 * - ローカル/コンソールのビルド（未設定）→ ルート相対。out/ をポート直下で配信できる。
 * @param {Record<string, string | undefined>} env
 * @returns {{ basePath?: string, assetPrefix?: string }}
 */
export function resolveBasePath(env) {
  const raw = (env.GA_BASE_PATH ?? "").trim().replace(/\/+$/, "");
  if (!raw) return {};
  const basePath = raw.startsWith("/") ? raw : `/${raw}`;
  return { basePath, assetPrefix: `${basePath}/` };
}

const nextConfig = {
  reactStrictMode: true,
  // static export（out/ に静的書き出し）。サーバランタイム不要。
  output: "export",
  // export では Next の画像最適化サーバが使えないため無効化（最適化は事前に行うか CSS で対応）。
  images: { unoptimized: true },
  // 各ルートを /path/index.html として出力し、サブディレクトリ配信で 404 を避ける。
  trailingSlash: true,
  // サブパス配信時のみ basePath/assetPrefix を適用（上記参照）。
  ...resolveBasePath(process.env),
};

export default nextConfig;
