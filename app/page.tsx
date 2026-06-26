// ボドゲ図鑑 — トップ（カタログ）。
// データはビルド時に埋め込み、検索/絞り込みは CatalogClient（client）で行う。
// static export のため、初期 HTML には全件のカードが描画される（JS 評価前でも閲覧可）。
import Link from "next/link";
import gamesData from "@/data/games.json";
import { collectFacets } from "@/lib/catalog.mjs";
import type { Game } from "@/lib/types";
import { CatalogClient } from "@/components/CatalogClient";
import { SiteHeader } from "@/components/SiteHeader";

const games = gamesData as unknown as Game[];

export default function Home() {
  const facets = collectFacets(games);

  // hero のカタログ規模インジケータ（収録の手触りを数で伝える）
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
      <SiteHeader />

      <main>
        <div className="container">
          <section className="catalog-hero" aria-labelledby="hero-h">
            <span className="eyebrow">国内ボードゲーム・同人カタログ</span>
            <h1 id="hero-h">
              卓を囲む日本のゲームを、
              <br />
              <span className="accent-text">日本語で引く。</span>
            </h1>
            <p className="lead">
              海外中心のデータベースでは見つけにくい国内・同人・インディーの
              ボードゲームを、人数・プレイ時間・メカニクス・デザイナー・サークルで
              検索・絞り込みできるカタログ。一次情報をもとに編集し、順次収録を
              拡大しています。
            </p>

            <div className="hero-stats">
              <div className="hero-stat">
                <span className="num tabular">{total}</span>
                <span className="label">収録タイトル</span>
              </div>
              <div className="hero-stat">
                <span className="num tabular">{doujinCount}</span>
                <span className="label">同人・インディー</span>
              </div>
              <div className="hero-stat">
                <span className="num tabular">{designerCount}</span>
                <span className="label">デザイナー</span>
              </div>
            </div>

            <p className="hero-note">
              掲載は公式・一次情報をもとに編集部（株式会社Ga
              Project）が作成しています。
              <Link href="/about">収録の基準・運営について ›</Link>
            </p>
          </section>

          <div id="catalog">
            <CatalogClient games={games} facets={facets} />
          </div>
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
