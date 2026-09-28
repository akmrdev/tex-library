// チートシート集のコマンドクイズ(SQL・Git)
export default {
  decks: [
    {
      id: "sql-cmds",
      name: "SQL コマンドクイズ",
      cards: [
        {
          q: String.raw`重複する行を除いて結果を取得したい。使うキーワードは?`,
          choices: [
            String.raw`<code>SELECT DISTINCT</code>`,
            String.raw`<code>SELECT UNIQUE ROW</code>`,
            String.raw`<code>GROUP BY 1</code>`,
            String.raw`<code>DELETE DUPLICATE</code>`,
          ],
          answer: 0,
          explain: String.raw`SELECT の直後に DISTINCT を付ける。GROUP BY 全列でも似た効果があるが意図が読みにくい。`,
        },
        {
          q: String.raw`名前が「A」で始まる行を検索したい。正しい書き方は?`,
          choices: [
            String.raw`<code>WHERE name LIKE 'A%'</code>`,
            String.raw`<code>WHERE name = 'A*'</code>`,
            String.raw`<code>WHERE name MATCH 'A%'</code>`,
            String.raw`<code>WHERE name LIKE '%A'</code>`,
          ],
          answer: 0,
          explain: String.raw`LIKE の <code>%</code> は任意の文字列。<code>'A%'</code> は前方一致、<code>'%A'</code> は後方一致。`,
        },
        {
          q: String.raw`結果を先頭 5 行だけ取得したい。使う句は(SQLite/PostgreSQL)?`,
          choices: [
            String.raw`<code>LIMIT 5</code>`,
            String.raw`<code>TOP 5</code>`,
            String.raw`<code>FIRST 5</code>`,
            String.raw`<code>ROWNUM 5</code>`,
          ],
          answer: 0,
          explain: String.raw`LIMIT は標準的(TOP は SQL Server 固有)。ORDER BY のあとに評価されるので「並べた上位 5 件」が取れる。`,
        },
        {
          q: String.raw`集計列に別名を付けたい。使うキーワードは?`,
          choices: [
            String.raw`<code>AS</code>`,
            String.raw`<code>ALIAS</code>`,
            String.raw`<code>NAME</code>`,
            String.raw`<code>RENAME</code>`,
          ],
          answer: 0,
          explain: String.raw`<code>SUM(amount) AS total</code> の形。テーブルや列にも付けられる(結合の可読性向上に頻出)。`,
        },
        {
          q: String.raw`NULL を別の値に置き換えて表示したい。使う関数は?`,
          choices: [
            String.raw`<code>COALESCE(列, 0)</code>`,
            String.raw`<code>NULLIF(列, 0)</code>`,
            String.raw`<code>ISNULL(列)</code>`,
            String.raw`<code>NVL ONLY(列)</code>`,
          ],
          answer: 0,
          explain: String.raw`COALESCE は「最初に NULL でない引数を返す」。LEFT JOIN の合計を 0 円表示にする定番。`,
        },
        {
          q: String.raw`検索を高速化するための補助構造を作る文は?`,
          choices: [
            String.raw`<code>CREATE INDEX ... ON ...</code>`,
            String.raw`<code>CREATE TABLE ...</code>`,
            String.raw`<code>CREATE VIEW ...</code>`,
            String.raw`<code>CREATE SCHEMA ...</code>`,
          ],
          answer: 0,
          explain: String.raw`索引は木構造で行を直接引く。検索・JOIN に使う列に張る。書き込みがわずかに遅くなるトレードオフあり。`,
        },
        {
          q: String.raw`集計前の行に条件をつける句と、集計後のグループに条件をつける句の正しい組合せは?`,
          choices: [
            String.raw`WHERE →(集計前)/ HAVING →(集計後)`,
            String.raw`HAVING →(集計前)/ WHERE →(集計後)`,
            String.raw`どちらも WHERE だけで書ける`,
            String.raw`どちらも HAVING だけで書ける`,
          ],
          answer: 0,
          explain: String.raw`評価順序 FROM → WHERE → GROUP BY → HAVING。金額 &gt; 1000 は WHERE、合計 &gt;= 1000 は HAVING。`,
        },
        {
          q: String.raw`商品ごとの合計金額を知りたい。正しいクエリの骨格は?`,
          choices: [
            String.raw`<code>SELECT item, SUM(amount) FROM orders GROUP BY item</code>`,
            String.raw`<code>SELECT item, SUM(amount) FROM orders WHERE item = SUM(amount)</code>`,
            String.raw`<code>SUM(amount) FROM orders GROUP item</code>`,
            String.raw`<code>SELECT * FROM orders GROUP BY SUM(amount)</code>`,
          ],
          answer: 0,
          explain: String.raw`「グループ化する列を SELECT と GROUP BY の両方に書き、集計関数を SELECT に」が基本形。`,
        },
      ],
    },
    {
      id: "git-cmds",
      name: "Git コマンドクイズ",
      cards: [
        {
          q: String.raw`直前のコミットを修正し直したい(push 前)。使うコマンドは?`,
          choices: [
            String.raw`<code>git commit --amend</code>`,
            String.raw`<code>git revert HEAD</code>`,
            String.raw`<code>git reset --soft HEAD~2</code>`,
            String.raw`<code>git rebase -i</code>(必須)`,
          ],
          answer: 0,
          explain: String.raw`amend はメッセージやファイルの追加を含めて直前コミットを作り直す。push 済みのコミットには使わない。`,
        },
        {
          q: String.raw`push 済みのコミットを「履歴を壊さず」打ち消したい。使うコマンドは?`,
          choices: [
            String.raw`<code>git revert &lt;hash&gt;</code>`,
            String.raw`<code>git reset --hard &lt;hash&gt;</code>`,
            String.raw`<code>git push -f</code>`,
            String.raw`<code>git commit --amend</code>`,
          ],
          answer: 0,
          explain: String.raw`revert は「打ち消すコミットを新しく作る」。reset --hard + force push は他人がいるブランチでは禁止。`,
        },
        {
          q: String.raw`作業中の変更を一時的に退避して別の作業をしたい。使うコマンドは?`,
          choices: [
            String.raw`<code>git stash</code> → 復帰は <code>git stash pop</code>`,
            String.raw`<code>git save --temp</code>`,
            String.raw`<code>git commit --temp</code>`,
            String.raw`<code>git branch --park</code>`,
          ],
          answer: 0,
          explain: String.raw`stash はコミットしていない変更を退避する。退避リストは <code>git stash list</code> で確認できる。`,
        },
        {
          q: String.raw`ある行を「誰が・いつ」変更したか知りたい。使うコマンドは?`,
          choices: [
            String.raw`<code>git blame &lt;file&gt;</code>`,
            String.raw`<code>git log &lt;file&gt;</code>(だけ)`,
            String.raw`<code>git diff</code>`,
            String.raw`<code>git show HEAD</code>`,
          ],
          answer: 0,
          explain: String.raw`blame は行単位で最終変更コミットを表示。-L 10,20 で行範囲指定もできる。`,
        },
        {
          q: String.raw`「追加・削除された特定の文字列」でコミットを探したい。使うのは?`,
          choices: [
            String.raw`<code>git log -S "関数名"</code>(ピックアックス)`,
            String.raw`<code>git grep "関数名"</code>(履歴検索)`,
            String.raw`<code>git log --grep</code>(変更内容の検索)`,
            String.raw`<code>git find "関数名"</code>`,
          ],
          answer: 0,
          explain: String.raw`-S は「その文字列の出現数が変わったコミット」を探す。--grep はコミットメッセージの検索なので用途が違う。`,
        },
        {
          q: String.raw`git add した変更をステージから外したい(作業内容は残す)。使うのは?`,
          choices: [
            String.raw`<code>git restore --staged &lt;file&gt;</code>`,
            String.raw`<code>git restore &lt;file&gt;</code>`,
            String.raw`<code>git checkout --staged</code>`,
            String.raw`<code>git reset --hard</code>`,
          ],
          answer: 0,
          explain: String.raw`--staged 付きはステージングだけ取り消し(変更は残る)。付けない restore は作業内容ごと捨てるので注意。`,
        },
        {
          q: String.raw`新しいブランチを作って同時に切り替えたい。使うのは?`,
          choices: [
            String.raw`<code>git switch -c feature/x</code>`,
            String.raw`<code>git branch feature/x</code>(だけ)`,
            String.raw`<code>git merge feature/x</code>`,
            String.raw`<code>git push -u origin feature/x</code>(だけで十分)`,
          ],
          answer: 0,
          explain: String.raw`switch -c は作成+切替。branch は作るだけ、checkout -b は旧コマンド。`,
        },
        {
          q: String.raw`コンフリクトが起きたとき、マージ全体をやめたい。使うのは?`,
          choices: [
            String.raw`<code>git merge --abort</code>`,
            String.raw`<code>git reset --hard</code>(いきなり)`,
            String.raw`<code>git push -f</code>`,
            String.raw`<code>git commit -a</code>(衝突マーカーごと)`,
          ],
          answer: 0,
          explain: String.raw`merge --abort でマージ前の状態に戻る。解消するなら &lt;&lt;&lt;&lt;&lt;&lt;&lt; を手で直して add → commit が通常手順。`,
        },
      ],
    },
  ],
};
