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
const VERSION = Date.now().toString(36);
const katex = req(join(ROOT, "vendor/katex/katex.min.cjs"));
// book.json に "rsvp": true の本のインデックス(dist/rsvp-books.json 用)
const rsvpBooks = [];

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

// ---------- RSVP 専用フォーマット(rsvp.txt) ----------

// HTML エンティティをデコード(数値参照 + 主要な名前付き参照)
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

// KaTeX が出力した <span class="katex…">…</span> をタグの対応を取りながら丸ごと削除する
// (RSVP は数式を読めないため、レンダリング結果も原文 TeX も含め取り除く)
function stripKatex(html) {
  let out = "", pos = 0;
  for (;;) {
    const start = html.indexOf('<span class="katex', pos);
    if (start === -1) return out + html.slice(pos);
    out += html.slice(pos, start);
    let depth = 0, i = start;
    const re = /<span\b[^>]*>|<\/span>/g;
    re.lastIndex = start;
    let m;
    while ((m = re.exec(html))) {
      depth += m[0][1] === "/" ? -1 : 1;
      i = m.index + m[0].length;
      if (depth === 0) break;
    }
    pos = i;
  }
}

// 本文 HTML から RSVP 用のプレーンテキストを抽出する。
// 仕様: スクリプト/ナビ/コード/数式は取り除き、ブロックの境目は空行に、
// 見出しは「N. タイトル」の 1 行に。段落は空行区切り・UTF-8 で書き出す。
function htmlToRsvpText(html) {
  let s = html;
  // 本文として読む価値のない(あるいは読めない)要素を取り除く
  s = s.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style\b[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<nav\b[\s\S]*?<\/nav>/gi, "");          // 節の前後ナビ
  s = s.replace(/<summary\b[\s\S]*?<\/summary>/gi, "");  // 「解答を表示」ラベル
  s = s.replace(/<pre\b[\s\S]*?<\/pre>/gi, "");          // コードブロック
  s = s.replace(/<code\b[\s\S]*?<\/code>/gi, "");        // インラインコード
  s = stripKatex(s);
  s = s.replace(/<span class="math (?:inline|display)">[\s\S]*?<\/span>/g, ""); // プリレンダ前の数式
  // 節番号は「1. 」形式に置き換えて見出しを読みやすく
  s = s.replace(/<span class="sec-num">([\s\S]*?)<\/span>/g, "$1. ");
  // ブロックの終わりを空行に、<br> は改行に
  s = s.replace(/<\/(p|h[1-6]|li|div|tr|blockquote|figcaption|section|table|ul|ol)>/gi, "\n\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  // 残りのタグはすべて除去
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  // 空白を整える: 行内の連続空白は 1 つに、3 つ以上の改行は空行 1 つに
  s = s.replace(/[ \t\u00a0]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return s + "\n";
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
\\lstdefinelanguage{bash}{sensitive=true,morekeywords={echo,cd,ls,grep,sed,awk,cut,sort,uniq,wc,head,tail,cat,mkdir,rm,cp,mv,chmod,chown,ssh,scp,curl,tar,docker,git,if,then,else,elif,fi,for,while,do,done,case,esac,exit,export,local,function,sudo,cron,crontab,ps,kill,jobs,fg,bg},morecomment=[l]{\\#},morestring=[b]',morestring=[b]"}
\\lstdefinelanguage{HTML}{sensitive=false,morekeywords={html,head,body,div,span,script,link,meta,title,h1,h2,p,button,input,ul,li,nav,main,aside,section,header,footer,table,tr,td,th,class,id,href,src,rel,charset,viewport},morestring=[b]"}
\\lstdefinelanguage{CSS}{sensitive=true,morekeywords={color,background,margin,padding,border,border-radius,display,flex,grid,position,width,height,font,font-size,font-weight,text-align,justify-content,align-items,gap,overflow,media,screen,max-width,hover,transition,box-shadow,opacity},morestring=[b]"}
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

  // フラッシュカード(cards.js の新規デッキ or src/data の単語データ)
  const hasFlashcards = existsSync(join(BOOKS_DIR, dir, "cards.js")) || existsSync(join(BOOKS_DIR, dir, "src", "data"));

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

  // RSVP 専用フォーマット: book.json に "rsvp": true の本は全文プレーンテキストを生成
  if (meta.rsvp) {
    writeFileSync(join(outDir, "rsvp.txt"), htmlToRsvpText(content), "utf8");
    rsvpBooks.push({
      slug, title: meta.title, short: meta.short, desc: meta.desc,
      icon: meta.icon, hue: meta.hue,
    });
    console.log(`built rsvp: ${slug} → rsvp.txt`);
  }

  const toc = sections.map(({ id, title, subs, num }) => ({ id, title, subs: subs.map(({ id: sid, title: st, num: sn }) => ({ id: sid, title: st, num: sn })), num }));

  const html = readerTemplate({ meta, toc, content, hasPdf, quiz, hasFlashcards });
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`built book: ${slug} (${sections.length} sections, ${(html.length / 1024).toFixed(0)} KB)`);

  if (hasFlashcards) buildFlashcards(dir, slug, meta, loadCardDecks(dir, slug));
  return {
    slug, title: meta.title, short: meta.short, desc: meta.desc,
    icon: meta.icon, hue: meta.hue, category: meta.category,
    rsvp: !!meta.rsvp,
    tags: meta.tags ?? [],
    sections: sections.length,
    sectionsText,
    toc,
  };
}

// ---------- フラッシュカード ----------

// カード原稿(cards.js)内の \( \) / \[ \] をビルド時に KaTeX で HTML 化する
function renderTexInString(s) {
  return s
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => katex.renderToString(tex, { throwOnError: false }))
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => katex.renderToString(tex, { throwOnError: false, displayMode: true }));
}

// books/<slug>/cards.js の新規デッキ(選択式)を読み込んで数式をレンダリングする
function loadCardDecks(dir, slug) {
  const cardsFile = join(BOOKS_DIR, dir, "cards.js");
  if (!existsSync(cardsFile)) return [];
  const mod = req(cardsFile);          // ESM default export / CJS 4e215bfe5fdc
  const raw = mod.default?.decks ?? mod.decks ?? [];
  return raw.map((deck, di) => ({
    id: deck.id ?? `deck-${di}`,
    name: deck.name,
    type: "choice",
    cards: deck.cards.map((card, ci) => ({
      id: `${slug}-${deck.id ?? di}-${ci}`,
      q: renderTexInString(card.q),
      choices: card.choices.map(renderTexInString),
      answer: card.answer,
      explain: renderTexInString(card.explain ?? ""),
    })),
  }));
}

function buildFlashcards(dir, slug, meta, extraDecks) {
  const dataDir = join(BOOKS_DIR, dir, "src", "data");
  const wordDecks = [];
  if (existsSync(dataDir)) {
    for (const stage of readdirSync(dataDir).sort()) {
      const wordsDir = join(dataDir, stage, "words");
      if (!existsSync(wordsDir)) continue;
      for (const f of readdirSync(wordsDir).sort()) {
        if (!f.endsWith(".json")) continue;
        const deck = JSON.parse(readFileSync(join(wordsDir, f), "utf8"));
        const fallbackName = f.replace(/\.json$/, "").replace(/^[a-z]+-/, "").replace(/-/g, " ");
        wordDecks.push({
          id: `${stage}-${f.replace(/\.json$/, "")}`,
          name: deck.meta?.description ?? fallbackName,
          type: "words",
          words: (deck.words ?? []).map((w) => ({
            id: w.id ?? `${stage}-${f}-${w.en}`,
            en: w.en, ja: w.ja, ex_en: w.ex_en ?? "", ex_ja: w.ex_ja ?? "",
          })),
        });
      }
    }
  }
  const decks = [...(extraDecks ?? []), ...wordDecks];
  const total = decks.reduce((n, d) => n + (d.words?.length ?? d.cards?.length ?? 0), 0);
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
<title>学習カード — ${esc(meta.title)}</title>
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/app.css">
<link rel="stylesheet" href="/vendor/katex/katex.min.css">
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
#btn-next {
  display: none; margin: 14px auto 0; border: 1px solid hsl(45, 70%, 45%);
  background: hsl(45, 80%, 92%); color: hsl(35, 70%, 30%); border-radius: 999px;
  padding: 9px 34px; font-size: .95rem; font-family: inherit; cursor: pointer;
}
html[data-theme="dark"] #btn-next { background: hsl(45, 45%, 22%); color: hsl(45, 80%, 75%); }
#btn-next.show { display: block; }
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
  <h1>🎴 学習カード(全${total}問)</h1>
</div>
<div id="deck-chips"></div>
<div id="card-area">
  <div id="progress-line"><span id="pos-text"></span><span id="ok-text"></span></div>
  <div id="deck-bar"><div></div></div>
  <div class="card" id="card">
    <div class="en" id="card-en"></div>
    <div class="hint">正しいものを選んでください(カードのタップで再読み上げ)</div>
  </div>
  <div id="choices"></div>
  <div id="judge-msg"></div>
  <button id="btn-next" type="button">次へ →</button>
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
<script src="/assets/flashcards.js?v=${VERSION}"></script>
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
  const cardsLink = hasFlashcards ? `<a class="pdf-link" href="cards/">🎴 学習カード</a>` : "";
  const rsvpLink = meta.rsvp ? `<a class="pdf-link" href="/rsvp/?book=${esc(meta.slug)}">⚡ 速読で読む</a>
  <a class="pdf-link" href="/tts/?book=${esc(meta.slug)}">🔊 読み上げで聴く</a>` : "";
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
  ${rsvpLink}
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
<script src="/assets/prefs.js?v=${VERSION}"></script>
<script src="/assets/reader.js?v=${VERSION}"></script>
</body>
</html>`;
}

function bookshelfTemplate(books) {
  const total = books.length;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
${baseHead("TeX 図書館 — TeX 教科書ライブラリ", "TeX で書かれた教科書をブラウザで読む図書館")}
</head>
<body class="shelf">
<header class="shelf-header">
  <h1>📚 TeX 図書館</h1>
  <p>TeX で書かれた教科書をブラウザで読むライブラリ。数式は組み込み済み、読書進捗はこのブラウザに保存されます。収録 ${total} 冊。</p>
  <div class="shelf-search">${prefsToolbar()}
    <a class="shelf-rsvp" href="/rsvp/">⚡ 速読</a>
    <a class="shelf-rsvp" href="/tts/">🔊 読み上げ</a>
    <input id="global-search" type="search" placeholder="すべての教科書を横断検索…" autocomplete="off">
    <div id="global-results"></div>
  </div>
  <details class="shelf-paths">
    <summary>🗺️ 何から読む? — 学習パス</summary>
    <div class="path-list">
      <div class="path"><b>数学を学び直す</b><span>中学数学 → 高校数学 → 大学数学 → 線形代数 応用編</span></div>
      <div class="path"><b>データを読めるようになる</b><span>統計学入門 → ベイズ統計入門 → 時系列分析入門 → 機械学習入門</span></div>
      <div class="path"><b>投資の土台を築く</b><span>ファイナンス基礎 → 投資の数学 → 株式投資の基礎 → テクニカル分析入門</span></div>
      <div class="path"><b>プログラミングを始める</b><span>Web フロントエンド入門 → Python 入門 → TypeScript 入門 → アルゴリズムとデータ構造</span></div>
      <div class="path"><b>理科・語学を学び直す</b><span>高校化学やり直し → 高校物理やり直し → 英語教科書</span></div>
      <div class="path"><b>思考と文章を鍛える</b><span>論理の組み立て方 → 文章の技術 → 名スピーチ講義</span></div>
    </div>
  </details>
  <div class="shelf-filters" id="shelf-filters" role="tablist"></div>
</header>
<main id="shelf"></main>
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
<script src="/assets/prefs.js?v=${VERSION}"></script>
<script src="/assets/bookshelf.js?v=${VERSION}"></script>
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

// RSVP 専用フォーマット: 本の一覧と RSVP ページ(dist/rsvp/)
writeFileSync(join(DIST, "rsvp-books.json"), JSON.stringify(rsvpBooks, null, 2));
mkdirSync(join(DIST, "rsvp"), { recursive: true });
cpSync(join(SRC, "rsvp", "index.html"), join(DIST, "rsvp", "index.html"));
mkdirSync(join(DIST, "tts"), { recursive: true });
cpSync(join(SRC, "tts", "index.html"), join(DIST, "tts", "index.html"));
if (rsvpBooks.length) console.log(`built rsvp page: dist/rsvp/index.html (${rsvpBooks.length} books)`);
else console.log("built rsvp page: dist/rsvp/index.html (rsvp 本なし — index のみ)");

for (const item of ["vendor", "assets"]) {
  cpSync(join(ROOT, item), join(DIST, item), { recursive: true });
}
for (const f of ["manifest.webmanifest", "icon.svg", "_headers"]) {
  cpSync(join(SRC, f), join(DIST, f));
}
// SW にバージョンを埋め込んでデプロイごとにキャッシュを更新させる
const version = VERSION;
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
