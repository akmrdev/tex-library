export default {
  decks: [
    {
      id: "lab",
      name: "実習の要点",
      cards: [
        {
          q: "SQLite の対話シェルを開くコマンドは?",
          choices: ["sqlite3 shop.db", "sql shop.db", "db3 open shop.db", "sqlite --shell"],
          answer: 0,
          explain: "ファイルが無ければ新規作成。.headers on / .mode column も覚えよう。",
        },
        {
          q: "テーブル定義を確認する dot コマンドは?",
          choices: [".schema users", "SHOW users", "DESCRIBE users", "!def users"],
          answer: 0,
          explain: "ドットで始まるコマンドは SQLite シェル固有の機能です。",
        },
        {
          q: "UPDATE の WHERE を書き忘れると?",
          choices: ["全行が更新される", "エラー", "先頭 1 行のみ", "何も起きない"],
          answer: 0,
          explain: "実習でも一度経験する。実務では先に SELECT で対象確認。",
        },
        {
          q: "EXPLAIN QUERY PLAN で確認できることは?",
          choices: ["実行計画(全行スキャンか索引参照か)", "テーブル定義", "行数", "ユーザー権限"],
          answer: 0,
          explain: "インデックス作成前後で SCAN → SEARCH USING INDEX の変化を観察しました。",
        },
        {
          q: "ROLLBACK の効果は?",
          choices: ["トランザクション内の未確定変更をすべて取り消す", "テーブルを削除する", "データを複製する", "インデックスを再構築する"],
          answer: 0,
          explain: "COMMIT 前なら全部なかったことにできる——原子性の体験です。",
        },
        {
          q: "カンマ区切り items 列が駄目な理由は?",
          choices: ["商品単位の集計・検索が正規の SQL で不可能になる", "保存容量が増えるだけ", "表示が崩れるから", "主キーが持てないから"],
          answer: 0,
          explain: "1NF 違反。注文明細テーブルに分離するのが正解でした。",
        },
      ],
    },
  ],
};
