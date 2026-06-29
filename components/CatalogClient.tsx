"use client";

// ボドゲ図鑑 — 検索・絞り込み UI（クライアント）。
// 純ロジックは lib/catalog.mjs に委譲し、ここは state と描画に専念する。
// IME 変換中は検索を確定させない（変換途中の中間入力で暴発させない）。
//
// 構造コンセプト「ゲーム棚」:
//   左サイドバー + 均一カードグリッドという汎用構成を使わない。
//   - 検索と絞り込みは画面上部の横長ツールバー（filter-rail）に集約する。
//   - 絞り込み条件はツールバー直下にインラインで開くパネル（押し出し式）。
//   - 結果は「棚（shelf）」に陳列する。無条件のときは種別ごとに棚を分け、
//     条件があるときは1本の「検索結果」棚にまとめる。各作品は棚に並ぶ箱として描く。
import { useEffect, useMemo, useRef, useState } from "react";
import type { Facets, Game } from "@/lib/types";
import { filterGames, TIME_BUCKETS } from "@/lib/catalog.mjs";
import { GameCard } from "@/components/GameCard";

type Bucket = { key: string; label: string };

function toggle<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

// 種別の陳列順（商業 → 同人・インディー）。facets に無い種別も末尾で拾う。
const TYPE_ORDER = ["商業", "同人・インディー"];

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
  // 検索語 or いずれかの絞り込みが効いていれば「1本の検索結果棚」に切り替える。
  const isFiltering = activeCount > 0 || debouncedQuery.trim().length > 0;

  // 無条件時: 種別ごとに棚を分けて陳列する（棚＝陳列のまとまり）。
  const shelves = useMemo(() => {
    if (isFiltering) {
      return [{ key: "results", label: "検索結果", items: filtered }];
    }
    const byType = new Map<string, Game[]>();
    for (const g of filtered) {
      const list = byType.get(g.type) ?? [];
      list.push(g);
      byType.set(g.type, list);
    }
    const ordered = [
      ...TYPE_ORDER.filter((t) => byType.has(t)),
      ...[...byType.keys()].filter((t) => !TYPE_ORDER.includes(t)),
    ];
    return ordered.map((t) => ({
      key: t,
      label: t,
      items: byType.get(t) ?? [],
    }));
  }, [filtered, isFiltering]);

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
    <div className="container">
      {/* ── 整理棚の操作ツールバー（検索 + 絞り込み開閉）。横長の「棚の見出し板」風 ── */}
      <div className="filter-rail">
        <div className="search">
          <label className="visually-hidden" htmlFor="q">
            作品を検索（タイトル・読み・デザイナー・サークル）
          </label>
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="m20 20-3.2-3.2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
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

        <button
          type="button"
          className="filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls="filters"
          onClick={() => setFiltersOpen((v) => !v)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 6h18M6 12h12M10 18h4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          絞り込み{activeCount > 0 ? `（${activeCount}）` : ""}
        </button>
      </div>

      {/* 適用中の条件（ツールバー直下・常時表示。棚に貼られた付箋のように） */}
      {active.length > 0 && (
        <div className="active-filters" aria-label="適用中の絞り込み">
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

      {/* 絞り込みパネル（インラインで押し出し式に開く・棚を細分する「分類タブ」群） */}
      <div
        id="filters"
        className="filter-panel"
        data-open={filtersOpen}
        hidden={!filtersOpen}
      >
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

        <fieldset className="filter-group filter-group--tags">
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
      </div>

      {/* ── 陳列棚（結果） ── */}
      <section aria-label="作品一覧" className="shelves">
        <h2 className="visually-hidden">作品一覧</h2>

        <p className="result-count" aria-live="polite">
          <strong className="tabular">{filtered.length}</strong> 件
          {filtered.length !== games.length && (
            <span> / 全 {games.length} 件</span>
          )}
          {isFiltering ? " を陳列中" : "（種別ごとに陳列）"}
        </p>

        {filtered.length > 0 ? (
          shelves.map((shelf) => (
            <div className="shelf" key={shelf.key}>
              <div className="shelf-label">
                <span className="shelf-label-tab">{shelf.label}</span>
                <span className="shelf-label-count tabular">
                  {shelf.items.length}
                </span>
              </div>
              <div className="shelf-row">
                <ul className="box-rack">
                  {shelf.items.map((g) => (
                    <li key={g.id} className="box-slot">
                      <GameCard game={g} />
                    </li>
                  ))}
                </ul>
                {/* 棚板（shelf board）: 箱が乗る面。装飾なので aria 非対象。 */}
                <div className="shelf-board" aria-hidden="true" />
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <span className="card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="m20 20-3.2-3.2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <h3>棚に並ぶ作品が見つかりませんでした</h3>
            <p>検索語を短くするか、絞り込みを減らしてみてください。</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={clearAll}
              style={{ marginTop: "var(--sp-2)" }}
            >
              すべてクリア
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
