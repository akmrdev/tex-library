export default {
  decks: [
    {
      id: "senior-core",
      name: "高校数学の核",
      cards: [
        {
          q: String.raw`二次関数 \(y = x^2 - 4x + 1\) の頂点は?`,
          choices: ["(2, −3)", "(−2, 3)", "(2, 3)", "(4, 1)"],
          answer: 0,
          explain: "平方完成 y = (x−2)² − 3 より (2, −3)。",
        },
        {
          q: String.raw`\(\sin^2\theta + \cos^2\theta\) の値は?`,
          choices: ["1", "0", String.raw`\(\tan\theta\)`, "θ による"],
          answer: 0,
          explain: "ピタゴラスの基本恒等式。単位円から直ちに従います。",
        },
        {
          q: "log₂ 8 の値は?",
          choices: ["3", "4", "8", "2"],
          answer: 0,
          explain: "対数は「2 を何乗すると 8 か」を求める操作 → 3。",
        },
        {
          q: "log₁₀ 2 = 0.301 のとき log₁₀ 5 は?",
          choices: ["0.699", "0.301", "0.5", "1.301"],
          answer: 0,
          explain: "5 = 10/2 なので log10 = 1 − 0.301 = 0.699。",
        },
        {
          q: "等比数列 3, 6, 12, … の第 5 項は?",
          choices: ["48", "24", "96", "36"],
          answer: 0,
          explain: "初項 3・公比 2 → 3 × 2⁴ = 48。",
        },
        {
          q: String.raw`\(a_{n+1} = 2a_n + 3\)(\(a_1 = 1\))の一般項は?`,
          choices: [String.raw`\(a_n = 2^{n+1} - 3\)`, String.raw`\(a_n = 2^n + 3\)`, String.raw`\(a_n = 2^{n} - 1\)`, String.raw`\(a_n = 3 \cdot 2^{n-1}\)`],
          answer: 0,
          explain: "特性方程式 α = 2α + 3 の解 −3 を使い {aₙ + 3} を等比数列に変形します。",
        },
      ],
    },
  ],
};
