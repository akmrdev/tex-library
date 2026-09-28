// アルゴリズムの計算量・構造クイズ
export default {
  decks: [
    {
      id: "complexity",
      name: "計算量クイズ",
      cards: [
        {
          q: String.raw`ソート済み配列からの二分探索の計算量は?`,
          choices: [
            String.raw`\( O(\log n) \)`,
            String.raw`\( O(n) \)`,
            String.raw`\( O(n \log n) \)`,
            String.raw`\( O(1) \)`,
          ],
          answer: 0,
          explain: String.raw`中央を見るごとに候補が半分になる。100 万件でも最大 20 回程度(\( \log_2 10^6 \approx 20 \))。`,
        },
        {
          q: String.raw`マージソートの最悪計算量は?`,
          choices: [
            String.raw`\( O(n \log n) \)`,
            String.raw`\( O(n^2) \)`,
            String.raw`\( O(n) \)`,
            String.raw`\( O(\log n) \)`,
          ],
          answer: 0,
          explain: String.raw`分割が \( \log_2 n \) 段、各段の併合が \( O(n) \)。クイックソートは平均 \( O(n \log n) \) だが最悪 \( O(n^2) \) に落ちる点が違う。`,
        },
        {
          q: String.raw`ハッシュテーブルの検索・挿入の「平均」計算量は?`,
          choices: [
            String.raw`\( O(1) \)`,
            String.raw`\( O(\log n) \)`,
            String.raw`\( O(n) \)`,
            String.raw`\( O(n \log n) \)`,
          ],
          answer: 0,
          explain: String.raw`格納場所を計算で求めるため平均定数時間。衝突が続く最悪ケースは \( O(n) \) に劣化する。`,
        },
        {
          q: String.raw`次の二重ループの計算量は?<br><code>for i in range(n):<br>&nbsp;&nbsp;for j in range(n): ...</code>`,
          choices: [
            String.raw`\( O(n^2) \)`,
            String.raw`\( O(n) \)`,
            String.raw`\( O(2n) \)`,
            String.raw`\( O(\log n) \)`,
          ],
          answer: 0,
          explain: String.raw`ループのネストは掛け算。内側が range(i, n) の三角形でも合計は \( n(n+1)/2 \) で次数は変わらず \( O(n^2) \)。`,
        },
        {
          q: String.raw`メモ化なしの素朴な再帰でフィボナッチ数 \( F(n) \) を計算する計算量は?`,
          choices: [
            String.raw`\( O(2^n) \)`,
            String.raw`\( O(n) \)`,
            String.raw`\( O(n \log n) \)`,
            String.raw`\( O(n^2) \)`,
          ],
          answer: 0,
          explain: String.raw`同じ値を何度も再計算するため指数爆発。メモ化(動的計画法)で \( O(n) \) に落ちる。`,
        },
        {
          q: String.raw`隣接リスト表現のグラフでの幅優先探索(BFS)の計算量は?`,
          choices: [
            String.raw`\( O(V + E) \)`,
            String.raw`\( O(V \times E) \)`,
            String.raw`\( O(V^2) \)(常に)`,
            String.raw`\( O(\log V) \)`,
          ],
          answer: 0,
          explain: String.raw`各頂点と各辺を高々 1 回ずつ見る。\( V \) は頂点数、\( E \) は辺数。`,
        },
        {
          q: String.raw`\( O(n^2) \) のアルゴリズムで入力サイズ \( n \) を 10 倍にすると処理時間は?`,
          choices: [
            String.raw`約 100 倍`,
            String.raw`約 10 倍`,
            String.raw`約 20 倍`,
            String.raw`変わらない`,
          ],
          answer: 0,
          explain: String.raw`次数に比例して増える。1 秒の処理が 100 秒になる——計算量の違いは「速い遅い」でなく「動く動かない」の差。`,
        },
        {
          q: String.raw`メモ化(動的計画法)が効く問題の特徴は?`,
          choices: [
            String.raw`同じ部分問題が何度も再登場する(重複している)`,
            String.raw`データがソート済みである`,
            String.raw`グラフが連結である`,
            String.raw`入力が必ず数値である`,
          ],
          answer: 0,
          explain: String.raw`重複する部分問題を 1 回だけ解いて記録するのが DP の核心。部分和問題や最長共通部分列などが典型。`,
        },
      ],
    },
    {
      id: "structures",
      name: "データ構造の性格クイズ",
      cards: [
        {
          q: String.raw`幅優先探索(BFS)で使うデータ構造は?`,
          choices: [
            String.raw`キュー(先入れ先出し)`,
            String.raw`スタック(後入れ先出し)`,
            String.raw`ヒープ`,
            String.raw`ハッシュテーブル`,
          ],
          answer: 0,
          explain: String.raw`近い頂点から順に処理するには FIFO が必要。DFS はスタック(再帰は暗黙のスタック)。`,
        },
        {
          q: String.raw`重みがすべて同じグラフで「最短経路」を求めるのに適する探索は?`,
          choices: [
            String.raw`BFS(幅優先探索)`,
            String.raw`DFS(深さ優先探索)`,
            String.raw`二分探索`,
            String.raw`線形探索`,
          ],
          answer: 0,
          explain: String.raw`BFS はスタートからの距離の小さい順に訪れるため、最初にゴールへ届いた経路が必ず最短。`,
        },
        {
          q: String.raw`二分探索が機能するための前提条件は?`,
          choices: [
            String.raw`データがソート済みであること`,
            String.raw`データが数値であること`,
            String.raw`要素数が偶数であること`,
            String.raw`重複がないこと`,
          ],
          answer: 0,
          explain: String.raw`「中央と比較して半分を捨てる」決断ができるのは整列されているから。未整列ならまずソート(ただしソート自体は O(n log n))。`,
        },
        {
          q: String.raw`Python の dict や JS の Map の正体(実装)は?`,
          choices: [
            String.raw`ハッシュテーブル`,
            String.raw`連結リスト`,
            String.raw`二分探索木`,
            String.raw`配列の線形探索`,
          ],
          answer: 0,
          explain: String.raw`キーをハッシュ関数で数値に変換し格納位置を計算する。だから検索・挿入が平均 O(1)。`,
        },
        {
          q: String.raw`連結リストが配列より優れている点は?`,
          choices: [
            String.raw`既知の位置への挿入・削除が O(1) でできる`,
            String.raw`i 番目へのアクセスが O(1) でできる`,
            String.raw`メモリ使用量が常に少ない`,
            String.raw`キャッシュ効率が高い`,
          ],
          answer: 0,
          explain: String.raw`参照のつなぎ替えだけで済む。逆に i 番目へのアクセスは先頭からたどる O(n)。配列と正反対の性格。`,
        },
        {
          q: String.raw`二分探索木(BST)が O(n) に劣化するのはどんなとき?`,
          choices: [
            String.raw`ソート済みデータを順に挿入したとき`,
            String.raw`要素数が偶数のとき`,
            String.raw`値がすべて負のとき`,
            String.raw`木が平衡なとき`,
          ],
          answer: 0,
          explain: String.raw`一本道の木になり、検索が線形になる。実用の平衡木(赤黒木など)は自動でバランスを保つ。DB のインデックスの基礎。`,
        },
        {
          q: String.raw`「最後に積んだものを先に取り出す」処理に適する構造は?`,
          choices: [
            String.raw`スタック`,
            String.raw`キュー`,
            String.raw`優先度付きキュー`,
            String.raw`セット`,
          ],
          answer: 0,
          explain: String.raw`LIFO のスタック。関数呼び出しの管理・undo 履歴・DFS がこのパターン。待ち行列ならキュー。`,
        },
        {
          q: String.raw`部分和問題(いくつか選んで合計 target にできるか)を DP で解く発想は?`,
          choices: [
            String.raw`全組合せを列挙せず「到達できる合計値の集合」を順に更新する`,
            String.raw`合計が target を超えたら強制的に終了する`,
            String.raw`配列をソートしてから足し合わせる`,
            String.raw`乱数で何度も試して確率を出す`,
          ],
          answer: 0,
          explain: String.raw`\( 2^n \) 通りの列挙を、状態(合計値)の重複をまとめて処理することで回避する——動的計画法の典型形。`,
        },
      ],
    },
  ],
};
