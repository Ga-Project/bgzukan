// ボドゲ図鑑 — 共有カードの HTML（tools/og/render.mjs が Chrome で撮る）。
//
// 構造コンセプトは本体と同じ「ゲーム棚」。作品カードは1箱を正面から見た体裁
// （左に種別色の背・上に種別を刷った天面・題字・スペック刻印・箱裏の中身表記）、
// サイトカードは題字の横に箱の背が並ぶ棚。色は app/theme.css の light 値に揃え、
// 刻印（破線の沈んだ面）と中身表記（角丸 7px の枠）も本体の部品に合わせる。
//
// 文字の下限: カードは SNS で約 1/2.4 に縮んで表示される。意味を運ぶ文字は
// 和文 28px（実効 ≈11.7px）以上、ラテン数字 26px 以上にする。
//
// 組版はページ内のスクリプト（LAYOUT_SCRIPT）が決め、収まらなければ
// body[data-fit="overflow"] と理由を data-overflow に残す。render.mjs はこれを読んで
// 失敗させる（見切れた・詰まったカードを黙って書き出さない）。

import { OG_HEIGHT, OG_WIDTH } from "../../lib/og.mjs";
import { OG_FONT } from "./cards.mjs";

/** @param {string} s */
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const TYPE_HUE = { 商業: 214, "同人・インディー": 12 };

/**
 * 種別の色相。未知の種別は既定色に落とさず止める（種別を足したら色も決める）。
 * @param {string} type
 */
function typeHue(type) {
  const hue = /** @type {Record<string, number>} */ (TYPE_HUE)[type];
  if (hue === undefined) throw new Error(`種別「${type}」の色が決まっていない`);
  return hue;
}

/** @param {string} type */
function typeClass(type) {
  return type === "同人・インディー" ? "doujin" : "commercial";
}

const BASE_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${OG_WIDTH}px;height:${OG_HEIGHT}px;overflow:hidden}
body{
  position:relative;
  font-family:"${OG_FONT}",sans-serif;
  color:hsl(30 18% 14%);
  background:hsl(34 38% 95%);
  -webkit-font-smoothing:antialiased;
}
.tab{font-variant-numeric:tabular-nums}
.foot{
  position:absolute;left:0;right:0;bottom:0;height:76px;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 56px;
  background:hsl(28 24% 84%);
  border-top:4px solid hsl(26 26% 72%);
}
.foot .name{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:900;letter-spacing:.02em}
.foot .url{font-size:26px;font-weight:600;color:hsl(30 14% 30%);letter-spacing:.01em}
.dice{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;
  background:linear-gradient(135deg,hsl(12 70% 43%),hsl(36 70% 51%))}
.dice svg{width:26px;height:26px}
`;

const DICE_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="#fff" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="#fff"/><circle cx="15.5" cy="15.5" r="1.6" fill="#fff"/><circle cx="12" cy="12" r="1.6" fill="#fff"/></svg>`;

const URL_TEXT = "ga-project.github.io/bgzukan";

