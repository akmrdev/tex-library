// テーマ(ライト/ダーク)と文字サイズの設定。全ページ共通。
(function () {
  "use strict";
  var KEY = "texlib-prefs";
  var prefs = { theme: "light", fs: "m" };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY));
    if (saved) prefs = { theme: saved.theme || "light", fs: saved.fs || "m" };
  } catch (e) {}

  function apply() {
    var root = document.documentElement;
    root.dataset.theme = prefs.theme;
    root.dataset.fs = prefs.fs;
    var light = document.getElementById("hl-light");
    var dark = document.getElementById("hl-dark");
    if (light && dark) {
      light.disabled = prefs.theme === "dark";
      dark.disabled = prefs.theme !== "dark";
    }
    var btn = document.querySelector('.prefs button[data-pref="theme"]');
    if (btn) btn.textContent = prefs.theme === "dark" ? "☀️" : "🌙";
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {}
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".prefs button[data-pref]");
    if (!btn) return;
    if (btn.dataset.pref === "theme") {
      prefs.theme = prefs.theme === "dark" ? "light" : "dark";
    } else if (btn.dataset.pref === "font") {
      prefs.fs = prefs.fs === "s" ? "m" : prefs.fs === "m" ? "l" : "s";
    }
    apply();
  });

  apply();
})();
