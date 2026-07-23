// ボドゲ図鑑 — robots.txt（静的書き出し）。
//
// ⚠️ 現構成ではこのファイルは効かない。robots.txt はオリジンのルート
// （https://ga-project.github.io/robots.txt）だけがクローラに読まれる仕様で、
// 本サイトはサブパス配信のため出力先が /bgzukan/robots.txt になる。つまり
// 下の Sitemap 行は誰にも届かず、sitemap の自動発見は起きない。
// **sitemap の周知は Search Console / Bing Webmaster への明示送信で行う**
// （手順は README の「検索エンジンへの登録」を参照）。
//
// それでも置いておくのは、独自ドメインに移してルート配信になった時点で
// そのまま効くようにするため。効かないものを効くように見せないためこの注記を残す。
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site.mjs";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("sitemap.xml"),
  };
}
