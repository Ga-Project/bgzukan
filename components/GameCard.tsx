// ボドゲ図鑑 — 一覧カード（プレゼンテーション）。
// カード全体が1つのリンク。内部に別リンクを入れ子にしない（外部リンクは詳細のみ）。
import Link from "next/link";
import type { Game } from "@/lib/types";
import {
  formatPlayers,
  formatTime,
  formatYear,
  gameTags,
} from "@/lib/catalog.mjs";

const MAX_TAGS = 3;

// 仕様アイコン（装飾。意味は aria-label / テキストで伝えるので aria-hidden）。
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
function IconYear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.5 9.5h17M8 3.5v3M16 3.5v3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
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
    <Link className="game-card" href={`/games/${game.id}/`}>
      <span
        className={`type-badge ${isDoujin ? "type-badge--doujin" : "type-badge--commercial"}`}
      >
        {game.type}
      </span>
      <h3>{game.title}</h3>
      <span className="reading">{game.reading}</span>
      <div className="spec-row">
        <span className="spec-item" aria-label="人数">
          <IconPlayers />
          <span className="num">{formatPlayers(game)}</span>
        </span>
        <span className="spec-item" aria-label="プレイ時間">
          <IconTime />
          <span className="num">{formatTime(game)}</span>
        </span>
        <span className="spec-item" aria-label="発表年">
          <IconYear />
          <span className="num">{formatYear(game)}</span>
        </span>
      </div>
      <div className="card-tags">
        {shown.map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
        {rest > 0 && <span className="tag-more">＋{rest}</span>}
      </div>
    </Link>
  );
}
