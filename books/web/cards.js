export default {
  decks: [
    {
      id: "web-core",
      name: "Web の三層",
      cards: [
        {
          q: "CSS ボックスモデルの内側からの層の順序は?",
          choices: ["content → padding → border → margin", "margin → border → padding → content", "content → border → margin", "padding → content → margin"],
          answer: 0,
          explain: "中身の周りに内余白(padding)、線(border)、外余白(margin)。",
        },
        {
          q: "querySelector(\"#toc\") が選ぶ要素は?",
          choices: ["id=\"toc\" の要素", "class=\"toc\" の要素", "<toc> タグ", "すべての toc"],
          answer: 0,
          explain: "# は id、. は class のセレクタ記法です。",
        },
        {
          q: "イベント処理を結びつける標準 API は?",
          choices: ["addEventListener", "onClick = fn() のみ", "listen()", "event()"],
          answer: 0,
          explain: "複数のリスナーを重ねて登録できる標準の方法です。",
        },
        {
          q: "localStorage の特徴は?",
          choices: ["ドメインごとに永続保存(値は文字列)", "サーバーへ自動送信", "タブを閉じると消える", "オブジェクトをそのまま保存できる"],
          answer: 0,
          explain: "オブジェクトは JSON.stringify/parse で相互変換します。",
        },
        {
          q: "レスポンシブ対応のための meta タグの content は?",
          choices: ["width=device-width, initial-scale=1", "charset=utf-8", "refresh=5", "viewport=mobile"],
          answer: 0,
          explain: "@media と組み合わせて画面幅ごとの切替を可能にします。",
        },
        {
          q: "「取得 → 反応 → 変更」の JS の型に当てはまる組合せは?",
          choices: ["querySelector → addEventListener → style変更", "style変更 → querySelector → fetch", "fetch → import → render", "add → click → save"],
          answer: 0,
          explain: "この 3 択だけで検索・タブ・モーダルが作れます。",
        },
      ],
    },
  ],
};
