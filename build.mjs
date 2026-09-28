#!/usr/bin/env node
// TeX 図書館 ビルドスクリプト
// books/<slug>/main.tex を pandoc で HTML 断片に変換し、dist/ に静的サイトを生成する。
// 数式は \( \) / \[ \] の TeX ソースのまま残し、ブラウザ側 KaTeX (vendor/) で描画する。
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const BOOKS_DIR = join(ROOT, "books");
const DIST = join(ROOT, "dist");
const SRC = join(ROOT, "src");

function runPandoc(texPath) {
  const r = spawnSync("pandoc", [
    "-f", "latex",
    "-t", "html5",
    "--math-method=mathjax",
    "--no-highlight",
    "--top-level-division=section",
    "--wrap=none",
    texPath,
  ], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(`pandoc failed for ${texPath}:\n${r.stderr}`);
    process.exit(1);
  }
  return r.stdout;
}

// pandoc 出力を <h1> 単位でセクション分割し、TOC を組み立てる
function splitSections(body) {
  const parts = body.split(/(?=<h1\b)/).filter((p) => p.trim());
  const sections = [];
  for (const part of parts) {
    const idMatch = part.match(/<h1[^>]*\bid="([^"]+)"/);
    const titleMatch = part.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (!idMatch || !titleMatch) continue; // h1 以外で始まる断片(前付けなど)は先頭セクションに統合
    const subs = [];
    for (const m of part.matchAll(/<h2[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)) {
      subs.push({ id: m[1], title: stripTags(m[2]) });
    }
    sections.push({ id: idMatch[1], title: stripTags(titleMatch[1]), subs });
  }
  return sections;
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "").trim();
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildBook(dir) {
  const slug = dir;
  const metaPath = join(BOOKS_DIR, dir, "book.json");
  if (!existsSync(metaPath)) {
    console.warn(`skip books/${dir}: book.json がありません`);
    return null;
  }
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  const texPath = join(BOOKS_DIR, dir, "main.tex");
  let body = runPandoc(texPath);
  // lstlisting の言語を highlight.js 形式に変換 (<pre class="X"><code> → <code class="language-X">)
  body = body.replace(/<pre class="([^"]+)"([^>]*)><code>/g, (_, lang, rest) => `<pre${rest}><code class="language-${lang.toLowerCase()}">`);
  const sections = splitSections(body);
  if (sections.length === 0) {
    console.error(`books/${dir}: \\section が 1 つも見つかりません`);
    process.exit(1);
  }
  // セクションを <section> で包み、前後ナビを差し込む
  const wrapped = body.split(/(?=<h1\b)/).filter((p) => p.trim()).map((part, i, arr) => {
    const nav = [];
    if (i > 0) nav.push(`<a class="nav-prev" href="#${esc(sections[i - 1].id)}">← ${esc(sections[i - 1].title)}</a>`);
    if (i < arr.length - 1) nav.push(`<a class="nav-next" href="#${esc(sections[i + 1].id)}">${esc(sections[i + 1].title)} →</a>`);
    return `<section class="sec" id="${esc(sections[i]?.id ?? `sec-${i}`)}">\n${part}\n<nav class="sec-nav">${nav.join("")}</nav>\n</section>`;
  }).join("\n");

  const toc = sections.map(({ id, title, subs }) => ({ id, title, subs }));
  const html = readerTemplate({ meta, toc, content: wrapped });
  const outDir = join(DIST, "book", slug);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`built book: ${slug} (${sections.length} sections, ${(html.length / 1024).toFixed(0)} KB)`);
  return {
    slug, title: meta.title, short: meta.short, desc: meta.desc,
    icon: meta.icon, hue: meta.hue, category: meta.category,
    tags: meta.tags ?? [],
    sections: sections.length,
  };
}

// ---------- テンプレート ----------

function baseHead(title, desc) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/vendor/katex/katex.min.css">
<link rel="stylesheet" href="/vendor/hljs/github.min.css">
<link rel="stylesheet" href="/assets/app.css">
<meta name="theme-color" content="#1a2233">`;
}

function readerTemplate({ meta, toc, content }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
${baseHead(`${meta.title} — TeX 図書館`, meta.desc)}
</head>
<body class="reader" data-book="${esc(meta.slug)}">
<div id="toc-overlay"></div>
<aside id="toc">
  <a class="toc-back" href="/">📚 TeX 図書館</a>
  <h2 class="toc-book"><span class="toc-icon" style="--hue:${meta.hue}">${meta.icon}</span>${esc(meta.title)}</h2>
  <nav id="toc-nav"></nav>
  <div class="toc-progress"><div class="toc-progress-bar"><div id="toc-progress-fill"></div></div><span id="toc-progress-text"></span></div>
</aside>
<main id="content">
  <button id="toc-toggle" aria-label="目次を開く">☰</button>
  <header class="book-header">
    <h1 class="book-title">${esc(meta.title)}</h1>
    <p class="book-desc">${esc(meta.desc)}</p>
  </header>
  <div id="search-box"><input id="search-input" type="search" placeholder="本文を検索…" autocomplete="off"><div id="search-results"></div></div>
  <article id="book-body">${content}</article>
  <footer class="book-footer">
    <a href="/">📚 本棚に戻る</a>
  </footer>
</main>
<script id="toc-json" type="application/json">${JSON.stringify(toc)}</script>
<script src="/vendor/katex/katex.min.js"></script>
<script src="/vendor/katex/auto-render.min.js"></script>
<script src="/vendor/hljs/highlight.min.js"></script>
<script src="/assets/reader.js"></script>
</body>
</html>`;
}

function bookshelfTemplate(books) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
${baseHead("TeX 図書館 — TeX 教科書ライブラリ", "TeX で書かれた教科書をブラウザで読む図書館")}
</head>
<body class="shelf">
<header class="shelf-header">
  <h1>📚 TeX 図書館</h1>
  <p>TeX で書かれた教科書をブラウザで読むライブラリ。数式は KaTeX、読書進捗はこのブラウザに保存されます。</p>
</header>
<main id="shelf" class="shelf-grid"></main>
<footer class="shelf-footer">教科書を追加するには <code>books/</code> に TeX を置いてビルド — <a href="https://github.com/akmrdev/tex-library" rel="noopener">GitHub</a></footer>
<script id="books-json" type="application/json">${JSON.stringify(books)}</script>
<script src="/assets/bookshelf.js"></script>
</body>
</html>`;
}

// ---------- メイン ----------

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const bookDirs = readdirSync(BOOKS_DIR).filter((d) => statSync(join(BOOKS_DIR, d)).isDirectory()).sort();
const books = bookDirs.map(buildBook).filter(Boolean);
if (books.length === 0) {
  console.error("books/ に教科書がありません");
  process.exit(1);
}

writeFileSync(join(DIST, "index.html"), bookshelfTemplate(books));

for (const item of ["vendor", "assets"]) {
  cpSync(join(ROOT, item), join(DIST, item), { recursive: true });
}
for (const f of ["manifest.webmanifest", "sw.js", "icon.svg", "_headers"]) {
  cpSync(join(SRC, f), join(DIST, f));
}

console.log(`done: ${books.length} books → dist/`);
