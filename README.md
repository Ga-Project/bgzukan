# ボドゲ図鑑

国内のボードゲーム・同人タイトルを日本語で検索・絞り込みできるデータカタログ。

海外中心のデータベースでは見つけにくい国内の商業・同人・インディーのボードゲームを、
人数・プレイ時間・メカニクス・デザイナー・サークルといった切り口で構造化し、
ブラウザ内だけで横断検索できるようにする。Next.js（App Router）で静的サイトに
書き出し、GitHub Pages で配信する。

## 特徴

- **日本語で引ける**: タイトル・読み（かな）・デザイナー・サークルを横断検索（カナ表記ゆれを吸収）。
- **絞り込み**: 種別（商業／同人・インディー）・人数・プレイ時間・メカニクス／カテゴリで即時フィルタ。
- **一次情報ベース**: 各作品は公式・一次情報をもとに自社で構造化・執筆し、出典を併記する。

## 開発

```bash
./setup.sh        # pnpm install
pnpm dev          # http://localhost:3000（ホットリロード）
pnpm test         # node --test（データ整合 + 検索ロジックの回帰）
pnpm lint         # next lint
pnpm typecheck    # tsc --noEmit
```

## ビルド & プレビュー

```bash
pnpm build        # next build → out/ に静的 HTML/CSS/JS を生成
./run.sh serve    # out/ をビルドしてローカル配信（http://localhost:3000）
```

`out/` がそのまま配信物。`next start`（サーバ常駐）は使わない。

## データ

作品データは `data/games.json` にまとめている。1 件のスキーマと検索／絞り込みロジックは
`lib/types.ts` と `lib/catalog.mjs`（`test/` で回帰）に定義してある。収録は順次拡大していく。

掲載情報は公式・一次情報をもとに自社で構造化・執筆したもので、内容は変更される場合があり、
正確性を保証するものではない。掲載情報の修正・削除の依頼は、運営の株式会社Ga Project
（https://ga-project.net ）まで。

## 構成

```
bgzukan/
├─ app/
│  ├─ page.tsx              # トップ（カタログ）。データを埋め込み CatalogClient を描画
│  ├─ games/[id]/page.tsx   # 作品詳細（generateStaticParams で全件を静的生成）
│  ├─ not-found.tsx         # 404
│  ├─ layout.tsx            # メタ情報・アクセス計測タグ
│  ├─ globals.css           # 共通デザイン基盤（トークン・light/dark・a11y）
│  └─ theme.css             # 製品テーマ（配色・カタログ用コンポーネント）
├─ components/              # GameCard / CatalogClient
├─ lib/                     # types.ts / catalog.mjs（純ロジック）
├─ data/games.json          # 作品データ
└─ test/                    # node:test（データ整合・検索ロジック）
```

## ライセンス

MIT License — © 2026 株式会社Ga Project
