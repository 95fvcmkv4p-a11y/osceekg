/* Kapitel 2 – Vom Dipol zur Kurve */
(function () {
  "use strict";
  const { el, smooth, jitter } = U;
  const D2R = Math.PI / 180;

  // ======================================================================
  // 2A  Muskelstreifen: Depolarisation / Repolarisation und Ausschlagsrichtung
  // ======================================================================
  function initFig2A() {
    const root = document.getElementById("fig-2a");
    if (!root) return;
    const svg = root.querySelector("svg");
    svg.setAttribute("viewBox", "0 0 640 300");
    const N = 14, X0 = 40, CW = 30, Y0 = 78, CH = 42, XE = 575;
    const L = 5.5 * CW; // Abklingdistanz

    const SCEN = {
      dep: { segs: [["dep", 1], ["hold", 0.45]], tag: "Depolarisation",
        txt: "Die Depolarisationsfront läuft <b>auf die Elektrode zu</b>. An der Front zeigt der Dipol (von − nach +) in Ausbreitungsrichtung → <b>positiver Ausschlag</b>. Ist alles depolarisiert, gibt es keine Potenzialdifferenz mehr → die Linie kehrt zur Nulllinie zurück." },
      same: { segs: [["hold0", 0.25], ["repL", 1], ["hold", 0.35]], tag: "Repolarisation, gleiche Richtung",
        txt: "Repolarisation in <b>derselben Richtung</b> wie die Depolarisation: Hinter der Front ist die Außenseite wieder positiv, davor noch negativ. Der Dipol zeigt jetzt <b>von der Elektrode weg</b> → <b>negativer Ausschlag</b>. So entsteht eine diskordante (gegensinnige) T-Welle." },
      rev: { segs: [["hold0", 0.25], ["repR", 1], ["hold", 0.35]], tag: "Repolarisation, Gegenrichtung",
        txt: "Repolarisation <b>in Gegenrichtung</b> (von der Elektrode weg): Die zuletzt erregten Zellen repolarisieren zuerst. Der Dipol zeigt <b>zur Elektrode</b> → <b>positiver Ausschlag</b>, obwohl sich die Front entfernt. Das ist die Situation im Ventrikel (Epikard vor Endokard)." },
      cycle: { segs: [["dep", 0.7], ["hold", 0.8], ["repR", 1.4], ["hold", 0.5]], tag: "Ganzer Zyklus",
        txt: "Depolarisation zur Elektrode hin (≈ QRS), vollständige Depolarisation ohne Potenzialdifferenz (≈ ST-Strecke), Repolarisation in Gegenrichtung (≈ T-Welle) – beide Ausschläge sind positiv: <b>konkordant</b>." },
    };

    const defs = el("defs", {}, svg);
    const mk = el("marker", { id: "arr2a", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", fill: "var(--accent)" }, mk);
    const mk2 = el("marker", { id: "arr2a-g", viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", fill: "var(--ink-faint)" }, mk2);

    const gCells = el("g", {}, svg);
    const cells = [], outS = [], inS = [];
    for (let i = 0; i < N; i++) {
      const x = X0 + i * CW;
      cells.push(el("rect", { x: x + 1, y: Y0, width: CW - 2, height: CH, rx: 6, fill: "var(--paper)", stroke: "var(--ink)", "stroke-width": 1.4, filter: "url(#sk-wobble)" }, gCells));
      outS.push(el("text", { x: x + CW / 2, y: Y0 - 9, "text-anchor": "middle", class: "sk-label" }, gCells));
      inS.push(el("text", { x: x + CW / 2, y: Y0 + CH / 2 + 6, "text-anchor": "middle", class: "sk-label small", opacity: 0.7 }, gCells));
    }
    el("text", { x: X0 - 6, y: Y0 - 8, "text-anchor": "end", class: "sk-mono", text: "außen" }, gCells);
    el("text", { x: X0 - 6, y: Y0 + CH / 2 + 4, "text-anchor": "end", class: "sk-mono", text: "innen" }, gCells);
    // Elektrode
    el("path", { d: `M${X0 + N * CW + 6},${Y0 + CH / 2} L${XE - 14},${Y0 + CH / 2}`, class: "leader" }, svg);
    el("circle", { cx: XE, cy: Y0 + CH / 2, r: 13, fill: "var(--paper-2)", stroke: "var(--ink)", "stroke-width": 2 }, svg);
    el("text", { x: XE, y: Y0 + CH / 2 + 6, "text-anchor": "middle", class: "sk-label", text: "+" }, svg);
    el("text", { x: XE, y: Y0 + CH / 2 + 34, "text-anchor": "middle", class: "sk-label small", text: "Elektrode" }, svg);
    const dip = el("line", { stroke: "var(--accent)", "stroke-width": 3, "marker-end": "url(#arr2a)", opacity: 0 }, svg);
    const dipT = el("text", { class: "sk-label small red", "text-anchor": "middle", text: "Dipol" }, svg);
    const prop = el("line", { stroke: "var(--ink-faint)", "stroke-width": 1.6, "stroke-dasharray": "4 3", "marker-end": "url(#arr2a-g)", opacity: 0 }, svg);
    const propT = el("text", { class: "sk-mono", "text-anchor": "middle", text: "Ausbreitung" }, svg);
    // Kurvenbereich
    const TY = 250, TH = 60, TX0 = 40, TX1 = 600;
    el("line", { x1: TX0, y1: TY, x2: TX1, y2: TY, stroke: "var(--ink-faint)", "stroke-width": 1, "stroke-dasharray": "3 3" }, svg);
    el("text", { x: TX0, y: TY - TH - 8, class: "sk-mono", text: "an der Elektrode gemessene Spannung" }, svg);
    const ghost = el("path", { fill: "none", stroke: "var(--ink-faint)", "stroke-width": 1.2, opacity: 0.5 }, svg);
    const curve = el("path", { fill: "none", stroke: "var(--trace)", "stroke-width": 2.4, "stroke-linejoin": "round" }, svg);
    const curDot = el("circle", { r: 4, fill: "var(--accent)" }, svg);

    const readout = root.querySelector(".readout");
    const slider = root.querySelector("input[type=range]");
    const playBtn = root.querySelector(".play");
    let scen = "cycle", tau = 0, total = 1, samples = [];

    function stateAt(tt) {
      // gibt Array s_i (0 = Ruhe, 1 = depolarisiert) und aktive Front zurück
      let acc = 0, s = new Array(N).fill(0), front = null, kind = "none";
      let base = "rest";
      for (const [type, dur] of SCEN[scen].segs) {
        if (type === "hold0") base = "dep";
        if (tt < acc + dur || (acc + dur >= total - 1e-9 && tt >= total - 1e-9)) {
          const p = U.clamp((tt - acc) / dur, 0, 1) * N;
          if (type === "dep") { s = s.map((_, i) => U.clamp(p - i, 0, 1)); front = X0 + p * CW; kind = "dep"; }
          else if (type === "repL") { s = s.map((_, i) => 1 - U.clamp(p - i, 0, 1)); front = X0 + p * CW; kind = "repL"; }
          else if (type === "repR") { s = s.map((_, i) => 1 - U.clamp(p - (N - 1 - i), 0, 1)); front = X0 + (N - p) * CW; kind = "repR"; }
          else s = s.map(() => (base === "dep" ? 1 : 0));
          if (p <= 0.001 || p >= N - 0.001) front = null;
          return { s, front, kind };
        }
        // Segment abgeschlossen → Endzustand übernehmen
        if (type === "dep") base = "dep"; else if (type === "repL" || type === "repR") base = "rest";
        acc += dur;
      }
      return { s: s.map(() => (base === "dep" ? 1 : 0)), front: null, kind };
    }
    function potential(s) {
      let V = 0;
      for (let i = 0; i < N - 1; i++) {
        const qa = 1 - 2 * s[i], qb = 1 - 2 * s[i + 1];
        const bx = X0 + (i + 1) * CW, d = XE - bx;
        V += ((qb - qa) / 2) * (1 / (1 + (d / L) * (d / L)));
      }
      return V;
    }
    function prepare() {
      total = SCEN[scen].segs.reduce((a, s) => a + s[1], 0);
      samples = [];
      for (let k = 0; k <= 400; k++) { const tt = (k / 400) * total; samples.push([tt, potential(stateAt(tt).s)]); }
      const maxV = Math.max(0.2, ...samples.map((s) => Math.abs(s[1])));
      samples.scale = (TH - 6) / maxV;
      ghost.setAttribute("d", "M" + samples.map(([tt, v]) => `${(TX0 + (tt / total) * (TX1 - TX0)).toFixed(1)},${(TY - v * samples.scale).toFixed(1)}`).join(" L"));
      readout.innerHTML = `<span class="tag">${SCEN[scen].tag}</span>${SCEN[scen].txt}`;
    }
    function render() {
      const { s, front, kind } = stateAt(tau);
      for (let i = 0; i < N; i++) {
        const dep = s[i] > 0.5;
        cells[i].setAttribute("fill", s[i] > 0.02 ? `color-mix(in srgb, var(--ochre) ${Math.round(s[i] * 55)}%, var(--paper))` : "var(--paper)");
        outS[i].textContent = dep ? "−" : "+";
        outS[i].setAttribute("style", `fill:${dep ? "var(--ink)" : "var(--accent)"}`);
        inS[i].textContent = dep ? "+" : "−";
      }
      if (front !== null) {
        const y = Y0 + CH + 26;
        const dipDir = kind === "repL" ? -1 : 1; // Dipol zeigt von − nach +
        dip.setAttribute("x1", front - dipDir * 28); dip.setAttribute("x2", front + dipDir * 28);
        dip.setAttribute("y1", y); dip.setAttribute("y2", y); dip.setAttribute("opacity", 1);
        dipT.setAttribute("x", front); dipT.setAttribute("y", y + 22); dipT.setAttribute("opacity", 1);
        const pDir = kind === "repR" ? -1 : 1;
        prop.setAttribute("x1", front - pDir * 22); prop.setAttribute("x2", front + pDir * 22);
        prop.setAttribute("y1", Y0 - 34); prop.setAttribute("y2", Y0 - 34); prop.setAttribute("opacity", 1);
        propT.setAttribute("x", front); propT.setAttribute("y", Y0 - 42); propT.setAttribute("opacity", 1);
      } else { [dip, dipT, prop, propT].forEach((n) => n.setAttribute("opacity", 0)); }
      const upto = samples.filter(([tt]) => tt <= tau + 1e-9);
      curve.setAttribute("d", upto.length ? "M" + upto.map(([tt, v]) => `${(TX0 + (tt / total) * (TX1 - TX0)).toFixed(1)},${(TY - v * samples.scale).toFixed(1)}`).join(" L") : "");
      const v = potential(s);
      curDot.setAttribute("cx", TX0 + (tau / total) * (TX1 - TX0)); curDot.setAttribute("cy", TY - v * samples.scale);
      slider.value = Math.round((tau / total) * 1000);
    }
    const loop = U.loop(root, (dt) => {
      tau += (dt / 1000) * 0.32;
      if (tau >= total) { tau = total; setPlaying(false); }
      render();
    });
    const setPlaying = (on) => { on ? loop.play() : loop.pause(); playBtn.textContent = on ? "❚❚ Pause" : "▶ Abspielen"; };
    playBtn.addEventListener("click", () => { if (!loop.running && tau >= total) tau = 0; setPlaying(!loop.running); });
    slider.addEventListener("input", () => { setPlaying(false); tau = (+slider.value / 1000) * total; render(); });
    U.seg(root.querySelector(".scen"), (v) => { scen = v; tau = 0; prepare(); render(); if (!U.reducedMotion()) setPlaying(true); });
    prepare(); tau = U.reducedMotion() ? total : 0; render();
    if (!U.reducedMotion()) setPlaying(true);
  }

  // ======================================================================
  // 2B  Projektion eines Vektors auf die Extremitätenableitungen
  // ======================================================================
  const AXES = [["I", 0], ["II", 60], ["III", 120], ["aVR", -150], ["aVL", -30], ["aVF", 90]];
  const CAB = ["aVL", "I", "-aVR", "II", "aVF", "III"];
  const AX = Object.fromEntries([...AXES, ["-aVR", 30]]);

  function hexaxial(g, C, R, opts = {}) {
    el("circle", { cx: C, cy: C, r: R, class: "sk-thin", "stroke-dasharray": "2 5" }, g);
    const lines = {};
    for (const [nm, deg] of AXES) {
      const ux = Math.cos(deg * D2R), uy = Math.sin(deg * D2R);
      const neg = el("line", { x1: C, y1: C, x2: C - ux * R, y2: C - uy * R, stroke: "var(--ink-faint)", "stroke-width": 1, "stroke-dasharray": "3 4" }, g);
      const pos = el("line", { x1: C, y1: C, x2: C + ux * R, y2: C + uy * R, stroke: "var(--ink-soft)", "stroke-width": 1.3 }, g);
      const lx = C + ux * (R + 20), ly = C + uy * (R + 20) + 5;
      const txt = el("text", { x: lx, y: ly, "text-anchor": "middle", class: "sk-label small", text: `${nm} ${deg > 0 ? "+" : deg < 0 ? "−" : ""}${Math.abs(deg)}°` }, g);
      lines[nm] = { pos, neg, txt, ux, uy };
    }
    if (opts.degrees) {
      for (const [deg, t] of [[180, "±180°"], [-90, "−90°"]]) {
        el("text", { x: C + Math.cos(deg * D2R) * (R + 22), y: C + Math.sin(deg * D2R) * (R + 22) + 4, "text-anchor": "middle", class: "sk-mono", text: t }, g);
      }
    }
    return lines;
  }

  function initFig2B() {
    const root = document.getElementById("fig-2b");
    if (!root) return;
    const svg = root.querySelector("svg.proj");
    const C = 210, R = 150;
    svg.setAttribute("viewBox", "0 0 420 420");
    const defs = el("defs", {}, svg);
    const mk = el("marker", { id: "arr2b", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", fill: "var(--ink)" }, mk);
    const g = el("g", {}, svg);
    const axes = hexaxial(g, C, R, { degrees: true });
    const projSeg = el("line", { stroke: "var(--accent)", "stroke-width": 6, "stroke-linecap": "round", opacity: 0.85 }, svg);
    const perp = el("line", { stroke: "var(--accent)", "stroke-width": 1.3, "stroke-dasharray": "4 3" }, svg);
    const vec = el("line", { x1: C, y1: C, stroke: "var(--ink)", "stroke-width": 3.2, "marker-end": "url(#arr2b)", "stroke-linecap": "round" }, svg);
    const handle = el("circle", { r: 13, fill: "var(--ochre)", "fill-opacity": 0.35, stroke: "var(--ink)", "stroke-width": 1.5, style: "cursor:grab", tabindex: 0, role: "slider", "aria-label": "Vektor ziehen" }, svg);
    el("text", { x: 12, y: 24, class: "sk-label", text: "Frontalebene (Hexaxialsystem)" }, svg);

    const bars = root.querySelector("svg.bars");
    bars.setAttribute("viewBox", "0 0 420 220");
    const BW = 46, GAP = 22, BX0 = 34, BY = 110, BH = 80;
    el("line", { x1: 20, y1: BY, x2: 410, y2: BY, stroke: "var(--ink-faint)", "stroke-width": 1 }, bars);
    const barEls = {};
    CAB.forEach((nm, i) => {
      const x = BX0 + i * (BW + GAP);
      const r = el("rect", { x, width: BW, fill: "var(--blue)", opacity: 0.75, rx: 3, style: "cursor:pointer" }, bars);
      const v = el("text", { x: x + BW / 2, class: "sk-mono", "text-anchor": "middle" }, bars);
      const t = el("text", { x: x + BW / 2, y: 212, class: "sk-label small", "text-anchor": "middle", text: nm.replace("-", "−") }, bars);
      r.addEventListener("click", () => select(nm.replace("-", "") === "aVR" ? "aVR" : nm));
      barEls[nm] = { r, v, t };
    });
    el("text", { x: 20, y: 16, class: "sk-mono", text: "Ausschlag = |H| · cos(Winkel) – Cabrera-Reihenfolge" }, bars);

    const angS = root.querySelector(".ang"), magS = root.querySelector(".mag");
    const angO = root.querySelector(".ang-out"), magO = root.querySelector(".mag-out");
    const readout = root.querySelector(".readout");
    const chips = root.querySelector(".leads");
    let theta = 45, mag = 0.85, sel = "II";

    const val = (nm) => mag * Math.cos((theta - AX[nm]) * D2R);
    const fmt = (x) => (x >= 0 ? "+" : "−") + Math.abs(x).toFixed(2);
    function select(nm) { sel = nm; [...chips.querySelectorAll("button")].forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === nm))); draw(); }
    function draw() {
      const tx = C + Math.cos(theta * D2R) * mag * R, ty = C + Math.sin(theta * D2R) * mag * R;
      vec.setAttribute("x2", tx); vec.setAttribute("y2", ty);
      handle.setAttribute("cx", tx); handle.setAttribute("cy", ty);
      handle.setAttribute("aria-valuenow", Math.round(theta));
      for (const [nm, a] of Object.entries(axes)) {
        const on = nm === sel;
        a.pos.setAttribute("stroke", on ? "var(--accent)" : "var(--ink-soft)"); a.pos.setAttribute("stroke-width", on ? 2.6 : 1.3);
        a.neg.setAttribute("stroke", on ? "var(--accent)" : "var(--ink-faint)");
        a.txt.setAttribute("class", on ? "sk-label small red" : "sk-label small");
      }
      const a = axes[sel], p = val(sel);
      const px = C + a.ux * p * R, py = C + a.uy * p * R;
      projSeg.setAttribute("x1", C); projSeg.setAttribute("y1", C); projSeg.setAttribute("x2", px); projSeg.setAttribute("y2", py);
      perp.setAttribute("x1", tx); perp.setAttribute("y1", ty); perp.setAttribute("x2", px); perp.setAttribute("y2", py);
      for (const nm of CAB) {
        const v = val(nm), b = barEls[nm];
        const hgt = Math.abs(v) * BH;
        b.r.setAttribute("y", v >= 0 ? BY - hgt : BY); b.r.setAttribute("height", Math.max(1, hgt));
        b.r.setAttribute("fill", v >= 0 ? "var(--accent)" : "var(--blue)");
        b.v.setAttribute("y", v >= 0 ? BY - hgt - 6 : BY + hgt + 14); b.v.textContent = fmt(v);
        b.t.setAttribute("class", nm === sel || (nm === "-aVR" && sel === "aVR") ? "sk-label small red" : "sk-label small");
      }
      angS.value = Math.round(theta); magS.value = Math.round(mag * 100);
      angO.textContent = (theta > 0 ? "+" : "") + Math.round(theta) + "°"; magO.textContent = mag.toFixed(2);
      const diff = ((theta - AX[sel] + 540) % 360) - 180;
      const I = val("I"), II = val("II"), III = val("III");
      let note = "";
      if (Math.abs(Math.abs(diff) - 90) < 6) note = " → Vektor steht fast <b>senkrecht</b> auf der Ableitung: kaum Ausschlag (bzw. biphasisch).";
      else if (Math.abs(diff) < 12) note = " → Vektor zeigt fast genau <b>zum positiven Pol</b>: maximaler positiver Ausschlag.";
      else if (Math.abs(diff) > 168) note = " → Vektor zeigt <b>vom positiven Pol weg</b>: maximal negativer Ausschlag.";
      readout.innerHTML =
        `<b>${sel}</b>: |H| · cos(${Math.round(theta)}° − (${AX[sel]}°)) = ${mag.toFixed(2)} · cos(${Math.round(diff)}°) = <b>${fmt(val(sel))}</b>${note}` +
        `<br><span class="mono">Einthoven: I + III = ${fmt(I)} ${III >= 0 ? "+" : "−"} ${Math.abs(III).toFixed(2)} = ${fmt(I + III)} = II (${fmt(II)}) ✓</span>`;
    }
    // Ziehen
    let drag = false;
    const toLocal = (e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
    const onMove = (e) => {
      if (!drag) return;
      const p = toLocal(e), dx = p.x - C, dy = p.y - C;
      theta = Math.atan2(dy, dx) / D2R; mag = U.clamp(Math.hypot(dx, dy) / R, 0.15, 1); draw();
    };
    handle.addEventListener("pointerdown", (e) => { drag = true; handle.setPointerCapture(e.pointerId); handle.style.cursor = "grabbing"; });
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", () => { drag = false; handle.style.cursor = "grab"; });
    svg.addEventListener("pointerdown", (e) => { if (e.target !== handle) { drag = true; onMove(e); drag = false; } });
    handle.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") theta += 5;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") theta -= 5; else return;
      e.preventDefault(); theta = ((theta + 540) % 360) - 180; draw();
    });
    angS.addEventListener("input", () => { theta = +angS.value; draw(); });
    magS.addEventListener("input", () => { mag = +magS.value / 100; draw(); });
    U.seg(chips, (v) => select(v));
    select("II");
  }

  // ======================================================================
  // 2C  Vektorschleife → Extremitätenableitungen
  // ======================================================================
  function lagetyp(a) {
    if (a < -30) return "überdrehter Linkstyp";
    if (a < 30) return "Linkstyp";
    if (a < 60) return "Indifferenztyp";
    if (a < 90) return "Steiltyp";
    if (a <= 120) return "Rechtstyp";
    return "überdrehter Rechtstyp";
  }

  function initFig2C() {
    const root = document.getElementById("fig-2c");
    if (!root) return;
    const svg = root.querySelector("svg.loop");
    const canvas = root.querySelector("canvas.ecg-canvas");
    const tS = root.querySelector(".time"), tO = root.querySelector(".time-out");
    const rotS = root.querySelector(".rot"), rotO = root.querySelector(".rot-out");
    const axisOut = root.querySelector(".axis-out");
    const playBtn = root.querySelector(".play");
    const showPT = root.querySelector(".pt");
    const C = 180, R = 135, WIN = 680;
    svg.setAttribute("viewBox", "0 0 360 360");
    const defs = el("defs", {}, svg);
    const mk = el("marker", { id: "arr2c", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: "auto" }, defs);
    el("path", { d: "M0,0 L10,5 L0,10 z", fill: "var(--accent)" }, mk);
    const gAx = el("g", { opacity: 0.8 }, svg);
    hexaxial(gAx, C, R);
    const loopQ = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 1.4, opacity: 0.35 }, svg);
    const loopQdone = el("path", { fill: "none", stroke: "var(--ink)", "stroke-width": 2.4 }, svg);
    const loopP = el("path", { fill: "none", stroke: "var(--blue)", "stroke-width": 1.6, "stroke-dasharray": "4 3" }, svg);
    const loopT = el("path", { fill: "none", stroke: "var(--violet)", "stroke-width": 1.6, "stroke-dasharray": "4 3" }, svg);
    const meanAx = el("line", { x1: C, y1: C, stroke: "var(--ochre)", "stroke-width": 5, opacity: 0.6, "stroke-linecap": "round" }, svg);
    const arrow = el("line", { x1: C, y1: C, stroke: "var(--accent)", "stroke-width": 3, "marker-end": "url(#arr2c)" }, svg);
    const lblP = el("text", { class: "sk-label small blue", text: "P (×4)" }, svg);
    const lblT = el("text", { class: "sk-label small", style: "fill:var(--violet)", text: "T" }, svg);
    el("text", { x: 8, y: 20, class: "sk-label", text: "Vektorschleife (frontal)" }, svg);

    let t = 160, speed = 0.12, order = "std", beat, sig, k, k3 = null;
    const SC = R / 1.75;
    const h3 = U.heart3d(root.querySelector("canvas.h3d"), { axes: "frontal", view: "schräg" });
    function compute() {
      beat = EKG.makeBeat({ axis: +rotS.value });
      const leads = ["I", "II", "III", "aVR", "aVL", "aVF"];
      const r = EKG.render([{ t0: 0, beat }], { fs: 500, duration: WIN, leads });
      sig = r.leads; sig["-aVR"] = r.leads.aVR.map((x) => -x);
      // Hauptachse aus QRS-Flächen (I und aVF)
      let aI = 0, aF = 0;
      for (let i = Math.round(beat.qrsOn / 2); i < Math.round(beat.qrsOff / 2); i++) { aI += sig.I[i]; aF += sig.aVF[i]; }
      const ang = Math.atan2(aF / EKG.LEAD_VECTORS.aVF[1], aI) / D2R;
      axisOut.textContent = `${ang >= 0 ? "+" : "−"}${Math.abs(Math.round(ang))}° · ${lagetyp(ang)}`;
      meanAx.setAttribute("x2", C + Math.cos(ang * D2R) * R * 0.98); meanAx.setAttribute("y2", C + Math.sin(ang * D2R) * R * 0.98);
      const pts = (a, b, s = 1) => { const p = []; for (let tt = a; tt <= b; tt += 2) { const H = beat.vec(tt); p.push([C + H[0] * SC * s, C + H[1] * SC * s]); } return p; };
      k = { q: pts(beat.qrsOn - 2, beat.qrsOff + 4), p: pts(0, 104, 4), tt: pts(beat.qrsOff + 60, beat.tEnd + 10) };
      loopQ.setAttribute("d", smooth(k.q)); loopP.setAttribute("d", smooth(k.p)); loopT.setAttribute("d", smooth(k.tt));
      const far = (pts) => pts.reduce((a, p) => (Math.hypot(p[0] - C, p[1] - C) > Math.hypot(a[0] - C, a[1] - C) ? p : a), [C, C]);
      const pm = far(k.p), tm = far(k.tt);
      const place = (lbl, p, dy) => { const dx = p[0] - C, dyy = p[1] - C, L = Math.hypot(dx, dyy) || 1;
        lbl.setAttribute("x", p[0] + (dx / L) * 14 - 8); lbl.setAttribute("y", p[1] + (dyy / L) * 14 + dy); };
      place(lblP, pm, 4); place(lblT, tm, 6);
      rotO.textContent = (+rotS.value > 0 ? "+" : "") + rotS.value + "°";
      k3 = { q: U.loop3d(beat, beat.qrsOn - 2, beat.qrsOff + 4), p: U.loop3d(beat, 0, 104), tt: U.loop3d(beat, beat.qrsOff + 60, beat.tEnd + 10) };
    }
    function update3d() {
      const inP = t < 110;
      const H = beat.vec(t);
      const nDone = Math.max(0, Math.round((t - (beat.qrsOn - 2)) / 2));
      const loops = [{ pts: k3.q, color: U.cssVar("--ink"), width: 1.2, alpha: 0.35 }];
      if (nDone > 1) loops.push({ pts: k3.q.slice(0, nDone), color: U.cssVar("--accent"), width: 2.4, proj: false });
      if (showPT.checked) {
        loops.push({ pts: k3.p, scale: 4, color: U.cssVar("--blue"), width: 1.2, alpha: 0.7, proj: false });
        loops.push({ pts: k3.tt, color: U.cssVar("--violet"), width: 1.2, alpha: 0.7, proj: false });
      }
      h3.set({ frontRot: +rotS.value, loops, vec: Math.hypot(...H) * (inP ? 4 : 1) > 0.04 ? H : null, vecScale: inP ? 4 : 1 });
    }
    const cv = U.canvas(canvas, (w) => (w < 480 ? 6 * 74 + 20 : w > 900 ? 2 * 150 + 20 : 3 * 112 + 20), draw);
    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const names = order === "std" ? ["I", "II", "III", "aVR", "aVL", "aVF"] : ["aVL", "I", "-aVR", "II", "aVF", "III"];
      const cols = w < 480 ? 1 : w > 900 ? 3 : 2, rows = 6 / cols;
      const cw = (w - 8 * (cols + 1)) / cols, rh = (h - 12) / rows;
      const pxmm = cw / ((WIN / 1000) * 50);
      names.forEach((nm, i) => {
        const col = cols === 1 ? 0 : cols === 3 ? i % 3 : Math.floor(i / 3);
        const row = cols === 1 ? i : cols === 3 ? Math.floor(i / 3) : i % 3;
        const x0 = 8 + col * (cw + 8), y = 6 + row * rh;
        U.paper(ctx, x0, y, cw, rh - 6, pxmm);
        const y0 = y + (rh - 6) * 0.6;
        const gain = Math.min(10, ((rh - 6) * 0.55) / (1.6 * pxmm));
        U.trace(ctx, sig[nm], 500, { x0, y0, pxmm, speed: 50, gain, color: U.cssVar("--ink-faint"), width: 1 });
        U.trace(ctx, sig[nm], 500, { x0, y0, pxmm, speed: 50, gain, i1: Math.max(1, Math.round(t / 2)), width: 1.9 });
        if (i === 0) U.label(ctx, `50 mm/s · ${gain.toFixed(1).replace(".", ",")} mm/mV`, x0 + cw - 4, y + 14, { size: 10, align: "right", color: U.cssVar("--ink-soft") });
        U.label(ctx, nm, x0 + 5, y + 15, { size: 12, color: U.cssVar("--accent"), font: `600 13px ${U.cssVar("--f-sans")}` });
        const cx = x0 + (t / 1000) * 50 * pxmm;
        ctx.strokeStyle = U.cssVar("--accent"); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y + rh - 6); ctx.stroke();
      });
    }
    function setT(nt) {
      t = ((nt % WIN) + WIN) % WIN;
      const H = beat.vec(t);
      const inP = t < 110;
      const s = inP ? 4 : 1;
      arrow.setAttribute("x2", C + H[0] * SC * s); arrow.setAttribute("y2", C + H[1] * SC * s);
      arrow.setAttribute("opacity", Math.hypot(H[0], H[1]) * s > 0.04 ? 1 : 0);
      const done = k.q.slice(0, Math.max(0, Math.round((t - (beat.qrsOn - 2)) / 2)));
      loopQdone.setAttribute("d", done.length > 1 ? smooth(done) : "");
      tS.value = Math.round(t); tO.textContent = Math.round(t) + " ms";
      const vis = showPT.checked ? "" : "none";
      loopP.style.display = vis; loopT.style.display = vis; lblP.style.display = vis; lblT.style.display = vis;
      cv.redraw(); update3d();
    }
    const loop = U.loop(root, (dt) => setT(t + dt * speed));
    const setPlaying = (on) => { on ? loop.play() : loop.pause(); playBtn.textContent = on ? "❚❚ Pause" : "▶ Abspielen"; };
    playBtn.addEventListener("click", () => setPlaying(!loop.running));
    tS.addEventListener("input", () => { setPlaying(false); setT(+tS.value); });
    rotS.addEventListener("input", () => { compute(); setT(t); });
    showPT.addEventListener("change", () => setT(t));
    U.seg(root.querySelector(".order"), (v) => { order = v; cv.redraw(); });
    U.seg(root.querySelector(".speed"), (v) => { speed = +v; });
    root.querySelector(".reset").addEventListener("click", () => { rotS.value = 0; compute(); setT(t); });
    compute(); setT(beat.qrsOn + 47);
    if (!U.reducedMotion()) setPlaying(true);
  }

  function initQuiz() {
    const m = document.querySelector('[data-quiz="kap2"]');
    if (!m) return;
    U.quiz(m, "kap2", [
      { q: "Eine Depolarisationsfront läuft direkt auf den positiven Pol einer Ableitung zu. Was zeigt das EKG?",
        a: ["Einen negativen Ausschlag", "Einen positiven Ausschlag", "Keinen Ausschlag", "Einen Ausschlag, dessen Richtung von der Herzfrequenz abhängt"],
        c: 1, e: "Bei der Depolarisation zeigt der Dipol (von − nach +) in Ausbreitungsrichtung. Läuft die Front auf den positiven Pol zu, wird der Ausschlag positiv." },
      { q: "Warum ist die T-Welle normalerweise gleichsinnig (konkordant) zum QRS-Komplex?",
        a: ["Weil Repolarisation immer positive Ausschläge erzeugt", "Weil die Repolarisation in derselben Richtung wie die Depolarisation abläuft", "Weil das Epikard früher repolarisiert als das Endokard – die Repolarisation läuft entgegen der Depolarisation", "Weil die Vorhöfe während der T-Welle depolarisieren"],
        c: 2, e: "Repolarisation in derselben Richtung würde einen gegensinnigen Ausschlag erzeugen. Weil die epikardialen Aktionspotenziale kürzer sind, läuft die Repolarisation von epikardial nach endokardial – also umgekehrt – und der Ausschlag hat dieselbe Polarität wie der QRS (Yan & Antzelevitch 1998)." },
      { q: "Der QRS-Hauptvektor steht exakt senkrecht auf Ableitung aVL. Wie sieht der QRS in aVL aus?",
        a: ["Maximal positiv", "Maximal negativ", "Klein bzw. biphasisch (Nettofläche ≈ 0)", "Er fehlt vollständig, die Ableitung zeigt eine Nulllinie"],
        c: 2, e: "Die Projektion eines Vektors auf eine senkrechte Achse ist null (cos 90° = 0). Da der QRS aber eine Schleife ist, sieht man meist kleine positive und negative Anteile – die Nettofläche ist annähernd null. Genau das nutzt man später zur Lagetypbestimmung." },
      { q: "In Ableitung I misst du +0,4 mV, in Ableitung III +0,7 mV (zum gleichen Zeitpunkt). Wie groß ist II?",
        a: ["+0,3 mV", "+1,1 mV", "+0,55 mV", "Das lässt sich nicht berechnen"],
        c: 1, e: "Einthoven-Gesetz: II = I + III. Das ist keine Näherung, sondern folgt direkt aus der Definition der drei Ableitungen (Potenzialdifferenzen zwischen denselben drei Elektroden)." },
      { q: "Wie lautet die Reihenfolge der Extremitätenableitungen im Cabrera-Kreis (von oben nach unten bzw. links nach rechts)?",
        a: ["I, II, III, aVR, aVL, aVF", "aVL, I, −aVR, II, aVF, III", "aVR, aVL, aVF, I, II, III", "III, aVF, II, −aVR, I, aVL"],
        c: 1, e: "Im Cabrera-Kreis folgen die Ableitungen in 30°-Schritten aufeinander: aVL (−30°), I (0°), −aVR (+30°), II (+60°), aVF (+90°), III (+120°). Die AHA/ACCF/HRS-Empfehlungen (2007) empfehlen diese Anzeige ausdrücklich." },
    ]);
  }

  document.addEventListener("DOMContentLoaded", () => { initFig2A(); initFig2B(); initFig2C(); initQuiz(); });
})();
