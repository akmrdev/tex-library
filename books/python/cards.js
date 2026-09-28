// Python のコード出力クイズ — 「このコードの出力は?」
export default {
  decks: [
    {
      id: "basics",
      name: "基本構文の出力クイズ",
      cards: [
        {
          q: String.raw`<code>[x * 2 for x in range(4)]</code> の評価結果は?`,
          choices: [
            String.raw`<code>[0, 2, 4, 6]</code>`,
            String.raw`<code>[2, 4, 6, 8]</code>`,
            String.raw`<code>[0, 1, 2, 3]</code>`,
            String.raw`<code>[1, 2, 3, 4]</code>`,
          ],
          answer: 0,
          explain: String.raw`range(4) は 0〜3 を生成。内包表記は各要素を 2 倍した新しいリストを作る。`,
        },
        {
          q: String.raw`<code>print(1 + 2 * 3 ** 2)</code> の出力は?`,
          choices: [
            String.raw`<code>19</code>`,
            String.raw`<code>27</code>`,
            String.raw`<code>13</code>`,
            String.raw`<code>36</code>`,
          ],
          answer: 0,
          explain: String.raw`累乗が最優先(3² = 9)、次に乗算(2×9 = 18)、最後に加算で 19。`,
        },
        {
          q: String.raw`<code>f"{12345:,}"</code> の評価結果は?`,
          choices: [
            String.raw`<code>"12,345"</code>`,
            String.raw`<code>"12345"</code>`,
            String.raw`<code>"1,2345"</code>`,
            String.raw`エラーになる`,
          ],
          answer: 0,
          explain: String.raw`f-string の書式指定 <code>:,</code> で 3 桁区切りになる。金額の表示で頻出。`,
        },
        {
          q: String.raw`<code>type(4 / 2)</code> は何を返す?`,
          choices: [
            String.raw`<code>&lt;class 'float'&gt;</code>`,
            String.raw`<code>&lt;class 'int'&gt;</code>`,
            String.raw`<code>&lt;class 'decimal'&gt;</code>`,
            String.raw`<code>&lt;class 'str'&gt;</code>`,
          ],
          answer: 0,
          explain: String.raw`Python の <code>/</code> は割り切れても常に float。<code>//</code> なら整数除算で int。`,
        },
        {
          q: String.raw`<code>print("abc"[::-1])</code> の出力は?`,
          choices: [
            String.raw`<code>cba</code>`,
            String.raw`<code>abc</code>`,
            String.raw`<code>ab</code>`,
            String.raw`エラーになる`,
          ],
          answer: 0,
          explain: String.raw`スライスのステップ −1 は逆順。回文判定 <code>s == s[::-1]</code> の定番イディオム。`,
        },
        {
          q: String.raw`<code>10 % 3</code> と <code>10 // 3</code> の値の組は?`,
          choices: [
            String.raw`<code>1 と 3</code>`,
            String.raw`<code>3 と 1</code>`,
            String.raw`<code>3.33 と 3</code>`,
            String.raw`<code>1 と 3.33</code>`,
          ],
          answer: 0,
          explain: String.raw`<code>%</code> は剰余、<code>//</code> は整数除算(商の小数点以下切り捨て)。`,
        },
        {
          q: String.raw`<code>bool([])</code> と <code>bool([0])</code> の値の組は?`,
          choices: [
            String.raw`<code>False と True</code>`,
            String.raw`<code>True と True</code>`,
            String.raw`<code>False と False</code>`,
            String.raw`<code>True と False</code>`,
          ],
          answer: 0,
          explain: String.raw`空のリストは偽、要素を持つリストは真(要素が 0 でも)。空判定 <code>if not xs:</code> の根拠。`,
        },
        {
          q: String.raw`<code>"3" + "5"</code> と <code>"3" * 2</code> の評価結果の組は?`,
          choices: [
            String.raw`<code>"35" と "33"</code>`,
            String.raw`<code>8 と 6</code>`,
            String.raw`<code>"8" と "6"</code>`,
            String.raw`エラーになる`,
          ],
          answer: 0,
          explain: String.raw`文字列の <code>+</code> は連結、<code>*</code> は繰り返し。数値として足したいなら <code>int("3") + int("5")</code>。`,
        },
      ],
    },
    {
      id: "structures",
      name: "データ構造と関数の出力クイズ",
      cards: [
        {
          q: String.raw`<code>d = {"a": 1}</code> のとき <code>d.get("b", 0)</code> の評価結果は?`,
          choices: [
            String.raw`<code>0</code>`,
            String.raw`<code>None</code>`,
            String.raw`<code>KeyError</code>`,
            String.raw`<code>"b"</code>`,
          ],
          answer: 0,
          explain: String.raw`get の第 2 引数はキーが無いときのデフォルト値。<code>d["b"]</code> なら KeyError になる。`,
        },
        {
          q: String.raw`<code>list(range(1, 6, 2))</code> の評価結果は?`,
          choices: [
            String.raw`<code>[1, 3, 5]</code>`,
            String.raw`<code>[1, 2, 3, 4, 5]</code>`,
            String.raw`<code>[2, 4]</code>`,
            String.raw`<code>[1, 3, 5, 7]</code>`,
          ],
          answer: 0,
          explain: String.raw`range(始点, 終点(含まない), ステップ)。1 から 2 刻みで 6 未満まで。`,
        },
        {
          q: String.raw`<code>def f(x, y=2): return x * y</code> のとき <code>f(3)</code> の値は?`,
          choices: [
            String.raw`<code>6</code>`,
            String.raw`<code>3</code>`,
            String.raw`<code>5</code>`,
            String.raw`エラーになる`,
          ],
          answer: 0,
          explain: String.raw`省略された y はデフォルト値 2。デフォルト引数は呼び出し側の省略を可能にする。`,
        },
        {
          q: String.raw`<code>set([1, 2, 1, 3, 3])</code> の評価結果は?`,
          choices: [
            String.raw`<code>{1, 2, 3}</code>`,
            String.raw`<code>[1, 2, 3]</code>`,
            String.raw`<code>{1, 1, 2, 3, 3}</code>`,
            String.raw`<code>{3, 2, 1}</code> と重複付き`,
          ],
          answer: 0,
          explain: String.raw`set は重複を自動で除去。重複検出は <code>len(xs) != len(set(xs))</code> という定番テクに使える。`,
        },
        {
          q: String.raw`<code>sum({"a": 1, "b": 2, "c": 3}.values())</code> の値は?`,
          choices: [
            String.raw`<code>6</code>`,
            String.raw`<code>{"a": 1, ...}</code>`,
            String.raw`<code>3</code>`,
            String.raw`エラーになる`,
          ],
          answer: 0,
          explain: String.raw`.keys() はキー、.values() は値、.items() は (キー, 値) の組を返す。`,
        },
        {
          q: String.raw`<code>xs = [1, 2, 3]</code> のとき <code>xs.append(4)</code> 実行後の <code>xs</code> と <code>len(xs)</code> は?`,
          choices: [
            String.raw`<code>[1, 2, 3, 4]</code> と <code>4</code>`,
            String.raw`<code>[4]</code> と <code>1</code>`,
            String.raw`<code>[1, 2, 3]</code> と <code>3</code>(破壊的でない)`,
            String.raw`<code>[1, 2, 3, [4]]</code> と <code>4</code>`,
          ],
          answer: 0,
          explain: String.raw`append は破壊的メソッド(元のリストを変更)。list を返さないので戻り値を使う書き方はしない。`,
        },
        {
          q: String.raw`<code>[x for x in [3, 1, 4, 1, 5] if x &gt; 2]</code> の評価結果は?`,
          choices: [
            String.raw`<code>[3, 4, 5]</code>`,
            String.raw`<code>[1, 1]</code>`,
            String.raw`<code>[3, 1, 4, 1, 5]</code>`,
            String.raw`<code>True</code>`,
          ],
          answer: 0,
          explain: String.raw`内包表記の if はフィルタ。map + filter の短い書き方で、分析の前処理で頻出。`,
        },
        {
          q: String.raw`<code>from collections import Counter</code> のとき <code>Counter("abab").most_common(1)</code> の評価結果は?`,
          choices: [
            String.raw`<code>[("a", 2)]</code>`,
            String.raw`<code>{"a": 2}</code>`,
            String.raw`<code>2</code>`,
            String.raw`<code>[("a", 2), ("b", 2)]</code>`,
          ],
          answer: 0,
          explain: String.raw`most_common(n) は「(要素, 回数)」のタプルのリストを多い順に n 件返す。最頻値の抽出に使う。`,
        },
      ],
    },
  ],
};
