// ボドゲ図鑑 — トップ（カタログ）。
// データはビルド時に埋め込み、検索/絞り込みは CatalogClient（client）で行う。
// static export のため、初期 HTML には全件のカードが描画される（JS 評価前でも閲覧可）。
import Link from "next/link";
import gamesData from "@/data/games.json";
import { collectFacets } from "@/lib/catalog.mjs";
import type { Game } from "@/lib/types";
import { CatalogClient } from "@/components/CatalogClient";

const games = gamesData as unknown as Game[];

export default function Home() {
  const facets = collectFacets(games);

  return (
    <>
      <header className="site-header">
        <div className="container">
          <Link className="brand" href="/">
            <span className="brand-name">ボドゲ図鑑</span>
            <span className="brand-tag">国内ボードゲーム・同人カタログ</span>
          </Link>
          <Link href="/about">このサイトについて</Link>
        </div>
      </header>

      <main>
        <div className="container">
          <section className="catalog-hero">
            <h1>国内ボードゲーム・同人タイトルを日本語で引く</h1>
            <p className="lead">
              海外中心のデータベースでは見つけにくい国内・同人・インディーの
              ボードゲームを、人数・プレイ時間・メカニクス・デザイナー・サークルで
              検索・絞り込みできるカタログです。収録は順次拡大中。
            </p>
            <p className="hero-note">
              掲載は公式・一次情報をもとに編集部（株式会社Ga
              Project）が作成しています。国内発の作品を順次収録中。
              <Link href="/about">収録の基準・運営について ›</Link>
            </p>
          </section>

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
    </>
  );
}
