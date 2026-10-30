/* Kapitel 10 – Ventrikuläre Rhythmen und Breitkomplex-Tachykardie */
(function () {
  "use strict";
  const R = () => window.RHYTHMS;
  const ITEMS = {
    ves: { t: "VES", build: () => R().pvc({ pattern: "0001" }),
      txt: "<span class='tag'>Ventrikuläre Extrasystolen</span>Vorzeitige, <b>breite und deformierte</b> QRS-Komplexe ohne vorangehende P-Welle, ST-T diskordant. Die nächste Sinus-P-Welle fällt in die Refraktärzeit und wird nicht übergeleitet – es folgt eine <b>kompensatorische Pause</b> (Abstand der Sinusschläge um die VES = 2 × RR). Dieser Ursprung (rechtsventrikulärer Ausflusstrakt: LSB-artig, inferiore Achse) ist die häufigste Form bei Herzgesunden." },
    big: { t: "Bigeminus", build: () => R().pvc({ pattern: "01", hr: 72 }),
      txt: "<span class='tag'>Bigeminus</span>Regelmäßiger Wechsel von Normalschlag und Extrasystole. Pulsdefizit möglich, weil die frühen Extrasystolen hämodynamisch wenig auswerfen." },
    cpl: { t: "Couplet", build: () => R().vt({ n: 2, hr: 150, startAt: 3300, type: "rvot" }),
      txt: "<span class='tag'>Couplet</span>Zwei aufeinanderfolgende ventrikuläre Extrasystolen. Drei und mehr in Folge mit einer Frequenz &gt; 100/min gelten als ventrikuläre Tachykardie." },
    nsvt: { t: "nsVT", build: () => R().vt({ n: 6, hr: 175, startAt: 3000 }),
      txt: "<span class='tag'>Nicht anhaltende VT</span>≥ 3 ventrikuläre Schläge in Folge mit &gt; 100/min, Dauer &lt; 30 s und spontanes Ende (ESC 2022). Bedeutung hängt von der Herzerkrankung ab: bei struktureller Herzerkrankung Risikomarker, bei Herzgesunden oft gutartig." },
    vt: { t: "Monomorphe VT", build: () => R().vt({ n: 60, hr: 175, startAt: 1800 }),
      txt: "<span class='tag'>Anhaltende monomorphe VT</span>Regelmäßige Breitkomplex-Tachykardie (hier 175/min) mit gleichförmigen Komplexen, Dauer ≥ 30 s oder Terminierung wegen Instabilität nötig. Typische Hinweise: <b>AV-Dissoziation</b> (P-Wellen laufen unabhängig durch, siehe Leiterdiagramm), Achse „Nordwest“ (−90° bis ±180°), sehr breiter QRS, Fusions- oder Capture-Schläge. Häufigste Ursache: Narbe nach Infarkt." },
    tdp: { t: "Torsade de pointes", build: () => R().torsade(), fs: 400,
      txt: "<span class='tag'>Torsade de pointes</span>Polymorphe VT, deren QRS-Achse sich spindelförmig um die Grundlinie „dreht“. Tritt bei <b>verlängerter QT-Zeit</b> auf (angeboren oder durch Medikamente, Hypokaliämie, Hypomagnesiämie, Bradykardie), oft nach einer Pause („short-long-short“). Akuttherapie u. a. Magnesium intravenös, auslösende Faktoren beseitigen." },
    vf: { t: "Kammerflimmern", build: () => R().vf(),
      txt: "<span class='tag'>Kammerflimmern</span>Völlig unkoordinierte Kammererregung ohne abgrenzbare QRS-Komplexe – funktioneller Kreislaufstillstand. Sofortige Defibrillation und Reanimation." },
  };

  // Brugada-Algorithmus als klickbarer Entscheidungsbaum
  const STEPS = [
    { q: "Fehlt in <b>allen</b> Brustwandableitungen ein RS-Komplex (nur R, nur QS oder qR)?", yes: "VT", no: 1, why: "Konkordanz: alle präkordialen Komplexe gleich gerichtet – spricht für VT." },
    { q: "Ist in irgendeiner Brustwandableitung das <b>RS-Intervall</b> (Beginn R bis tiefster Punkt S) &gt; 100 ms?", yes: "VT", no: 2, why: "Ein sehr langsamer initialer Anteil spricht für Erregung über das Arbeitsmyokard." },
    { q: "Liegt eine <b>AV-Dissoziation</b> vor (P-Wellen unabhängig, Fusions- oder Capture-Schläge)?", yes: "VT", no: 3, why: "AV-Dissoziation ist hochspezifisch für VT." },
    { q: "Erfüllen V1/V2 <b>und</b> V6 die morphologischen VT-Kriterien (getrennt für RSB- und LSB-artige Komplexe)?", yes: "VT", no: "SVT", why: "Z. B. RSB-artig: monophasisches R oder qR in V1, R/S &lt; 1 in V6; LSB-artig: breites r &gt; 30 ms oder Knotung im S-Abstieg in V1/V2, qR in V6." },
  ];
  function initTree() {
    const root = document.getElementById("fig-10b");
    if (!root) return;
    const box = root.querySelector(".tree");
    let path = [];
    function render() {
      const html = [];
      let i = 0;
      for (const ans of path) {
        const s = STEPS[i];
        html.push(`<div class="tstep done"><span class="n">${i + 1}</span><div>${s.q}<div class="ans">${ans ? "Ja" : "Nein"}</div></div></div>`);
        const next = ans ? s.yes : s.no;
        if (typeof next === "string") {
          html.push(next === "VT"
            ? `<div class="tresult vt"><b>→ Ventrikuläre Tachykardie</b><p>${s.why}</p></div>`
            : `<div class="tresult svt"><b>→ SVT mit Aberration möglich</b><p>Nur wenn alle vier Schritte negativ sind. Im Zweifel – und besonders bei struktureller Herzerkrankung – wie eine VT behandeln (ESC 2022).</p></div>`);
          html.push(`<button type="button" class="btn ghost reset">Neu beginnen</button>`);
          box.innerHTML = html.join(""); box.querySelector(".reset").addEventListener("click", () => { path = []; render(); });
          return;
        }
        i = next;
      }
      const s = STEPS[i];
      html.push(`<div class="tstep"><span class="n">${i + 1}</span><div>${s.q}<div class="tbtns"><button type="button" class="btn yes">Ja</button><button type="button" class="btn ghost no">Nein</button></div></div></div>`);
      box.innerHTML = html.join("");
      box.querySelector(".yes").addEventListener("click", () => { path.push(true); render(); });
      box.querySelector(".no").addEventListener("click", () => { path.push(false); render(); });
    }
    render();
    const canvas = root.querySelector("canvas");
    const r = window.RHYTHMS.vt({ n: 80, hr: 160, startAt: 0, type: "pb" });
    const sig = U.model12(r.schedule);
    U.canvas(canvas, (w) => U.layout12(w, {}).h, (ctx, w, h) => U.draw12(ctx, w, h, sig, {}));
  }

  U.quizzes({ kap10: [
    { q: "Was kennzeichnet eine ventrikuläre Extrasystole typischerweise?", a: ["Vorzeitige P-Welle mit schmalem QRS", "Vorzeitiger, breiter, deformierter QRS ohne vorangehende P-Welle mit kompensatorischer Pause", "Verlängerte PQ-Zeit", "Fehlen einer T-Welle"], c: 1, e: "Die Erregung startet im Ventrikel und breitet sich langsam über das Myokard aus. Der Sinusknoten wird meist nicht zurückgesetzt – daher die kompensatorische Pause." },
    { q: "Ab wann spricht man von einer anhaltenden VT?", a: ["Ab 3 Schlägen", "Ab 10 Schlägen", "Ab ≥ 30 s Dauer oder wenn sie wegen Instabilität früher beendet werden muss", "Ab einer Frequenz von 200/min"], c: 2, e: "Definition nach ESC 2022: anhaltend ≥ 30 s oder hämodynamisch instabil mit früherer Terminierung; ≥ 3 Schläge bis &lt; 30 s = nicht anhaltend." },
    { q: "Welcher Befund spricht bei einer Breitkomplex-Tachykardie am stärksten für eine VT?", a: ["Frequenz 160/min", "AV-Dissoziation mit Capture- oder Fusionsschlägen", "Typischer RSB-Aspekt in V1", "Junger Patient"], c: 1, e: "AV-Dissoziation ist hochspezifisch für die VT. Die Frequenz hilft nicht weiter; ein typischer Schenkelblock-Aspekt spricht eher für eine Aberration." },
    { q: "Eine 70-jährige Patientin mit altem Vorderwandinfarkt hat eine regelmäßige Breitkomplex-Tachykardie, ist aber stabil. Wie gehst du vor?", a: ["Wie eine SVT behandeln, da sie stabil ist", "Im Zweifel wie eine VT behandeln", "Verapamil intravenös", "Abwarten"], c: 1, e: "Bei struktureller Herzerkrankung ist eine Breitkomplex-Tachykardie in der Mehrzahl eine VT. Stabilität schließt eine VT nicht aus; Verapamil kann bei VT zum Kreislaufkollaps führen." },
    { q: "Torsade de pointes tritt typischerweise auf bei …", a: ["kurzer QT-Zeit", "verlängerter QT-Zeit", "AV-Block I°", "WPW-Syndrom"], c: 1, e: "Die verlängerte Repolarisation begünstigt frühe Nachdepolarisationen, die die polymorphe Tachykardie auslösen. Auslöser: QT-verlängernde Medikamente, Hypokaliämie, Hypomagnesiämie, Bradykardie, angeborenes LQTS." },
  ] });

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("fig-10a");
    if (root) U.rhythmFigure(root, ITEMS, { leads: ["II", "V1"] });
    initTree();
  });
})();
