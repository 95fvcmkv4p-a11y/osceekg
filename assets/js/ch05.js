/* Kapitel 5 – Lagetyp & R-Progression */
(function () {
  "use strict";
  const { el } = U;
  const D2R = Math.PI / 180;
  const TYPES = [
    ["üLT", "überdrehter Linkstyp", -180, -30], ["LT", "Linkstyp", -30, 30], ["IT", "Indifferenztyp", 30, 60],
    ["ST", "Steiltyp", 60, 90], ["RT", "Rechtstyp", 90, 120], ["üRT", "überdrehter Rechtstyp", 120, 180],
  ];
  const typeOf = (a) => { const x = ((a + 540) % 360) - 180; return TYPES.find(([, , lo, hi]) => x >= lo && x < hi) || TYPES[5]; };
  // Grundmodell ohne Rotation hat eine QRS-Achse von ca. +40°
  const BASE_AXIS = 40;

  function measuredAxis(beat) {
    let aI = 0, aF = 0;
    for (let t = beat.qrsOn; t <= beat.qrsOff; t += 1) { const H = beat.vec(t); aI += EKG.leadValue(H, "I"); aF += EKG.leadValue(H, "aVF"); }
    return Math.atan2(aF / EKG.LEAD_VECTORS.aVF[1], aI) / D2R;
  }
  const axisOfRot = (rot) => measuredAxis(EKG.makeBeat({ axis: rot, qt: 400 }));
  function signalsForAxis(axis) {
    // gewünschte Flächenachse treffen: Rotation iterativ korrigieren
    let rot = axis - BASE_AXIS;
    for (let k = 0; k < 4; k++) { const d = ((axis - axisOfRot(rot) + 540) % 360) - 180; rot += d; }
    const beat = EKG.makeBeat({ axis: rot, qt: 400 });
    const rr = 860, sch = [];
    for (let t0 = 100 - rr; t0 < 3200; t0 += rr) sch.push({ t0, beat });
    const out = U.model12(sch, { fs: 400, duration: 2600, leads: ["I", "II", "III", "aVR", "aVL", "aVF", "-aVR"] });
    out.beat = beat; out.rot = rot;
    return out;
  }

  function initFig5A() {
    const root = document.getElementById("fig-5a");
    if (!root) return;
    const svg = root.querySelector("svg");
    const canvas = root.querySelector("canvas.ecg-canvas");
    const h3 = U.heart3d(root.querySelector("canvas.h3d"), { axes: "frontal", horizontal: false, view: "vorn" });
    const slider = root.querySelector(".ax"), axOut = root.querySelector(".ax-out");
    const readout = root.querySelector(".readout");
    const typeBox = root.querySelector(".types");
    const scoreEl = root.querySelector(".score");
    let mode = "explore", axis = 50, sig = null, answered = false, score = U.store.get("lagetyp:score", { r: 0, n: 0 });

    // Hexaxial mit Sektoren
    svg.setAttribute("viewBox", "0 0 340 340");
    const C = 170, R = 120, g = el("g", {}, svg);
    const sectors = {};
    TYPES.forEach(([k, , lo, hi], i) => {
      const a0 = lo * D2R, a1 = hi * D2R;
      const p = `M${C},${C} L${C + R * Math.cos(a0)},${C + R * Math.sin(a0)} A${R},${R} 0 ${hi - lo > 180 ? 1 : 0} 1 ${C + R * Math.cos(a1)},${C + R * Math.sin(a1)} Z`;
      sectors[k] = el("path", { d: p, fill: i % 2 ? "var(--paper-3)" : "var(--paper-2)", stroke: "var(--rule)", "stroke-width": 1 }, g);
      const mid = ((lo + hi) / 2) * D2R, rr = k === "üLT" ? R * 0.62 : R * 0.72;
      const ma = k === "üLT" ? -105 * D2R : mid;
      el("text", { x: C + rr * Math.cos(ma), y: C + rr * Math.sin(ma) + 4, "text-anchor": "middle", class: "sk-label small", text: k }, g);
    });
    for (const [nm, deg] of Object.entries(EKG.FRONTAL_ANGLE)) {
      if (nm === "-aVR") continue;
      el("line", { x1: C, y1: C, x2: C + Math.cos(deg * D2R) * (R + 6), y2: C + Math.sin(deg * D2R) * (R + 6), stroke: "var(--ink-faint)", "stroke-width": 1 }, g);
      el("text", { x: C + Math.cos(deg * D2R) * (R + 24), y: C + Math.sin(deg * D2R) * (R + 24) + 4, "text-anchor": "middle", class: "sk-label small", text: `${nm} ${deg > 0 ? "+" : deg < 0 ? "−" : ""}${Math.abs(deg)}°` }, g);
    }
    const defs = el("defs", {}, svg);
    const mk = el("marker", { id: "arr5", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", fill: "var(--accent)" }, mk);
    const arrow = el("line", { x1: C, y1: C, stroke: "var(--accent)", "stroke-width": 3.5, "marker-end": "url(#arr5)" }, svg);

    const cv = U.canvas(canvas, (w) => Math.ceil((w / 2 / 33) * 3 * 19), (ctx, w, h) => {
      if (!sig) return;
      const colW = w / 2, pxmm = colW / 33; ctx.clearRect(0, 0, w, h); U.paper(ctx, 0, 0, w, h, pxmm);
      const rows = EKG.CABRERA, rowH = h / 3;
      rows.forEach((l, i) => {
        const col = Math.floor(i / 3), r = i % 3;
        const x0 = col * colW + pxmm, y0 = r * rowH + rowH * 0.64;
        const gain = Math.min(10, (rowH * 0.62) / (1.6 * pxmm));
        U.trace(ctx, sig.leads[l], sig.fs, { x0, y0, pxmm, gain, width: 1.4, i1: Math.round(1.25 * sig.fs) });
        U.label(ctx, `${l.replace("-", "−")} (${EKG.FRONTAL_ANGLE[l] > 0 ? "+" : ""}${EKG.FRONTAL_ANGLE[l]}°)`, x0 + 4, r * rowH + 14, { size: 11.5, color: U.cssVar("--accent") });
      });
      ctx.strokeStyle = U.cssVar("--ink"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(colW, 0); ctx.lineTo(colW, h); ctx.stroke();
      U.label(ctx, "Cabrera-Reihenfolge (spaltenweise) · 25 mm/s", w - 6, h - 6, { size: 10, align: "right", color: U.cssVar("--ink-soft"), bg: U.cssVar("--ecg-bg") });
    });

    function setAxis(a, reveal) {
      axis = a; sig = signalsForAxis(a);
      const vis = mode === "explore" || reveal;
      arrow.style.display = vis ? "" : "none";
      arrow.setAttribute("x2", C + Math.cos(a * D2R) * R * 0.95); arrow.setAttribute("y2", C + Math.sin(a * D2R) * R * 0.95);
      const [k, name] = typeOf(a);
      for (const [kk, p] of Object.entries(sectors)) p.style.fill = vis && kk === k ? "var(--accent-soft)" : "";
      axOut.textContent = vis ? `${a > 0 ? "+" : ""}${Math.round(a)}° · ${name}` : "?";
      if (mode === "explore") readout.innerHTML = explain(a);
      cv.redraw();
      if (vis) h3.set({ hidden: false, frontRot: sig.rot, loops: [{ pts: U.loop3d(sig.beat, sig.beat.qrsOn - 2, sig.beat.qrsOff + 4) }], vec: U.meanQRS(sig.beat) });
      else h3.set({ hidden: true, label: "Erst den Lagetyp wählen – dann siehst du das Herz" });
    }
    function explain(a) {
      const vals = Object.fromEntries(EKG.CABRERA.map((l) => [l, Math.cos((a - EKG.FRONTAL_ANGLE[l]) * D2R)]));
      const best = Object.entries(vals).sort((x, y) => y[1] - x[1])[0][0];
      const iso = Object.entries(vals).sort((x, y) => Math.abs(x[1]) - Math.abs(y[1]))[0][0];
      return `Größter positiver Ausschlag in <b>${best.replace("-", "−")}</b>, am ehesten isoelektrisch: <b>${iso.replace("-", "−")}</b> → Achse etwa senkrecht dazu. ` +
        `Schnelltest: I ${vals.I > 0.05 ? "positiv" : vals.I < -0.05 ? "negativ" : "isoelektrisch"}, aVF ${vals.aVF > 0.05 ? "positiv" : vals.aVF < -0.05 ? "negativ" : "isoelektrisch"}, II ${vals.II > 0.05 ? "positiv" : vals.II < -0.05 ? "negativ" : "isoelektrisch"}.`;
    }
    // Übungsmodus
    U.segButtons(typeBox, TYPES.map(([k, n]) => [k, n]), "");
    typeBox.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      if (mode !== "train" || answered) return;
      answered = true;
      const [k, name] = typeOf(axis);
      const ok = b.dataset.v === k;
      score.n++; if (ok) score.r++; U.store.set("lagetyp:score", score);
      b.setAttribute("aria-pressed", "true");
      readout.innerHTML = `${ok ? "<b>Richtig.</b>" : `<b>Nicht ganz</b> – gesucht war <b>${name}</b>.`} Achse ${axis > 0 ? "+" : ""}${Math.round(axis)}°. ` + explain(axis) + ` <button type="button" class="btn ghost next" style="margin-left:.4rem">Nächstes EKG →</button>`;
      readout.querySelector(".next").addEventListener("click", train);
      scoreEl.textContent = `${score.r} von ${score.n} richtig`;
      setAxis(axis, true);
    }));
    function train() {
      answered = false;
      typeBox.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false"));
      let a; do { a = Math.round(-95 + Math.random() * 270); } while (TYPES.some(([, , lo, hi]) => Math.abs(a - lo) < 6 || Math.abs(a - hi) < 6));
      readout.innerHTML = "Bestimme den Lagetyp aus den sechs Extremitätenableitungen und wähle ihn oben aus.";
      setAxis(a, false);
    }
    U.seg(root.querySelector(".mode"), (v) => {
      mode = v; root.classList.toggle("training", v === "train");
      typeBox.style.display = v === "train" ? "" : "none";
      slider.disabled = v === "train";
      if (v === "train") train(); else setAxis(+slider.value);
    });
    typeBox.style.display = "none";
    slider.addEventListener("input", () => setAxis(+slider.value));
    scoreEl.textContent = score.n ? `${score.r} von ${score.n} richtig` : "";
    setAxis(50);
  }

  // ======================================================================
  // 5B  R-Progression in der Horizontalebene
  // ======================================================================
  function initFig5B() {
    const root = document.getElementById("fig-5b");
    if (!root) return;
    const canvas = root.querySelector("canvas.ecg-canvas");
    const h3 = U.heart3d(root.querySelector("canvas.h3d"), { axes: "horizontal", frontal: false, view: "unten", height: 0.75 });
    const slider = root.querySelector(".rot"), rotOut = root.querySelector(".rot-out");
    const readout = root.querySelector(".readout");
    const PRE = {
      normal: { t: "normal", o: {} },
      ant: { t: "alter Vorderwandinfarkt", o: { qrsComps: [
        EKG.comp("Septum (fehlt anterior)", 12, 6, 6, [-0.6, 0.35, 0.1], 0.18), EKG.comp("Apex", 31, 9, 9, [0.55, 0.75, -0.05], 0.7),
        EKG.comp("freie Wand LV", 47, 10, 10, [0.85, 0.42, -0.45], 1.45), EKG.comp("basal", 70, 8, 9, [-0.35, -0.5, -0.8], 0.38)] } },
      rvh: { t: "Rechtsherzhypertrophie", o: EKG.PRESETS.rvh() },
      lbbb: { t: "Linksschenkelblock", o: EKG.PRESETS.lbbb() },
    };
    let pre = "normal", sig = null, tz = "";
    const cv = U.canvas(canvas, (w) => Math.ceil(w * 0.3), (ctx, w, h) => {
      if (!sig) return;
      const pxmm = w / (6 * 1.1 * 25 + 2);
      ctx.clearRect(0, 0, w, h); U.paper(ctx, 0, 0, w, h, pxmm);
      const prec = ["V1", "V2", "V3", "V4", "V5", "V6"];
      prec.forEach((l, i) => {
        const x0 = pxmm + i * 1.1 * 25 * pxmm, y0 = h * 0.6;
        if (l === tz) { ctx.fillStyle = U.cssVar("--accent"); ctx.globalAlpha = 0.12; ctx.fillRect(x0, 0, 1.1 * 25 * pxmm, h); ctx.globalAlpha = 1; }
        U.trace(ctx, sig.leads[l], sig.fs, { x0, y0, pxmm, i0: 0, i1: Math.round(1.1 * sig.fs), width: 1.5 });
        U.label(ctx, l, x0 + 4, 16, { size: 12, color: U.cssVar("--accent") });
      });
    });
    function update() {
      const o = Object.assign({}, PRE[pre].o, { horiz: +slider.value, qt: 400 });
      const beat = EKG.makeBeat(o);
      sig = U.model12([{ t0: 80, beat }], { fs: 400, duration: 1200, leads: ["V1", "V2", "V3", "V4", "V5", "V6"] });
      const A = EKG.analyzeBeat(beat, { leads: ["V1", "V2", "V3", "V4", "V5", "V6"] });
      tz = ["V1", "V2", "V3", "V4", "V5", "V6"].find((l) => A[l].R >= -A[l].S) || "—";
      rotOut.textContent = (+slider.value > 0 ? "+" : "") + slider.value + "°";
      const where = { V1: "sehr früh", V2: "früh", V3: "normal", V4: "normal", V5: "spät", V6: "spät", "—": "nicht erreicht" }[tz];
      readout.innerHTML = `Umschlagzone (R ≥ S erstmals): <b>${tz}</b> – ${where}. R-Amplituden: ` +
        ["V1", "V2", "V3", "V4", "V5", "V6"].map((l) => `${l} ${A[l].R.toFixed(1).replace(".", ",")}`).join(" · ") + " mV.";
      cv.redraw();
      h3.set({ horizRot: +slider.value, loops: [{ pts: U.loop3d(beat, beat.qrsOn - 2, beat.qrsOff + 4) }], vec: U.meanQRS(beat) });
    }
    U.segButtons(root.querySelector(".pre"), Object.entries(PRE).map(([k, v]) => [k, v.t]), "normal");
    U.seg(root.querySelector(".pre"), (v) => { pre = v; update(); });
    slider.addEventListener("input", update);
    update();
  }

  U.quizzes({ kap5: [
    { q: "QRS in I positiv, in aVF negativ, in II überwiegend negativ. Welcher Lagetyp?", a: ["Linkstyp", "Überdrehter Linkstyp", "Indifferenztyp", "Rechtstyp"], c: 1, e: "I positiv und aVF negativ → Achse zwischen 0° und −90°. Ist II (+60°) überwiegend negativ, liegt die Achse jenseits von −30° → überdrehter Linkstyp (häufigste Ursache: linksanteriorer Hemiblock)." },
    { q: "Welche Ableitung ist am ehesten isoelektrisch, wenn die QRS-Achse +60° beträgt?", a: ["aVF", "aVL", "I", "III"], c: 1, e: "Die Ableitung senkrecht zu +60° liegt bei −30° bzw. +150° – das ist aVL." },
    { q: "Bei welchem Lagetyp-Bereich spricht man vom Steiltyp?", a: ["+30° bis +60°", "+60° bis +90°", "+90° bis +120°", "−30° bis +30°"], c: 1, e: "Konvention im deutschsprachigen Raum: Linkstyp −30° bis +30°, Indifferenztyp +30° bis +60°, Steiltyp +60° bis +90°, Rechtstyp +90° bis +120°." },
    { q: "Ein schlanker 20-Jähriger hat einen Steiltyp. Wie ordnest du das ein?", a: ["Pathologisch, Echokardiografie nötig", "Altersentsprechend normal", "Hinweis auf linksposterioren Hemiblock", "Hinweis auf Lungenembolie"], c: 1, e: "Die Herzachse dreht sich mit dem Alter nach links. Steil- und sogar Rechtstyp sind bei jungen, schlanken Menschen häufig normal; der Lagetyp ist immer im Kontext von Alter und Habitus zu bewerten." },
    { q: "Welche Ursache passt NICHT zu einer verzögerten R-Progression (Umschlagzone V5/V6)?", a: ["Alter Vorderwandinfarkt", "Linksschenkelblock", "Fehlplatzierte Brustwandelektroden", "Posteriorer Infarkt"], c: 3, e: "Ein posteriorer Infarkt führt spiegelbildlich zu hohen R-Zacken in V1/V2 – also zu einer frühen Umschlagzone. Die anderen drei sind klassische Ursachen einer verzögerten R-Progression." },
  ] });

  document.addEventListener("DOMContentLoaded", () => { initFig5A(); initFig5B(); });
})();
