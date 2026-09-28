// SQL・データベースのクイズ
export default {
  decks: [
    {
      id: "sql",
      name: "SQL 構文と設計クイズ",
      cards: [
        {
          q: String.raw`GROUP BY で集計したあとにグループへ条件をつける句は?`,
          choices: [
            String.raw`HAVING`,
            String.raw`WHERE`,
            String.raw`GROUP`,
            String.raw`ORDER BY`,
          ],
          answer: 0,
          explain: String.raw`評価順序は FROM → WHERE → GROUP BY → HAVING。WHERE は集計前の行の条件、HAVING は集計後の条件。`,
        },
        {
          q: String.raw`「一度も注文していないユーザー」を見つける定番パターンは?`,
          choices: [
            String.raw`LEFT JOIN して WHERE o.id IS NULL で判定`,
            String.raw`INNER JOIN して COUNT する`,
            String.raw`UNION で両テーブルを結合する`,
            String.raw`GROUP BY user_id だけ書く`,
          ],
          answer: 0,
          explain: String.raw`左外部結合なら注文のないユーザーも残り、右側が NULL で埋まる。NULL 判定で「結合できなかった行」を抽出する。`,
        },
        {
          q: String.raw`UPDATE 文で WHERE を書き忘れるとどうなる?`,
          choices: [
            String.raw`全行が更新される`,
            String.raw`エラーになる`,
            String.raw`先頭 1 行だけ更新される`,
            String.raw`何も起きない`,
          ],
          answer: 0,
          explain: String.raw`WHERE なしは「全行が対象」。先に同じ WHERE で SELECT して対象を確認してから更新するのが実務の作法。`,
        },
        {
          q: String.raw`NULL 値を比較する正しい書き方は?`,
          choices: [
            String.raw`IS NULL / IS NOT NULL`,
            String.raw`= NULL`,
            String.raw`== NULL`,
            String.raw`LIKE NULL`,
          ],
          answer: 0,
          explain: String.raw`NULL は「未知」を表すため = による比較は常に成立しない。初心者の定番バグ。`,
        },
        {
          q: String.raw`第 1 正規形(1NF)の要件は?`,
          choices: [
            String.raw`各セルに単一の値だけを入れる(繰り返し・カンマ区切りをなくす)`,
            String.raw`主キーを必ず 2 列にする`,
            String.raw`すべての列にインデックスを張る`,
            String.raw`テーブルを必ず 3 つ以上に分ける`,
          ],
          answer: 0,
          explain: String.raw`1NF は「1 セル 1 値」。カンマ区切りの items 列は検索も集計も不可能になるので、行を分けるか別テーブルにする。`,
        },
        {
          q: String.raw`トランザクションの「原子性」が保障するものは?`,
          choices: [
            String.raw`複数の変更が「全部成功するか、全く適用されないか」のどちらかになること`,
            String.raw`同時実行が互いに干渉しないこと`,
            String.raw`確定後のデータが停電でも残ること`,
            String.raw`制約違反がないこと`,
          ],
          answer: 0,
          explain: String.raw`ACID の A。COMMIT で確定、ROLLBACK で全取消。送金の「減らす+増やす」は片方だけ成功するとお金が消える。`,
        },
        {
          q: String.raw`インデックスを張ると速くなる操作は?`,
          choices: [
            String.raw`特定の列での検索・結合・ソート`,
            String.raw`INSERT の書き込み`,
            String.raw`全行の一括削除`,
            String.raw`テーブル作成`,
          ],
          answer: 0,
          explain: String.raw`索引(木構造)で行を直接引ける。代償として書き込みがわずかに遅くなり容量を消費する。LIKE '%o%' のような前方一致なし検索には効かない。`,
        },
        {
          q: String.raw`複雑なクエリに名前を付けて読みやすくする句は?`,
          choices: [
            String.raw`WITH(共通テーブル式 / CTE)`,
            String.raw`AS(だけ)`,
            String.raw`VIEW を必ず作る`,
            String.raw`JOIN`,
          ],
          answer: 0,
          explain: String.raw`WITH 名前 AS (SELECT ...) で一時的な名前付き結果を作る。副問い合わせのネストを避け、上から読めるクエリになる。`,
        },
      ],
    },
  ],
};
