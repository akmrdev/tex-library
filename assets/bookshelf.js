// 本棚: カテゴリ別の書架 + 絞り込み + 教科書カード + 横断検索 + 進捗の書き出し/読み込み
(function () {
  "use strict";
  var books = JSON.parse(document.getElementById("books-json").textContent);
  var shelf = document.getElementById("shelf");
  var filtersEl = document.getElementById("shelf-filters");

  // カテゴリを大きな書架(棚)にまとめる
  var GROUPS = [
    { id: "math",    name: "数学・論理",     match: ["数学", "統計", "論理学"] },
    { id: "prog",    name: "プログラミング", match: ["プログラミング", "AI", "実習書"] },
    { id: "money",   name: "投資・金融",     match: ["投資", "経済"] },
    { id: "science", name: "理科・健康",     match: ["理科", "物理", "健康と性能"] },
    { id: "study",   name: "学習・語学",     match: ["学習法", "勉強法", "英語"] },
    { id: "culture", name: "芸術・社会",     match: ["芸術", "心理学"] },
    { id: "ref",     name: "リファレンス",   match: ["リファレンス", "問題集", "辞典", "読み物"] }
  ];
  function groupOf(category) {
    for (var i = 0; i < GROUPS.length; i++) {
      if (GROUPS[i].match.indexOf(category) !== -1) return GROUPS[i].id;
    }
    return "misc";
  }
  function groupName(id) {
    if (id === "misc") return "その他";
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].id === id) return GROUPS[i].name;
    return id;
  }
  var order = GROUPS.map(function (g) { return g.id; }).concat(["misc"]);

  // 絞り込み状態(localStorage に保存)
  var filter = "all";
  try { filter = localStorage.getItem("texlib-shelf-filter") || "all"; } catch (e) {}
  if (filter !== "all" && order.indexOf(filter) === -1) filter = "all";

  function progressOf(slug) {
    var progress = { read: [], last: null };
    try { progress = JSON.parse(localStorage.getItem("texlib-progress:" + slug)) || progress; } catch (e) {}
    return progress;
  }

  function cardOf(b) {
    var progress = progressOf(b.slug);
    var pct = Math.min(100, Math.round((progress.read.length / Math.max(1, b.sections)) * 100));
    var card = document.createElement("a");
    card.className = "book-card";
    card.href = "/book/" + b.slug + "/" + (progress.last && pct > 0 && pct < 100 ? "?resume=" + progress.last : "");
    card.style.setProperty("--hue", b.hue);

    var progressHtml = "";
    if (pct > 0) {
      progressHtml = '<div class="book-progress">' +
        (pct >= 100 ? "読了 🎉 " : '<span class="resume-badge">つづきから</span> ') +
        pct + "% (" + progress.read.length + "/" + b.sections + " 節)" +
        '<div class="bar"><div class="fill" style="width:' + pct + '%"></div></div></div>';
    }
    var extras = b.rsvp ? '<span class="rsvp-chip">⚡ 速読対応</span>' : "";

    card.innerHTML =
      '<div class="book-icon">' + b.icon + "</div>" +
      "<h2>" + esc(b.title) + "</h2>" +
      '<p class="book-desc">' + esc(b.desc) + "</p>" +
      '<div class="book-meta"><span>' + esc(b.category) + "</span><span>" + b.sections + " 節</span>" +
      b.tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + extras + "</div>" +
      progressHtml;
    return card;
  }

  function sectionOf(groupId, groupBooks) {
    var sec = document.createElement("section");
    sec.className = "shelf-group";
    var h = document.createElement("h2");
    h.innerHTML = esc(groupName(groupId)) + ' <span class="count">' + groupBooks.length + " 冊</span>";
    var grid = document.createElement("div");
    grid.className = "shelf-grid";
    groupBooks.forEach(function (b) { grid.appendChild(cardOf(b)); });
    sec.appendChild(h);
    sec.appendChild(grid);
    return sec;
  }

  function render() {
    shelf.innerHTML = "";
    var byGroup = {};
    order.forEach(function (id) { byGroup[id] = []; });
    books.forEach(function (b) { byGroup[groupOf(b.category)].push(b); });

    if (filter === "all") {
      order.forEach(function (id) {
        if (byGroup[id].length) shelf.appendChild(sectionOf(id, byGroup[id]));
      });
    } else {
      shelf.appendChild(sectionOf(filter, byGroup[filter]));
    }
  }

  // ---- 絞り込みチップ ----
  function renderFilters() {
    var byGroup = {};
    order.forEach(function (id) { byGroup[id] = 0; });
    books.forEach(function (b) { byGroup[groupOf(b.category)]++; });

    filtersEl.innerHTML = "";
    var mk = function (id, label, count) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "shelf-chip" + (filter === id ? " active" : "");
      btn.setAttribute("aria-pressed", filter === id ? "true" : "false");
      btn.innerHTML = esc(label) + ' <span class="chip-count">' + count + "</span>";
      btn.addEventListener("click", function () {
        filter = id;
        try { localStorage.setItem("texlib-shelf-filter", filter); } catch (e) {}
        renderFilters();
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      filtersEl.appendChild(btn);
    };
    mk("all", "すべて", books.length);
    order.forEach(function (id) {
      if (byGroup[id]) mk(id, groupName(id), byGroup[id]);
    });
  }

  renderFilters();
  render();

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---- 横断検索 ----
  var searchInput = document.getElementById("global-search");
  var resultsBox = document.getElementById("global-results");
  var index = null;
  searchInput.addEventListener("input", function () {
    clearTimeout(searchInput._t);
    searchInput._t = setTimeout(function () {
      var q = searchInput.value.trim();
      if (q.length < 2) { resultsBox.classList.remove("open"); resultsBox.innerHTML = ""; return; }
      ensureIndex(function () { search(q); });
    }, 200);
  });
  resultsBox.addEventListener("click", function (e) {
    if (e.target.closest("a")) { resultsBox.classList.remove("open"); searchInput.value = ""; }
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".shelf-search")) resultsBox.classList.remove("open");
  });

  function ensureIndex(cb) {
    if (index) { cb(); return; }
    fetch("/search-index.json")
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; cb(); })
      .catch(function () { index = []; });
  }

  function search(q) {
    var lq = q.toLowerCase();
    var hits = [];
    index.forEach(function (entry) {
      var count = 0, pos = 0;
      var lt = entry.text.toLowerCase();
      while ((pos = lt.indexOf(lq, pos)) !== -1 && count < 50) { count++; pos += q.length; }
      var titleBonus = entry.title.toLowerCase().indexOf(lq) !== -1 ? 10 : 0;
      var bookBonus = entry.book.toLowerCase().indexOf(lq) !== -1 ? 5 : 0;
      var score = count + titleBonus + bookBonus;
      if (score > 0) {
        var first = entry.text.toLowerCase().indexOf(lq);
        var start = Math.max(0, first - 20);
        var frag = entry.text.slice(start, first + q.length + 44).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "<mark>$&</mark>");
        hits.push({ score: score, html: '<a href="/book/' + entry.slug + '/#' + entry.id + '"><span class="book-name">' + entry.icon + " " + esc(entry.book) + "</span><strong>" + esc(entry.title) + "</strong><br>" + (start > 0 ? "…" : "") + frag + "…</a>" });
      }
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    resultsBox.innerHTML = hits.length
      ? hits.slice(0, 20).map(function (h) { return h.html; }).join("")
      : '<div class="no-hit">「' + esc(q) + '」は見つかりませんでした</div>';
    resultsBox.classList.add("open");
  }

  // ---- 進捗の書き出し / 読み込み ----
  var msg = document.getElementById("progress-msg");
  function flash(text) {
    msg.textContent = text;
    setTimeout(function () { msg.textContent = ""; }, 3000);
  }
  document.getElementById("progress-export").addEventListener("click", function () {
    var all = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key.indexOf("texlib-") === 0) all[key] = localStorage.getItem(key);
    }
    var blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "texlib-progress-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
    flash("書き出しました");
  });
  document.getElementById("progress-import").addEventListener("click", function () {
    document.getElementById("progress-file").click();
  });
  document.getElementById("progress-file").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var imported = 0;
        Object.keys(data).forEach(function (key) {
          if (key.indexOf("texlib-") === 0 && (key.indexOf("texlib-progress:") === 0 || key.indexOf("texlib-hl:") === 0 || key === "texlib-prefs")) {
            localStorage.setItem(key, data[key]);
            imported++;
          }
        });
        flash(imported + " 件読み込みました");
        render();
      } catch (err) {
        flash("読み込みに失敗しました(不正なファイル)");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  }
})();
