#!/usr/bin/env node
// TeX 図書館 ビルドスクリプト
// books/<slug>/main.tex を pandoc で HTML 断片に変換し、dist/ に静的サイトを生成する。
// - 数式はビルド時に KaTeX(vendor 同梱)で HTML にプリレンダリングする
// - 演習の解答は <details> に折りたたむ
// - tectonic が利用できる環境では各教科書の PDF も生成してリンクを付ける
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync, statSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const ROOT = dirname(fileURLToPath(import.meta.url));
const BOOKS_DIR = join(ROOT, "books");
const DIST = join(ROOT, "dist");
const SRC = join(ROOT, "src");
const req = createRequire(import.meta.url);
const katex = req(join(ROOT, "vendor/katex/katex.min.cjs"));

function runPandoc(texPath, format) {
  const r = spawnSync("pandoc", [
    "-f", format,
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

// ---------- 後処理パイプライン ----------

// 数式をビルド時に KaTeX で HTML 化(pandoc は \( \) 付き TeX を出力する)
function prerenderMath(body) {
  const decode = (s) => s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&");
  const render = (tex, displayMode) => {
    try {
      return katex.renderToString(tex, { throwOnError: false, displayMode });
    } catch (e) {
      console.warn(`KaTeX error: ${tex.slice(0, 40)}…\n${e.message}`);
      return `<code class="tex-error">${tex}</code>`;
    }
  };
  return body
    .replace(/<span class="math display">\\\[([\s\S]*?)\\\]<\/span>/g, (_, tex) => render(decode(tex), true))
    .replace(/<span class="math inline">\\\(([\s\S]*?)\\\)<\/span>/g, (_, tex) => render(decode(tex), false));
}

// 演習の解答(「解答の指針:」で始まる段落)を折りたたみに変換
function foldAnswers(body) {
  return body.replace(
    /<p><strong>解答の指針:<\/strong>([\s\S]*?)<\/p>/g,
    '<details class="answer"><summary>解答を表示</summary><div class="answer-body"><p><strong>解答の指針:</strong>$1</p></div></details>'
  );
}

// lstlisting の言語を highlight.js 形式に変換
function fixCodeLangs(body) {
  return body.replace(/<pre class="([^"]+)"([^>]*)><code>/g, (_, lang, rest) => `<pre${rest}><code class="language-${lang.toLowerCase()}">`);
}

// 図のパスを絶対パスに書き換え
function fixFigurePaths(body, slug) {
  return body.replace(/src="(?!\/|http)([^"]+)"/g, (m, p) => p.startsWith("figures/") ? `src="/book/${slug}/${p}"` : m);
}

// pandoc 出力を <h1> 単位でセクション分割し、節番号と TOC を組み立てる
function splitSections(body) {
  const parts = body.split(/(?=<h1\b)/).filter((p) => p.trim());
  const sections = [];
  parts.forEach((part, i) => {
    const idMatch = part.match(/<h1[^>]*\bid="([^"]+)"/);
    const titleMatch = part.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (!idMatch || !titleMatch) return;
    const subs = [];
    for (const m of part.matchAll(/<h2[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)) {
      subs.push({ id: m[1], title: stripTags(m[2]), num: `${i + 1}.${subs.length + 1}` });
    }
    sections.push({ id: idMatch[1], title: stripTags(titleMatch[1]), subs, num: i + 1 });
  });
  return { parts, sections };
}

// 見出しに節番号を差し込む
function numberHeadings(parts, sections) {
  return parts.map((part, i) => {
    const sec = sections[i];
    if (!sec) return part;
    let n = 0;
    return part
      .replace(/(<h1[^>]*>)/, `$1<span class="sec-num">${sec.num}</span>`)
      .replace(/(<h2[^>]*>)/g, (_, tag) => `${tag}<span class="sec-num">${sec.num}.${++n}</span>`);
  });
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, "").trim();
}

// ---------- PDF 生成(tectonic があれば) ----------

function tectonicAvailable() {
  return spawnSync("tectonic", ["--version"], { encoding: "utf8" }).status === 0;
}

