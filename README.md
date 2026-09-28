# 📚 TeX 図書館

TeX で書かれた教科書をブラウザで読む図書館型 Web アプリ。

- **https://tex-library.pages.dev** — Cloudflare Pages で公開中

## しくみ

```
books/<slug>/main.tex ──pandoc──▶ HTML 断片
                     ──tectonic─▶ PDF(任意)
                              │
build.mjs ──▶ dist/ (本棚 + リーダー静的サイト)
```

- TeX(`main.tex`)と Markdown(`main.md`)のどちらでも書ける(pandoc で変換、日本語 OK)
- 数式は**ビルド時に KaTeX(vendored)で HTML 化**されるため、実行時の数式描画なしで即表示(MathML も出力され読み上げ・コピーに対応)
- tectonic がある環境では `node build.mjs --pdf` で各教科書(tex の本のみ)の PDF も生成(XeCJK + Noto/Hiragino)
- コードは highlight.js(vendored)でハイライト
- 読書進捗(読了節・最終位置)は localStorage に保存

## 機能

- 本棚: 教科書カード・進捗率・「つづきから」
- **横断検索**: 本棚から全教科書の本文を一括検索(`dist/search-index.json` を生成)
- リーダー: 目次サイドバー(節番号・読了 ✓・**サブ節の開閉**)・スクロールスパイ・前後ナビ・書内検索・`←`/`→` キーでの節移動・`/` 検索・`t` 目次
- **確認テスト**: `books/<slug>/quiz.json` を置くと最終節に選択式クイズ(解説・スコア付き)
- **解答の折りたたみ**: 「解答の指針:」段落は自動で `<details>` になる
- **ダークモード + 文字サイズ**: 右上の 🌙 / A ボタン(設定は localStorage に保存)
- コードブロックのコピーボタン
- 進捗の JSON 書き出し / 読み込み(本棚フッター)
- 画面外の節は `content-visibility: auto` で描画をスキップし、長い本でもスクロールが軽い
- PWA(SW は HTML を network-first で取得するため、デプロイ後は常に最新が表示される)
- **ビルド時の整合性検証**(`tools/validate.mjs`): アンカーの飛び先・TOC・search-index・quiz.json を検査し、違反があればビルドが失敗する

## 教科書の追加・更新

1. `books/<slug>/` に `main.tex` と `book.json` を置く(Markdown なら `main.md`)
2. (任意) `quiz.json`(確認テスト)と `figures/*.svg`(図)を置く
3. `npm run build`(pandoc、PDF まで作るなら tectonic)
4. main に push すると GitHub Actions が自動デプロイ(CI では PDF も生成)

英語教科書(`books/english/`)だけは特殊で、`english-learning-textbooks` リポジトリの
データ(Markdown 単元 + JSON 単語)を `books/english/src/data/` に置き、
`node tools/gen-english-book.mjs` で `main.md` を生成する(元データ更新時にのみ再実行)。

`main.tex` の書き方の目安:
- 標準の `\section` / `\subsection` がそのまま節番号つきの目次・章になる
- 数式は `$...$`, `\[...\]`, `equation*`, `align` など標準環境
- 定義・定理・例は `\begin{quote}` + `\textbf{【定義】…}` の形(ボックスで表示される)
- コードは `\begin{lstlisting}[language=TypeScript]` など
- 解答は `\textbf{解答の指針:}` で始める段落として書く(自動で折りたたまれる)
- 図は `\begin{figure}\includegraphics[width=...]{figures/xxx.svg}\caption{...}\end{figure}`(PDF 版では「Web 版参照」注記に置き換わる)
- `\label` / `\ref` による相互参照は非対応

## 開発

```sh
node build.mjs           # dist/ 生成
node build.mjs --pdf     # tectonic で PDF も生成
python3 -m http.server 8000 --directory dist   # ローカル確認
```

## デプロイ

GitHub Actions(`.github/workflows/deploy.yml`)が main push 時にビルドし、
`npx wrangler pages deploy dist --project-name=tex-library` で公開する。
リポジトリ Secrets に `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` が必要。
