# このチートシート集のために

この本は「読む」ためではなく「引く」ための本です。本図書館の教科書を使っていて、書き方やコマンドがうろ覚えになったときに開く、1 枚リファレンスです。章が短いのは仕様です。

収録しているのは次の 3 枚です。

1. **数式記法(LaTeX / KaTeX)**: 図書館の教科書で使われている数式の書き方。自分でも数式を書いてみたいときに。
2. **SQL 構文**: SELECT・JOIN・集計・インデックスの定番パターン。
3. **Git コマンド**: 日常操作の 9 割をカバーするコマンド表。

# 数式記法(LaTeX / KaTeX)

本図書館の数式は KaTeX で描画されています。インライン数式は `$x^2$`、独立行の数式は `$$x^2$$` の形で書きます。よく使う記法の一覧です。

## 基本の形

| やりたいこと | 書き方 | 結果 |
| --- | --- | --- |
| 上付き・下付き | `x^2`, `a_1` | $x^2$, $a_1$ |
| 分数 | `\frac{a}{b}` | $\frac{a}{b}$ |
| 平方根 | `\sqrt{x}`, `\sqrt[3]{x}` | $\sqrt{x}$, $\sqrt[3]{x}$ |
| 総和 | `\sum_{k=1}^{n} a_k` | $\sum_{k=1}^{n} a_k$ |
| 積分 | `\int_0^1 f(x)\,dx` | $\int_0^1 f(x)\,dx$ |
| 極限 | `\lim_{x \to 0}` | $\lim_{x \to 0}$ |
| 積(二重) | `\iint_D f\,dA` | $\iint_D f\,dA$ |

## ギリシャ文字と記号

| 書き方 | 結果 | 書き方 | 結果 |
| --- | --- | --- | --- |
| `\alpha, \beta, \gamma` | $\alpha, \beta, \gamma$ | `\mu, \sigma` | $\mu, \sigma$ |
| `\lambda, \theta` | $\lambda, \theta$ | `\varepsilon, \delta` | $\varepsilon, \delta$ |
| `\pm, \times, \div` | $\pm, \times, \div$ | `\le, \ge, \ne` | $\le, \ge, \ne$ |
| `\in, \subset` | $\in, \subset$ | `\to, \Rightarrow` | $\to, \Rightarrow$ |
| `\infty` | $\infty$ | `\forall, \exists` | $\forall, \exists$ |
| `\mathbb{R}, \mathbb{N}` | $\mathbb{R}, \mathbb{N}$ | `\emptyset` | $\emptyset$ |

## 行列と多行の式

| やりたいこと | 書き方 |
| --- | --- |
| 行列 | `\begin{pmatrix} a & b \\ c & d \end{pmatrix}` → $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$ |
| 決定記号 | `\begin{vmatrix} a & b \\ c & d \end{vmatrix}` → $\begin{vmatrix} a & b \\ c & d \end{vmatrix}$ |
| 複数行の式(揃える) | `\begin{aligned} f(x) &= x + 1 \\ g(x) &= x + 2 \end{aligned}` → $\begin{aligned} f(x) &= x + 1 \\ g(x) &= x + 2 \end{aligned}$ |
| 場合分け | `\begin{cases} x & (x \ge 0) \\ -x & (x < 0) \end{cases}` → $\begin{cases} x & (x \ge 0) \\ -x & (x < 0) \end{cases}$ |

## 関数・演算子

| やりたいこと | 書き方 | 結果 |
| --- | --- | --- |
| 三角関数 | `\sin x, \cos x, \tan x` | $\sin x, \cos x, \tan x$ |
| 対数・指数 | `\log x, \ln x, e^x` | $\log x, \ln x, e^x$ |
| 絶対値・ノルム | `\|x\|`, `\|\boldsymbol{a}\|` | $\|x\|$ |
| ベクトル | `\boldsymbol{a}, \vec{v}` | $\boldsymbol{a}, \vec{v}$ |
| 二項係数 | `\binom{n}{k}` | $\binom{n}{k}$ |
| 転置 | `A^{\top}` | $A^{\top}$ |
| 勾配 | `\nabla f` | $\nabla f$ |
| 確率・期待値 | `P(A \mid B), E[X]` | $P(A \mid B), E[X]$ |

# SQL 構文

サンプルとして次の 2 テーブルを想定します。

```sql
-- users(ユーザー)          -- orders(注文)
-- id   name   age           -- id  user_id  amount  created_at
-- 1    Alice  31            -- 1   1        1200    2026-01-10
-- 2    Bob    25            -- 2   1         800    2026-02-01
-- 3    Carol  37            -- 3   2        2000    2026-02-15
```

