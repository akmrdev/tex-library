// 投資の数学カード — 選択式クイズ
export default {
  decks: [
    {
      id: "formulas",
      name: "期待値・ケリー・資金管理",
      cards: [
        {
          q: String.raw`勝率 \( p \)、ペイアウト比 \( b \)(勝てば利益 \( b \)、負ければ \( -1 \))の賭けの期待値係数 \( E \) は?`,
          choices: [
            String.raw`\( E = p(b + 1) - 1 \)`,
            String.raw`\( E = pb \)`,
            String.raw`\( E = p - q \)`,
            String.raw`\( E = \displaystyle \frac{bp - q}{b} \)`,
          ],
          answer: 0,
          explain: String.raw`「勝ったら \( b \) もらう確率 × それ以外は 1 失う」をまとめると \( pb - (1-p) = p(b+1) - 1 \)。4 番目はケリー比 \( f^* \) の式。`,
        },
        {
          q: String.raw`ケリー基準の最適賭け割合 \( f^* \) は?`,
          choices: [
            String.raw`\( \displaystyle f^* = \frac{bp - q}{b} \)`,
            String.raw`\( f^* = bp - q \)`,
            String.raw`\( \displaystyle f^* = \frac{p}{b} \)`,
            String.raw`\( f^* = p(b + 1) - 1 \)`,
          ],
          answer: 0,
          explain: String.raw`成長率 \( g(f) = p\ln(1+bf) + q\ln(1-f) \) を最大化した結果。つまり「期待値係数 \( E \) をペイアウト比 \( b \) で割ったもの」。`,
        },
        {
          q: String.raw`ユーロルーレット(37 マス)で赤に賭けたときの期待値は?`,
          choices: [
            String.raw`約 −2.7%(ハウスエッジ)`,
            String.raw`ちょうど 0(フェアゲーム)`,
            String.raw`約 +2.7%`,
            String.raw`約 −5.6%`,
          ],
          answer: 0,
          explain: String.raw`\( E = \frac{18}{37} - \frac{19}{37} = -\frac{1}{37} \approx -2.7\% \)。ゼロの 1 マスが全プレイヤーの長期成績をマイナスへ動かす。`,
        },
        {
          q: String.raw`ケリー比より大きい金額(オーバーベット)を続けたとき、長期の資金成長率は?`,
          choices: [
            String.raw`必ず低下する(2 倍以上ならマイナスにもなる)`,
            String.raw`リスクを取ったぶん必ず上昇する`,
            String.raw`期待値が正なら必ず上昇する`,
            String.raw`変わらない`,
          ],
          answer: 0,
          explain: String.raw`成長率曲線は \( f^* \) で最大、それを超えると対数項の発散で単調に悪化。期待値が正でも賭け方次第で資金は減る。`,
        },
        {
          q: String.raw`独立な試行で \( n \) 連敗する確率は(負け率 \( q \)) ?`,
          choices: [
            String.raw`\( q^n \)`,
            String.raw`\( nq \)`,
            String.raw`\( q + n \)`,
            String.raw`\( 1 - q^n \)`,
          ],
          answer: 0,
          explain: String.raw`独立なので掛かる。勝率 60% なら 5 連敗は \( 0.4^5 \approx 1\% \) だが、試行数が多いと「どこかで」起こる。`,
        },
        {
          q: String.raw`資金の割合 \( f \) を賭ける方式で \( n \) 連敗したときの資金残率は?`,
          choices: [
            String.raw`\( (1 - f)^n \)`,
            String.raw`\( 1 - nf \)`,
            String.raw`\( (1 - f)^{1/n} \)`,
            String.raw`\( f^n \)`,
          ],
          answer: 0,
          explain: String.raw`固定比率方式では勝ち負けの順序によらず最終資金が決まるのが特徴。\( f = 0.1 \) で 10 連敗すると \( 0.9^{10} \approx 35\% \) 残存。`,
        },
        {
          q: String.raw`実戦でフルケリーでなく半ケリーを使う主な理由は?`,
          choices: [
            String.raw`勝率の推定誤りに対する安全性が大幅に上がるから`,
            String.raw`成長率が 2 倍になるから`,
            String.raw`税金が安くなるから`,
            String.raw`破産確率が数学的に 0 になるから`,
          ],
          answer: 0,
          explain: String.raw`成長率曲線の頂点付近は平坦なので、半分の賭け幅でも成長率の低下は小さく、推定が外れたときの被害を大きく減らせる。`,
        },
        {
          q: String.raw`マーティンゲール(負けるたびに賭け額を倍に)の根本的な欠点は?`,
          choices: [
            String.raw`有限な資金では連敗時に必要額が指数関数的に増え破綻する`,
            String.raw`期待値が他の戦略より悪い`,
            String.raw`勝率を数学的に下げるから`,
            String.raw`手数料だけの問題`,
          ],
          answer: 0,
          explain: String.raw`累積賭け額は \( 2^n - 1 \) で爆発する。期待値自体はゲームの期待値のまま負で、途中の勝率の高さは幻想。`,
        },
      ],
    },
  ],
};
