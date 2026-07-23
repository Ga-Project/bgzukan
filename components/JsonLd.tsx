// 構造化データ（JSON-LD）を1つ埋める小物。
//
// dangerouslySetInnerHTML を使うのは、JSON-LD が「テキストとしての JSON」を
// script 要素の中身に置く仕様で、React に子要素として渡すとエスケープされて
// 壊れるため。値は自前データを JSON.stringify したものだけなので任意の HTML は
// 入らないが、JSON 内の "<" は "<" に置換して </script> の早期終了を塞ぐ。
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
