#!/usr/bin/env node
// 英語教科書ジェネレータ
// books/english/src/data/ (english-learning-textbooks リポジトリのデータ) から
// books/english/main.md を生成する。文法単元は Markdown のまま連結し、
// 単語データは JSON から表に変換する。
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "..", "books", "english", "src", "data");
const OUT = join(ROOT, "..", "books", "english", "main.md");

// ---- 文法単元 ----
const GRAMMAR_PARTS = [
  { part: "中学文法", dir: "junior/grammar" },
  { part: "高校文法", dir: "senior/grammar" },
];

// ---- 単語(出典デッキ) ----
const VOCAB_PARTS = [
  { part: "中学の単語", files: ["junior/words/jw-level1-core-100.json", "junior/words/jw-level2-jhs-100.json"], examples: true },
  { part: "高校の単語", files: ["senior/words/sw-level3-shs-core-80.json", "senior/words/sw-level4-academic-70.json"], examples: true },
  { part: "英検対策の単語", files: ["eiken/words/eik-lv4-80.json", "eiken/words/eik-lv3-80.json", "eiken/words/eik-pre2-70.json", "eiken/words/eik-lv2-70.json", "eiken/words/eik-pre1-80.json"], examples: false },
  { part: "共通テストの単語", files: ["common-test/words/ct-basic-150.json", "common-test/words/ct-academic-150.json", "common-test/words/ct-society-60.json", "common-test/words/ct-science-60.json"], examples: false },
  { part: "TOEIC の単語", files: ["toeic/words/tw-core-100.json", "toeic/words/tw-email-formula-150.json", "toeic/words/tw-industry-specific-160.json", "toeic/words/tw-part1-4-listening-150.json"], examples: false },
];

const out = [];

out.push(`# この教科書のために — 英語力の土台

この教科書は、中学英語から大学入試・TOEIC までをひと続きで学べるように構成した英語の教科書です。次の 3 つの柱でできています。

1. **文法**: 中学 18 単元 → 高校 14 単元の順に、英語の骨格を段階的に組み立てます。
2. **単語**: 中学 200 語・高校 150 語を例文つきで、さらに英検・共通テスト・TOEIC の試験別語彙を収録します。
3. **確認テスト**: 最終節の選択式クイズで理解を確かめます。

学習の進め方はシンプルです。文法の節を順に読み、例文を声に出して読む。その日のうちに対応する単語の節に目を通す。週に一度、確認テストに戻る。英語は「知っている」より「出せる」が大事なので、例文をそのまま使える形で覚えるのが最短ルートです。

各文法単元は、 english-learning-textbooks(オープンコンテンツ)の構造化データを元にしています。
`);

for (const g of GRAMMAR_PARTS) {
  out.push(`# ${g.part}`);
  for (const f of readdirSync(join(SRC, g.dir)).sort()) {
    const md = readFileSync(join(SRC, g.dir, f), "utf8");
    // フロントマターを落とし、本文中の h1(単元タイトル)をそのまま節として使う
    const body = md.replace(/^---[\s\S]*?---\s*/, "");
    out.push(body.trim());
  }
}

// 不規則動詞表・品詞早見表
out.push(`# 資料 — 不規則動詞表と品詞`);
for (const f of readdirSync(join(SRC, "junior/reference")).sort()) {
  const md = readFileSync(join(SRC, "junior/reference", f), "utf8").replace(/^---[\s\S]*?---\s*/, "");
  out.push(md.trim());
}

// 単語集
let wordTotal = 0;
for (const v of VOCAB_PARTS) {
  out.push(`# ${v.part}`);
  for (const rel of v.files) {
    const deck = JSON.parse(readFileSync(join(SRC, rel), "utf8"));
    const deckName = deck.meta?.description ?? rel;
    out.push(`## ${deckName}(${deck.words.length}語)`);
    const rows = [v.examples ? "| 英 | 意味 | 品詞 | 例文 |" : "| 英 | 意味 | 品詞 |",
      v.examples ? "| --- | --- | --- | --- |" : "| --- | --- | --- |"];
    for (const w of deck.words) {
      const pos = w.pos ?? "";
      if (v.examples) {
        const ex = `${w.ex_en ?? ""}${w.ex_ja ? `<br>${w.ex_ja}` : ""}`.replace(/\|/g, "\\|");
        rows.push(`| **${w.en}** | ${w.ja.replace(/\|/g, "\\|")} | ${pos} | ${ex} |`);
      } else {
        rows.push(`| **${w.en}** | ${w.ja.replace(/\|/g, "\\|")} | ${pos} |`);
      }
    }
    out.push(rows.join("\n"));
    wordTotal += deck.words.length;
  }
}

out.push(`# 学習の習慣化 — 復習の設計

単語と文法は、忘れることを前提に設計します。翌日・1週間後・1か月後の 3 回の復習(間隔反復)を基本サイクルにしてください。

- **翌日**: その日読んだ文法単元の例文を、日本語を見ながら英語に戻す
- **1週間後**: 単語表を隠しながら自力で意味を出す。出せなかった語に印をつける
- **1か月後**: 印のついた語だけをもう一周。確認テストで総点検する

1日 20〜30 分の継続が、週末のまとめ勉強より確実に効きます。この教科書の読書進捗と確認テストの記録はブラウザに保存されるので、習慣の目安にしてください。

(収録単語: 合計 ${wordTotal} 語 — 出典: english-learning-textbooks, CC ライセンスのオープンコンテンツ)
`);

writeFileSync(OUT, out.join("\n\n"));
console.log(`generated: books/english/main.md (${wordTotal} words, ${out.length} blocks)`);
