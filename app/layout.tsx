import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import "./theme.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site.mjs";

// SEO/OGP。公開 URL（GitHub Pages のサブパス配信）を metadataBase に置く。
// 公開 URL と説明文の正は lib/site.mjs（canonical・sitemap・JSON-LD と同じ実体を使い、
// 片方だけ変わって canonical が死んだ URL を指す事故を防ぐ）。
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "ボドゲ図鑑 — 国内ボードゲーム・同人タイトルの日本語データカタログ",
    template: "%s — ボドゲ図鑑",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
          data-goatcounter="https://ga-project.goatcounter.com/count"
          src="https://gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
