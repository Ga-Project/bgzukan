// ボドゲ図鑑 — 棚に並ぶ「箱（ボックスアート）」1点（プレゼンテーション）。
// カード全体が1つのリンク。内部に別リンクを入れ子にしない（外部リンクは詳細のみ）。
//
// 構造コンセプト「ゲーム棚」:
//   均一なフラットカードではなく、ゲーム箱の佇まいを与える。
//   - 箱の天面（lid）に種別を刷り、背に厚み（spine）を持たせて棚に「乗っている」感を出す。
//   - 仕様（人数・時間）は箱面の隅に押された「スペック刻印」プレートとして見せる。
//   - メカニクス/カテゴリは箱の裏面に列記された「中身」表記の体で下端に並べる。
import Link from "next/link";
import type { Game } from "@/lib/types";
import {
  formatPlayers,
  formatTime,
  formatYear,
  gameTags,
} from "@/lib/catalog.mjs";

const MAX_TAGS = 3;

function IconPlayers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm13 8v-1a4 4 0 0 0-3-3.87M16 4.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconTime() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7v5l3.5 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GameCard({ game }: { game: Game }) {
  const tags = gameTags(game);
  const shown = tags.slice(0, MAX_TAGS);
  const rest = tags.length - shown.length;
  const isDoujin = game.type === "同人・インディー";

  return (
    <Link
      className={`game-box ${isDoujin ? "game-box--doujin" : "game-box--commercial"}`}
      href={`/games/${game.id}/`}
    >
      {/* 箱の厚み（spine）。装飾なので aria 非対象。 */}
      <span className="box-spine" aria-hidden="true" />

      {/* 箱の天面（lid）= 種別を刷ったカラーバンド */}
      <span className="box-lid">
        <span className="box-lid-type">{game.type}</span>
        <span className="box-lid-year tabular" aria-label="発表年">
          {formatYear(game)}
        </span>
      </span>

      {/* 箱の表面 */}
      <span className="box-face">
        <span className="box-title">{game.title}</span>
        <span className="box-reading">{game.reading}</span>

        {/* スペック刻印プレート（箱面の隅に押された規格表記の体） */}
        <span className="spec-plate">
          <span className="spec-cell" aria-label="人数">
            <IconPlayers />
            <span className="num tabular">{formatPlayers(game)}</span>
          </span>
          <span className="spec-div" aria-hidden="true" />
          <span className="spec-cell" aria-label="プレイ時間">
            <IconTime />
            <span className="num tabular">{formatTime(game)}</span>
          </span>
        </span>
      </span>

      {/* 箱の裏面「中身」表記（メカニクス・カテゴリ） */}
      <span className="box-contents">
        {shown.map((t) => (
          <span className="content-chip" key={t}>
            {t}
          </span>
        ))}
        {rest > 0 && <span className="content-more">＋{rest}</span>}
      </span>
    </Link>
  );
}
