// 単語フラッシュカード: デッキ選択・3段階評価・SRS 風の記録・TTS
(function () {
  "use strict";
  var KEY = "texlib-cards:" + location.pathname.split("/")[2]; // book slug
  var status = {};
  try { status = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(status)); } catch (e) {}
  }

  var state = {
    decks: [], deckId: null, queue: [], pos: 0,
    filter: "new", shuffled: false, tts: true, revealed: false
  };
  var $ = function (id) { return document.getElementById(id); };

  function statusOf(id) { return (status[id] && status[id].s) || "new"; }

  function buildQueue() {
    var deck = state.decks.find(function (d) { return d.id === state.deckId; });
    if (!deck) return;
    var words = deck.words.filter(function (w) {
      if (state.filter === "new") return statusOf(w.id) === "new";
      if (state.filter === "again") return statusOf(w.id) === "again";
      return true;
    });
    if (state.shuffled) {
      for (var i = words.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = words[i]; words[i] = words[j]; words[j] = t;
      }
    }
    state.queue = words;
    state.pos = 0;
  }

  function deckStats(deck) {
    var ok = 0;
    deck.words.forEach(function (w) { if (statusOf(w.id) === "ok") ok++; });
    return ok;
  }

  function renderChips() {
    var box = $("deck-chips");
    box.innerHTML = "";
    state.decks.forEach(function (d) {
      var b = document.createElement("button");
      b.className = "deck-chip" + (d.id === state.deckId ? " active" : "");
      b.textContent = d.name + "(" + deckStats(d) + "/" + d.words.length + ")";
      b.addEventListener("click", function () {
        state.deckId = d.id;
        buildQueue();
        renderChips();
        renderCard();
      });
      box.appendChild(b);
    });
  }

  function speak(text) {
    if (!state.tts || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
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
    var w = state.queue[state.pos];
    state.revealed = false;
    $("card-en").textContent = w.en;
    $("card-ja").textContent = "";
    $("card-ex").textContent = "";
    $("pos-text").textContent = (state.pos + 1) + " / " + state.queue.length + " 枚目";
    var deck = state.decks.find(function (d) { return d.id === state.deckId; });
    $("ok-text").textContent = deck ? "✅ " + deckStats(deck) + "/" + deck.words.length + " 覚え済み" : "";
    $("deck-bar").firstElementChild.style.width = (100 * state.pos / Math.max(1, state.queue.length)) + "%";
    speak(w.en);
  }

  function reveal() {
    if (state.revealed) return;
    var w = state.queue[state.pos];
    state.revealed = true;
    $("card-ja").textContent = w.ja;
    $("card-ex").textContent = (w.ex_en ? w.ex_en + (w.ex_ja ? "\n" + w.ex_ja : "") : "");
  }

  function grade(s) {
    var w = state.queue[state.pos];
    if (!w) return;
    status[w.id] = { s: s, t: Date.now() };
    save();
    state.pos++;
    renderCard();
    if (state.pos % 5 === 0) renderChips();
  }

  fetch("decks.json")
    .then(function (r) { return r.json(); })
    .then(function (decks) {
      state.decks = decks;
      state.deckId = decks[0] && decks[0].id;
      buildQueue();
      renderChips();
      renderCard();
    });

  $("card").addEventListener("click", reveal);
  $("btn-ok").addEventListener("click", function () { grade("ok"); });
  $("btn-mid").addEventListener("click", function () { grade("mid"); });
  $("btn-again").addEventListener("click", function () { grade("again"); });
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
