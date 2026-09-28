#!/usr/bin/env node
// ビルド成果物の整合性チェック。違反があれば process.exit(1)。
// - 記事内アンカー(href="#...")がすべて実在する ID に向いているか
// - 本棚の ?resume= 飛び先が実在するか
// - search-index.json の (slug, id) が各本の TOC と一致するか
// - quiz.json の answer 番号が選択肢の範囲内か
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const BOOKS = join(ROOT, "books");
const errors = [];

function check(cond, message) {
  if (!cond) errors.push(message);
}

// ---- dist の必須ファイル ----
for (const f of ["index.html", "sw.js", "manifest.webmanifest", "icon.svg", "search-index.json"]) {
  check(existsSync(join(DIST, f)), `dist/${f} がありません`);
}
for (const f of ["app.css", "reader.js", "bookshelf.js", "prefs.js"]) {
  check(existsSync(join(DIST, "assets", f)), `dist/assets/${f} がありません`);
}

// ---- 各本の HTML ----
const tocBySlug = {};
if (existsSync(join(DIST, "book"))) {
  for (const slug of readdirSync(join(DIST, "book"))) {
    const file = join(DIST, "book", slug, "index.html");
    check(existsSync(file), `dist/book/${slug}/index.html がありません`);
    if (!existsSync(file)) continue;
    const html = readFileSync(file, "utf8");

    const m = html.match(/<script id="toc-json" type="application\/json">([\s\S]*?)<\/script>/);
    check(m, `book/${slug}: toc-json がありません`);
    if (!m) continue;
    const toc = JSON.parse(m[1]);
    tocBySlug[slug] = toc;

    // ID の重複チェック(section ラッパーと対応する h1 が同じ ID を共有するのは仕様なので 1 つ分だけ数える)
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((x) => x[1]);
    for (const sid of [...html.matchAll(/<section class="sec" id="([^"]+)"/g)].map((x) => x[1])) {
      const i = ids.indexOf(sid);
      if (i !== -1) ids.splice(i, 1);
    }
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    check(dup.length === 0, `book/${slug}: ID が重複しています: ${[...new Set(dup)].join(", ")}`);
    const idSet = new Set(ids);

    // 記事内アンカーの飛び先
    const body = html.match(/<article id="book-body">([\s\S]*?)<\/article>/)?.[1] ?? "";
    for (const a of body.matchAll(/href="#([^"]+)"/g)) {
      check(idSet.has(a[1]), `book/${slug}: アンカー #${a[1]} の飛び先が存在しません`);
    }
    // TOC の飛び先
    for (const sec of toc) {
      check(idSet.has(sec.id), `book/${slug}: TOC の ${sec.id} が本文にありません`);
      for (const sub of sec.subs) {
        check(idSet.has(sub.id), `book/${slug}: TOC のサブ ${sub.id} が本文にありません`);
      }
    }
    // 節番号の連続性
    toc.forEach((sec, i) => {
      check(sec.num === i + 1, `book/${slug}: 節番号が不連続 (${sec.num} at index ${i})`);
    });
  }
}

// ---- 本棚の ?resume= リンク ----
const shelfHtml = existsSync(join(DIST, "index.html")) ? readFileSync(join(DIST, "index.html"), "utf8") : "";
{
  const m = shelfHtml.match(/<script id="books-json" type="application\/json">([\s\S]*?)<\/script>/);
  check(m, "本棚に books-json がありません");
  if (m) {
    const books = JSON.parse(m[1]);
    for (const b of books) {
      check(tocBySlug[b.slug], `本棚の本 ${b.slug} の HTML がありません`);
      check(existsSync(join(BOOKS, b.slug)), `books/${b.slug} がありません`);
    }
    for (const hit of shelfHtml.matchAll(/\/book\/([a-z0-9-]+)\/\?resume=([^"&]+)/g)) {
      const [, slug, id] = hit;
      const toc = tocBySlug[slug];
      check(toc && toc.some((s) => s.id === id), `本棚の resume 先 ${slug}#${id} が存在しません`);
    }
  }
}

// ---- search-index.json ----
if (existsSync(join(DIST, "search-index.json"))) {
  const index = JSON.parse(readFileSync(join(DIST, "search-index.json"), "utf8"));
  for (const e of index) {
    const toc = tocBySlug[e.slug];
    check(toc, `search-index に未知の本 ${e.slug} があります`);
    if (toc) check(toc.some((s) => s.id === e.id), `search-index の ${e.slug}#${e.id} が TOC にありません`);
    check(typeof e.text === "string", `search-index の ${e.slug}#${e.id} にテキストがありません`);
  }
}

// ---- cards.js(学習カードデッキ) ----
if (existsSync(BOOKS)) {
  for (const slug of readdirSync(BOOKS)) {
    const cfile = join(BOOKS, slug, "cards.js");
    if (!existsSync(cfile)) continue;
    const { createRequire } = await import("node:module");
    const mod = createRequire(import.meta.url)(cfile);
    const decks = mod.default?.decks ?? mod.decks ?? [];
    decks.forEach((deck, di) => {
      check(Array.isArray(deck.cards) && deck.cards.length >= 3, `books/${slug}/cards.js deck${di + 1}(${deck.name}): カードが少なすぎます`);
      deck.cards.forEach((card, ci) => {
        check(Array.isArray(card.choices) && card.choices.length >= 3, `books/${slug}/cards.js ${deck.id} Q${ci + 1}: 選択肢が3未満`);
        check(Number.isInteger(card.answer) && card.answer >= 0 && card.answer < (card.choices?.length ?? 0),
          `books/${slug}/cards.js ${deck.id} Q${ci + 1}: answer が範囲外`);
        check(typeof card.q === "string" && card.q.length > 0, `books/${slug}/cards.js ${deck.id} Q${ci + 1}: 問題文がない`);
      });
    });
  }
}

// ---- quiz.json ----
if (existsSync(BOOKS)) {
  for (const slug of readdirSync(BOOKS)) {
    const qfile = join(BOOKS, slug, "quiz.json");
    if (!existsSync(qfile)) continue;
    const quiz = JSON.parse(readFileSync(qfile, "utf8"));
    check(Array.isArray(quiz) && quiz.length > 0, `books/${slug}/quiz.json が空です`);
    quiz.forEach((item, i) => {
      check(Array.isArray(item.choices) && item.choices.length >= 2, `books/${slug}/quiz.json Q${i + 1}: 選択肢が不正`);
      check(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < (item.choices?.length ?? 0),
        `books/${slug}/quiz.json Q${i + 1}: answer 番号が範囲外`);
      check(typeof item.explain === "string" && item.explain.length > 0, `books/${slug}/quiz.json Q${i + 1}: 解説がない`);
    });
  }
}

if (errors.length) {
  console.error(`検証に失敗しました (${errors.length} 件):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("検証 OK: アンカー・TOC・search-index・quiz すべて整合しています");