// Web 用 HTML と PDF 用に TeX を前処理する共通変換
function texForPdf(tex, slug) {
  const preamble = `\\documentclass[a4paper,11pt]{article}
\\usepackage{amsmath,amssymb}
\\usepackage[margin=25mm]{geometry}
\\usepackage{xcolor}
\\usepackage{listings,graphicx}
\\usepackage{xeCJK}
\\IfFontExistsTF{Noto Serif CJK JP}{\\setCJKmainfont{Noto Serif CJK JP}}{\\setCJKmainfont{Hiragino Mincho ProN}}
\\IfFontExistsTF{Noto Sans CJK JP}{\\setCJKsansfont{Noto Sans CJK JP}}{\\setCJKsansfont{Hiragino Sans}}
\\lstdefinelanguage{TypeScript}{sensitive=true,morekeywords={function,const,let,type,interface,class,return,if,else,async,await,new,private,public,protected,readonly,extends,implements,constructor,throw,while,for,of,in,import,from,export,switch,case,break,number,string,boolean,void,never,unknown,Promise,Record},morecomment=[l]{//},morecomment=[s]{/*}{*/},morestring=[b]'}
\\lstdefinelanguage{JavaScript}{sensitive=true,morekeywords={function,return,const},morecomment=[l]{//},morestring=[b]'}
\\lstdefinelanguage{Python}{sensitive=true,morekeywords={def,return,import,from,for,in,if,else,elif,print,len,range,sum,float,int,round,lambda,with,open,as,mean,statistics,class,self,None,True,False,and,or,not,try,except,while,break,continue,raise,pass,yield},morecomment=[l]{\\#},morestring=[b]',morestring=[b]"}
\\lstdefinelanguage{SQL}{sensitive=false,morekeywords={SELECT,FROM,WHERE,GROUP,BY,ORDER,JOIN,LEFT,INNER,OUTER,ON,AS,AND,OR,NOT,NULL,IN,BETWEEN,LIKE,DISTINCT,LIMIT,HAVING,COUNT,SUM,AVG,MIN,MAX,INSERT,INTO,VALUES,UPDATE,SET,DELETE,CREATE,TABLE,INDEX,PRIMARY,KEY,FOREIGN,REFERENCES,ALTER,DROP,WITH,UNION,ALL,CASE,WHEN,THEN,ELSE,END,EXISTS,CHECK,DEFAULT},morecomment=[l]{--},morestring=[b]',morestring=[b]"}
\\lstset{basicstyle=\\ttfamily\\footnotesize,breaklines=true,frame=single,backgroundcolor=\\color{gray!8},columns=fullflexible}
\\setlength{\\parskip}{0.4em}
`;
  return tex
    .replace(/\\documentclass\{article\}/, preamble)
    // SVG は PDF に組めないので注記に置き換える
    .replace(/\\begin\{figure\}[\s\S]*?\\includegraphics\[[^\]]*\]\{([^}]+)\}[\s\S]*?\\caption\{([\s\S]*?)\}[\s\S]*?\\end\{figure\}/g,
      '\\begin{center}\\textit{※ 図(\\texttt{$1})は Web 版参照: $2}\\end{center}')
    .replace(/\\begin\{figure\}[\s\S]*?\\end\{figure\}/g, "");
}

function buildPdf(slug, outPath) {
  const tmp = mkdtempSync(join(tmpdir(), "texlib-pdf-"));
  writeFileSync(join(tmp, "book.tex"), texForPdf(readFileSync(join(BOOKS_DIR, slug, "main.tex"), "utf8")));
  const r = spawnSync("tectonic", ["-X", "compile", "book.tex"], { cwd: tmp, encoding: "utf8", timeout: 600000, maxBuffer: 32 * 1024 * 1024 });
  const pdf = join(tmp, "book.pdf");
  if (r.status !== 0 || !existsSync(pdf)) {
    console.warn(`PDF build failed for ${slug}:\n${(r.stderr || r.stdout || "").slice(-2000)}`);
    return false;
  }
  cpSync(pdf, outPath);
  return true;
}

// ---------- 本のビルド ----------

