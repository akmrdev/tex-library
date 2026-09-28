// リーダー: 目次生成・スクロールスパイ・読書進捗・検索・ハイライト・クイズ
// 数式はビルド時に KaTeX で HTML 化済み(実行時の数式描画なし)
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

  // ---- 目次リンク生成(節クリックでサブ節の開閉ができるグループ構造) ----
  var links = [];
  tocData.forEach(function (sec) {
    var group = document.createElement("div");
    group.className = "toc-group";
    var row = document.createElement("div");
    row.className = "toc-row";
    var a = document.createElement("a");
    a.href = "#" + sec.id;
    a.textContent = sec.num + ". " + sec.title;
    a.dataset.sec = sec.id;
    row.appendChild(a);
    links.push(a);
    if (sec.subs.length > 0) {
      var tog = document.createElement("button");
      tog.className = "toc-toggle";
      tog.type = "button";
      tog.setAttribute("aria-label", "サブ節の開閉");
      tog.textContent = "▸";
      tog.addEventListener("click", function () {
        group.classList.toggle("closed");
        tog.textContent = group.classList.contains("closed") ? "▸" : "▾";
      });
      row.appendChild(tog);
      sec.subs.forEach(function (sub) {
        var sa = document.createElement("a");
        sa.href = "#" + sub.id;
        sa.textContent = sub.num + " " + sub.title;
        sa.className = "sub";
        sa.dataset.sec = sub.id;
        group.appendChild(sa);
        links.push(sa);
      });
      group.classList.add("closed"); // サブ節は既定で折りたたみ
    }
    group.insertBefore(row, group.firstChild);
    tocNav.appendChild(group);
  });

  function expandGroup(id) {
    links.forEach(function (a) {
      if (a.dataset.sec !== id) return;
      var group = a.closest(".toc-group");
      if (group) {
        group.classList.remove("closed");
        var tog = group.querySelector(".toc-toggle");
        if (tog) tog.textContent = "▾";
      }
    });
  }

  function markDone(id, done) {
    links.forEach(function (a) {
      if (a.dataset.sec === id) a.classList.toggle("done", done);
    });
  }
  tocData.forEach(function (sec) {
    if (progress.read.indexOf(sec.id) !== -1) markDone(sec.id, true);
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
      expandGroup(activeId);
      var a = tocNav.querySelector('a[data-sec="' + activeId + '"]');
      if (a) a.scrollIntoView({ block: "nearest" });
    }
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
  function closeToc() { toc.classList.remove("open"); overlay.classList.remove("show"); }
  document.getElementById("toc-toggle").addEventListener("click", function () {
    toc.classList.add("open");
    overlay.classList.add("show");
  });
  overlay.addEventListener("click", closeToc);
  tocNav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeToc();
  });

  // ---- 検索(この本の中) ----
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

  // ---- コードブロックにコピーボタン ----
  document.querySelectorAll("#book-body pre code").forEach(function (code) {
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "コピー";
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(code.textContent).then(function () {
        btn.textContent = "✓ コピーしました";
        btn.classList.add("copied");
        setTimeout(function () {
          btn.textContent = "コピー";
          btn.classList.remove("copied");
        }, 1600);
      });
    });
    code.parentElement.appendChild(btn);
  });

  // ---- キーボード操作 ----
  document.addEventListener("keydown", function (e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "/") {
      e.preventDefault();
      input.focus();
      return;
    }
    if (e.key === "t" || e.key === "T") {
      toc.classList.toggle("open");
      overlay.classList.toggle("show");
      return;
    }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      var idx = tocData.findIndex(function (s) { return s.id === activeId; });
      if (idx === -1) idx = 0;
      var next = e.key === "ArrowRight" ? Math.min(tocData.length - 1, idx + 1) : Math.max(0, idx - 1);
      var target = document.getElementById(tocData[next].id);
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }
  });

  // ---- 確認テスト ----
  var quizJson = document.getElementById("quiz-json");
  if (quizJson) renderQuiz(JSON.parse(quizJson.textContent));

  function renderQuiz(quiz) {
    var root = document.getElementById("quiz-root");
    var state = { correct: 0, answered: 0 };

    function draw() {
      root.innerHTML = "";
      state = { correct: 0, answered: 0 };
      quiz.forEach(function (item, qi) {
        var box = document.createElement("div");
        box.className = "quiz-q";
        var q = document.createElement("p");
        q.className = "q-text";
        q.innerHTML = '<span class="q-num">Q' + (qi + 1) + '.</span>' + escapeHtml(item.q);
        box.appendChild(q);
        var ul = document.createElement("ul");
        ul.className = "quiz-choices";
        item.choices.forEach(function (c, ci) {
          var li = document.createElement("li");
          var b = document.createElement("button");
          b.type = "button";
          b.textContent = c;
          b.addEventListener("click", function () {
            box.classList.add("answered");
            state.answered++;
            var isRight = ci === item.answer;
            if (isRight) state.correct++;
            ul.querySelectorAll("button").forEach(function (btn, i) {
              btn.disabled = true;
              if (i === item.answer) btn.classList.add("correct");
              else if (i === ci && !isRight) btn.classList.add("wrong");
            });
            if (state.answered === quiz.length) showScore();
          });
          li.appendChild(b);
          ul.appendChild(li);
        });
        box.appendChild(ul);
        var ex = document.createElement("p");
        ex.className = "quiz-explain";
        ex.textContent = "解説: " + item.explain;
        box.appendChild(ex);
        root.appendChild(box);
      });
      var score = document.createElement("p");
      score.id = "quiz-score";
      root.appendChild(score);
      var retry = document.createElement("button");
      retry.id = "quiz-retry";
      retry.type = "button";
      retry.textContent = "やり直す";
      retry.addEventListener("click", draw);
      root.appendChild(retry);
    }

    function showScore() {
      var score = document.getElementById("quiz-score");
      score.textContent = state.correct + " / " + quiz.length + " 問正解" +
        (state.correct === quiz.length ? " — 完璧です🎉" : state.correct >= quiz.length * 0.7 ? " — 良くできました!" : " — 解説を読み直してみましょう");
      if (progress.read.indexOf("quiz") === -1) {
        progress.read.push("quiz");
        markDone("quiz", true);
        saveProgress();
      }
    }

    draw();
  }

  // ---- 描画後処理と再開 ----
  if (window.hljs) hljs.highlightAll();
  updateSpy();

  var params = new URLSearchParams(location.search);
  var resume = params.get("resume");
  if (resume && document.getElementById(resume)) {
    setTimeout(function () {
      document.getElementById(resume).scrollIntoView();
    }, 300);
  }

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  }
})();
