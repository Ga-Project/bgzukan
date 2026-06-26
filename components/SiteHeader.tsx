// ボドゲ図鑑 — 共通ヘッダー（全ページで同一のランドマーク・ブランド表現）。
// サイコロ目をモチーフにしたマーク＋名前＋副題。一貫性のため各ページで再利用する。
import Link from "next/link";

function DiceMark() {
  return (
    <span className="brand-mark-dice" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="4.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="8" cy="8" r="1.7" fill="currentColor" />
        <circle cx="16" cy="8" r="1.7" fill="currentColor" />
        <circle cx="12" cy="12" r="1.7" fill="currentColor" />
        <circle cx="8" cy="16" r="1.7" fill="currentColor" />
        <circle cx="16" cy="16" r="1.7" fill="currentColor" />
      </svg>
    </span>
  );
}

export function SiteHeader({ showTag = true }: { showTag?: boolean }) {
  return (
    <header className="site-header is-scrolled">
      <div className="container">
        <Link className="brand" href="/">
          <DiceMark />
          <span className="brand-text">
            <span className="brand-name">ボドゲ図鑑</span>
            {showTag && (
              <span className="brand-tag">国内ボードゲーム・同人カタログ</span>
            )}
          </span>
        </Link>
        <Link href="/about">このサイトについて</Link>
      </div>
    </header>
  );
}
