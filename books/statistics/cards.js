// 統計学の公式カード — 選択式クイズ
export default {
  decks: [
    {
      id: "desc",
      name: "記述統計と確率",
      cards: [
        {
          q: String.raw`相関係数 \( r \) のとりうる範囲は?`,
          choices: [
            String.raw`\( -1 \le r \le 1 \)`,
            String.raw`\( 0 \le r \le 1 \)`,
            String.raw`\( -1 < r < 1 \) で 0 を含まない`,
            String.raw`\( r \ge 0 \) のみ符号は常に正`,
          ],
          answer: 0,
          explain: String.raw`\( r = \pm 1 \) は完全な直線関係、\( r = 0 \) は直線的関係の不在。符号は向きを表す。`,
        },
        {
          q: String.raw`確率変数の分散 \( V[X] \) を期待値で書くと?`,
          choices: [
            String.raw`\( E[X^2] - (E[X])^2 \)`,
            String.raw`\( (E[X])^2 - E[X^2] \)`,
            String.raw`\( E[X^2] + (E[X])^2 \)`,
            String.raw`\( E[(X - E[X])]^2 \)`,
          ],
          answer: 0,
          explain: String.raw`計算しやすい定番形。「2 乗の平均 − 平均の 2 乗」。2 番目は引き算の順序が逆なので符号が反転してしまう。`,
        },
        {
          q: String.raw`独立な確率変数 \( X, Y \) に対して正しい式は?`,
          choices: [
            String.raw`\( V[X + Y] = V[X] + V[Y] \)`,
            String.raw`\( V[X + Y] = V[X] \cdot V[Y] \)`,
            String.raw`\( E[X + Y] = E[X] \cdot E[Y] \)`,
            String.raw`\( V[X + Y] = V[X] \)`,
          ],
          answer: 0,
          explain: String.raw`和の期待値は常に加法的、分散の加法性には独立が必要。期待値の積の形(3 番目)は独立のとき \( E[X]E[Y] \) だが和ではない。`,
        },
        {
          q: String.raw`二項分布 \( B(n, p) \) の期待値と分散は?`,
          choices: [
            String.raw`\( E = np \)、\( V = np(1-p) \)`,
            String.raw`\( E = p \)、\( V = np \)`,
            String.raw`\( E = np \)、\( V = np^2 \)`,
            String.raw`\( E = n(1-p) \)、\( V = np \)`,
          ],
          answer: 0,
          explain: String.raw`成功回数の平均は \( np \)、ばらつきには失敗確率 \( (1-p) \) が入る。`,
        },
        {
          q: String.raw`ポアソン分布 Po(\( \lambda \)) の期待値と分散は?`,
          choices: [
            String.raw`ともに \( \lambda \)`,
            String.raw`\( E = \lambda \)、\( V = \lambda^2 \)`,
            String.raw`ともに \( \sqrt{\lambda} \)`,
            String.raw`\( E = 1/\lambda \)、\( V = \lambda \)`,
          ],
          answer: 0,
          explain: String.raw`期待値と分散が一致するのがポアソン分布の特徴的な性質。`,
        },
        {
          q: String.raw`ベイズの定理の形は?`,
          choices: [
            String.raw`\( \displaystyle P(A \mid B) = \frac{P(B \mid A)\, P(A)}{P(B)} \)`,
            String.raw`\( \displaystyle P(A \mid B) = \frac{P(A \cap B)}{P(A)} \)`,
            String.raw`\( \displaystyle P(A \mid B) = P(A) + P(B) \)`,
            String.raw`\( \displaystyle P(A \mid B) = P(B \mid A) \)`,
          ],
          answer: 0,
          explain: String.raw`2 番目は乗法定理の変形(分母が P(B) でない)。ベイズは「結果から原因を逆算」する式で、まれな事象の検査陽性の例が有名。`,
        },
        {
          q: String.raw`正規分布 \( N(\mu, \sigma^2) \) で「μ ± 2σ」に入る確率は?`,
          choices: [
            String.raw`約 95%`,
            String.raw`約 68%`,
            String.raw`約 99.7%`,
            String.raw`ちょうど 95%`,
          ],
          answer: 0,
          explain: String.raw`68–95–99.7 ルール。正確には \( P(|Z| \le 2) \approx 0.954 \)。95% というと \( \pm 1.96\sigma \)。`,
        },
        {
          q: String.raw`データ \( x_i \) の標準化得点( z スコア)の式は?`,
          choices: [
            String.raw`\( \displaystyle z_i = \frac{x_i - \bar{x}}{s} \)`,
            String.raw`\( \displaystyle z_i = \frac{\bar{x} - x_i}{s^2} \)`,
            String.raw`\( \displaystyle z_i = \frac{x_i}{s} \)`,
            String.raw`\( \displaystyle z_i = x_i - \bar{x} \)`,
          ],
          answer: 0,
          explain: String.raw`「平均から何標準偏差離れているか」。4 番目は中心化だけで規格化が足りない。`,
        },
      ],
    },
    {
      id: "infer",
      name: "推測統計(区間推定・検定・回帰)",
      cards: [
        {
          q: String.raw`標本平均の標準誤差は?`,
          choices: [
            String.raw`\( \displaystyle \frac{\sigma}{\sqrt{n}} \)`,
            String.raw`\( \displaystyle \frac{\sigma}{n} \)`,
            String.raw`\( \displaystyle \frac{\sigma^2}{n} \)`,
            String.raw`\( \sigma \)`,
          ],
          answer: 0,
          explain: String.raw`サンプル数を 4 倍にしても誤差は半分になるだけ。精度は \( \sqrt{n} \) に比例——実務上最重要の事実。`,
        },
        {
          q: String.raw`σ 既知のときの母平均の 95% 信頼区間は?`,
          choices: [
            String.raw`\( \displaystyle \bar{x} \pm 1.96\, \frac{\sigma}{\sqrt{n}} \)`,
            String.raw`\( \displaystyle \bar{x} \pm 1.96\, \sigma \)`,
            String.raw`\( \displaystyle \bar{x} \pm 2.58\, \frac{\sigma}{\sqrt{n}} \)`,
            String.raw`\( \displaystyle \bar{x} \pm 1.96\, \frac{\sigma}{n} \)`,
          ],
          answer: 0,
          explain: String.raw`標準正規の 95% が ±1.96 に入ることから。2.58 は 99% 区間。n でなく √n で割る。`,
        },
        {
          q: String.raw`帰無仮説 \( H_0: \mu = \mu_0 \) の z 検定統計量は?`,
          choices: [
            String.raw`\( \displaystyle Z = \frac{\bar{x} - \mu_0}{\sigma / \sqrt{n}} \)`,
            String.raw`\( \displaystyle Z = \frac{\mu_0 - \bar{x}}{\sigma} \)`,
            String.raw`\( \displaystyle Z = \frac{\bar{x} - \mu_0}{\sigma^2} \)`,
            String.raw`\( \displaystyle Z = \frac{\sigma}{\sqrt{n}(\bar{x} - \mu_0)} \)`,
          ],
          answer: 0,
          explain: String.raw`「観測した平均が帰無仮説から標準誤差の何倍離れているか」。|Z| が大きいほど偶然では説明しにくい。`,
        },
        {
          q: String.raw`p 値の正しい解釈は?`,
          choices: [
            String.raw`\( H_0 \) が正しいと仮定したとき、観測以上に極端な結果が出る確率`,
            String.raw`\( H_0 \) が正しい確率`,
            String.raw`\( H_1 \) が正しい確率`,
            String.raw`効果の大きさ`,
          ],
          answer: 0,
          explain: String.raw`p 値は「H₀ のもとでのデータの極端さ」。H₀ の正しさの確率ではない(それを知るにはベイズの枠組みが要る)。効果量は別途報告する。`,
        },
        {
          q: String.raw`第 1 種の過誤とは?`,
          choices: [
            String.raw`\( H_0 \) が正しいのに棄却してしまうこと`,
            String.raw`\( H_0 \) が誤りなのに棄却できないこと`,
            String.raw`サンプル数が足りないこと`,
            String.raw`信頼区間が広すぎること`,
          ],
          answer: 0,
          explain: String.raw`「無実の人を有罪にする」過誤で、その確率が有意水準 α。2 番目は第 2 種の過誤(確率 β、1−β が検出力)。`,
        },
        {
          q: String.raw`単回帰の回帰係数 \( b \) と相関係数 \( r \) の関係は?`,
          choices: [
            String.raw`\( \displaystyle b = r \, \frac{s_y}{s_x} \)`,
            String.raw`\( b = r^2 \)`,
            String.raw`\( \displaystyle b = r \, \frac{s_x}{s_y} \)`,
            String.raw`\( b = r \cdot \bar{y} \)`,
          ],
          answer: 0,
          explain: String.raw`y のばらつきに対して x のばらつきが小さいほど傾きは急になる。切片は \( a = \bar{y} - b\bar{x} \)。`,
        },
        {
          q: String.raw`決定係数 \( R^2 \) の読み方は?`,
          choices: [
            String.raw`\( y \) のばらつきのうち \( x \) で説明できる割合(\( R^2 = r^2 \))`,
            String.raw`相関の強さそのもの(−1 から 1)`,
            String.raw`回帰直線の傾き`,
            String.raw`標本の数と精度の比`,
          ],
          answer: 0,
          explain: String.raw`\( r = 0.8 \) なら \( R^2 = 0.64 \) で「64% を説明」。符号は現れず、強さの 2 乗。`,
        },
        {
          q: String.raw`中心極限定理の主張として正しいものは?`,
          choices: [
            String.raw`任意の母集団から大きな標本を取ると、標本平均は近似的に正規分布に従う`,
            String.raw`サンプル数を増やすと標本分散は 0 に収束する`,
            String.raw`母集団は必ず正規分布に従う`,
            String.raw`相関係数は n が大きいと 1 に近づく`,
          ],
          answer: 0,
          explain: String.raw`母集団の分布が何であっても \( \bar{X}_n \approx N(\mu, \sigma^2/n) \)。推測統計の心臓部。`,
        },
      ],
    },
  ],
};
