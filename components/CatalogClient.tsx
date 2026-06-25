"use client";

// ボドゲ図鑑 — 検索・絞り込み UI（クライアント）。
// 純ロジックは lib/catalog.mjs に委譲し、ここは state と描画に専念する。
// IME 変換中は検索を確定させない（変換途中の中間入力で暴発させない）。
// 検索は常時表示（フィルタ折りたたみの外）、絞り込みチップだけをサイドバー/ドロワーに置く。
import { useEffect, useMemo, useRef, useState } from "react";
import type { Facets, Game } from "@/lib/types";
import { filterGames, TIME_BUCKETS } from "@/lib/catalog.mjs";
import { GameCard } from "@/components/GameCard";

type Bucket = { key: string; label: string };

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function CatalogClient({
  games,
  facets,
}: {
  games: Game[];
  facets: Facets;
}) {
  // 検索: 入力値（rawQuery）と、フィルタに使う確定値（debounced）を分ける。
  const [rawQuery, setRawQuery] = useState("");
  const [committedQuery, setCommittedQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const composingRef = useRef(false);

  const [players, setPlayers] = useState<number[]>([]);
  const [timeBuckets, setTimeBuckets] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(committedQuery), 160);
    return () => clearTimeout(t);
  }, [committedQuery]);

  const filtered = useMemo(
    () =>
      filterGames(games, {
        query: debouncedQuery,
        players,
        timeBuckets,
        types,
        tags,
      }),
    [games, debouncedQuery, players, timeBuckets, types, tags],
  );

  const activeCount =
    players.length + timeBuckets.length + types.length + tags.length;

  function onQueryChange(value: string) {
    setRawQuery(value);
    if (!composingRef.current) setCommittedQuery(value);
  }
  function clearQuery() {
    setRawQuery("");
    setCommittedQuery("");
    setDebouncedQuery("");
  }
  function clearAll() {
    clearQuery();
    setPlayers([]);
    setTimeBuckets([]);
    setTypes([]);
    setTags([]);
  }

  // 適用中の条件チップ（個別解除）
  const active: { key: string; label: string; remove: () => void }[] = [
    ...types.map((t) => ({
      key: `type:${t}`,
      label: t,
      remove: () => setTypes((p) => toggle(p, t)),
    })),
    ...players.map((n) => ({
      key: `pl:${n}`,
      label: `${n}人`,
      remove: () => setPlayers((p) => toggle(p, n)),
    })),
    ...timeBuckets.map((b) => ({
      key: `time:${b}`,
      label: TIME_BUCKETS.find((x: Bucket) => x.key === b)?.label ?? b,
      remove: () => setTimeBuckets((p) => toggle(p, b)),
    })),
    ...tags.map((t) => ({
      key: `tag:${t}`,
      label: t,
      remove: () => setTags((p) => toggle(p, t)),
    })),
  ];

  return (
    <>
      {/* 検索は常時表示（フィルタの折りたたみの外・全幅） */}
      <div className="search">
        <label className="visually-hidden" htmlFor="q">
          作品を検索（タイトル・読み・デザイナー・サークル）
        </label>
        <input
          id="q"
          type="search"
          inputMode="search"
          placeholder="タイトル・かな・デザイナーで検索"
          value={rawQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={(e) => {
            composingRef.current = false;
            setCommittedQuery(e.currentTarget.value);
          }}
        />
        {rawQuery && (
          <button
            type="button"
            className="search-clear"
            aria-label="検索をクリア"
            onClick={clearQuery}
          >
            ×
          </button>
        )}
      </div>

      {/* 絞り込みトグル（モバイル/タブレットのみ・デスクトップは常時サイドバー表示） */}
      <button
        type="button"
        className="filter-toggle btn btn-secondary"
        aria-expanded={filtersOpen}
        aria-controls="filters"
        onClick={() => setFiltersOpen((v) => !v)}
      >
        絞り込み{activeCount > 0 ? `（${activeCount}）` : ""}
      </button>

      <div className="catalog-layout">
        <aside id="filters" className="filters" data-open={filtersOpen}>
          <fieldset className="filter-group">
            <legend>種別</legend>
            <div className="chip-cloud">
              {facets.types.map((t) => (
                <label className="chip" key={t.name}>
                  <input
                    type="checkbox"
                    checked={types.includes(t.name)}
                    onChange={() => setTypes((p) => toggle(p, t.name))}
                  />
                  <span>{t.name}</span>
                  <span className="chip-count">{t.count}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="filter-group">
            <legend>人数</legend>
            <div className="chip-cloud">
              {facets.players.map((n) => (
                <label className="chip" key={n}>
                  <input
                    type="checkbox"
                    checked={players.includes(n)}
                    onChange={() => setPlayers((p) => toggle(p, n))}
                  />
                  <span>{n}人</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="filter-group">
            <legend>プレイ時間</legend>
            <div className="chip-cloud">
              {TIME_BUCKETS.map((b: Bucket) => (
                <label className="chip" key={b.key}>
                  <input
                    type="checkbox"
                    checked={timeBuckets.includes(b.key)}
                    onChange={() => setTimeBuckets((p) => toggle(p, b.key))}
                  />
                  <span>{b.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="filter-group">
            <legend>タグ</legend>
            <div className="chip-cloud chip-cloud--scroll">
              {facets.tags.map((t) => (
                <label className="chip" key={t.name}>
                  <input
                    type="checkbox"
                    checked={tags.includes(t.name)}
                    onChange={() => setTags((p) => toggle(p, t.name))}
                  />
                  <span>{t.name}</span>
                  <span className="chip-count">{t.count}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </aside>

        <section aria-label="検索結果">
          <h2 className="visually-hidden">検索結果</h2>

          <div className="result-bar">
            <p className="result-count" aria-live="polite">
              <strong>{filtered.length}</strong>件
              {filtered.length !== games.length && (
                <span> / 全{games.length}件</span>
              )}
            </p>
            {active.length > 0 && (
              <div className="active-filters">
                {active.map((a) => (
                  <span className="active-chip" key={a.key}>
                    {a.label}
                    <button
                      type="button"
                      aria-label={`${a.label} を解除`}
                      onClick={a.remove}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button type="button" className="clear-all" onClick={clearAll}>
                  すべてクリア
                </button>
              </div>
            )}
          </div>

          {filtered.length > 0 ? (
            <div className="game-grid">
              {filtered.map((g) => (
                <GameCard game={g} key={g.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">
                🔍
              </span>
              <h3>条件に合う作品が見つかりませんでした</h3>
              <p>検索語を短くするか、絞り込みを減らしてみてください。</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={clearAll}
                style={{ marginTop: "var(--sp-4)" }}
              >
                すべてクリア
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