function buildBook(dir, wantPdf) {
  const slug = dir;
  const metaPath = join(BOOKS_DIR, dir, "book.json");
  if (!existsSync(metaPath)) {
    console.warn(`skip books/${dir}: book.json がありません`);
    return null;
  }
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  const srcFile = existsSync(join(BOOKS_DIR, dir, "main.tex")) ? "main.tex" : "main.md";
  const srcFormat = srcFile === "main.tex" ? "latex" : "markdown";
  const rawBody = runPandoc(join(BOOKS_DIR, dir, srcFile), srcFormat);
  let body = rawBody;
  body = fixCodeLangs(body);
  body = fixFigurePaths(body, slug);
  body = prerenderMath(body);
  body = foldAnswers(body);

  const { parts, sections } = splitSections(body);
  if (sections.length === 0) {
    console.error(`books/${dir}: \\section が 1 つも見つかりません`);
    process.exit(1);
  }

  const outDir = join(DIST, "book", slug);
  mkdirSync(outDir, { recursive: true });

  // 図があればコピー
  const figuresDir = join(BOOKS_DIR, dir, "figures");
  if (existsSync(figuresDir)) cpSync(figuresDir, join(outDir, "figures"), { recursive: true });

  // PDF(tex の本のみ、tectonic がある場合に生成)
  let hasPdf = false;
  if (wantPdf && srcFormat === "latex" && tectonicAvailable()) {
    hasPdf = buildPdf(slug, join(outDir, "book.pdf"));
    if (hasPdf) console.log(`built pdf: ${slug}`);
  }

  // 確認テスト(quiz.json があれば最後に追加)
  const quizPath = join(BOOKS_DIR, dir, "quiz.json");
  const quiz = existsSync(quizPath) ? JSON.parse(readFileSync(quizPath, "utf8")) : null;
  if (quiz) {
    sections.push({ id: "quiz", title: "確認テスト", subs: [], num: sections.length + 1 });
  }

  // フラッシュカード用の単語データ(src/data がある本のみ)
  const hasFlashcards = existsSync(join(BOOKS_DIR, dir, "src", "data"));

  // 横断検索用に生本文から節ごとのプレーンテキストを抽出
  const rawParts = rawBody.split(/(?=<h1\b)/).filter((p) => /<h1[^>]*\bid=/.test(p));
  const sectionsText = rawParts.map((p) => stripTags(p).replace(/\\\(|\\\)|\\\[|\\\]/g, " ").replace(/\s+/g, " ").trim());

  // セクションを包み、前後ナビを差し込む
  const numbered = numberHeadings(parts, sections);
  const htmlParts = [];
  numbered.forEach((part, i) => {
    const nav = [];
    if (i > 0) nav.push(`<a class="nav-prev" href="#${esc(sections[i - 1].id)}">← ${esc(sections[i - 1].num)}. ${esc(sections[i - 1].title)}</a>`);
    if (i < parts.length - 1) nav.push(`<a class="nav-next" href="#${esc(sections[i + 1].id)}">${esc(sections[i + 1].num)}. ${esc(sections[i + 1].title)} →</a>`);
    htmlParts.push(`<section class="sec" id="${esc(sections[i].id)}">\n${part}\n<nav class="sec-nav">${nav.join("")}</nav>\n</section>`);
  });
  if (quiz) {
    htmlParts.push(`<section class="sec" id="quiz">\n<h1 id="quiz"><span class="sec-num">${sections.length}</span>確認テスト</h1>\n<p>各教科書の内容を確認する全${quiz.length}問。選ぶと正否と解説が表示されます。</p>\n<div id="quiz-root"></div>\n</section>`);
  }
  const content = htmlParts.join("\n");
  const toc = sections.map(({ id, title, subs, num }) => ({ id, title, subs: subs.map(({ id: sid, title: st, num: sn }) => ({ id: sid, title: st, num: sn })), num }));

  const html = readerTemplate({ meta, toc, content, hasPdf, quiz, hasFlashcards });
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`built book: ${slug} (${sections.length} sections, ${(html.length / 1024).toFixed(0)} KB)`);

  if (hasFlashcards) buildFlashcards(dir, slug, meta);
  return {
    slug, title: meta.title, short: meta.short, desc: meta.desc,
    icon: meta.icon, hue: meta.hue, category: meta.category,
    tags: meta.tags ?? [],
    sections: sections.length,
    sectionsText,
    toc,
  };
}

// ---------- フラッシュカード ----------