## 基本の SELECT

```sql
SELECT * FROM users;                       -- 全列・全行
SELECT name, age FROM users WHERE age >= 30;
SELECT DISTINCT name FROM users;           -- 重複を除く
SELECT * FROM orders ORDER BY amount DESC LIMIT 5;
SELECT * FROM users WHERE name LIKE 'A%';  -- 前方一致
SELECT * FROM orders WHERE created_at BETWEEN '2026-01-01' AND '2026-01-31';
SELECT * FROM users WHERE age IN (25, 31) AND name IS NOT NULL;
```

## JOIN

```sql
-- 内部結合(両方に存在する行だけ)
SELECT u.name, o.amount
FROM users u
JOIN orders o ON o.user_id = u.id;

-- 左外部結合(注文がないユーザーも残す)
SELECT u.name, o.amount
FROM users u
LEFT JOIN orders o ON o.user_id = u.id;

-- 集計と JOIN の合わせ技(ユーザーごとの合計金額)
SELECT u.name, SUM(o.amount) AS total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.name
ORDER BY total DESC;
```

## 集計とグループ化

```sql
SELECT COUNT(*) FROM orders;                       -- 行数
SELECT AVG(amount), MIN(amount), MAX(amount) FROM orders;
SELECT user_id, SUM(amount) AS total
FROM orders
GROUP BY user_id
HAVING SUM(amount) >= 1000;                        -- 集計後の条件は HAVING
```

## 変更系

```sql
INSERT INTO users (id, name, age) VALUES (4, 'Dave', 28);
UPDATE users SET age = 29 WHERE name = 'Dave';
DELETE FROM orders WHERE amount = 0;
```

## 設計と性能

```sql
CREATE TABLE users (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL,
  age   INTEGER CHECK (age >= 0)
);
CREATE INDEX idx_orders_user ON orders(user_id);   -- JOIN/検索を速くする
-- NULL を許すか・DEFAULT を持たせるかは設計の要。
-- インデックスは「検索・JOIN に使う列」に張り、書き込みはわずかに遅くなる。
```

# Git コマンド

## 日常のサイクル

| やりたいこと | コマンド |
| --- | --- |
| 状態を確認 | `git status` |
| 変更を見る | `git diff` |
| 変更を記録 | `git add -A && git commit -m "メッセージ"` |
| 履歴を見る | `git log --oneline --graph` |
| リモートへ送る | `git push` |
| リモートを取り込む | `git pull --rebase` |

## ブランチ操作

| やりたいこと | コマンド |
| --- | --- |
| 作って切り替え | `git switch -c feature/x` |
| 切り替え | `git switch main` |
| 一覧 | `git branch -a` |
| マージ | `git merge feature/x` |
| リベース | `git rebase main` |
| 削除 | `git branch -d feature/x` |

## 取り消し系

| やりたいこと | コマンド | 備考 |
| --- | --- | --- |
| 直前のコミットをやり直し | `git commit --amend` | push 前限定 |
| ワークツリーの変更を捨てる | `git restore <file>` | |
| add の取り消し | `git restore --staged <file>` | |
| コミットを打ち消すコミット | `git revert <hash>` | 履歴を壊さない。push 済みはこちら |
| 過去へ戻る(履歴ごと) | `git reset --hard <hash>` | push 済みブランチでは原則禁止 |

## 過去を改変・探す

| やりたいこと | コマンド |
| --- | --- |
| 行単位で誰が変えたか | `git blame -L 10,20 <file>` |
| コミットを探す | `git log --oneline --grep="キーワード"` |
| 変更内容で探す | `git log -S "関数名"`(ピックアックス) |
| 一時退避 | `git stash` → `git stash pop` |
| 特定コミットだけ持ってくる | `git cherry-pick <hash>` |

## トラブル時の第一手

- コンフリクトしたら: `git status` で当該ファイルを確認 → `<<<<<<<` を手で解消 → `git add` → `git commit`。`git merge --abort` で中止もできる
- 誤 push したら: `git revert` で打ち消す(他人がいるブランチの `reset --hard` + force push は禁止)
- やらかしの履歴を辿る: `git reflog` で操作履歴を確認し、戻したい地点の hash に `git reset --hard`

# 学び方 — チートシートの使い方

引いたら、その場で 1 回手を動かして確かめるのが効果的な使い方です。SQL ならローカルの SQLite、Git なら練習用ディレクトリで試す。リファレンスは「覚えなくてよい」という安心材料であり、繰り返し引くうちに自然と定着します。
