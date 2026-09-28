// リーダー: 目次生成・スクロールスパイ・読書進捗・検索・KaTeX/ハイライト描画
(function () {
  "use strict";
  var book = document.body.dataset.book;
  var tocData = JSON.parse(document.getElementById("toc-json").textContent);
  var tocNav = document.getElementById("toc-nav");
  var fill = document.getElementById("toc-progress-fill");
  var progressText = document.getElementById("toc-progress-text");
  var PROGRESS_KEY = "texlib-progress:" + book;

  // ---- 進捗(localStorage) ----
  var progress = { read: [], last: null };
  try { progress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || progress; } catch (e) {}
  function saveProgress() {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch (e) {}
  }

  // ---- 目次リンク生成 ----
  var links = [];
  tocData.forEach(function (sec) {
    var a = document.createElement("a");
    a.href = "#" + sec.id;
    a.textContent = sec.title;
    a.dataset.sec = sec.id;
    tocNav.appendChild(a);
    links.push(a);
    sec.subs.forEach(function (sub) {
      var sa = document.createElement("a");
      sa.href = "#" + sub.id;
      sa.textContent = sub.title;
      sa.className = "sub";
      sa.dataset.sec = sub.id;
      tocNav.appendChild(sa);
      links.push(sa);
    });
  });

  function markDone(id, done) {
    links.forEach(function (a) {
      if (a.dataset.sec === id && a.classList.contains("sub")) a.classList.toggle("done", done);
    });
    links.forEach(function (a) { if (a.dataset.sec === id && !a.classList.contains("sub")) a.classList.toggle("done", done); });
  }
  tocData.forEach(function (sec) {
    var done = progress.read.indexOf(sec.id) !== -1;
    if (done) markDone(sec.id, true);
  });

  // ---- スクロールスパイ + 読了判定 ----
  var secEls = Array.prototype.slice.call(document.querySelectorAll("#book-body .sec"));
  var activeId = null;
  function currentSection() {
    var y = window.scrollY + 120;
    var cur = secEls[0];
    secEls.forEach(function (el) { if (el.offsetTop <= y) cur = el; });
    return cur;
  }
  function updateSpy() {
    var cur = currentSection();
    if (!cur) return;
    if (cur.id !== activeId) {
      activeId = cur.id;
      links.forEach(function (a) { a.classList.toggle("active", a.dataset.sec === activeId); });
      var a = tocNav.querySelector('a[data-sec="' + activeId + '"]');
      if (a && a.classList.contains("sub")) a = tocNav.querySelector('a[data-sec="' + activeId + '"]');
      if (a) a.scrollIntoView({ block: "nearest" });
    }
    // 表示率に応じて進捗バーを更新
    var total = document.documentElement.scrollHeight - window.innerHeight;
    var pct = total > 0 ? Math.min(100, Math.round((window.scrollY / total) * 100)) : 0;
    fill.style.width = pct + "%";
    progressText.textContent = pct + "%";
    progress.last = cur.id;
    saveProgress();
  }
  var spyTimer = null;
  window.addEventListener("scroll", function () {
    if (spyTimer) return;
    spyTimer = setTimeout(function () { spyTimer = null; updateSpy(); }, 120);
  }, { passive: true });

  // 読了: セクションが 50% 以上見えたら記録
  if ("IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.intersectionRatio >= 0.5 && progress.read.indexOf(en.target.id) === -1) {
          progress.read.push(en.target.id);
          markDone(en.target.id, true);
          saveProgress();
        }
      });
    }, { threshold: [0.5] });
    secEls.forEach(function (el) { seen.observe(el); });
  }

  // ---- モバイル目次 ----
  var toc = document.getElementById("toc");
  var overlay = document.getElementById("toc-overlay");
  document.getElementById("toc-toggle").addEventListener("click", function () {
    toc.classList.add("open");
    overlay.classList.add("show");
  });
  overlay.addEventListener("click", closeToc);
  tocNav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeToc();
  });
  function closeToc() { toc.classList.remove("open"); overlay.classList.remove("show"); }

  // ---- 検索 ----
  var input = document.getElementById("search-input");
  var results = document.getElementById("search-results");
  var bodyText = {};
  secEls.forEach(function (el) {
    var h1 = el.querySelector("h1");
    bodyText[el.id] = {
      title: h1 ? h1.textContent : "",
      text: el.textContent.replace(/\s+/g, " ")
    };
  });
  var debounce = null;
  input.addEventListener("input", function () {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      var q = input.value.trim();
      if (q.length < 2) { results.classList.remove("open"); results.innerHTML = ""; return; }
      var hits = [];
      Object.keys(bodyText).forEach(function (id) {
        var t = bodyText[id];
        var idx = t.text.toLowerCase().indexOf(q.toLowerCase());
        if (idx !== -1) {
          var start = Math.max(0, idx - 24);
          var frag = t.text.slice(start, idx + q.length + 40).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "<mark>$&</mark>");
          hits.push('<a href="#' + id + '"><strong>' + escapeHtml(t.title) + "</strong><br>" + (start > 0 ? "…" : "") + frag + (idx + q.length + 40 < t.text.length ? "…" : "") + "</a>");
        }
      });
      results.innerHTML = hits.length ? hits.join("") : '<div class="no-hit">「' + escapeHtml(q) + '」は見つかりませんでした</div>';
      results.classList.add("open");
    }, 180);
  });
  results.addEventListener("click", function (e) {
    if (e.target.closest("a")) { results.classList.remove("open"); input.value = ""; }
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#search-box")) results.classList.remove("open");
  });
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---- KaTeX / ハイライト描画 ----
  function renderMath() {
    if (window.renderMathInElement) {
      renderMathInElement(document.getElementById("book-body"), {
        delimiters: [
          { left: "\\[", right: "\\]", display: true },
          { left: "\\(", right: "\\)", display: false }
        ],
        throwOnError: false
      });
    }
  }
  if (window.hljs) hljs.highlightAll();
  renderMath();
  updateSpy();

  // 「つづきから」: 前回位置のクエリパラメータ対応 (?resume=sec-id は本棚側で付与)
  var params = new URLSearchParams(location.search);
  var resume = params.get("resume");
  if (resume && document.getElementById(resume)) {
    setTimeout(function () {
      document.getElementById(resume).scrollIntoView();
    }, 300);
  }

  // Service Worker
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  }
})();
