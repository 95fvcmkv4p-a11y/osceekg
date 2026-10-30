/* Kapitel 12 – Hypertrophie & Belastung */
(function () {
  "use strict";
  const PE = () => ({
    qrsComps: [
      EKG.comp("Septum", 12, 6, 6, [-0.55, 0.3, 0.78], 0.3), EKG.comp("Apex", 31, 9, 9, [0.35, 0.75, 0.55], 0.75),
      EKG.comp("freie Wand LV", 47, 10, 10, [0.85, 0.42, -0.3], 1.25), EKG.comp("RV verspätet (inkompletter RSB)", 92, 12, 12, [-0.75, -0.1, 0.65], 0.6)],
    extraComps: [Object.assign(EKG.comp("initial superior (Q in III)", 8, 5, 6, [0.4, -0.85, 0.2], 0.22), { noRotate: true })],
    qrsDuration: 112, tVector: [0.75, -0.15, -0.65], tScale: 0.9,
  });
  const MODES = {
    normal: { t: "Normal", opts: () => ({}), hr: 70, txt: "Normale Amplituden. Sokolow-Lyon- und Cornell-Index unter den Grenzwerten." },
    lvh: { t: "LVH (Spannung)", opts: (m) => { const o = EKG.PRESETS.lvh(false); o.qrsComps = o.qrsComps.map((c) => (c.name.includes("hypertroph") ? Object.assign({}, c, { a: c.a * m }) : c)); return o; }, hr: 70, scale: true,
      txt: "Erhöhte QRS-Amplituden durch vermehrte linksventrikuläre Muskelmasse. Spannungskriterien sind <b>spezifisch, aber wenig sensitiv</b> – ein normales EKG schließt eine LVH nicht aus. Hohe Amplituden allein sind bei jungen, schlanken Menschen häufig normal." },
    lvhs: { t: "LVH + Strain", opts: (m) => { const o = EKG.PRESETS.lvh(true); o.qrsComps = o.qrsComps.map((c) => (c.name.includes("hypertroph") ? Object.assign({}, c, { a: c.a * m }) : c)); return o; }, hr: 70, scale: true,
      txt: "Zusätzlich zu den Spannungskriterien <b>deszendierende ST-Senkung mit asymmetrisch negativer T-Welle</b> in I, aVL, V5, V6 („Strain“-Muster). Spricht für eine ausgeprägte Hypertrophie mit Repolarisationsstörung und ist prognostisch ungünstig. Oft begleitet von linksatrialer Belastung (P breit, doppelgipflig)." },
    rvh: { t: "RVH", opts: EKG.PRESETS.rvh, hr: 82,
      txt: "Rechtstyp, <b>dominantes R in V1</b> (R/S &gt; 1, R ≥ 0,7 mV), tiefes S in V5/V6, T-Negativierung rechtspräkordial, P dextroatriale. Ursachen: pulmonale Hypertonie, Pulmonalstenose, angeborene Vitien. Die EKG-Kriterien sind wenig sensitiv." },
    pmit: { t: "P sinistroatriale", opts: EKG.PRESETS.pMitrale, hr: 70, focusP: true,
      txt: "<b>Linksatriale Belastung</b> (P mitrale): P-Welle ≥ 120 ms, in II doppelgipflig mit betontem zweitem Gipfel; in V1 biphasisch mit breitem, tiefem negativem Endteil (≥ 1 mm tief und ≥ 40 ms breit). Ursachen: Mitralvitien, Hypertonie, Herzinsuffizienz." },
    ppulm: { t: "P dextroatriale", opts: EKG.PRESETS.pPulmonale, hr: 80, focusP: true,
      txt: "<b>Rechtsatriale Belastung</b> (P pulmonale): hohe, spitze P-Welle ≥ 0,25 mV in II (bzw. &gt; 0,15 mV positiv in V1), normale Dauer. Ursachen: Lungenerkrankungen, pulmonale Hypertonie, Trikuspidalvitien." },
    pe: { t: "akute Rechtsbelastung", opts: PE, hr: 112,
      txt: "Mögliche EKG-Zeichen einer akuten Rechtsherzbelastung (z. B. Lungenembolie): <b>Sinustachykardie</b> (häufigster Befund), T-Negativierungen in V1–V4, inkompletter oder kompletter RSB, S<sub>I</sub>Q<sub>III</sub>T<sub>III</sub>-Muster, Rechtsdrehung der Achse. Alle Zeichen sind <b>weder sensitiv noch spezifisch</b> – ein normales EKG schließt eine Lungenembolie nicht aus." },
  };

  function indices(A) {
    const R = (l) => A[l].R, S = (l) => -A[l].S;
    const deepestS = Math.max(...EKG.LEADS.map(S));
    return {
      sokolow: S("V1") + Math.max(R("V5"), R("V6")),
      cornell: R("aVL") + S("V3"),
      peguero: deepestS + S("V4"),
      ravl: R("aVL"),
      rv1: R("V1"), rsV1: R("V1") / Math.max(0.01, S("V1")),
      sokRV: R("V1") + Math.max(S("V5"), S("V6")),
    };
  }

  function init() {
    const root = document.getElementById("fig-12a");
    if (!root) return;
    const canvas = root.querySelector("canvas"), readout = root.querySelector(".readout"), table = root.querySelector(".idx");
    const massS = root.querySelector(".mass"), massO = root.querySelector(".mass-out"), sexSel = root.querySelector(".sex");
    U.segButtons(root.querySelector(".mode"), Object.entries(MODES).map(([k, v]) => [k, v.t]), "lvhs");
    let mode = "lvhs", sig = null, marks = {};
    const cv = U.canvas(canvas, (w) => U.layout12(w, {}).h, (ctx, w, h) => U.draw12(ctx, w, h, sig, { marks }));
    function update() {
      const M = MODES[mode], m = +massS.value / 100;
      massS.disabled = !M.scale; massO.textContent = M.scale ? `× ${m.toFixed(2).replace(".", ",")}` : "–";
      const opts = M.opts(m);
      sig = U.sinus12(opts, M.hr);
      const A = EKG.analyzeBeat(sig.beat);
      const I = indices(A), w = sexSel.value === "w";
      const f = (x) => x.toFixed(2).replace(".", ",");
      const rows = [
        ["Sokolow-Lyon (LVH)", "SV1 + RV5/V6", I.sokolow, 3.5, "&gt; 3,5 mV"],
        ["Cornell (LVH)", "RaVL + SV3", I.cornell, w ? 2.0 : 2.8, w ? "&gt; 2,0 mV (♀)" : "&gt; 2,8 mV (♂)"],
        ["Peguero-Lo Presti (LVH)", "tiefstes S + SV4", I.peguero, w ? 2.3 : 2.8, w ? "≥ 2,3 mV (♀)" : "≥ 2,8 mV (♂)"],
        ["R in aVL (LVH)", "RaVL", I.ravl, 1.1, "&gt; 1,1 mV"],
        ["Sokolow-Lyon (RVH)", "RV1 + SV5/V6", I.sokRV, 1.05, "&gt; 1,05 mV"],
        ["R/S in V1 (RVH)", "RV1 / SV1", I.rsV1, 1.0, "&gt; 1"],
      ];
      table.innerHTML = `<thead><tr><th>Index</th><th>Berechnung</th><th>Modellwert</th><th>Grenze</th></tr></thead><tbody>` +
        rows.map(([n, c, v, lim, ls]) => `<tr class="${v > lim ? "pos" : ""}"><td>${n}</td><td>${c}</td><td class="mono">${f(v)}${n.includes("R/S") ? "" : " mV"}</td><td>${ls}${v > lim ? " ✓" : ""}</td></tr>`).join("") + "</tbody>";
      marks = {};
      if (mode.startsWith("lvh")) ["V1", "V5", "V6", "aVL", "V3"].forEach((l) => (marks[l] = { tone: "focus" }));
      if (mode === "rvh") ["V1", "V5", "V6", "I"].forEach((l) => (marks[l] = { tone: "focus" }));
      if (M.focusP) ["II", "V1"].forEach((l) => (marks[l] = { tone: "focus" }));
      if (mode === "pe") ["I", "III", "V1", "V2", "V3"].forEach((l) => (marks[l] = { tone: "focus" }));
      readout.innerHTML = `<span class="tag">${M.t}</span>${M.txt}`;
      cv.redraw();
    }
    U.seg(root.querySelector(".mode"), (v) => { mode = v; update(); });
    massS.addEventListener("input", update); sexSel.addEventListener("change", update);
    update();
  }

  U.quizzes({ kap12: [
    { q: "Wie berechnet sich der Sokolow-Lyon-Index für die LVH, und wo liegt der Grenzwert?", a: ["RV1 + SV5 > 1,05 mV", "SV1 + RV5 oder RV6 > 3,5 mV", "RaVL + SV3 > 2,8 mV", "R in I > 1,5 mV"], c: 1, e: "S in V1 plus das höhere R in V5 oder V6; &gt; 3,5 mV gilt als positiv. RV1 + SV5/6 ist der Sokolow-Index für die Rechtshypertrophie." },
    { q: "Was gilt für die EKG-Kriterien der Linkshypertrophie?", a: ["Hoch sensitiv, wenig spezifisch", "Hoch spezifisch, aber wenig sensitiv", "Sensitiv und spezifisch", "Ohne diagnostischen Wert"], c: 1, e: "Ein positiver Index macht eine LVH wahrscheinlich, ein negativer schließt sie nicht aus. Bei Verdacht ist die Echokardiografie das Mittel der Wahl." },
    { q: "Welche P-Welle passt zur linksatrialen Belastung?", a: ["Hoch und spitz in II (≥ 0,25 mV)", "Breit (≥ 120 ms), doppelgipflig in II, tiefer negativer Endteil in V1", "Negativ in II", "Fehlend"], c: 1, e: "Der linke Vorhof wird zuletzt erregt; seine Vergrößerung verlängert und betont den zweiten Teil der P-Welle." },
    { q: "Was ist das häufigste EKG-Zeichen bei akuter Lungenembolie?", a: ["S₁Q₃T₃-Muster", "Kompletter Rechtsschenkelblock", "Sinustachykardie", "ST-Hebung in V1–V3"], c: 2, e: "Die Sinustachykardie ist der häufigste Befund; das klassische S₁Q₃T₃-Muster ist selten und unspezifisch. Ein unauffälliges EKG schließt eine Lungenembolie nicht aus." },
    { q: "Was beschreibt das „Strain“-Muster bei Linkshypertrophie?", a: ["Aszendierende ST-Hebung in V1–V3", "Deszendierende ST-Senkung mit asymmetrisch negativer T-Welle lateral", "Hohe spitze T-Wellen", "U-Wellen in V2"], c: 1, e: "Die sekundäre Repolarisationsstörung zeigt sich lateral (I, aVL, V5, V6) und ist diskordant zum hohen R; sie darf nicht reflexhaft als Ischämie interpretiert werden." },
  ] });

  document.addEventListener("DOMContentLoaded", init);
})();
