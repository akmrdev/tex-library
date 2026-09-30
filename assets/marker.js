// マーカー: 本文をドラッグ選択するとマーカーツールバーが出て、ハイライトを付けられる。
// 位置は節ID+本文テキストで記録するので、DOM の再構築(再ビルド・フォント変更)にも耐える。
// データ: localStorage["texlib-hl:<slug>"] = [{ id, sec, text, color }]
(function () {
  "use strict";

  var book = document.body.dataset.book;
  var body = document.getElementById("book-body");
  if (!book || !body) return;

  var KEY = "texlib-hl:" + book;
  var COLORS = ["yellow", "green", "pink", "blue"];
  var MAX_HL = 500;

  var hls = [];
  try { hls = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(hls.slice(-MAX_HL))); } catch (e) {}
  }

  // 既存マーク・数式・コードの中は対象外(二重マークや数式崩れを防ぐ)
  function skippable(node) {
    return !!node.parentElement.closest("mark.hl, .katex, script, style, pre, code");
  }

  // 節の中のテキストノードを連結した文字列と、ノードごとの範囲を作る。
  // 空白だけのノードも残す(段落をまたぐ選択のマッチングに必要)
  function textMap(secEl) {
    var map = [], all = "", pos = 0;
    var walker = document.createTreeWalker(secEl, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (skippable(n)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      map.push({ node: n, start: pos, end: pos + n.nodeValue.length });
      all += n.nodeValue;
      pos += n.nodeValue.length;
    }
    return { all: all, map: map };
  }

  // 1 件のハイライトを DOM に適用する(見つからなければ false)。
  // 選択文字列と DOM テキストの空白(改行・連続空白)の差は \s+ で吸収する
  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  function findText(secEl, text) {
    var m = textMap(secEl);
    var re = new RegExp(text.trim().split(/\s+/).map(escapeRe).join("\\s+"));
    var hit = re.exec(m.all);
    if (!hit) return null;
    return { map: m.map, start: hit.index, end: hit.index + hit[0].length };
  }

  function applyHl(hl) {
    var secEl = document.getElementById(hl.sec);
    if (!secEl) return false;
    var found = findText(secEl, hl.text);
    if (!found) return false;
    var at = found.start, end = found.end;
    // 範囲に重なるテキストノードを、はみ出し部分を分割しながら mark で包む
    found.map.forEach(function (e) {
      if (e.end <= at || e.start >= end) return;
      var s = Math.max(0, at - e.start);
      var t = Math.min(e.node.nodeValue.length, end - e.start);
      if (t <= s) return;
      var r = document.createRange();
      r.setStart(e.node, s);
      r.setEnd(e.node, t);
      var mark = document.createElement("mark");
      mark.className = "hl hl-" + hl.color;
      mark.dataset.hlId = hl.id;
      mark.title = "クリックでマーカーを削除";
      try { r.surroundContents(mark); } catch (err) { /* まれな構造では諦める */ }
    });
    return true;
  }

  function restoreAll() {
    hls.forEach(applyHl);
  }

  // ---- ツールバー ----
  var bar = document.createElement("div");
  bar.id = "hl-bar";
  bar.hidden = true;
  COLORS.forEach(function (c) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "hl-btn hl-swatch-" + c;
    b.setAttribute("aria-label", "マーカー(" + c + ")");
    b.title = "マーカー(" + c + ")";
    b.addEventListener("mousedown", function (e) { e.preventDefault(); }); // 選択を解除させない
    b.addEventListener("click", function () { addHl(c); });
    bar.appendChild(b);
  });
  document.body.appendChild(bar);

  function currentSelection() {
    var sel = window.getSelection();
    if (!sel.rangeCount || sel.isCollapsed) return null;
    var text = sel.toString();
    if (!text || text.trim().length < 2) return null;
    var range = sel.getRangeAt(0);
    var secEl = (range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement)
      .closest(".sec");
    if (!secEl || !body.contains(secEl)) return null;
    // 1 節の中に収まっているか(またいでも開始節に記録するが、長すぎる選択は無視)
    if (text.length > 400) return null;
    return { sel: sel, range: range, secEl: secEl, text: text.trim() };
  }

  function showBar(rect) {
    bar.hidden = false;
    var top = rect.top + window.scrollY - bar.offsetHeight - 8;
    var left = rect.left + rect.width / 2 + window.scrollX - bar.offsetWidth / 2;
    left = Math.max(8, Math.min(left, document.documentElement.clientWidth - bar.offsetWidth - 8));
    bar.style.top = Math.max(8, top) + "px";
    bar.style.left = left + "px";
  }

  function hideBar() { bar.hidden = true; }

  function addHl(color) {
    var cur = currentSelection();
    if (!cur) { hideBar(); return; }
    var hl = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      sec: cur.secEl.id,
      text: cur.text,
      color: color
    };
    // 同じ箇所の二重登録を防ぐ
    var dup = hls.some(function (h) { return h.sec === hl.sec && h.text === hl.text; });
    if (!dup) {
      hls.push(hl);
      save();
      applyHl(hl);
    }
    cur.sel.removeAllRanges();
    hideBar();
  }

  // ---- 選択の監視 ----
  var pending = null;
  function onSelectionChange() {
    clearTimeout(pending);
    pending = setTimeout(function () {
      var cur = currentSelection();
      if (!cur) { hideBar(); return; }
      var rect = cur.range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { hideBar(); return; }
      showBar(rect);
    }, 250);
  }
  document.addEventListener("selectionchange", onSelectionChange);
  // スクロールやタップ移動でツールバーが置き去りにならないように
  window.addEventListener("scroll", hideBar, { passive: true });

  // マークをクリックで削除
  body.addEventListener("click", function (e) {
    var mark = e.target.closest("mark.hl");
    if (!mark) return;
    var id = mark.dataset.hlId;
    hls = hls.filter(function (h) { return h.id !== id; });
    save();
    // 同じ id の mark は範囲分割で複数になることがある
    body.querySelectorAll('mark.hl[data-hl-id="' + id + '"]').forEach(function (m) {
      var parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    });
    e.preventDefault();
    e.stopPropagation();
  });

  restoreAll();
})();
