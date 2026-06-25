// ボドゲ図鑑 — このサイトについて（運営・収録基準・データの作り方）。
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "このサイトについて",
  description:
    "ボドゲ図鑑の運営者・収録の基準・データの作り方・情報の修正/削除の依頼方法について。",
};

export default function AboutPage() {
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
        <div className="container container-narrow detail">
          <nav className="breadcrumb" aria-label="パンくず">
            <Link href="/">← 一覧へ戻る</Link>
          </nav>

          <h1>このサイトについて</h1>
          <p className="detail-desc">
            ボドゲ図鑑は、国内のボードゲーム・同人タイトルを日本語で検索・閲覧できる
            データカタログです。海外中心のデータベースでは見つけにくい国内・同人・
            インディーの作品情報を、日本語で整理して提供することを目的としています。
          </p>

          <section className="detail-section" aria-labelledby="operator-h">
            <h2 id="operator-h">運営</h2>
            <p className="detail-desc">
              本サイトは{" "}
              <a
                href="https://ga-project.net"
                target="_blank"
                rel="noopener noreferrer"
              >
                株式会社Ga Project
              </a>{" "}
              が運営・編集しています。
            </p>
          </section>

          <section className="detail-section" aria-labelledby="howdata-h">
            <h2 id="howdata-h">データの作り方</h2>
            <p className="detail-desc">
              掲載作品は、公式サイト・頒布物の奥付・イベントカタログなどの一次情報を
              もとに、編集部が人数・プレイ時間・メカニクス・デザイナー・サークルなどの
              事実情報を構造化しています。紹介文はすべて自社で執筆しており、他サイトの
              説明文の転載や、他データベースからの自動転記は行っていません。各作品には
              参照した出典のリンクを併記しています。
            </p>
          </section>

          <section className="detail-section" aria-labelledby="criteria-h">
            <h2 id="criteria-h">収録の基準</h2>
            <p className="detail-desc">
              日本国内のデザイナー・サークル・メーカー発の作品（商業／同人・インディー）
              のうち、人数・プレイ時間・発表年などの基本情報を一次情報で確認できたものを
              掲載しています。海外デザインの輸入・翻訳作品は対象外です。掲載数は現在も
              順次拡大しています。一覧では、検索（タイトル・かな・デザイナー・サークル）や、
              種別・人数・プレイ時間・タグでの絞り込みで作品を探せます。
            </p>
          </section>

          <section className="detail-section" aria-labelledby="contact-h">
            <h2 id="contact-h">情報の修正・追加・削除のご依頼</h2>
            <p className="detail-desc">
              掲載情報の誤り・追加・削除のご依頼は、運営の{" "}
              <a
                href="https://ga-project.net"
                target="_blank"
                rel="noopener noreferrer"
              >
                株式会社Ga Project
              </a>{" "}
              までご連絡ください。サークル・個人の非公開情報は掲載していません。
            </p>
          </section>

          <section className="detail-section" aria-labelledby="disclaimer-h">
            <h2 id="disclaimer-h">免責</h2>
            <p className="detail-desc">
              掲載情報は変更される場合があり、正確性を保証するものではありません。
              最新・正確な情報は各公式サイト等でご確認ください。
            </p>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container footer-note">
          <p>© 2026 株式会社Ga Project — ボドゲ図鑑</p>
        </div>
      </footer>
    </>
  );
}
