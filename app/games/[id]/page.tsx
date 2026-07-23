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
  relatedGames,
} from "@/lib/catalog.mjs";
import { breadcrumbJsonLd, gameJsonLd, gameUrl } from "@/lib/site.mjs";
import { SiteHeader } from "@/components/SiteHeader";
import { GameCard } from "@/components/GameCard";
import { JsonLd } from "@/components/JsonLd";

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
  const url = gameUrl(game);
  return {
    title: game.title,
    description,
    // サブパス配信のため絶対 URL を直接与える（相対値だと /bgzukan が落ちる）。
    alternates: { canonical: url },
    // openGraph は全フィールドを再宣言する（Next の metadata マージはキー単位の
    // 置換で、部分指定するとレイアウト側の type/locale が消えるため）。
    openGraph: {
      title: `${game.title} — ボドゲ図鑑`,
      description,
      url,
      type: "article",
      locale: "ja_JP",
    },
  };
}

export default function GamePage({ params }: { params: { id: string } }) {
  const game = games.find((g) => g.id === params.id);
  if (!game) notFound();

  const isDoujin = game.type === "同人・インディー";
  const tags = gameTags(game);
  const related = relatedGames(game, games, 4);

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
          {/* 可視パンくずは BreadcrumbList の構造化データと同じ2段にする
              （可視内容と構造化データが一致していることが表示の要件）。 */}
          <nav className="breadcrumb" aria-label="パンくず">
            <Link href="/">← 棚に戻る</Link>
            <span className="breadcrumb-sep" aria-hidden="true">
              ›
            </span>
            <span aria-current="page">{game.title}</span>
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

          {/* ── 棚の隣（関連作品）──
              図鑑は1点引いて終わりではなく、隣を辿って知らない作品に出会う道具。
              デザイナー・遊び味・卓の人数が近い順に並べる（lib/catalog.mjs）。 */}
          {related.length > 0 && (
            <section className="related" aria-labelledby="related-h">
              <div className="shelf-label">
                <h2 id="related-h" className="shelf-label-tab">
                  棚の隣
                </h2>
                <span className="related-note">
                  デザイナー・遊び味・人数が近い作品
                </span>
              </div>
              <div className="shelf-row">
                <ul className="box-rack">
                  {related.map((g) => (
                    <li className="box-slot" key={g.id}>
                      <GameCard game={g} />
                    </li>
                  ))}
                </ul>
                {/* 棚板（箱が乗る面）。装飾なので aria 非対象。 */}
                <div className="shelf-board" aria-hidden="true" />
              </div>
            </section>
          )}
        </div>
      </main>

      <JsonLd data={gameJsonLd(game)} />
      <JsonLd data={breadcrumbJsonLd(game)} />

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
