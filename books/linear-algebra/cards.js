// 数学の公式カード — 選択式クイズ
// q / choices / explain 内の \( \) はビルド時に KaTeX でレンダリングされる
export default {
  decks: [
    {
      id: "calc",
      name: "微分・積分の公式",
      cards: [
        {
          q: String.raw`\( \displaystyle \int x^n \, dx \) を求めよ(ただし \( n \neq -1 \))。`,
          choices: [
            String.raw`\( \displaystyle \frac{x^{n+1}}{n+1} + C \)`,
            String.raw`\( \displaystyle n x^{n-1} + C \)`,
            String.raw`\( \displaystyle \frac{x^n}{n} + C \)`,
            String.raw`\( \ln |x| + C \)`,
          ],
          answer: 0,
          explain: String.raw`微分の逆操作なので指数が 1 増えて割り算。\( n = -1 \) のときだけ例外で \( \ln|x| + C \) になる。`,
        },
        {
          q: String.raw`\( \displaystyle \int \frac{1}{x} \, dx \) を求めよ。`,
          choices: [
            String.raw`\( \ln |x| + C \)`,
            String.raw`\( \displaystyle -\frac{1}{x^2} + C \)`,
            String.raw`\( \displaystyle \frac{x^0}{0} + C \)`,
            String.raw`\( \log x + C \)(x > 0 限定)`,
          ],
          answer: 0,
          explain: String.raw`\( n = -1 \) の特別ケース。負の x も含めて \( \ln|x| + C \) と書くのが正確。`,
        },
        {
          q: String.raw`\( \displaystyle \int x e^x \, dx \) を求めよ。`,
          choices: [
            String.raw`\( (x - 1) e^x + C \)`,
            String.raw`\( x e^x + C \)`,
            String.raw`\( \displaystyle \frac{x^2}{2} e^x + C \)`,
            String.raw`\( (x + 1) e^{x-1} + C \)`,
          ],
          answer: 0,
          explain: String.raw`部分積分: \( \int u v' = uv - \int u'v \) に \( u = x, v' = e^x \) を代入し 2 回計算すると \( (x-1)e^x \)。微分して \( x e^x \) に戻ることで検算できる。`,
        },
        {
          q: String.raw`積の微分公式 \( (uv)' \) は?`,
          choices: [
            String.raw`\( u'v + uv' \)`,
            String.raw`\( u'v' \)`,
            String.raw`\( uv' + u'v + uv \)`,
            String.raw`\( \displaystyle \frac{u'v - uv'}{v^2} \)`,
          ],
          answer: 0,
          explain: String.raw`積の微分は「片方微分 + もう片方微分」。最後の選択肢は商の微分公式。`,
        },
        {
          q: String.raw`合成関数 \( f(g(x)) \) の微分は?`,
          choices: [
            String.raw`\( f'(g(x)) \, g'(x) \)`,
            String.raw`\( f'(g(x)) + g'(x) \)`,
            String.raw`\( f'(x) \, g'(x) \)`,
            String.raw`\( f(g'(x)) \)`,
          ],
          answer: 0,
          explain: String.raw`連鎖律(チェーンルール)。外側を微分したものに内側の微分を掛け、内側はそのまま。`,
        },
        {
          q: String.raw`\( e^x \) のマクローリン展開は?`,
          choices: [
            String.raw`\( \displaystyle \sum_{k=0}^{\infty} \frac{x^k}{k!} \)`,
            String.raw`\( \displaystyle \sum_{k=1}^{\infty} \frac{x^k}{k} \)`,
            String.raw`\( \displaystyle \sum_{k=0}^{\infty} (-1)^k \frac{x^{2k}}{(2k)!} \)`,
            String.raw`\( \displaystyle \sum_{k=0}^{\infty} x^k \)`,
          ],
          answer: 0,
          explain: String.raw`\( \big( \frac{x^k}{k!} \big) \) の和が \( e^x \)。2 番目は \( \log(1+x) \)、3 番目は \( \cos x \)、4 番目は \( \frac{1}{1-x} \) の展開。`,
        },
        {
          q: String.raw`\( \displaystyle \int_0^1 x e^x \, dx \) の値は?`,
          choices: [
            String.raw`\( 1 \)`,
            String.raw`\( e - 1 \)`,
            String.raw`\( e \)`,
            String.raw`\( e^2 - 1 \)`,
          ],
          answer: 0,
          explain: String.raw`不定積分 \( (x-1)e^x \) を使うと \( [(x-1)e^x]_0^1 = 0 - (-1) = 1 \)。`,
        },
        {
          q: String.raw`関数 \( f(x) \) が極値をもつ点での必要条件は?`,
          choices: [
            String.raw`\( f'(a) = 0 \)`,
            String.raw`\( f''(a) > 0 \)`,
            String.raw`\( f(a) = 0 \)`,
            String.raw`\( f'(a) > 0 \)`,
          ],
          answer: 0,
          explain: String.raw`微分可能なら極値の点で導関数が 0(停留条件)。ただし \( f'(a)=0 \) でも極値とは限らず(鞍点)、符号の変化や 2 階微分での判定が要る。`,
        },
      ],
    },
    {
      id: "linear",
      name: "線形代数と級数",
      cards: [
        {
          q: String.raw`行列の積について常に成り立つ式は?`,
          choices: [
            String.raw`\( \det(AB) = \det A \cdot \det B \)`,
            String.raw`\( AB = BA \)`,
            String.raw`\( \det(A + B) = \det A + \det B \)`,
            String.raw`\( (AB)^{-1} = A^{-1}B^{-1} \)`,
          ],
          answer: 0,
          explain: String.raw`行列の積は一般に可換でない(AB ≠ BA)。逆行列は \( (AB)^{-1} = B^{-1}A^{-1} \) と順序が逆になる。`,
        },
        {
          q: String.raw`\( A = \begin{pmatrix} a & b \\ c & d \end{pmatrix} \) の逆行列は(\( \det A \neq 0 \)) ?`,
          choices: [
            String.raw`\( \displaystyle \frac{1}{ad - bc} \begin{pmatrix} d & -b \\ -c & a \end{pmatrix} \)`,
            String.raw`\( \displaystyle \frac{1}{ad - bc} \begin{pmatrix} a & -b \\ -c & d \end{pmatrix} \)`,
            String.raw`\( \displaystyle \frac{1}{bc - ad} \begin{pmatrix} d & b \\ c & a \end{pmatrix} \)`,
            String.raw`\( \displaystyle \begin{pmatrix} d & -b \\ -c & a \end{pmatrix} \)`,
          ],
          answer: 0,
          explain: String.raw`対角を入れ替え、非対角の符号を反転して行列式で割る。1 で割ることを忘れない。`,
        },
        {
          q: String.raw`\( A\boldsymbol{v} = \lambda \boldsymbol{v} \ (\boldsymbol{v} \neq \boldsymbol{0}) \) における \( \lambda \) は何?`,
          choices: [
            String.raw`固有値`,
            String.raw`行列式`,
            String.raw`トレース`,
            String.raw`階数`,
          ],
          answer: 0,
          explain: String.raw`固有値問題の定義。対応する \( \boldsymbol{v} \) が固有ベクトルで、「A の変換で向きが変わらない方向」を与える。`,
        },
        {
          q: String.raw`ベクトル \( \boldsymbol{a}, \boldsymbol{b} \) が直交する条件は?`,
          choices: [
            String.raw`\( \boldsymbol{a} \cdot \boldsymbol{b} = 0 \)`,
            String.raw`\( \|\boldsymbol{a}\| = \|\boldsymbol{b}\| \)`,
            String.raw`\( \boldsymbol{a} \times \boldsymbol{b} = 0 \)`,
            String.raw`\( \boldsymbol{a} = c\,\boldsymbol{b} \)(c は定数)`,
          ],
          answer: 0,
          explain: String.raw`内積 0 ⟺ なす角 90°。最後の選択肢は「平行」の条件。`,
        },
        {
          q: String.raw`トレース(対角和)と固有値の関係は?`,
          choices: [
            String.raw`\( \mathrm{tr}(A) \) は固有値の和に等しい`,
            String.raw`\( \mathrm{tr}(A) \) は固有値の積に等しい`,
            String.raw`\( \mathrm{tr}(A) \) は常に 0`,
            String.raw`固有値との関係はない`,
          ],
          answer: 0,
          explain: String.raw`固有値の和 = トレース、固有値の積 = 行列式。検算や問題のショートカットに使える。`,
        },
        {
          q: String.raw`等比級数 \( \displaystyle \sum_{k=0}^{\infty} r^k \) の和(\( |r| < 1 \))は?`,
          choices: [
            String.raw`\( \displaystyle \frac{1}{1 - r} \)`,
            String.raw`\( \displaystyle \frac{r}{1 - r} \)`,
            String.raw`\( \displaystyle \frac{1}{1 + r} \)`,
            String.raw`\( 1 - r \)`,
          ],
          answer: 0,
          explain: String.raw`部分和 \( \frac{1 - r^{n+1}}{1-r} \) の極限。2 番目は \( k=1 \) から始まる場合の形。`,
        },
        {
          q: String.raw`\( \displaystyle \sum_{k=1}^{\infty} \frac{1}{k(k+1)} \) の値は?`,
          choices: [
            String.raw`\( 1 \)`,
            String.raw`\( \displaystyle \frac{1}{2} \)`,
            String.raw`発散する`,
            String.raw`\( 2 \)`,
          ],
          answer: 0,
          explain: String.raw`\( \frac{1}{k(k+1)} = \frac{1}{k} - \frac{1}{k+1} \) の望遠級数で部分和は \( 1 - \frac{1}{n+1} \to 1 \)。`,
        },
        {
          q: String.raw`連立一次方程式 \( A\boldsymbol{x} = \boldsymbol{b} \) が一意解をもつ条件は?`,
          choices: [
            String.raw`\( \det A \neq 0 \)`,
            String.raw`\( \boldsymbol{b} = \boldsymbol{0} \)`,
            String.raw`\( A \) が対称行列`,
            String.raw`\( A \) の成分がすべて正`,
          ],
          answer: 0,
          explain: String.raw`正則(逆行列が存在)なら \( \boldsymbol{x} = A^{-1}\boldsymbol{b} \) と一意に決まる。det = 0 なら解なしまたは無数に存在。`,
        },
      ],
    },
  ],
};