// 組版スクリプト。作品カードとサイトカードで共用し、該当する要素が無い処理は飛ばす。
//
//  1. 題字: 行指定（.line）が無ければ語境界でだけ折り返す。語境界は Chrome 同梱の
//     ICU（Intl.Segmenter）で取り、連続するカタカナは1語に戻す（ICU は
//     「ニュー｜ヨーク」で切るため）。1行に収まるなら大きく（data-one）、
//     2行になるなら data-max から縮める。下限（data-min）でも入らなければ失敗。
//     折り返した行の先頭が助詞・句読点・長音なら失敗（行頭禁則）。
//  2. 読み: 題字と刻印の間が 24px 未満、または読みが1行に入らないなら消す
//     （優先順位が最下位の情報）。それでも 24px 未満なら失敗。
//  3. 中身表記: 先頭から順に入るものだけ残し、入らないものは飛ばして次を試す。
//     落とした数は「＋N」。「＋N」だけでも入らなければ失敗。
//  0. 書体: 指定の書体が無い環境では失敗する。
//  4. 境界: [data-bounds] の外にはみ出す要素・切り詰められた背の題字があれば失敗。
const LAYOUT_SCRIPT = `
<script>
(function(){
  var bad=[];
  // 指定の書体が無ければ止める（別書体で黙って描くと見た目も収まりも変わる）。
  // 総称書体だけのときと幅が変わるかで、書体が実際に使われているかを判定する。
  (function(){ var c=document.createElement('canvas').getContext('2d'), t='ボドゲ図鑑あいうABC123', used=false;
    ['monospace','serif'].forEach(function(g){ c.font='900 40px '+g; var a=c.measureText(t).width;
      c.font='900 40px "${OG_FONT}",'+g; if(c.measureText(t).width!==a) used=true; });
    if(!used) bad.push('font:${OG_FONT}'); })();
  var KATA=/[\\u30A0-\\u30FF]/;
  var el=document.getElementById('title');
  if(el && el.dataset.words==='1' && !el.querySelector('.line')){
    var text=el.textContent, words=[];
    for(var s of new Intl.Segmenter('ja',{granularity:'word'}).segment(text)){
      var w=s.segment, prev=words[words.length-1];
      // 連続するカタカナ（ICU は「ニュー｜ヨーク」で切る）と、直後のひらがなだけの短い
      // 区切り（助詞・助動詞相当: 「の」「を」「に」）と句読点は、直前の語にくっつける。
      if(prev && ((KATA.test(prev.slice(-1)) && KATA.test(w.charAt(0))) || /^[\u3041-\u3096]{1,2}$/.test(w) || /^[。、！？」）]+$/.test(w))) words[words.length-1]=prev+w;
      else words.push(w);
    }
    el.textContent='';
    words.forEach(function(w){ var sp=document.createElement('span'); sp.style.whiteSpace='nowrap'; sp.textContent=w; el.appendChild(sp); });
  }
  function lines(size){ return Math.round(el.scrollHeight/(size*1.18)); }
  function wide(){ return el.scrollWidth>el.clientWidth+1; }
  var size=0;
  if(el){
    var one=+el.dataset.one||0, max=+el.dataset.max, min=+el.dataset.min;
    var maxLines=el.querySelector('.line')?el.querySelectorAll('.line').length:2;
    var fitted=false;
    if(one){ for(size=one; size>=max; size-=4){ el.style.fontSize=size+'px'; if(!wide() && lines(size)===1){ fitted=true; break; } } }
    if(!fitted){ for(size=max; size>=min; size-=4){ el.style.fontSize=size+'px'; if(!wide() && lines(size)<=maxLines){ fitted=true; break; } } }
    if(!fitted){ size=min; el.style.fontSize=size+'px'; bad.push('title'); }
  }
  // 行頭禁則: 折り返した行が助詞・句読点・長音で始まっていないか（語の結合で防ぎ、ここで検出する）。
  var HEAD_NG=/^[のをにはがでとへもや。、！？ー）」]/;
  function lineHeads(box){ var heads=[], top=null;
    box.querySelectorAll('span').forEach(function(sp){ var t=sp.getBoundingClientRect().top;
      if(top!==null && t>top+2) heads.push(sp.textContent); top=t; });
    return heads; }
  var reading=document.querySelector('.reading'), row=document.querySelector('.row');
  function gap(){ var top=(reading&&reading.isConnected?reading:el).getBoundingClientRect().bottom; return row.getBoundingClientRect().top-top; }
  if(el && row){
    if(reading && (reading.scrollWidth>reading.clientWidth+1 || gap()<24)){ reading.remove(); reading=null; }
    while(gap()<24 && size>+el.dataset.min){ size-=4; el.style.fontSize=size+'px'; }
    if(gap()<24) bad.push('gap:'+Math.round(gap()));
  }
  var chips=document.querySelector('.chips');
  if(chips){
    var all=Array.prototype.slice.call(chips.children);
    // 先頭から入るものだけ拾う。more を渡すと、その幅を末尾に確保したうえで拾う。
    var pack=function(more){
      chips.textContent=''; if(more) chips.appendChild(more);
      var n=0;
      all.forEach(function(c){ chips.insertBefore(c, more||null); if(chips.scrollWidth>chips.clientWidth+1){ chips.removeChild(c); n++; } });
      return n;
    };
    var dropped=pack(null);
    if(dropped){
      var more=document.createElement('span'); more.className='chip more'; more.textContent='＋'+dropped;
      dropped=pack(more); more.textContent='＋'+dropped;
      if(!dropped) chips.removeChild(more);
    }
  }
  if(chips && chips.scrollWidth>chips.clientWidth+1) bad.push('chips');
  var sp=document.querySelectorAll('.sp span');
  for(var j=0;j<sp.length;j++){ if(sp[j].scrollHeight>sp[j].clientHeight+1) bad.push('spine:'+sp[j].textContent); }
  document.querySelectorAll('[data-bounds]').forEach(function(box){
    var r=box.getBoundingClientRect();
    box.querySelectorAll('*').forEach(function(k){ var b=k.getBoundingClientRect();
      if(b.width && (b.right>r.right+1 || b.bottom>r.bottom+1 || b.left<r.left-1)) bad.push((k.className||k.tagName)+':'+Math.round(b.right)+'x'+Math.round(b.bottom)); });
  });
  // 題字の最終的な級数で判定する（読みとの間隔の調整で縮めた後）。
  if(el) lineHeads(el).forEach(function(h){ if(HEAD_NG.test(h)) bad.push('line-head:'+h); });
  document.body.setAttribute('data-overflow', bad.join(' '));
  document.body.setAttribute('data-fit', bad.length ? 'overflow' : 'ok');
  document.body.setAttribute('data-title-size', String(size));
})();
</script>`;