function buildFlashcards(dir, slug, meta) {
  const dataDir = join(BOOKS_DIR, dir, "src", "data");
  const decks = [];
  for (const stage of readdirSync(dataDir).sort()) {
    const wordsDir = join(dataDir, stage, "words");
    if (!existsSync(wordsDir)) continue;
    for (const f of readdirSync(wordsDir).sort()) {
      if (!f.endsWith(".json")) continue;
      const deck = JSON.parse(readFileSync(join(wordsDir, f), "utf8"));
      const fallbackName = f.replace(/\.json$/, "").replace(/^[a-z]+-/, "").replace(/-/g, " ");
      decks.push({
        id: `${stage}-${f.replace(/\.json$/, "")}`,
        name: deck.meta?.description ?? fallbackName,
        words: (deck.words ?? []).map((w) => ({
          id: w.id ?? `${stage}-${f}-${w.en}`,
          en: w.en, ja: w.ja, ex_en: w.ex_en ?? "", ex_ja: w.ex_ja ?? "",
        })),
      });
    }
  }
  const total = decks.reduce((n, d) => n + d.words.length, 0);
  const outDir = join(DIST, "book", slug, "cards");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "decks.json"), JSON.stringify(decks));
  writeFileSync(
    join(outDir, "index.html"),
    cardsTemplate({ meta, decks: decks.length, total }),
  );
  console.log(`built flashcards: ${slug} (${decks.length} decks, ${total} words)`);
}

