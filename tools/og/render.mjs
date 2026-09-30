// ボドゲ図鑑 — 共有カードを public/og/ に書き出す（手元で実行し、成果物をコミットする）。
//
//   node tools/og/render.mjs            # 入力が変わったカードだけ描き直す
//   node tools/og/render.mjs --all      # 全カードを描き直す
//   CHROME=/path/to/chrome node tools/og/render.mjs
//
// 作品データ（data/games.json）かテンプレート（card-html.mjs）を変えたら実行する。
// 忘れると test/og.test.mjs が lib/og-manifest.mjs との食い違いで落ちる。
//
// 1枚ごとに Chrome を2回起動する: (1) --dump-dom で組版の判定を読む
// (2) --screenshot で撮る。収まらないカード（data-fit="overflow"）は書き出さずに失敗させる。
//
// 失敗しても作業ツリーを壊さない: 1枚ずつ一時ディレクトリで描き、描けたものだけ
// PNG と manifest のエントリを一緒に確定する。収まらない・Chrome が止まった等で
// 失敗したカードは PNG も manifest も元のまま。再実行すれば残りから続く。

import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
  mkdtempSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { OG_HEIGHT, OG_WIDTH } from "../../lib/og.mjs";
import manifest from "../../lib/og-manifest.mjs";
import { CHROME_FLAGS, expectedCards, inputHash, sha256 } from "./cards.mjs";
import { gameCardHtml, siteCardHtml } from "./card-html.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const publicDir = join(root, "public");
const ogDir = join(publicDir, "og");
const MANIFEST_PATH = join(root, "lib/og-manifest.mjs");
const games = JSON.parse(readFileSync(join(root, "data/games.json"), "utf8"));
const all = process.argv.includes("--all");

const CHROME =
  process.env.CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// 1回の起動と全体の両方に上限を置く。1回ごとの上限だけでは、枚数が増えたときの
// 総時間が有界にならない。
const CHROME_TIMEOUT_MS = 60_000;
const TOTAL_DEADLINE_MS = 15 * 60_000;
const deadline = Date.now() + TOTAL_DEADLINE_MS;

// 同じ作業ツリーで2本同時に描くと public/og と manifest の書き込みが競合するので排他する。
// 強制終了（kill -9）でロックが残った場合は、他に動いていないことを確かめて消す。
const LOCK_PATH = join(root, ".og-render.lock");
try {
  writeFileSync(LOCK_PATH, String(process.pid), { flag: "wx" });
} catch {
  console.error(`別の描画が動いている（${LOCK_PATH} がある）。動いていなければ消して再実行する`);
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), "bgzukan-og-"));

/** 起動中の Chrome のプロセスグループ（中断時に止める）。 */
const running = new Set();

/**
 * Chrome を1回起動して stdout を返す。上限を超えたらプロセスグループごと止める
 * （レンダラ等の子プロセスを残さない）。
 * --user-data-dir は渡さない: 渡すと出力後も終了しない。headless は既定で
 * 使い捨てのプロファイルを使う。
 * @param {string[]} args
 * @returns {Promise<string>}
 */
function chrome(args) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) return Promise.reject(new Error("全体の締め切りを超えた"));
  const limit = Math.min(CHROME_TIMEOUT_MS, remaining);
  return new Promise((resolve, reject) => {
    const child = spawn(
      CHROME,
      [...CHROME_FLAGS, ...args],
      { detached: true, stdio: ["ignore", "pipe", "ignore"] },
    );
    running.add(/** @type {number} */ (child.pid));
    let out = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (d) => (out += d));
    const timer = setTimeout(() => {
      try {
        process.kill(-(/** @type {number} */ (child.pid)), "SIGKILL");
      } catch {
        // 既に終了している
      }
      reject(new Error(`Chrome が ${limit}ms で終わらない`));
    }, limit);
    child.on("error", (e) => {
      clearTimeout(timer);
      running.delete(/** @type {number} */ (child.pid));
      reject(
        /** @type {NodeJS.ErrnoException} */ (e).code === "ENOENT"
          ? new Error(`Chrome が見つからない: ${CHROME}（CHROME=<実行ファイルのパス> で指定する）`)
          : e,
      );
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      running.delete(/** @type {number} */ (child.pid));
      if (code === 0) resolve(out);
      else reject(new Error(`Chrome が終了コード ${code} で終わった`));
    });
  });
}

/**
 * 1枚描いて PNG を返す（この時点では public/og/ に書かない）。
 * @param {string} relPath public/ からの相対パス
 * @param {string} html
 */
