export default {
  decks: [
    {
      id: "shell-core",
      name: "シェルの必殺技",
      cards: [
        {
          q: "パイプ | の意味は?",
          choices: ["左のコマンド出力を右のコマンド入力へ渡す", "順に実行するだけ", "ファイルへ出力", "エラー無視"],
          answer: 0,
          explain: "小さな道具を繋いで複雑な処理を作る、UNIX の核心です。",
        },
        {
          q: "ログファイルに追記された行をリアルタイム監視するコマンドは?",
          choices: ["tail -f file.log", "head -f file.log", "cat -f file.log", "watch log"],
          answer: 0,
          explain: "tail -f は追記を待ち受けるログ監視の基本です。",
        },
        {
          q: "権限 755 の意味は?",
          choices: ["所有者 rwx・グループ r-x・他人 r-x", "全員 rwx", "所有者 r-- のみ", "全員書込可"],
          answer: 0,
          explain: "rwx を 421 の足し算で表します。7=rwx、5=r-x。",
        },
        {
          q: "cron の「*/5 * * * *」の意味は?",
          choices: ["5 分ごとに実行", "毎日 5 時", "5 日ごと", "5 月のみ"],
          answer: 0,
          explain: "フィールドは 分・時・日・月・曜日。*/5 は分を 5 刻みで。",
        },
        {
          q: "CSV の 3 列目の合計を awk で計算する式は?",
          choices: ["awk -F, '{s+=$3} END {print s}' data.csv", "awk 3 sum data.csv", "cut -c3 data.csv | sum", "grep -c 3 data.csv"],
          answer: 0,
          explain: "awk は行をフィールドに分けて小さな計算をする道具です。",
        },
        {
          q: "シェルスクリプト先頭の「set -euo pipefail」の目的は?",
          choices: ["失敗を黙って続けない(早く失敗させる)", "実行を速くする", "変数を文字列にする", "出力を静かにする"],
          answer: 0,
          explain: "エラー即中止・未定義変数エラー・パイプの失敗検出。事故を防ぐ定番宣言です。",
        },
      ],
    },
  ],
};
