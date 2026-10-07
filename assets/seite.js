// Freunde schenken Freude – kleine Helfer, ohne externe Bibliotheken
(function () {
  "use strict";
  var body = document.body;

  // Mobiles Menü
  var mk = document.querySelector(".menue-knopf");
  if (mk) {
    mk.addEventListener("click", function () {
      var offen = body.classList.toggle("menue-offen");
      mk.setAttribute("aria-expanded", offen ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && body.classList.contains("menue-offen")) {
        body.classList.remove("menue-offen"); mk.setAttribute("aria-expanded", "false"); mk.focus();
      }
    });
  }

  // IBAN kopieren
  document.querySelectorAll("[data-kopieren]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-kopieren").replace(/\s/g, "");
      var fertig = function () { b.setAttribute("data-ok", ""); setTimeout(function () { b.removeAttribute("data-ok"); }, 2200); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(fertig, fertig);
      else { var a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); } catch (e) {} a.remove(); fertig(); }
    });
  });

  // Jahresfilter (Spenden / News)
  var filter = document.querySelector(".filter");
  if (filter) {
    filter.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var j = b.getAttribute("data-jahr");
      filter.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      document.querySelectorAll(".jahr").forEach(function (s) { s.hidden = j !== "alle" && s.getAttribute("data-jahr") !== j; });
    });
  }

  // Videos erst nach Klick laden (Datenschutz)
  document.querySelectorAll(".video-start").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + b.getAttribute("data-id") + "?autoplay=1&rel=0";
      f.title = b.getAttribute("data-titel");
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.setAttribute("allowfullscreen", "");
      b.parentNode.replaceChild(f, b);
    });
  });

  // Sanftes Einblenden beim Scrollen
  var el = document.querySelectorAll(".zeigen");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("sichtbar"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    el.forEach(function (x) { io.observe(x); });
  } else { el.forEach(function (x) { x.classList.add("sichtbar"); }); }
})();
