# 📚 TeX 図書館

TeX で書かれた教科書をブラウザで読む図書館型 Web アプリ。

- **https://tex-library.pages.dev** — Cloudflare Pages で公開中

## しくみ

```
books/<slug>/main.tex ──pandoc──▶ HTML 断片(数式は \( \) のまま)
                              │
build.mjs ──▶ dist/ (本棚 + リーダー静的サイト)
```

- TeX は pandoc で HTML に変換される(コンパイラ不要、日本語 OK)
- 数式は TeX ソースのまま残し、ブラウザ側の KaTeX(vendored)で描画
- コードは highlight.js(vendored)でハイライト
- 読書進捗(読了節・最終位置)は localStorage に保存

## 教科書の追加・更新

1. `books/<slug>/` に `main.tex` と `book.json` を置く
2. `npm run build`(pandoc が必要)
3. main に push すると GitHub Actions が自動デプロイ

`main.tex` の書き方の目安:
- 標準の `\section` / `\subsection` がそのまま目次・章になる
- 数式は `$...$`, `\[...\]`, `equation*`, `align` など標準環境
- 定義・定理・例は `\begin{quote}` + `\textbf{【定義】…}` の形(ボックスで表示される)
- コードは `\begin{lstlisting}[language=TypeScript]` など
- `\label` / `\ref` による相互参照は非対応

## 開発

```sh
npm run build          # dist/ 生成
python3 -m http.server 8000 --directory dist   # ローカル確認
```

## デプロイ

GitHub Actions(`.github/workflows/deploy.yml`)が main push 時にビルドし、
`npx wrangler pages deploy dist --project-name=tex-library` で公開する。
リポジトリ Secrets に `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` が必要。
