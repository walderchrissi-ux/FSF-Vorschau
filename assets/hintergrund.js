// Freunde schenken Freude – bewegter Hintergrund
// Feine Glas- und Kohlestaub-Splitter, die sanft schweben.
// Mit der Maus (oder dem Finger) entsteht ein Wirbel, der die Splitter anzieht und aufleuchten lässt.
// Umgesetzt nach der Vorlage "ASMR Static Background", ohne React, ohne Bibliotheken.
(function () {
  "use strict";
  var leinwand = document.querySelector(".hintergrund");
  if (!leinwand) return;
  var ctx = leinwand.getContext("2d");
  if (!ctx) return;

  var ruhig = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = matchMedia("(pointer: coarse)").matches;
  var RADIUS = touch ? 180 : 280;     // Reichweite des Wirbels
  var WIRBEL = 0.07;
  var ZUG = 0.12;

  var breite, hoehe, dpr, teilchen = [], maus = { x: -1000, y: -1000 }, laeuft = false, rahmenId;

  function Teilchen() { this.neu(); }
  Teilchen.prototype.neu = function () {
    this.x = Math.random() * breite;
    this.y = Math.random() * hoehe;
    this.groesse = Math.random() * 1.5 + 0.5;
    this.vx = (Math.random() - 0.5) * 0.2;
    this.vy = (Math.random() - 0.5) * 0.2;
    // 70 % Kohlestaub, 30 % Glas
    this.farbe = Math.random() > 0.7 ? "240, 245, 255" : "80, 80, 85";
    this.alpha = Math.random() * 0.4 + 0.1;
    this.drehung = Math.random() * Math.PI * 2;
    this.drehTempo = (Math.random() - 0.5) * 0.05;
    this.glanz = 0;
  };
  Teilchen.prototype.bewegen = function () {
    var dx = maus.x - this.x, dy = maus.y - this.y;
    var abstand = Math.sqrt(dx * dx + dy * dy) || 1;
    if (abstand < RADIUS) {
      var kraft = (RADIUS - abstand) / RADIUS;
      this.vx += (dx / abstand) * kraft * ZUG;               // Anziehung
      this.vy += (dy / abstand) * kraft * ZUG;
      this.vx += (dy / abstand) * kraft * WIRBEL * 10;       // Wirbel (quer zum Radius)
      this.vy -= (dx / abstand) * kraft * WIRBEL * 10;
      this.glanz = kraft * 0.7;
    } else {
      this.glanz *= 0.92;
    }
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.95; this.vy *= 0.95;                        // Reibung
    this.vx += (Math.random() - 0.5) * 0.04;                 // leichtes Zittern
    this.vy += (Math.random() - 0.5) * 0.04;
    this.drehung += this.drehTempo + (Math.abs(this.vx) + Math.abs(this.vy)) * 0.05;
    if (this.x < -20) this.x = breite + 20;
    if (this.x > breite + 20) this.x = -20;
    if (this.y < -20) this.y = hoehe + 20;
    if (this.y > hoehe + 20) this.y = -20;
  };
  Teilchen.prototype.zeichnen = function () {
    var a = Math.min(this.alpha + this.glanz, 0.9);
    var s = this.groesse, c = Math.cos(this.drehung), si = Math.sin(this.drehung);
    ctx.setTransform(c * dpr, si * dpr, -si * dpr, c * dpr, this.x * dpr, this.y * dpr);
    // Leuchten ohne teures shadowBlur: ein größerer, zarter Lichthof hinter dem Splitter
    if (this.glanz > 0.3) {
      ctx.fillStyle = "rgba(180, 220, 255, " + (this.glanz * 0.35) + ")";
      ctx.beginPath();
      ctx.moveTo(0, -s * 5); ctx.lineTo(s * 2.4, 0); ctx.lineTo(0, s * 5); ctx.lineTo(-s * 2.4, 0);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = "rgba(" + this.farbe + ", " + a + ")";
    // scharfer Splitter (Raute)
    ctx.beginPath();
    ctx.moveTo(0, -s * 2.5); ctx.lineTo(s, 0); ctx.lineTo(0, s * 2.5); ctx.lineTo(-s, 0);
    ctx.closePath(); ctx.fill();
  };

  function einrichten() {
    dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2);
    breite = window.innerWidth; hoehe = window.innerHeight;
    leinwand.width = Math.round(breite * dpr); leinwand.height = Math.round(hoehe * dpr);
    // Anzahl an die Bildschirmfläche anpassen (Handy: weniger, schont den Akku)
    var anzahl = Math.min(1000, Math.round(breite * hoehe / (touch ? 1600 : 1300)));
    teilchen = [];
    for (var i = 0; i < anzahl; i++) teilchen.push(new Teilchen());
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, leinwand.width, leinwand.height);
    if (ruhig) einBild();
  }

  function einBild() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(0, 0, 0, 0.18)";              // leichte Bewegungsunschärfe
    ctx.fillRect(0, 0, leinwand.width, leinwand.height);
    for (var i = 0; i < teilchen.length; i++) { if (!ruhig) teilchen[i].bewegen(); teilchen[i].zeichnen(); }
  }

  function schleife() {
    einBild();
    rahmenId = requestAnimationFrame(schleife);
  }
  function start() { if (!laeuft && !ruhig) { laeuft = true; schleife(); } }
  function stopp() { laeuft = false; cancelAnimationFrame(rahmenId); }

  var zeitgeber;
  window.addEventListener("resize", function () { clearTimeout(zeitgeber); zeitgeber = setTimeout(einrichten, 150); });
  window.addEventListener("mousemove", function (e) { maus.x = e.clientX; maus.y = e.clientY; }, { passive: true });
  document.addEventListener("mouseleave", function () { maus.x = -1000; maus.y = -1000; });
  window.addEventListener("touchmove", function (e) { if (e.touches[0]) { maus.x = e.touches[0].clientX; maus.y = e.touches[0].clientY; } }, { passive: true });
  window.addEventListener("touchend", function () { maus.x = -1000; maus.y = -1000; }, { passive: true });
  // im Hintergrund-Tab anhalten
  document.addEventListener("visibilitychange", function () { document.hidden ? stopp() : start(); });

  einrichten();
  start();
})();
