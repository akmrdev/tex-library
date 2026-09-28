// 本棚: 教科書カード + 横断検索 + 進捗の書き出し/読み込み
(function () {
  "use strict";
  var books = JSON.parse(document.getElementById("books-json").textContent);
  var shelf = document.getElementById("shelf");

  function progressOf(slug) {
    var progress = { read: [], last: null };
    try { progress = JSON.parse(localStorage.getItem("texlib-progress:" + slug)) || progress; } catch (e) {}
    return progress;
  }

  function render() {
    shelf.innerHTML = "";
    books.forEach(function (b) {
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

      card.innerHTML =
        '<div class="book-icon">' + b.icon + "</div>" +
        "<h2>" + esc(b.title) + "</h2>" +
        '<p class="book-desc">' + esc(b.desc) + "</p>" +
        '<div class="book-meta"><span>' + esc(b.category) + "</span><span>" + b.sections + " 節</span>" +
        b.tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" +
        progressHtml;
      shelf.appendChild(card);
    });
  }
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
          if (key.indexOf("texlib-") === 0 && (key.indexOf("texlib-progress:") === 0 || key === "texlib-prefs")) {
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
