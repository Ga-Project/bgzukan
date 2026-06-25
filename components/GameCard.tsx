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
        <span aria-label="人数">
          <span className="num">{formatPlayers(game)}</span>
        </span>
        <span aria-label="プレイ時間">
          <span className="num">{formatTime(game)}</span>
        </span>
        <span aria-label="発表年">
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
