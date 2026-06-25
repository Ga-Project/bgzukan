import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import "./theme.css";

// SEO/OGP。公開 URL（GitHub Pages のサブパス配信）を metadataBase に置く。
export const metadata: Metadata = {
  metadataBase: new URL("https://ga-project.github.io/bgzukan/"),
  title: {
    default:
      "ボドゲ図鑑 — 国内ボードゲーム・同人タイトルの日本語データカタログ",
    template: "%s — ボドゲ図鑑",
  },
  description:
    "国内の商業・同人・インディーのボードゲームを、人数・プレイ時間・メカニクス・デザイナー・サークルで検索・絞り込みできる日本語のデータカタログ。",
  openGraph: {
    title: "ボドゲ図鑑",
    description:
      "国内ボードゲーム・同人タイトルを日本語で構造化したデータカタログ。人数・時間・メカニクスで検索・絞り込み。",
    type: "website",
    locale: "ja_JP",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        {/*
          アクセス計測（cookieless・秘密キー不要・GoatCounter）。
          公開前に bgzukan.goatcounter.com（無料サブドメイン）を取得すると有効化される。
        */}
        <Script
          data-goatcounter="https://bgzukan.goatcounter.com/count"
          src="https://gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
