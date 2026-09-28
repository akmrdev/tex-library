// 本棚: 教科書カード表示 + 進捗サマリ
(function () {
  "use strict";
  var books = JSON.parse(document.getElementById("books-json").textContent);
  var shelf = document.getElementById("shelf");

  books.forEach(function (b) {
    var key = "texlib-progress:" + b.slug;
    var progress = { read: [], last: null };
    try { progress = JSON.parse(localStorage.getItem(key)) || progress; } catch (e) {}
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

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  }
})();
