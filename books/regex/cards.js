export default {
  decks: [
    {
      id: "regex-core",
      name: "正規表現の部品",
      cards: [
        {
          q: "「a の 1 回以上の繰り返し」は?",
          choices: ["a+", "a*", "a?", "a{0}"],
          answer: 0,
          explain: "+ は 1 回以上、* は 0 回以上、? は 0 か 1 回。",
        },
        {
          q: "「行の先頭の abc」にマッチするのは?",
          choices: ["^abc", "abc$", "\\babc\\b", "(abc)"],
          answer: 0,
          explain: "^ が行頭、$ が行末のアンカーです。",
        },
        {
          q: "「cat または dog」にマッチするのは?",
          choices: ["cat|dog", "cat dog", "[catdog]", "cat\\dog"],
          answer: 0,
          explain: "| は OR。[catdog] は「これらの文字のどれか 1 文字」で意味が全く違います。",
        },
        {
          q: "3 桁の数字にマッチするのは?",
          choices: ["\\d{3}", "\\d3", "[0-9]3", "\\w{3}"],
          answer: 0,
          explain: "\\d は数字 1 文字、{3} で 3 回。\\w は英数字と _ です。",
        },
        {
          q: "貪欲マッチ .* の問題と回避法は?",
          choices: ["最長マッチしすぎるため .*? (控えめ)か [^x]* で区切りを明示する", "短すぎるため + に変える", "常にエラーになる", "大小文字を無視する"],
          answer: 0,
          explain: "<a>1</a><a>2</a> に対して .* は全体を飲み込みます。",
        },
        {
          q: "(ab)+ がマッチするのは?",
          choices: ["ab, abab, ababab…", "ab, abb, abbb…", "a, ab, abab…", "b, bab…"],
          answer: 0,
          explain: "(…) で一塊にしてから + が効きます。ab+ は「a と、b の 1 回以上」で全く別。",
        },
      ],
    },
  ],
};