/**
 * 作品カード。
 * @param {ReturnType<typeof import("./cards.mjs").gameCardFields>} f
 */
export function gameCardHtml(f) {
  const hue = typeHue(f.type);
  const tags = f.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join("");
  const year = f.year ? `<span class="year tab">${esc(f.year)}</span>` : "";
  const title =
    f.titleLines.length > 1
      ? f.titleLines.map((l) => `<span class="line">${esc(l)}</span>`).join("")
      : esc(f.title);
  const reading = f.reading ? `<p class="reading">${esc(f.reading)}</p>` : "";
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${BASE_CSS}
.box{position:absolute;left:56px;top:48px;right:56px;bottom:112px;
  background:#fffdf9;border-radius:14px;overflow:hidden;
  box-shadow:0 2px 0 hsl(26 26% 72%),0 14px 30px hsl(26 30% 30% / .16)}
.spine{position:absolute;left:0;top:0;bottom:0;width:30px;background:hsl(${hue} 55% 36%)}
.lid{position:absolute;left:30px;right:0;top:0;height:64px;display:flex;align-items:center;justify-content:space-between;
  padding:0 36px;background:hsl(${hue} 58% 42%);color:#fff}
.lid .type{font-size:30px;font-weight:800;letter-spacing:.08em}
.lid .year{font-size:28px;font-weight:700;opacity:.95}
.face{position:absolute;left:30px;right:0;top:64px;bottom:0;padding:0 44px 30px 48px;display:flex;flex-direction:column}
.head{flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0}
#title{font-weight:900;line-height:1.18;letter-spacing:.01em;line-break:strict;max-width:100%}
#title .line{display:block;white-space:nowrap}
.reading{margin-top:10px;font-size:28px;color:hsl(30 12% 38%);letter-spacing:.04em;white-space:nowrap;overflow:hidden}
.row{display:flex;align-items:center;gap:22px}
.spec{display:flex;align-items:center;background:hsl(34 30% 93%);border:3px dashed hsl(28 16% 62%);border-radius:7px;color:hsl(30 18% 18%)}
.spec span{display:flex;align-items:center;gap:10px;padding:10px 20px;font-size:34px;font-weight:800}
.spec span+span{border-left:3px dashed hsl(28 16% 62%)}
.spec svg{width:32px;height:32px;color:hsl(${hue} 58% 36%)}
.chips{display:flex;gap:12px;flex-wrap:nowrap;overflow:hidden;min-width:0;flex:1}
.chip{flex:none;font-size:28px;font-weight:700;padding:6px 16px;border-radius:7px;background:hsl(34 24% 94%);border:2px solid hsl(28 14% 80%);color:hsl(30 14% 30%);white-space:nowrap}
.chip.more{background:transparent;border-color:transparent;padding-left:4px}
</style></head><body class="${typeClass(f.type)}">
<div class="box" data-bounds>
  <div class="spine"></div>
  <div class="lid"><span class="type">${esc(f.type)}</span>${year}</div>
  <div class="face">
    <div class="head">
      <h1 id="title" data-one="124" data-max="92" data-min="56" data-words="1">${title}</h1>
      ${reading}
    </div>
    <div class="row">
      <div class="spec">
        <span><svg viewBox="0 0 24 24" fill="none"><path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm13 8v-1a4 4 0 0 0-3-3.87M16 4.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><b class="tab">${esc(f.players)}</b></span>
        <span><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3.5 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><b class="tab">${esc(f.time)}</b></span>
      </div>
      <div class="chips">${tags}</div>
    </div>
  </div>
</div>
<div class="foot"><span class="name"><span class="dice">${DICE_SVG}</span>ボドゲ図鑑</span><span class="url">${URL_TEXT}</span></div>
${LAYOUT_SCRIPT}
</body></html>`;
}

/**
 * サイトカード（トップ・このサイトについて・404）。
 * @param {ReturnType<typeof import("./cards.mjs").siteCardFields>} f
 */
export function siteCardHtml(f) {
  const spines = f.spines
    .map((s, i) => {
      const hue = typeHue(s.type);
      // 背の高さに揺らぎを付けて「並んだ箱」に見せる（値は決定的）。
      const h = [330, 300, 350, 312, 296, 338, 306][i % 7];
      // 短い欧文（ito 等）は横倒しにせず正立させる。
      const upright = /^[A-Za-z0-9]{1,4}$/.test(s.title) ? " upright" : "";
      return `<div class="sp" style="height:${h}px;background:hsl(${hue} 55% ${i % 2 ? 40 : 34}%)"><span class="${upright.trim()}">${esc(s.title)}</span></div>`;
    })
    .join("");
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>${BASE_CSS}
.left{position:absolute;left:64px;top:62px;width:560px;bottom:76px}
.kicker{font-size:28px;font-weight:700;color:hsl(12 64% 36%);letter-spacing:.12em;white-space:nowrap}
.site-title{margin-top:14px;font-size:104px;font-weight:900;line-height:1.05;letter-spacing:.02em;white-space:nowrap}
.lede{margin-top:22px;font-size:32px;line-height:1.5;font-weight:700;color:hsl(30 16% 22%)}
.lede span{display:block;white-space:nowrap}
.count{margin-top:26px;display:flex;gap:28px;font-size:28px;font-weight:700;color:hsl(30 14% 30%);white-space:nowrap}
.count b{font-size:44px;color:hsl(30 18% 14%);margin-right:6px}
.shelf{position:absolute;right:56px;bottom:76px;width:500px;height:400px;display:flex;align-items:flex-end;gap:10px;
  padding:0 18px;border-bottom:18px solid hsl(26 26% 62%)}
.sp{flex:1;border-radius:6px 6px 0 0;display:flex;justify-content:center;padding-top:18px;color:#fff;
  box-shadow:inset -6px 0 0 rgb(0 0 0 / .12)}
.sp span{writing-mode:vertical-rl;font-size:28px;font-weight:800;letter-spacing:.06em;white-space:nowrap;overflow:hidden;max-height:calc(100% - 28px)}
.sp span.upright{text-orientation:upright;letter-spacing:-.12em}
.foot{justify-content:flex-end}
</style></head><body>
<div class="left" data-bounds>
  <p class="kicker">国内ボードゲームの日本語カタログ</p>
  <h1 class="site-title">ボドゲ図鑑</h1>
  <p class="lede"><span>人数・プレイ時間・メカニクスで、</span><span>商業も同人も同じ棚から探せる。</span></p>
  <p class="count"><span><b class="tab">${f.count}</b>作品</span><span>うち同人・インディー<b class="tab" style="margin-left:8px">${f.doujin}</b></span></p>
</div>
<div class="shelf" aria-hidden="true">${spines}</div>
<div class="foot"><span class="url">${URL_TEXT}</span></div>
${LAYOUT_SCRIPT}
</body></html>`;
}
