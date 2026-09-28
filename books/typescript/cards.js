// TypeScript の型推論クイズ
export default {
  decks: [
    {
      id: "types",
      name: "型推論と型ユーティリティ",
      cards: [
        {
          q: String.raw`<code>const a = [1, 2, 3];</code> のとき <code>a</code> の型は?`,
          choices: [
            String.raw`<code>number[]</code>`,
            String.raw`<code>(1 | 2 | 3)[]</code>`,
            String.raw`<code>readonly [1, 2, 3]</code>`,
            String.raw`<code>any[]</code>`,
          ],
          answer: 0,
          explain: String.raw`配列リテラルは要素型の配列に推論される。リテラル型の固定タプルにしたいなら <code>as const</code> を付ける。`,
        },
        {
          q: String.raw`<code>let b = cond ? "long" : "short";</code> のとき <code>b</code> の型は?`,
          choices: [
            String.raw`<code>"long" | "short"</code>`,
            String.raw`<code>string</code>`,
            String.raw`<code>"long"</code>`,
            String.raw`<code>unknown</code>`,
          ],
          answer: 0,
          explain: String.raw`三項演算子の両辺のリテラル型のユニオンに推論される。let なので広げすぎず、取りうる値の集合そのもの。`,
        },
        {
          q: String.raw`<code>function first&lt;T&gt;(items: T[]): T | undefined</code> に対する <code>first(["a", "b"])</code> の戻り値の型は?`,
          choices: [
            String.raw`<code>string | undefined</code>`,
            String.raw`<code>string</code>`,
            String.raw`<code>T | undefined</code>(そのまま)`,
            String.raw`<code>unknown</code>`,
          ],
          answer: 0,
          explain: String.raw`ジェネリクスは呼び出し時に T が決まる。空配列の可能性があるため undefined とのユニオンが正確な型。`,
        },
        {
          q: String.raw`<code>type Config = { host: string; port: number; debug: boolean }</code> のとき <code>keyof Config</code> は?`,
          choices: [
            String.raw`<code>"host" | "port" | "debug"</code>`,
            String.raw`<code>string | number | boolean</code>`,
            String.raw`<code>Config</code>`,
            String.raw`<code>number</code>`,
          ],
          answer: 0,
          explain: String.raw`keyof は「プロパティ名(キー)のユニオン」を作る。<code>Config[K]</code> と組み合わせるとキーと値の型の対応を保てる。`,
        },
        {
          q: String.raw`<code>type User = { id: number; name: string; email: string }</code> のとき <code>Pick&lt;User, "id"&gt;</code> は?`,
          choices: [
            String.raw`<code>{ id: number }</code>`,
            String.raw`<code>{ name: string; email: string }</code>`,
            String.raw`<code>{ id: number } | User</code>`,
            String.raw`<code>number</code>`,
          ],
          answer: 0,
          explain: String.raw`Pick は指定キーだけを取り出す。除外したいなら Omit。派生型を元の型から作るのが保守しやすい設計。`,
        },
        {
          q: String.raw`switch 文の default で <code>const _x: never = value</code> と書く目的は?`,
          choices: [
            String.raw`ユニオンの全ケースを処理し忘れたらコンパイルエラーにするため`,
            String.raw`実行時エラーを握りつぶすため`,
            String.raw`any に暗黙変換するため`,
            String.raw`バンドルサイズを減らすため`,
          ],
          answer: 0,
          explain: String.raw`全ケースを処理済みなら value の型は never。新ケース追加時に代入がエラーになり処理漏れを検出できる。`,
        },
        {
          q: String.raw`<code>Record&lt;string, number&gt;</code> が表す型は?`,
          choices: [
            String.raw`「文字列キー → 数値」の辞書型全体`,
            String.raw`<code>string</code> か <code>number</code> のユニオン`,
            String.raw`<code>{ key: string; value: number }</code>`,
            String.raw`<code>number[]</code>`,
          ],
          answer: 0,
          explain: String.raw`Record&lt;K, V&gt; は「キー型 K → 値型 V」のマップ型を生成する。単語カウントなど集計結果の型付けに定番。`,
        },
        {
          q: String.raw`判別可能ユニオンの利点として正しいのは?`,
          choices: [
            String.raw`判別子の値で型が絞り込まれ、不正な状態を型レベルで排除できる`,
            String.raw`実行速度が必ず速くなる`,
            String.raw`JSON にできないデータも扱える`,
            String.raw`any を使わずに済むためバンドルが小さくなる`,
          ],
          answer: 0,
          explain: String.raw`if (r.status === "success") で分岐内の型が絞り込まれる(narrowing)。「ありえない組合せ」をコンパイル時に検出できるのが核心。`,
        },
      ],
    },
  ],
};
