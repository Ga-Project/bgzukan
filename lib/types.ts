// ボドゲ図鑑 — ドメイン型。data/games.json の1件と、検索/絞り込みの状態を表す。
// 純ロジックは lib/catalog.mjs（node:test で回帰）に置き、UI はこの型で受け渡す。

/** 数値レンジ（人数・プレイ時間の min/max）。単一値のときは min===max。 */
export interface Range {
  min: number;
  max: number;
}

/** 作品の種別。商業流通か、同人・インディー発か。 */
export type GameType = "商業" | "同人・インディー";

/** 入手先リンク1件（公式・通販。アフィリトラッキングは付けない）。 */
export interface Shop {
  name: string;
  url: string;
}

/** カタログ1作品。data/games.json の1要素に対応する。 */
export interface Game {
  /** 安定ID（URL に使う・半角英数とハイフン）。 */
  id: string;
  title: string;
  /** ひらがな読み（かな横断検索に使う）。 */
  reading: string;
  type: GameType;
  /** デザイナー。公表情報が無ければ null。 */
  designer: string | null;
  /** メーカー/サークル。公表情報が無ければ null。 */
  publisher: string | null;
  players: Range;
  /** プレイ時間（分）。 */
  time: Range;
  /** 推奨年齢の下限。不明は null。 */
  minAge: number | null;
  /** 発表年（日本版初版）。不明は null。 */
  year: number | null;
  /** 同人発の初出イベント（例: ゲームマーケット2018春）。該当なしは null。 */
  firstEvent: string | null;
  mechanics: string[];
  categories: string[];
  /** 自社執筆の紹介文（他サイト転載なし）。 */
  description: string;
  /** 公式URL。無ければ null。 */
  officialUrl: string | null;
  /** 事実の裏付けになった一次情報URL。 */
  sources: string[];
  shops: Shop[];
}

/** ファセット1件（名前と件数）。 */
export interface TagCount {
  name: string;
  count: number;
}

/** 絞り込み UI を組むためのファセット集合。 */
export interface Facets {
  types: TagCount[];
  players: number[];
  tags: TagCount[];
}

/** 検索/絞り込みの状態。 */
export interface Filters {
  query: string;
  players: number[];
  timeBuckets: string[];
  types: string[];
  tags: string[];
}