function cardsTemplate({ meta, decks, total }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>単語カード — ${esc(meta.title)}</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/app.css">
<style>
body.cards-page { background: var(--bg); min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 24px 16px 48px; font-family: var(--sans); }
.cards-head { width: 100%; max-width: 720px; display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.cards-head a { color: var(--ink-soft); text-decoration: none; font-size: .85rem; }
.cards-head h1 { font-size: 1.2rem; margin: 0; flex: 1; }
#deck-chips { display: flex; flex-wrap: wrap; gap: 8px; width: 100%; max-width: 720px; margin-bottom: 16px; }
.deck-chip { border: 1px solid var(--line); background: var(--paper); color: var(--ink); border-radius: 999px; padding: 5px 13px; font-size: .78rem; cursor: pointer; font-family: inherit; }
.deck-chip.active { background: hsl(45, 70%, 50%); border-color: hsl(45, 70%, 50%); color: #1a2233; font-weight: 600; }
#card-area { width: 100%; max-width: 720px; }
#progress-line { display: flex; justify-content: space-between; font-size: .8rem; color: var(--ink-soft); margin-bottom: 8px; }
#deck-bar { height: 6px; background: var(--line); border-radius: 999px; overflow: hidden; margin-bottom: 20px; }
#deck-bar div { height: 100%; width: 0; background: hsl(45, 70%, 50%); transition: width .25s; }
.card { background: var(--paper); border: 1px solid var(--line); border-radius: 18px; padding: 36px 24px 24px; text-align: center; cursor: pointer; user-select: none; display: flex; flex-direction: column; justify-content: center; gap: 14px; }
.card .en { font-size: 2.2rem; font-weight: 700; letter-spacing: .02em; }
.card .hint { font-size: .74rem; color: var(--ink-soft); }
#choices { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
#choices button {
  border: 1px solid var(--line); background: var(--paper); color: var(--ink);
  border-radius: 12px; padding: 14px 12px; font-size: .95rem; font-family: inherit; cursor: pointer;
  transition: background .12s, border-color .12s; text-align: center; line-height: 1.5;
}
#choices button:hover:not(:disabled) { border-color: hsl(45, 70%, 45%); background: hsl(45, 80%, 95%); }
html[data-theme="dark"] #choices button:hover:not(:disabled) { background: hsl(45, 40%, 20%); }
#choices button:disabled { cursor: default; opacity: .8; }
#choices button.correct { border-color: hsl(150, 55%, 42%); background: hsla(150, 55%, 42%, .15); font-weight: 600; opacity: 1; }
#choices button.wrong { border-color: hsl(0, 55%, 50%); background: hsla(0, 55%, 50%, .12); opacity: 1; }
#judge-msg { text-align: center; font-size: .9rem; margin-top: 12px; min-height: 1.4em; }
#judge-msg .ex { display: block; font-size: .8rem; color: var(--ink-soft); margin-top: 4px; line-height: 1.6; }
#judge-msg.good { color: hsl(150, 55%, 32%); }
html[data-theme="dark"] #judge-msg.good { color: hsl(150, 55%, 55%); }
#judge-msg.bad { color: hsl(0, 60%, 45%); }
html[data-theme="dark"] #judge-msg.bad { color: hsl(0, 70%, 65%); }
#filter-line { display: flex; gap: 8px; justify-content: center; margin-top: 18px; font-size: .8rem; }
#filter-line button { border: 1px solid var(--line); background: var(--paper); color: var(--ink-soft); border-radius: 999px; padding: 4px 14px; cursor: pointer; font-family: inherit; }
#filter-line button.active { color: var(--ink); border-color: var(--ink-soft); }
#tts-note { margin-top: 12px; font-size: .72rem; color: var(--ink-soft); }
#done-msg { display: none; width: 100%; max-width: 720px; text-align: center; padding: 60px 0; }
#done-msg .big { font-size: 2rem; margin-bottom: 8px; }
</style>
</head>
<body class="cards-page">
<div class="cards-head">
  <a href="/book/${esc(meta.slug)}/">← ${esc(meta.title)}</a>
  <h1>🎴 単語カード(全${total}語)</h1>
</div>
<div id="deck-chips"></div>
<div id="card-area">
  <div id="progress-line"><span id="pos-text"></span><span id="ok-text"></span></div>
  <div id="deck-bar"><div></div></div>
  <div class="card" id="card">
    <div class="en" id="card-en"></div>
    <div class="hint">正しい意味を選んでください(タップで再読み上げ)</div>
  </div>
  <div id="choices"></div>
  <div id="judge-msg"></div>
  <div id="filter-line">
    <button data-filter="all">すべて</button>
    <button data-filter="new" class="active">未学習</button>
    <button data-filter="again">要復習</button>
    <button id="btn-shuffle">シャッフル</button>
    <button id="btn-tts">🔊 発音 ON/OFF</button>
  </div>
  <div id="tts-note">単語はカード表示時に自動で読み上げます(発音 ON 時)</div>
</div>
<div id="done-msg"><div class="big">🎉</div><div id="done-text"></div></div>
<script src="/assets/flashcards.js"></script>
</body>
</html>`;
}


function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function baseHead(title, desc) {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="stylesheet" href="/vendor/katex/katex.min.css">
<link rel="stylesheet" href="/vendor/hljs/github.min.css" id="hl-light">
<link rel="stylesheet" href="/vendor/hljs/github-dark.min.css" id="hl-dark" disabled>
<link rel="stylesheet" href="/assets/app.css">
<meta name="theme-color" content="#1a2233">`;
}

function prefsToolbar() {
  return `<div class="prefs">
  <button data-pref="theme" aria-label="ダークモード切替">🌙</button>
  <button data-pref="font" aria-label="文字サイズ切替">A</button>
</div>`;
}

function readerTemplate({ meta, toc, content, hasPdf, quiz, hasFlashcards }) {
  const pdfLink = hasPdf ? `<a class="pdf-link" href="book.pdf" download>⬇️ PDF 版</a>` : "";
  const cardsLink = hasFlashcards ? `<a class="pdf-link" href="cards/">🎴 単語カード</a>` : "";
  return `<!DOCTYPE html>
<html lang="ja">
<head>
${baseHead(`${meta.title} — TeX 図書館`, meta.desc)}
</head>
<body class="reader" data-book="${esc(meta.slug)}">
<div id="toc-overlay"></div>
<aside id="toc">
  <a class="toc-back" href="/">📚 TeX 図書館</a>
  <h2 class="toc-book"><span class="toc-icon">${meta.icon}</span>${esc(meta.title)}</h2>
  ${pdfLink}
  ${cardsLink}
  <nav id="toc-nav"></nav>
  <div class="toc-progress"><div class="toc-progress-bar"><div id="toc-progress-fill"></div></div><span id="toc-progress-text"></span></div>
</aside>
<main id="content">
  <button id="toc-toggle" aria-label="目次を開く">☰</button>
  ${prefsToolbar()}
  <header class="book-header">
    <h1 class="book-title">${esc(meta.title)}</h1>
    <p class="book-desc">${esc(meta.desc)}${hasPdf ? ' <a class="pdf-inline" href="book.pdf" download>⬇️ PDF 版をダウンロード</a>' : ""}</p>
  </header>
  <div id="search-box"><input id="search-input" type="search" placeholder="本文を検索…" autocomplete="off"><div id="search-results"></div></div>
  <article id="book-body">${content}</article>
  <footer class="book-footer">
    <a href="/">📚 本棚に戻る</a>
  </footer>
</main>
<script id="toc-json" type="application/json">${JSON.stringify(toc)}</script>
${quiz ? `<script id="quiz-json" type="application/json">${JSON.stringify(quiz)}</script>` : ""}
<script src="/vendor/hljs/highlight.min.js"></script>
<script src="/assets/prefs.js"></script>
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
  <p>TeX で書かれた教科書をブラウザで読むライブラリ。数式は組み込み済み、読書進捗はこのブラウザに保存されます。</p>
  <div class="shelf-search">${prefsToolbar()}
    <input id="global-search" type="search" placeholder="すべての教科書を横断検索…" autocomplete="off">
    <div id="global-results"></div>
  </div>
</header>
<main id="shelf" class="shelf-grid"></main>
<footer class="shelf-footer">
  <div class="progress-io">
    <button id="progress-export">⬆️ 進捗を書き出す</button>
    <button id="progress-import">⬇️ 進捗を読み込む</button>
    <input id="progress-file" type="file" accept="application/json" hidden>
    <span id="progress-msg" role="status"></span>
  </div>
  <p>教科書を追加するには <code>books/</code> に TeX を置いてビルド — <a href="https://github.com/akmrdev/tex-library" rel="noopener">GitHub</a></p>
</footer>
<script id="books-json" type="application/json">${JSON.stringify(books.map(({ sectionsText, toc, ...b }) => b))}</script>
<script src="/assets/prefs.js"></script>
<script src="/assets/bookshelf.js"></script>
</body>
</html>`;
}

// ---------- メイン ----------

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const wantPdf = process.argv.includes("--pdf");
const bookDirs = readdirSync(BOOKS_DIR).filter((d) => statSync(join(BOOKS_DIR, d)).isDirectory()).sort();
const books = bookDirs.map((d) => buildBook(d, wantPdf)).filter(Boolean);
if (books.length === 0) {
  console.error("books/ に教科書がありません");
  process.exit(1);
}

writeFileSync(join(DIST, "index.html"), bookshelfTemplate(books.map(({ sectionsText, toc, ...b }) => b)));

// 横断検索索引(節ごとの本文テキスト)
const searchEntries = [];
for (const b of books) {
  const meta = JSON.parse(readFileSync(join(BOOKS_DIR, b.slug, "book.json"), "utf8"));
  b.toc.forEach((sec, i) => {
    searchEntries.push({
      slug: b.slug, icon: meta.icon, book: meta.title,
      id: sec.id, title: `${sec.num}. ${sec.title}`,
      text: b.sectionsText[i] ?? "",
    });
  });
}
writeFileSync(join(DIST, "search-index.json"), JSON.stringify(searchEntries));

for (const item of ["vendor", "assets"]) {
  cpSync(join(ROOT, item), join(DIST, item), { recursive: true });
}
for (const f of ["manifest.webmanifest", "icon.svg", "_headers"]) {
  cpSync(join(SRC, f), join(DIST, f));
}
// SW にバージョンを埋め込んでデプロイごとにキャッシュを更新させる
const version = Date.now().toString(36);
const sw = readFileSync(join(SRC, "sw.js"), "utf8").replace(/__BUILD_VERSION__/g, version);
writeFileSync(join(DIST, "sw.js"), sw);

// 整合性検証(アンカー・TOC・search-index・quiz)
const v = spawnSync(process.execPath, [join(ROOT, "tools", "validate.mjs")], { encoding: "utf8" });
console.log(v.stdout.trim());
if (v.status !== 0) {
  console.error(v.stderr.trim());
  process.exit(1);
}

console.log(`done: ${books.length} books → dist/ (sw v${version})`);
