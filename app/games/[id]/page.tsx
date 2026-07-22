// ボドゲ図鑑 — 作品詳細（静的生成）。全 id を generateStaticParams で書き出す。
//
// 構造コンセプト「ゲーム棚」:
//   詳細は「箱の裏面（バックカバー）」の体裁。上部に箱の天面バンド＋題字＋規格表を
//   置いた "カバー面" を組み、その下に裏面の解説・中身・入手先・出典を並べる。
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import gamesData from "@/data/games.json";
import type { Game } from "@/lib/types";
import {
  formatAge,
  formatPlayers,
  formatTime,
  formatYear,
  gameTags,
} from "@/lib/catalog.mjs";
import { SiteHeader } from "@/components/SiteHeader";

const games = gamesData as unknown as Game[];

export function generateStaticParams() {
  return games.map((g) => ({ id: g.id }));
}

// 生成済みの id 以外は 404（static export と整合）。
export const dynamicParams = false;

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const game = games.find((g) => g.id === params.id);
  if (!game) return { title: "ページが見つかりません" };
  const description = game.description.slice(0, 110);
  return {
    title: game.title,
    description,
    openGraph: { title: `${game.title} — ボドゲ図鑑`, description },
  };
}

export default function GamePage({ params }: { params: { id: string } }) {
  const game = games.find((g) => g.id === params.id);
  if (!game) notFound();

  const isDoujin = game.type === "同人・インディー";
  const tags = gameTags(game);

  // 箱裏の「規格表」。主要スペックを上段に、人物情報を下段に。
  const specs: { label: string; value: string; faint?: boolean }[] = [
    { label: "人数", value: formatPlayers(game) },
    { label: "プレイ時間", value: formatTime(game) },
    { label: "推奨年齢", value: formatAge(game), faint: game.minAge == null },
    { label: "発表年", value: formatYear(game), faint: game.year == null },
    {
      label: "デザイナー",
      value: game.designer ?? "—",
      faint: game.designer == null,
    },
    {
      label: "メーカー / サークル",
      value: game.publisher ?? "—",
      faint: game.publisher == null,
    },
  ];
  if (game.firstEvent) {
    specs.push({ label: "初出", value: game.firstEvent });
  }

  return (
    <>
      <a className="skip-link" href="#detail-main">
        本文へスキップ
      </a>
      <SiteHeader showTag={false} />

      <main>
        <div id="detail-main" className="container detail">
          <nav className="breadcrumb" aria-label="パンくず">
            <Link href="/">← 棚に戻る</Link>
          </nav>

          {/* ── 箱のカバー面（天面バンド + 題字 + 規格表） ── */}
          <article
            className={`box-cover ${isDoujin ? "box-cover--doujin" : "box-cover--commercial"}`}
          >
            <div className="box-cover-lid">
              <span className="box-cover-type">{game.type}</span>
              <span className="box-cover-year tabular">{formatYear(game)}</span>
            </div>

            <div className="box-cover-body">
              <div className="box-cover-head">
                <h1>{game.title}</h1>
                <span className="reading">{game.reading}</span>
              </div>

              <dl className="spec-plate-lg" aria-label="規格">
                {specs.map((s) => (
                  <div className="spec-plate-cell" key={s.label}>
                    <dt>{s.label}</dt>
                    <dd className={s.faint ? "faint" : undefined}>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>

          {/* ── 箱の裏面（解説・中身・入手先・出典） ── */}
          <div className="detail-back">
            <section className="detail-section" aria-labelledby="desc-h">
              <h2 id="desc-h">どんなゲーム？</h2>
              <p className="detail-desc">{game.description}</p>
            </section>

            {tags.length > 0 && (
              <section className="detail-section" aria-labelledby="tags-h">
                <h2 id="tags-h">メカニクス・カテゴリ</h2>
                <div className="tag-list">
                  {tags.map((t) => (
                    <span className="content-chip" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {(game.officialUrl || game.shops.length > 0) && (
              <section className="detail-section" aria-labelledby="links-h">
                <h2 id="links-h">公式・入手先</h2>
                <ul className="link-list">
                  {game.officialUrl && (
                    <li>
                      <a
                        href={game.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        公式サイト
                      </a>
                    </li>
                  )}
                  {game.shops.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="detail-section" aria-labelledby="src-h">
              <h2 id="src-h">出典</h2>
              <ul className="link-list source-list">
                {game.sources.map((url) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
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
          <p>© 2026 株式会社Ga Project — ボドゲ図鑑</p>
        </div>
      </footer>
    </>
  );
}
