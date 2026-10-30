/* Kapitel 8 – Schenkel- und Faszikelblöcke */
(function () {
  "use strict";
  const { el } = U;

  const rbbbLpfb = () => {
    const l = EKG.PRESETS.lpfb();
    return Object.assign({}, l, { qrsComps: [...l.qrsComps, EKG.comp("rechter Ventrikel, verspätet", 106, 16, 18, [-0.62, 0.1, 0.78], 0.85)], qrsDuration: 142, tVector: [0.4, 0.75, -0.3] });
  };
  const PATTERNS = {
    none: { t: "Normale Erregungsleitung", opts: () => ({}), focus: [],
      crit: ["QRS ≤ 110 ms", "septales q in I, aVL, V5, V6; kleines r in V1", "Umschlagzone V3/V4"] },
    rbbb: { t: "Kompletter Rechtsschenkelblock", opts: EKG.PRESETS.rbbb, focus: ["V1", "V2", "I", "V6"],
      crit: ["QRS ≥ 120 ms", "rsr′, rsR′ oder rSR′ in V1 oder V2 (R′ meist breiter als r)", "S in I und V6 breiter als R oder &gt; 40 ms", "normale R-Gipfelzeit in V5/V6, &gt; 50 ms in V1", "Die ersten drei Kriterien müssen erfüllt sein (AHA/ACCF/HRS)"],
      why: "Septum und linker Ventrikel werden regulär erregt (die ersten ≈ 60 ms des QRS sind normal). Der rechte Ventrikel wird erst danach langsam über das Myokard erregt – dieser späte Vektor zeigt nach rechts vorn: R′ in V1, breites S in I und V6. Die T-Welle ist in V1–V3 sekundär negativ." },
    lbbb: { t: "Kompletter Linksschenkelblock", opts: EKG.PRESETS.lbbb, focus: ["V1", "V2", "V3", "I", "aVL", "V5", "V6"],
      crit: ["QRS ≥ 120 ms", "breite, gekerbte oder verplumpte R in I, aVL, V5, V6", "kein q in I, V5, V6", "R-Gipfelzeit &gt; 60 ms in V5/V6, normal in V1–V3", "ST und T meist gegensinnig zum QRS (diskordant)"],
      why: "Das Septum wird von rechts nach links erregt (das septale q in I/V6 fehlt), anschließend der gesamte linke Ventrikel langsam über das Arbeitsmyokard. Der Hauptvektor zeigt nach links hinten: QS/rS in V1–V3, breites R in I, aVL, V5, V6. Die Repolarisation ist sekundär diskordant – ST-Hebungen in V1–V3 sind hier erwartbar und kein Infarktbeweis." },
    lafb: { t: "Linksanteriorer Hemiblock (LAH)", opts: EKG.PRESETS.lafb, focus: ["I", "aVL", "II", "III", "aVF"],
      crit: ["Achse −45° bis −90° (überdrehter Linkstyp)", "qR in aVL", "R-Gipfelzeit in aVL ≥ 45 ms", "QRS &lt; 120 ms"],
      why: "Der dünne anteriore Faszikel fällt aus; der linke Ventrikel wird zuerst über den posterioren Faszikel (von inferior) und dann nach superior-links erregt. Initial kleines r in II, III, aVF und q in aVL, dann Hauptvektor nach links oben: tiefe S in II, III, aVF." },
    lpfb: { t: "Linksposteriorer Hemiblock (LPH)", opts: EKG.PRESETS.lpfb, focus: ["I", "aVL", "III", "aVF"],
      crit: ["Achse +90° bis +180° beim Erwachsenen", "rS in I und aVL", "qR in III und aVF", "QRS &lt; 120 ms", "Ausschluss anderer Ursachen eines Rechtstyps (Rechtsherzbelastung, schlanker Habitus, lateraler Infarkt)"],
      why: "Selten, da der posteriore Faszikel breit und doppelt versorgt ist. Der Erregungsvektor zeigt nach rechts unten. Ein LPH ist eine Ausschlussdiagnose." },
    rbbbLafb: { t: "RSB + LAH", opts: EKG.PRESETS.rbbbLafb, focus: ["V1", "I", "V6", "II", "III", "aVF", "aVL"],
      crit: ["Kriterien des RSB (QRS ≥ 120 ms, R′ in V1, breites S in I/V6)", "plus überdrehter Linkstyp mit qR in aVL und rS inferior"],
      why: "Häufigste Kombination zweier Leitungsstörungen. Die AHA/ACCF/HRS-Empfehlungen raten, statt „bifaszikulärer Block“ beide Störungen einzeln zu benennen. Mit zusätzlichem AV-Block I° und Synkopen ist an eine intermittierende höhergradige Leitungsstörung zu denken." },
    rbbbLpfb: { t: "RSB + LPH", opts: rbbbLpfb, focus: ["V1", "I", "aVL", "III", "aVF"],
      crit: ["Kriterien des RSB", "plus Achse ≥ +90° mit rS in I/aVL und qR in III/aVF"],
      why: "Seltener als RSB + LAH, aber prognostisch ungünstiger, weil dann die Erregung der Kammern fast nur noch über den linksanterioren Faszikel läuft." },
    all: { t: "Alle Schenkel blockiert", opts: null, focus: [],
      crit: ["Keine Überleitung zu den Kammern: AV-Block III° (infranodal)", "Vorhöfe im Sinusrhythmus, Kammern über langsamen ventrikulären Ersatzrhythmus"],
      why: "Werden rechter Schenkel und beide linken Faszikel unterbrochen, entsteht ein kompletter AV-Block unterhalb des His-Bündels (Kapitel 7)." },
  };

  function patternFor(cut) {
    const { rbb, lbb, laf, lpf } = cut;
    const lAll = lbb || (laf && lpf);
    if (rbb && lAll) return "all";
    if (lAll) return "lbbb";
    if (rbb && laf) return "rbbbLafb";
    if (rbb && lpf) return "rbbbLpfb";
    if (rbb) return "rbbb";
    if (laf) return "lafb";
    if (lpf) return "lpfb";
    return "none";
  }

  function init() {
    const root = document.getElementById("fig-8a");
    if (!root) return;
    const svg = root.querySelector("svg.cs"), canvas = root.querySelector("canvas"), readout = root.querySelector(".readout");
    svg.setAttribute("viewBox", "0 0 340 330");
    const g = el("g", {}, svg);
    // Skizze: Septum und Kammern (schematisch)
    el("path", { d: "M40,92 C26,180 60,270 150,315 C240,270 274,180 260,92 C230,78 70,78 40,92 Z", class: "sk-stroke", fill: "var(--paper-2)", filter: "url(#sk-wobble)" }, g);
    el("path", { d: "M140,90 L150,300 L160,90", class: "sk-thin" }, g);
    el("text", { x: 82, y: 200, class: "sk-label", text: "RV", "text-anchor": "middle" }, g);
    el("text", { x: 218, y: 200, class: "sk-label", text: "LV", "text-anchor": "middle" }, g);
    el("ellipse", { cx: 150, cy: 40, rx: 10, ry: 7, fill: "var(--accent)" }, g);
    el("text", { x: 166, y: 34, class: "sk-label small", text: "AV-Knoten / His-Bündel" }, g);
    const paths = {
      his: "M150,47 L150,92",
      rbb: "M147,92 C138,150 132,210 120,268",
      lbb: "M153,92 L162,118",
      laf: "M162,118 C190,128 222,128 250,112",
      lpf: "M162,118 C178,170 196,214 214,250",
    };
    const labels = { rbb: ["rechter Schenkel", 70, 140], lbb: ["linker Schenkel", 172, 80], laf: ["linksanteriorer Faszikel", 176, 152], lpf: ["linksposteriorer Faszikel", 196, 286] };
    const cut = { rbb: false, lbb: false, laf: false, lpf: false };
    const segs = {}, marks = {};
    el("path", { d: paths.his, stroke: "var(--accent)", "stroke-width": 5, fill: "none", "stroke-linecap": "round" }, g);
    for (const k of ["rbb", "lbb", "laf", "lpf"]) {
      const hit = el("path", { d: paths[k], stroke: "transparent", "stroke-width": 22, fill: "none", style: "cursor:pointer", tabindex: 0, role: "button", "aria-label": `${labels[k][0]} durchtrennen` }, g);
      segs[k] = el("path", { d: paths[k], stroke: "var(--accent)", "stroke-width": 5, fill: "none", "stroke-linecap": "round", style: "pointer-events:none" }, g);
      const p = segs[k];
      const L = p.getTotalLength ? 0 : 0;
      marks[k] = el("text", { class: "sk-label", "text-anchor": "middle", style: "fill:var(--danger);pointer-events:none;font-size:22px", text: "✕" }, g);
      el("text", { x: labels[k][1], y: labels[k][2], class: "sk-label small", text: labels[k][0], "text-anchor": k === "rbb" ? "middle" : "start" }, g);
      const toggle = () => { cut[k] = !cut[k]; update(); };
      hit.addEventListener("click", toggle);
      hit.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    }
    let sig = null, pat = "none";
    const cv = U.canvas(canvas, (w) => U.layout12(w, {}).h, (ctx, w, h) => {
      const m = {}; (PATTERNS[pat].focus || []).forEach((l) => (m[l] = { tone: "focus" }));
      U.draw12(ctx, w, h, sig, { marks: m });
    });
    function update() {
      for (const k of Object.keys(cut)) {
        segs[k].setAttribute("stroke", cut[k] ? "var(--ink-faint)" : "var(--accent)");
        segs[k].setAttribute("stroke-dasharray", cut[k] ? "3 5" : "");
        const pt = segs[k].getPointAtLength(segs[k].getTotalLength() * 0.5);
        marks[k].setAttribute("x", pt.x); marks[k].setAttribute("y", pt.y + 7);
        marks[k].style.display = cut[k] ? "" : "none";
      }
      pat = patternFor(cut);
      const P = PATTERNS[pat];
      if (pat === "all") {
        const r = window.RHYTHMS.avb3({ escape: "vent" });
        sig = U.model12(r.schedule);
      } else sig = U.sinus12(P.opts(), 72);
      readout.innerHTML = `<b>${P.t}</b><ul>${P.crit.map((c) => `<li>${c}</li>`).join("")}</ul>${P.why ? `<p class="caption">${P.why}</p>` : ""}`;
      cv.redraw();
    }
    U.seg(root.querySelector(".presets"), (v) => {
      for (const k of Object.keys(cut)) cut[k] = false;
      if (v === "rbbb") cut.rbb = true; if (v === "lbbb") cut.lbb = true; if (v === "lafb") cut.laf = true; if (v === "lpfb") cut.lpf = true;
      if (v === "rbbbLafb") { cut.rbb = true; cut.laf = true; }
      update();
    });
    update();
  }

  U.quizzes({ kap8: [
    { q: "Welche Kombination passt zum kompletten Rechtsschenkelblock?", a: ["QRS ≥ 120 ms, rSR′ in V1, breites S in I und V6", "QRS ≥ 120 ms, QS in V1, breites R in V6 ohne q", "QRS < 120 ms, Achse −60°", "Kurze PQ-Zeit und Delta-Welle"], c: 0, e: "RSB: späte Erregung des rechten Ventrikels → R′ in V1/V2 und breite S-Zacken in I und V6 (AHA/ACCF/HRS, Teil III)." },
    { q: "Warum sind ST-Hebungen in V1–V3 beim Linksschenkelblock kein Infarktbeweis?", a: ["Weil sie beim LSB nie vorkommen", "Weil die Repolarisation beim LSB sekundär diskordant zum QRS verläuft – tiefe QS in V1–V3 gehen mit ST-Hebung einher", "Weil V1–V3 beim LSB nicht verwertbar sind", "Weil ein LSB immer einen Infarkt ausschließt"], c: 1, e: "Diskordante ST-Veränderungen sind beim LSB erwartbar. Für die Infarktdiagnostik dienen spezielle Kriterien (Sgarbossa, Kapitel 11), und bei typischer Klinik wird der Patient wie bei einem STEMI behandelt (ESC 2023)." },
    { q: "Achse −60°, qR in aVL, rS in II, III, aVF, QRS 100 ms. Diagnose?", a: ["Linksposteriorer Hemiblock", "Linksanteriorer Hemiblock", "Kompletter Linksschenkelblock", "Inferiorer Infarkt"], c: 1, e: "Achse zwischen −45° und −90°, qR in aVL und QRS &lt; 120 ms erfüllen die Kriterien des linksanterioren Hemiblocks." },
    { q: "Welches Merkmal unterscheidet den LSB am sichersten vom RSB?", a: ["Die Frequenz", "Die Hauptrichtung des QRS in V1: beim LSB überwiegend negativ (QS/rS), beim RSB terminal positiv (R′)", "Die P-Welle", "Die QT-Zeit"], c: 1, e: "In V1 zeigt sich, welcher Ventrikel zuletzt erregt wird: beim RSB der rechte (terminal positiv), beim LSB der linke (Vektor nach hinten → negativ)." },
    { q: "Wie empfiehlt die AHA/ACCF/HRS, eine Kombination aus RSB und LAH zu benennen?", a: ["Trifaszikulärer Block", "Bilateraler Schenkelblock", "Jede Leitungsstörung einzeln: „Rechtsschenkelblock und linksanteriorer Hemiblock“", "Atypischer Linksschenkelblock"], c: 2, e: "Begriffe wie bi- oder trifaszikulärer Block werden nicht empfohlen, weil Anatomie und Pathologie stark variieren; stattdessen jede Störung einzeln beschreiben." },
  ] });

  document.addEventListener("DOMContentLoaded", init);
})();
