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

## 検索エンジンへの登録

ビルドすると `sitemap.xml`（トップ・このサイトについて・全作品詳細）と `robots.txt` が
`out/` に生成される。ただし **`robots.txt` はクローラに読まれない**。robots.txt は
オリジンのルート（`https://ga-project.github.io/robots.txt`）だけが参照される仕様で、
本サイトはサブパス配信のため出力先が `/bgzukan/robots.txt` になるためである。
つまり **sitemap は置いただけでは発見されない**。

sitemap を実際にクロールへ載せるには、明示送信が要る（一度きり・費用なし）。

1. Google Search Console と Bing Webmaster Tools に、**URL プレフィックス**の
   プロパティとして `https://ga-project.github.io/bgzukan/` を追加する。
2. 所有権の確認は HTML ファイル法を使う。発行された検証ファイルを `public/` に置いて
   デプロイすると `https://ga-project.github.io/bgzukan/<検証ファイル>` で配信され、
   静的サイトのまま確認が通る。
3. sitemap として `https://ga-project.github.io/bgzukan/sitemap.xml` を送信する。

独自ドメインでルート配信に移した場合は、`robots.txt` がそのまま効くようになる。

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
│  ├─ games/[id]/page.tsx   # 作品詳細（generateStaticParams で全件を静的生成）＋関連作品
│  ├─ about/page.tsx        # このサイトについて（運営・収録基準）
│  ├─ not-found.tsx         # 404
│  ├─ layout.tsx            # メタ情報・アクセス計測タグ
│  ├─ sitemap.ts            # sitemap.xml を生成（トップ・about・全作品）
│  ├─ robots.ts             # robots.txt を生成（サブパス配信のため現構成では未到達）
│  ├─ globals.css           # 共通デザイン基盤（トークン・light/dark・a11y）
│  └─ theme.css             # 製品テーマ（配色・カタログ用コンポーネント）
├─ components/              # GameCard / CatalogClient / JsonLd
├─ lib/                     # types.ts / catalog.mjs / site.mjs（純ロジック）
├─ data/games.json          # 作品データ
└─ test/                    # node:test（データ整合・検索・関連作品・公開URL/構造化データ）
```

## ライセンス

MIT License — © 2026 株式会社Ga Project
