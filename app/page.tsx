// ボドゲ図鑑 — トップ（カタログ）。
// データはビルド時に埋め込み、検索/絞り込みは CatalogClient（client）で行う。
// static export のため、初期 HTML には全件が棚に並んだ状態で描画される（JS 評価前でも閲覧可）。
//
// 構造コンセプト「ゲーム棚」:
//   汎用の hero + 均一カードグリッドを使わない。雑誌的な題字（masthead）で始まり、
//   作品は棚（shelf）に並ぶボックスアート（箱）として陳列される。
import type { Metadata } from "next";
import Link from "next/link";
import gamesData from "@/data/games.json";
import { collectFacets } from "@/lib/catalog.mjs";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  catalogJsonLd,
} from "@/lib/site.mjs";
import type { Game } from "@/lib/types";
import { CatalogClient } from "@/components/CatalogClient";
import { SiteHeader } from "@/components/SiteHeader";
import { JsonLd } from "@/components/JsonLd";

const games = gamesData as unknown as Game[];

// サブパス配信のため絶対 URL を直接与える（相対値だと /bgzukan が落ちる）。
//
// openGraph は全フィールドを再宣言する。Next の metadata マージはトップレベルの
// キー単位の置換なので、ここで `{ url }` だけ書くとレイアウトの openGraph が
// 丸ごと差し替わり、type と locale が出力から消える。
export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl() },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "ja_JP",
    url: absoluteUrl(),
  },
};

export default function Home() {
  const facets = collectFacets(games);

  // 題字に添える「奥付」風の規模インジケータ（収録の手触りを数で伝える）。
  const total = games.length;
  const doujinCount = games.filter(
    (g) => g.type === "同人・インディー",
  ).length;
  const designerCount = new Set(
    games.map((g) => g.designer).filter(Boolean),
  ).size;

  return (
    <>
      <a className="skip-link" href="#catalog">
        本文へスキップ
      </a>
      <SiteHeader showTag={false} />

      <main>
        {/* ── 題字（masthead）: 雑誌の表紙のように名前を大きく組み、奥付の数値を罫線で並べる ── */}
        <section className="masthead" aria-labelledby="masthead-h">
          <div className="container masthead-inner">
            <p className="masthead-kicker">国内ボードゲーム・同人インディー目録</p>
            <h1 id="masthead-h" className="masthead-title">
              ボドゲ<span className="masthead-title-accent">図鑑</span>
            </h1>
            <p className="masthead-sub">
              卓を囲む日本のゲームを、棚から手に取るように引く。海外中心の
              データベースでは見つけにくい国内・同人・インディーを、人数・時間・
              メカニクス・デザイナー・サークルで探せる目録。
            </p>

            {/* 奥付（colophon）: 罫線で区切った定規目盛り風の規模表記 */}
            <dl className="colophon" aria-label="収録規模">
              <div className="colophon-cell">
                <dt>収録タイトル</dt>
                <dd className="tabular">{total}</dd>
              </div>
              <div className="colophon-cell">
                <dt>同人・インディー</dt>
                <dd className="tabular">{doujinCount}</dd>
              </div>
              <div className="colophon-cell">
                <dt>デザイナー</dt>
                <dd className="tabular">{designerCount}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div id="catalog">
          <CatalogClient games={games} facets={facets} />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container footer-note">
          <p>
            掲載情報は公式・一次情報をもとに自社で構造化・執筆しています。内容は
            変更される場合があり、正確性を保証するものではありません。
          </p>
          <p>
            掲載情報の修正・削除のご依頼は、運営の{" "}
            <a
              href="https://ga-project.net"
              target="_blank"
              rel="noopener noreferrer"
            >
              株式会社Ga Project
            </a>{" "}
            までご連絡ください。
          </p>
          <p>
            <Link href="/about">
              このサイトについて（運営・収録基準・データの作り方）
            </Link>
          </p>
          <p>© 2026 株式会社Ga Project — ボドゲ図鑑</p>
        </div>
      </footer>

      <JsonLd data={catalogJsonLd(games)} />
    </>
  );
}
