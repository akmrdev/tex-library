// 単語フラッシュカード: デッキ選択・3段階評価・SRS 風の記録・TTS
(function () {
  "use strict";
  var KEY = "texlib-cards:" + location.pathname.split("/")[2]; // book slug
  var status = {};
  try { status = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  // 旧仕様(自己評価 ok/mid/again)からの移行: mid は要復習扱いにする
  Object.keys(status).forEach(function (k) {
    if (status[k] && status[k].s === "mid") status[k].s = "again";
  });
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(status)); } catch (e) {}
  }

  var state = {
    decks: [], deckId: null, queue: [], pos: 0,
    filter: "new", shuffled: false, tts: true, revealed: false
  };
  var $ = function (id) { return document.getElementById(id); };

  function statusOf(id) { return (status[id] && status[id].s) || "new"; }

  // デッキ種別: "choice"(問題文+選択肢が確定済み) / "words"(単語+動的誤答)
  function isWordDeck(deck) { return deck.type === "words"; }

  function buildQueue() {
    var deck = state.decks.find(function (d) { return d.id === state.deckId; });
    if (!deck) return;
    var items;
    if (isWordDeck(deck)) {
      items = deck.words.filter(function (w) {
        if (state.filter === "new") return statusOf(w.id) === "new";
        if (state.filter === "again") return statusOf(w.id) === "again";
        return true;
      });
    } else {
      items = deck.cards.filter(function (c) {
        if (state.filter === "new") return statusOf(c.id) === "new";
        if (state.filter === "again") return statusOf(c.id) === "again";
        return true;
      });
    }
    if (state.shuffled) {
      for (var i = items.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = items[i]; items[i] = items[j]; items[j] = t;
      }
    }
    state.queue = items;
    state.pos = 0;
  }

  function deckStats(deck) {
    var items = isWordDeck(deck) ? deck.words : deck.cards;
    var ok = 0;
    items.forEach(function (w) { if (statusOf(w.id) === "ok") ok++; });
    return ok;
  }

  function renderChips() {
    var box = $("deck-chips");
    box.innerHTML = "";
    state.decks.forEach(function (d) {
      var b = document.createElement("button");
      b.className = "deck-chip" + (d.id === state.deckId ? " active" : "");
      b.textContent = d.name + "(" + deckStats(d) + "/" + (isWordDeck(d) ? d.words : d.cards).length + ")";
      b.addEventListener("click", function () {
        state.deckId = d.id;
        buildQueue();
        renderChips();
        renderCard();
      });
      box.appendChild(b);
    });
  }

  // 音声選択: OS 内蔵の変な声(Albert・Zarvox など)を避け、自然な英語音声を選ぶ
  var voice = null;
  var PREFERRED = ["Samantha", "Daniel", "Karen", "Moira", "Tessa", "Google US English", "Aria", "Ava", "Libby", "Sonia"];
  var AVOID = /Albert|Bahh|Bells|Boing|Bubbles|Cellos|Jester|Junior|Organ|Trinoids|Whisper|Wobble|Zarvox|Bad News|Good News|Superstar|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley|Fred|Kathy|Ralph/i;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var en = speechSynthesis.getVoices().filter(function (v) {
      return /^en([-_]|$)/i.test(v.lang) && !AVOID.test(v.name);
    });
    voice = null;
    for (var i = 0; i < PREFERRED.length && !voice; i++) {
      voice = en.find(function (v) { return v.name.indexOf(PREFERRED[i]) !== -1; });
    }
    if (!voice) voice = en.find(function (v) { return v.lang === "en-US"; }) || en[0] || null;
    window.__voice = voice; // デバッグ用
  }
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
    // Chromium 系は初回 getVoices() が空のことがあるのでポーリング
    (function ensureVoices(n) {
      if (voice || n > 20) return;
      setTimeout(function () { pickVoice(); ensureVoices(n + 1); }, 300);
    })(0);
  }

  function speak(text) {
    if (!state.tts || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    if (voice) u.voice = voice;
    u.rate = 0.92;    // 学習用にややゆっくり
    speechSynthesis.speak(u);
  }

  function renderCard() {
    var area = $("card-area"), done = $("done-msg");
    if (state.pos >= state.queue.length) {
      area.style.display = "none";
      done.style.display = "block";
      $("done-text").textContent = state.filter === "new"
        ? "未学習カードがなくなりました!別のデッキや「すべて」フィルタで復習できます。"
        : "このデッキは一周しました!";
      renderChips();
      return;
    }
    area.style.display = "block";
    done.style.display = "none";
    var item = state.queue[state.pos];
    var deck = state.decks.find(function (d) { return d.id === state.deckId; });
    $("judge-msg").textContent = "";
    $("judge-msg").className = "";
    $("btn-next").classList.remove("show");
    $("pos-text").textContent = (state.pos + 1) + " / " + state.queue.length + " 枚目";
    $("ok-text").textContent = deck ? "✅ " + deckStats(deck) + "/" + (isWordDeck(deck) ? deck.words : deck.cards).length + " 正解済み" : "";
    $("deck-bar").firstElementChild.style.width = (100 * state.pos / Math.max(1, state.queue.length)) + "%";

    if (isWordDeck(deck)) {
      $("card-en").textContent = item.en;
      renderWordChoices(item, deck);
      speak(item.en);
    } else {
      $("card-en").innerHTML = item.q;   // ビルド時に KaTeX 済みの HTML
      renderFixedChoices(item);
    }
  }

  // choice デッキ: 原稿に書かれた選択肢をシャッフルして表示
  function renderFixedChoices(card) {
    var box = $("choices");
    box.innerHTML = "";
    var opts = card.choices.map(function (c, i) { return { html: c, correct: i === card.answer }; });
    shuffle(opts);
    opts.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.innerHTML = opt.html;
      b.addEventListener("click", function () { judge(b, opt.correct, card); });
      box.appendChild(b);
    });
  }

  // words デッキ: 正解 1 + 同デッキから誤答 3
  function renderWordChoices(w, deck) {
    var box = $("choices");
    box.innerHTML = "";
    var pool = (deck ? deck.words : []).filter(function (x) { return x.id !== w.id && x.ja !== w.ja; });
    if (pool.length < 3) {
      state.decks.forEach(function (d) {
        if (d.id === state.deckId) return;
        d.words.forEach(function (x) { if (x.id !== w.id && x.ja !== w.ja) pool.push(x); });
      });
    }
    shuffle(pool);
    var opts = shuffle([w.ja, pool[0].ja, pool[1].ja, pool[2].ja]);
    opts.forEach(function (ja) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = ja;
      b.addEventListener("click", function () { judge(b, ja === w.ja, w); });
      box.appendChild(b);
    });
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // 正誤判定で記録: 正解 -> ok / 誤答 -> again。進むかどうかはユーザーが選択。
  function judge(btn, correct, item) {
    var buttons = $("choices").querySelectorAll("button");
    var answerText = "";
    buttons.forEach(function (b) {
      b.disabled = true;
      var isAnswer = isWordDeck(state.decks.find(function (d) { return d.id === state.deckId; }))
        ? b.textContent === item.ja
        : b.innerHTML === item.choices[item.answer];
      if (isAnswer) { b.classList.add("correct"); answerText = b.textContent; }
      else if (b === btn && !correct) b.classList.add("wrong");
    });
    var msg = $("judge-msg");
    if (correct) {
      msg.textContent = "✅ 正解!";
      msg.className = "good";
      status[item.id] = { s: "ok", t: Date.now() };
    } else {
      msg.textContent = isWordDeck(state.decks.find(function (d) { return d.id === state.deckId; }))
        ? "❌ 不正解" + (answerText ? " — 正解は「" + answerText + "」" : "")
        : "❌ 不正解 — 正解の選択肢は緑で表示されています";
      msg.className = "bad";
      status[item.id] = { s: "again", t: Date.now() };
    }
    if (item.ex_en) {
      var ex = document.createElement("span");
      ex.className = "ex";
      ex.textContent = item.ex_en + (item.ex_ja ? " — " + item.ex_ja : "");
      msg.appendChild(ex);
    } else if (item.explain) {
      var exp = document.createElement("span");
      exp.className = "ex";
      exp.innerHTML = item.explain;
      msg.appendChild(exp);
    }
    save();
    if (item.en) speak(item.en);
    $("btn-next").classList.add("show");
    $("btn-next").focus();
  }

  function advance() {
    if (!$("btn-next").classList.contains("show")) return;
    $("btn-next").classList.remove("show");
    state.pos++;
    renderCard();
    if (state.pos % 5 === 0) renderChips();
  }

  // 解答済みのとき Enter / Space / → でも次へ
  document.addEventListener("keydown", function (e) {
    if (!$("btn-next").classList.contains("show")) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
      e.preventDefault();
      advance();
    }
  });

  fetch("decks.json")
    .then(function (r) { return r.json(); })
    .then(function (decks) {
      state.decks = decks;
      state.deckId = decks[0] && decks[0].id;
      buildQueue();
      renderChips();
      renderCard();
    })
    .catch(function (e) { window.__cardErr = (e.stack || e.message); });

  // カード本体のクリックで再読み上げ
  $("card").addEventListener("click", function () {
    var w = state.queue[state.pos];
    if (w && w.en) speak(w.en);
  });
  $("btn-next").addEventListener("click", advance);
  document.getElementById("filter-line").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.filter) {
      document.querySelectorAll("#filter-line button[data-filter]").forEach(function (x) {
        x.classList.toggle("active", x === b);
      });
      state.filter = b.dataset.filter;
    } else if (b.id === "btn-shuffle") {
      state.shuffled = !state.shuffled;
      b.classList.toggle("active", state.shuffled);
    } else if (b.id === "btn-tts") {
      state.tts = !state.tts;
      b.classList.toggle("active", state.tts);
      if (!state.tts && window.speechSynthesis) speechSynthesis.cancel();
    }
    buildQueue();
    renderCard();
  });
})();
