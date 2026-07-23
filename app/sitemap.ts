// ボドゲ図鑑 — sitemap.xml（静的書き出し）。
//
// 目録は「トップ1枚＋作品ごとの詳細」で成り立っているが、詳細は棚からの
// 内部リンクでしか辿れないため、収録作品を明示的に列挙して検索側に渡す。
// URL は lib/site.mjs の絶対 URL 生成に寄せる（サブパス配信のため）。
import type { MetadataRoute } from "next";
import gamesData from "@/data/games.json";
import type { Game } from "@/lib/types";
import { absoluteUrl, gameUrl } from "@/lib/site.mjs";

const games = gamesData as unknown as Game[];

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl(), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("about/"), changeFrequency: "yearly", priority: 0.3 },
    ...games.map((game) => ({
      url: gameUrl(game),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
