/* Kapitel 9 – Schmalkomplex-Tachykardien */
(function () {
  "use strict";
  const R = () => window.RHYTHMS;
  const AD = [3500, 7000, "Adenosin-Wirkung"];
  const withBand = (r, on) => Object.assign(r, on ? { band: AD } : {});
  const ITEMS = {
    st: { t: "Sinustachykardie", build: (ad) => withBand(R().sinusTach({ hr: 135, slowFrom: ad ? AD[0] : null, slowTo: AD[1] }), ad),
      txt: (ad) => "<span class='tag'>Sinustachykardie</span>Regelmäßig, &gt; 100/min, vor jedem QRS eine P-Welle mit normaler Achse. Beginn und Ende allmählich. Immer nach der Ursache fragen (Fieber, Volumenmangel, Schmerz, Anämie, Hyperthyreose, Lungenembolie)." + (ad ? " <b>Adenosin</b>: Die Frequenz sinkt nur vorübergehend und steigt wieder an – keine Terminierung." : "") },
    af: { t: "Vorhofflimmern", af: true, build: (ad) => withBand(R().afib({ mean: 520, slowFrom: ad ? AD[0] : null, slowTo: AD[1] }), ad),
      txt: (ad) => "<span class='tag'>Vorhofflimmern</span><b>Absolut arrhythmisch</b>, keine P-Wellen, unregelmäßige Flimmerwellen (am besten in V1 sichtbar). Nach ESC 2024 genügt zur Diagnose ein 12-Kanal-EKG oder eine Registrierung von ≥ 30 s mit diesem Muster." + (ad ? " Adenosin verlangsamt die Überleitung kurz und macht die Flimmerwellen deutlicher – therapeutisch nicht sinnvoll." : "") },
    afl21: { t: "Vorhofflattern 2:1", build: (ad) => withBand(R().flutter({ ratio: 2, blockFrom: ad ? AD[0] : null, blockTo: AD[1] }), ad),
      txt: (ad) => "<span class='tag'>Typisches Vorhofflattern mit 2:1-Überleitung</span>Kreisende Erregung im rechten Vorhof um die Trikuspidalklappe (kavotrikuspidaler Isthmus), Vorhoffrequenz um 300/min. <b>Sägezahnmuster</b>, negativ in II, III, aVF, positiv in V1. Bei 2:1-Überleitung regelmäßige Kammerfrequenz um 150/min – jede zweite Flatterwelle steckt im QRS oder in der T-Welle." + (ad ? " <b>Adenosin</b> blockiert den AV-Knoten vorübergehend: Die Flatterwellen werden frei sichtbar, das Flattern selbst läuft weiter (diagnostisch, nicht therapeutisch)." : " Tipp: Bei regelmäßiger Schmalkomplex-Tachykardie um 150/min immer an Flattern denken.") },
    afl4: { t: "Vorhofflattern 4:1", build: (ad) => withBand(R().flutter({ ratio: 4, blockFrom: ad ? AD[0] : null, blockTo: AD[1] }), ad),
      txt: "<span class='tag'>Vorhofflattern mit 4:1-Überleitung</span>Kammerfrequenz um 75/min, die Sägezahnwellen sind zwischen den QRS-Komplexen gut sichtbar. Wechselnde Überleitung (2:1/4:1) macht den Rhythmus scheinbar unregelmäßig." },
    avnrt: { t: "AVNRT", build: (ad) => withBand(R().avnrt({ stopAt: ad ? AD[0] + 300 : null }), ad),
      txt: (ad) => "<span class='tag'>AV-Knoten-Reentry-Tachykardie (typisch, slow-fast)</span>Kreisende Erregung im AV-Knoten über eine langsame und eine schnelle Bahn; häufigste regelmäßige Schmalkomplex-Tachykardie bei sonst Herzgesunden. Plötzlicher Beginn und plötzliches Ende, 140–250/min. Vorhöfe und Kammern werden fast gleichzeitig erregt: P-Wellen sind im QRS versteckt oder erscheinen direkt danach als <b>Pseudo-r′ in V1</b> bzw. Pseudo-S in II, III, aVF (RP sehr kurz)." + (ad ? " <b>Adenosin</b> blockiert den AV-Knoten – der Kreis wird unterbrochen, die Tachykardie endet abrupt, danach Sinusrhythmus." : "") },
    avrt: { t: "AVRT (orthodrom)", build: (ad) => withBand(R().avrt({ stopAt: ad ? AD[0] + 300 : null }), ad),
      txt: (ad) => "<span class='tag'>Orthodrome AV-Reentry-Tachykardie</span>Der Kreis läuft über den AV-Knoten zu den Kammern und über eine akzessorische Bahn zurück in die Vorhöfe. Schmaler QRS, retrograde P-Welle deutlich nach dem QRS (RP &gt; 70 ms), oft im ST-Segment. Im Sinusrhythmus kann eine Präexzitation (WPW-Muster) sichtbar sein – oder fehlen (verborgene Bahn)." + (ad ? " <b>Adenosin</b> unterbricht auch diesen Kreis am AV-Knoten. Danach zeigt sich hier im Sinusrhythmus die Delta-Welle." : "") },
    at: { t: "Fokale atriale Tachykardie", build: (ad) => withBand(R().focalAT({ blockFrom: ad ? AD[0] : null, blockTo: AD[1] }), ad),
      txt: (ad) => "<span class='tag'>Fokale atriale Tachykardie</span>Ein ektoper Vorhoffokus feuert schnell. Vor jedem QRS eine P-Welle mit <b>anderer Achse</b> als im Sinusrhythmus (hier negativ in II/III/aVF), langes RP-Intervall. Häufig bei struktureller Herzerkrankung, Digitalis-Überdosierung (dann oft mit AV-Block)." + (ad ? " <b>Adenosin</b> erzeugt einen vorübergehenden AV-Block; die Vorhoftachykardie läuft meist weiter – die P-Wellen werden deutlich." : "") },
  };

  function initGallery() {
    const root = document.getElementById("fig-9a");
    if (!root) return;
    const fig = U.rhythmFigure(root, ITEMS, { leads: ["II", "V1"] });
    const btn = root.querySelector(".adeno");
    let on = false;
    btn.addEventListener("click", () => { on = !on; btn.setAttribute("aria-pressed", on); btn.textContent = on ? "Adenosin: an" : "Adenosin geben"; fig.rebuild(on); });
    root.querySelector(".items").addEventListener("click", () => { on = false; btn.setAttribute("aria-pressed", "false"); btn.textContent = "Adenosin geben"; });
  }

  // ======================================================================
  // 9B  WPW: Präexzitation und präexzitiertes Vorhofflimmern
  // ======================================================================
  function initWPW() {
    const root = document.getElementById("fig-9b");
    if (!root) return;
    const canvas = root.querySelector("canvas"), readout = root.querySelector(".readout");
    const TXT = {
      sinus: "<span class='tag'>Normale Überleitung</span>PQ 160 ms, schmaler QRS ohne Delta-Welle.",
      wpw: "<span class='tag'>WPW-Muster (Präexzitation)</span>Die akzessorische Bahn umgeht den AV-Knoten und erregt einen Teil des Ventrikels vorzeitig: <b>kurze PQ-Zeit (&lt; 120 ms)</b>, <b>Delta-Welle</b> (träger QRS-Beginn), verbreiterter QRS und <b>sekundäre ST-T-Veränderungen</b>. Die Delta-Welle kann Q-Zacken vortäuschen (hier in I/aVL). Polarität der Delta-Welle in V1 positiv: eher linksseitige Bahn. Von einem WPW-<i>Syndrom</i> spricht man erst bei zusätzlichen Tachykardien.",
      pafib: "<span class='tag'>Vorhofflimmern bei WPW (präexzitiert)</span><b>Gefährlich</b>: Die Flimmererregung wird über die akzessorische Bahn ungebremst geleitet. Typisch: <b>unregelmäßig, sehr schnell, breite und wechselnd konfigurierte QRS-Komplexe</b>. Kann in Kammerflimmern übergehen. AV-Knoten-blockierende Medikamente (Adenosin, Verapamil, Diltiazem, Betablocker, Digitalis) sind kontraindiziert – sie können die Leitung über die Bahn noch begünstigen. Instabil: elektrische Kardioversion.",
    };
    let mode = "wpw", sig = null;
    const cv = U.canvas(canvas, (w) => U.layout12(w, {}).h, (ctx, w, h) => U.draw12(ctx, w, h, sig, { marks: mode === "wpw" ? { I: { tone: "focus" }, aVL: { tone: "focus" }, V1: { tone: "focus" }, II: { tone: "focus" } } : {} }));
    function update() {
      if (mode === "sinus") sig = U.sinus12({}, 72);
      else if (mode === "wpw") sig = U.sinus12(EKG.PRESETS.wpw(), 72);
      else {
        // präexzitiertes Vorhofflimmern: unregelmäßig, wechselnder Präexzitationsgrad
        let s = 11; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
        const sch = []; let t = 200;
        while (t < 10500) {
          const pre = 0.35 + 0.65 * rnd(), rr = 260 + 260 * rnd();
          const o = EKG.PRESETS.wpw();
          const beat = EKG.makeBeat(Object.assign(o, { hasP: false, pr: 0, qrsShift: 34 * pre + 10, qt: 300,
            extraComps: [EKG.comp("Präexzitation", 32 + 10 * pre, 26 + 10 * pre, 18, [-0.38, 0.25, 0.9], 0.6 + 0.9 * pre)], qrsScale: 0.85 - 0.4 * pre }));
          sch.push({ t0: t, beat }); t += rr;
        }
        const af = window.RHYTHMS.afib({}).extra;
        sig = U.model12(sch, { extra: af });
      }
      readout.innerHTML = TXT[mode];
      cv.redraw();
    }
    U.seg(root.querySelector(".mode"), (v) => { mode = v; update(); });
    update();
  }

  U.quizzes({ kap9: [
    { q: "Regelmäßige Schmalkomplex-Tachykardie mit genau 150/min. An welche Diagnose solltest du immer denken?", a: ["Sinustachykardie", "Vorhofflattern mit 2:1-Überleitung", "Ventrikuläre Tachykardie", "Vorhofflimmern"], c: 1, e: "Typisches Flattern hat eine Vorhoffrequenz um 300/min. Bei 2:1-Überleitung ergibt das 150/min; jede zweite Flatterwelle versteckt sich im QRS oder in der T-Welle." },
    { q: "Unregelmäßige Schmalkomplex-Tachykardie ohne P-Wellen. Was ist am wahrscheinlichsten?", a: ["AVNRT", "Vorhofflimmern", "Sinustachykardie", "Vorhofflattern 2:1"], c: 1, e: "Absolute Arrhythmie ohne P-Wellen ist das Kennzeichen des Vorhofflimmerns. AVNRT und Flattern mit fester Überleitung sind regelmäßig." },
    { q: "Was bewirkt Adenosin bei einer typischen AVNRT?", a: ["Nichts", "Es macht Flatterwellen sichtbar, die Tachykardie läuft weiter", "Es unterbricht den Reentry-Kreis im AV-Knoten und beendet die Tachykardie", "Es löst Vorhofflimmern aus"], c: 2, e: "Der AV-Knoten ist Teil des Kreises; die kurze AV-Blockade durch Adenosin terminiert AVNRT und orthodrome AVRT. Bei Vorhofflattern und atrialer Tachykardie wird nur die Überleitung vorübergehend blockiert." },
    { q: "Welche Befundtrias kennzeichnet das WPW-Muster im Sinusrhythmus?", a: ["Lange PQ, schmaler QRS, hohe T", "Kurze PQ (< 120 ms), Delta-Welle, verbreiterter QRS", "Fehlende P-Wellen, unregelmäßige RR-Abstände, schmaler QRS", "Sägezahnwellen, 2:1-Überleitung, schmaler QRS"], c: 1, e: "Die akzessorische Bahn umgeht die AV-Verzögerung (kurze PQ) und erregt den Ventrikel vorzeitig und langsam (Delta-Welle, breiter QRS); dazu sekundäre ST-T-Veränderungen." },
    { q: "Ein Patient mit bekanntem WPW hat eine unregelmäßige Tachykardie mit breiten, wechselnden QRS-Komplexen. Welches Medikament ist kontraindiziert?", a: ["Keines, alle sind sicher", "Verapamil", "Elektrische Kardioversion", "Sauerstoff"], c: 1, e: "Präexzitiertes Vorhofflimmern: AV-Knoten-blockierende Substanzen (Verapamil, Diltiazem, Adenosin, Betablocker, Digitalis) können die Leitung über die akzessorische Bahn begünstigen und Kammerflimmern auslösen." },
  ] });

  document.addEventListener("DOMContentLoaded", () => { initGallery(); initWPW(); });
})();