async function renderCard(relPath, html) {
  const base = join(work, relPath.replace(/[/.]/g, "_"));
  writeFileSync(`${base}.html`, html);
  const url = pathToFileURL(`${base}.html`).href;

  const dom = await chrome(["--dump-dom", url]);
  const fit = dom.match(/data-fit="([^"]+)"/)?.[1];
  if (fit !== "ok") {
    const where = dom.match(/data-overflow="([^"]*)"/)?.[1] ?? "";
    throw new Error(`${relPath}: カードに収まらない（data-fit=${fit ?? "未設定"} ${where}）`);
  }

  await chrome([`--screenshot=${base}.png`, url]);

  const png = readFileSync(`${base}.png`);
  const w = png.readUInt32BE(16);
  const h = png.readUInt32BE(20);
  if (w !== OG_WIDTH || h !== OG_HEIGHT) {
    throw new Error(`${relPath}: 寸法が ${w}x${h}（期待 ${OG_WIDTH}x${OG_HEIGHT}）`);
  }

  return png;
}

/**
 * 描いた PNG を public/og/ に置く。同じディレクトリ内の一時名に書いてから rename する
 * （途中で止まっても半端な PNG を残さない）。
 * @param {string} relPath
 * @param {Buffer} png
 */
function install(relPath, png) {
  const out = join(publicDir, relPath);
  mkdirSync(dirname(out), { recursive: true });
  const tmp = `${out}.tmp`;
  writeFileSync(tmp, png);
  renameSync(tmp, out);
}

/** @param {string} dir @returns {string[]} */
function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)],
  );
}

/**
 * manifest を書く（一時名に書いてから rename）。
 * @param {Record<string, {input: string, png: string}>} entries
 */
function writeManifest(entries) {
  const body = Object.keys(entries)
    .sort()
    .map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(entries[k])},`)
    .join("\n");
  const tmp = `${MANIFEST_PATH}.tmp`;
  writeFileSync(
    tmp,
    `// 自動生成（node tools/og/render.mjs）。手で編集しない。\n` +
      `// 共有カードごとの描画入力ハッシュ（input）と PNG の sha256（png）。\n` +
      `const manifest = {\n${body}\n};\n\nexport default manifest;\n`,
  );
  renameSync(tmp, MANIFEST_PATH);
}

/** 描画中の Chrome を止め、一時ディレクトリとロックを消す。 */
function cleanup() {
  for (const pid of running) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      // 既に終了している
    }
  }
  rmSync(work, { recursive: true, force: true });
  rmSync(LOCK_PATH, { force: true });
}

// 中断時は描画中の Chrome をグループごと止める（detached なので端末の Ctrl-C が届かず、
// シグナルで終了すると finally も走らない）。
for (const [sig, code] of /** @type {const} */ ([["SIGINT", 130], ["SIGTERM", 143]])) {
  process.on(sig, () => {
    cleanup();
    process.exit(code);
  });
}

try {
  const cards = expectedCards(games);
  // 描き終えた1枚ごとに PNG と manifest の該当エントリを一緒に確定する。
  // 途中で失敗・中断しても、確定済みのカードは PNG と manifest が一致しており、
  // 次の実行はまだ古いカードだけを描けばよい（件数が増えても再開で必ず終わる）。
  // 未処理のカードの manifest エントリは元のまま残す（手元の PNG と一致したまま）。
  const entries = { .../** @type {Record<string, {input: string, png: string}>} */ (manifest) };
  let drawn = 0;

  for (const { path, fields } of cards) {
    const input = inputHash(fields);
    const file = join(publicDir, path);
    const prev = entries[path];
    const upToDate =
      !all &&
      prev?.input === input &&
      existsSync(file) &&
      sha256(readFileSync(file)) === prev.png;
    if (upToDate) continue;
    const html = fields.kind === "site" ? siteCardHtml(fields) : gameCardHtml(fields);
    const png = await renderCard(path, html);
    install(path, png);
    entries[path] = { input, png: sha256(png) };
    writeManifest(entries);
    drawn++;
    process.stdout.write(".");
  }
  if (drawn) process.stdout.write("\n");

  // 収録から外れた作品のカード（と中断で残った一時ファイル）と、その manifest エントリを消す。
  const keep = new Set(cards.map((c) => join(publicDir, c.path)));
  const removed = listFiles(ogDir).filter((f) => !keep.has(f));
  for (const f of removed) rmSync(f);
  const paths = new Set(cards.map((c) => c.path));
  for (const k of Object.keys(entries)) if (!paths.has(k)) delete entries[k];
  writeManifest(entries);

  console.log(
    `描き直し ${drawn} 枚 / 全 ${cards.length} 枚` +
      (removed.length ? ` / 削除 ${removed.map((f) => relative(publicDir, f)).join(", ")}` : ""),
  );
} finally {
  cleanup();
}
