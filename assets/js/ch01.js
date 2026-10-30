/* Kapitel 1 – Erregungsbildung und Erregungsleitung */
(function () {
  "use strict";
  const { el, smooth, jitter } = U;

  // ======================================================================
  // 1A  Herzschema mit Erregungsausbreitung + synchrones EKG (Ableitung II)
  // ======================================================================
  // Zeitachse (ms ab Beginn der P-Welle). Werte orientieren sich an Klabunde
  // (Septum ~0,16 s, gesamte Ventrikel ~0,23 s) und Durrer et al. 1970.
  const PR = 160;
  const T_ = {
    sa: [0, 14], bach: [6, 48], av: [58, 135], his: [135, 146], bundles: [142, 160], purk: [150, 178],
    atrialDepolRate: 2.05, atrialRepolStart: 195,
  };
  // Ventrikel-Schichten: Aktivierung [Beginn, Ende], Repolarisation [Beginn, Ende]
  const LAYERS = {
    septum:   { on: [160, 184], off: [470, 515] },
    apex:     { on: [172, 186], off: [452, 492] },
    rvEndo:   { on: [168, 180], off: [468, 508] },
    rvEpi:    { on: [178, 192], off: [436, 476] },
    lvEndoA:  { on: [170, 184], off: [484, 528] },
    lvEpiA:   { on: [184, 208], off: [440, 480] },
    lvEndoB:  { on: [192, 210], off: [500, 545] },
    lvEpiB:   { on: [212, 248], off: [455, 498] },
  };

  const PHASES = [
    { t: [0, 15], tag: "Sinusknoten", txt: "Der <b>Sinusknoten</b> erreicht seine Schwelle und feuert. Seine Zellmasse ist so klein, dass das Oberflächen-EKG davon nichts zeigt." },
    { t: [15, 100], tag: "P-Welle", txt: "Die Erregung breitet sich über die <b>Vorhöfe</b> aus – zuerst rechts, über das Bachmann-Bündel dann links. Im EKG: <b>P-Welle</b>." },
    { t: [100, 135], tag: "PQ-Strecke", txt: "Der <b>AV-Knoten</b> leitet sehr langsam (≈ 0,05 m/s). Die Vorhöfe können sich kontrahieren, bevor die Kammern erregt werden. Im EKG: isoelektrische <b>PQ-Strecke</b>." },
    { t: [135, 160], tag: "PQ-Strecke", txt: "<b>His-Bündel, Tawara-Schenkel, Purkinje-Fasern</b> leiten sehr schnell (≈ 2–4 m/s). Auch das ist zu wenig Masse für eine sichtbare Zacke – die Linie bleibt isoelektrisch." },
    { t: [160, 186], tag: "QRS (Beginn)", txt: "Das <b>Septum</b> wird zuerst erregt – von <b>links nach rechts</b>. Daher stammen das kleine septale q in I, aVL, V5/V6 und das kleine r in V1." },
    { t: [186, 252], tag: "QRS", txt: "Das Kammermyokard wird über das Purkinje-Netz von <b>endokardial nach epikardial</b> erregt; posterobasale Anteile zuletzt. Im EKG: <b>QRS-Komplex</b>. Die Vorhof-Repolarisation (Ta-Welle) geht darin unter." },
    { t: [252, 390], tag: "ST-Strecke", txt: "Alle Kammerzellen sind depolarisiert (Plateau, Phase 2). Ohne Potenzialunterschied zwischen den Zellen: isoelektrische <b>ST-Strecke</b>." },
    { t: [390, 562], tag: "T-Welle", txt: "<b>Repolarisation</b> der Kammern. Das Epikard repolarisiert früher als das Endokard – die Repolarisation läuft also entgegen der Depolarisation. Deshalb ist die <b>T-Welle</b> normalerweise gleichsinnig zum QRS." },
    { t: [562, 1000], tag: "TP-Strecke", txt: "Diastole: Alle Zellen sind in Ruhe, die Linie ist isoelektrisch. Im Sinusknoten steigt das Membranpotenzial bereits langsam an (Phase 4) – der nächste Schlag bereitet sich vor." },
  ];

  const ramp = (t, a, b) => (t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a));

  function buildHeart(svg) {
    svg.setAttribute("viewBox", "-95 0 650 470");
    const uid = "h" + Math.random().toString(36).slice(2, 7);
    const defs = el("defs", {}, svg);

    // --- Geometrie ---
    const RA = [[150, 80], [112, 90], [84, 120], [80, 160], [98, 194], [136, 208], [186, 206], [205, 182], [207, 124], [190, 92]];
    const LA = [[238, 96], [223, 122], [221, 176], [242, 198], [292, 200], [336, 186], [352, 152], [344, 114], [312, 94], [272, 88]];
    const lvOut = [[372, 216], [383, 264], [375, 324], [347, 377], [306, 418], [262, 441]];
    const lvIn = [[332, 228], [341, 268], [334, 318], [312, 360], [284, 390], [258, 404]];
    const rvOut = [[76, 224], [68, 264], [82, 312], [116, 360], [168, 402], [226, 432]];
    const rvIn = [[102, 232], [98, 266], [112, 306], [142, 344], [178, 372], [206, 388]];
    const sepR = [[198, 228], [201, 282], [205, 336], [210, 386]];
    const sepL = [[226, 228], [232, 284], [240, 340], [252, 394]];
    const mid = (a, b) => a.map((p, i) => [(p[0] + b[i][0]) / 2, (p[1] + b[i][1]) / 2]);
    const poly = (a, b) => [...a, ...b.slice().reverse()];
    const lvMid = mid(lvOut, lvIn), rvMid = mid(rvOut, rvIn);
    const shapes = {
      lvEpiB: poly(lvOut.slice(0, 3), lvMid.slice(0, 3)),
      lvEpiA: poly(lvOut.slice(2), lvMid.slice(2)),
      lvEndoB: poly(lvMid.slice(0, 3), lvIn.slice(0, 3)),
      lvEndoA: poly(lvMid.slice(2), lvIn.slice(2)),
      rvEpi: poly(rvOut, rvMid),
      rvEndo: poly(rvMid, rvIn),
      septum: poly(sepR, sepL),
      apex: [rvOut[5], [244, 440], lvOut[5], lvIn[5], sepL[3], sepR[3], rvIn[5]],
    };
    const linPath = (pts) => "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L") + " Z";

    // --- Maske für die Vorhoferregung (wachsender Kreis um den Sinusknoten) ---
    const SA = [158, 86];
    const mask = el("mask", { id: uid + "-am", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 470, height: 470 }, defs);
    el("rect", { x: 0, y: 0, width: 470, height: 470, fill: "black" }, mask);
    const depC = el("circle", { cx: SA[0], cy: SA[1], r: 0, fill: "white" }, mask);
    const repC = el("circle", { cx: SA[0], cy: SA[1], r: 0, fill: "black" }, mask);
    const sMask = el("mask", { id: uid + "-sm", maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 470, height: 470 }, defs);
    const sRect = el("rect", { x: 260, y: 200, width: 0, height: 220, fill: "white" }, sMask);

    const gBase = el("g", { filter: "url(#sk-wobble)" }, svg);
    const gAct = el("g", {}, svg);
    const gLines = el("g", { filter: "url(#sk-wobble)" }, svg);

    // Gefäßstümpfe (Dekoration)
    el("path", { class: "sk-stroke", d: "M138,20 L140,80 M172,18 L170,84" }, gLines);          // V. cava superior
    el("path", { class: "sk-stroke", d: "M228,60 C230,30 262,18 292,26 C318,34 322,58 318,80" }, gLines); // Aorta
    el("path", { class: "sk-stroke", d: "M252,78 C254,52 270,44 290,46 C306,48 306,64 302,82" }, gLines);
    el("path", { class: "sk-stroke", d: "M346,112 L392,98 M352,150 L398,152" }, gLines);       // Lungenvenen
    el("path", { class: "sk-stroke", d: "M104,204 L96,236" }, gLines);                         // V. cava inferior

    // Grundflächen
    const baseFill = "var(--paper-2)";
    const atria = el("g", {}, gBase);
    el("path", { d: smooth(RA, true), fill: baseFill, stroke: "none" }, atria);
    el("path", { d: smooth(LA, true), fill: baseFill, stroke: "none" }, atria);
    for (const k of Object.keys(shapes)) el("path", { d: linPath(shapes[k]), fill: baseFill, stroke: "none" }, gBase);

    // Aktive (erregte) Flächen
    const atrAct = el("g", { mask: `url(#${uid}-am)` }, gAct);
    el("path", { d: smooth(RA, true), fill: "var(--ochre)", opacity: 0.75 }, atrAct);
    el("path", { d: smooth(LA, true), fill: "var(--ochre)", opacity: 0.75 }, atrAct);
    const act = {};
    for (const k of Object.keys(shapes)) {
      act[k] = el("path", { d: linPath(shapes[k]), fill: "var(--ochre)", opacity: 0,
        mask: k === "septum" ? `url(#${uid}-sm)` : null }, gAct);
    }

    // Umrisse (doppelt, leicht versetzt → Skizze)
    const outline = (pts, closed = true, w = 1.8) => {
      el("path", { d: smooth(pts, closed), class: "sk-stroke", "stroke-width": w }, gLines);
      el("path", { d: smooth(jitter(pts, 1.2, pts.length), closed), class: "sk-thin" }, gLines);
    };
    outline(RA); outline(LA);
    outline([...rvOut, [244, 440], ...lvOut.slice().reverse()], false, 2);
    outline([[76, 224], [130, 214], [196, 222]], false);
    outline([[228, 222], [300, 210], [372, 216]], false);
    outline(lvIn, false, 1.4); outline(rvIn, false, 1.4);
    outline(sepR, false, 1.4); outline(sepL, false, 1.4);
    // Endo/Epi-Trennlinie andeuten
    el("path", { d: smooth(lvMid), class: "sk-thin", "stroke-dasharray": "2 4" }, gLines);
    el("path", { d: smooth(rvMid), class: "sk-thin", "stroke-dasharray": "2 4" }, gLines);

    // --- Erregungsleitungssystem ---
    const gCS = el("g", {}, svg);
    const cs = {};
    const csPath = (key, d, w = 3) => {
      cs[key] = el("path", { d, fill: "none", stroke: "var(--accent)", "stroke-width": w, "stroke-linecap": "round", opacity: 0.55 }, gCS);
      return cs[key];
    };
    csPath("bach", "M167,88 C200,76 236,82 262,100", 2.4);
    csPath("his", "M213,212 L214,236", 3.4);
    const rbb = csPath("rbb", "M209,238 C204,282 205,330 210,372");
    csPath("mod", "M206,322 C180,334 152,338 124,320", 2.2);
    const lbb = csPath("lbb", "M219,238 C228,282 237,332 247,376");
    csPath("lafasc", "M222,256 C252,262 284,258 318,246", 2);
    csPath("lpfasc", "M226,272 C250,304 270,332 300,350", 2);
    // Purkinje-Fasern: feine Äste entlang des Endokards
    const pk = [];
    const purkAlong = (pts, dir) => {
      for (let i = 1; i < pts.length; i++) {
        const [x, y] = pts[i];
        const d = `M${x},${y} l${dir * 9},${-4} M${x},${y} l${dir * 7},${6}`;
        pk.push(el("path", { d, fill: "none", stroke: "var(--accent)", "stroke-width": 1.3, opacity: 0.5 }, gCS));
      }
    };
    purkAlong(lvIn, 1); purkAlong(rvIn, -1);
    purkAlong([[248, 392], [240, 360], [232, 318]], 1); purkAlong([[208, 380], [204, 344]], -1);
    cs.sa = el("ellipse", { cx: SA[0], cy: SA[1], rx: 9, ry: 6, fill: "var(--accent)", opacity: 0.8 }, gCS);
    cs.av = el("ellipse", { cx: 212, cy: 207, rx: 8.5, ry: 5.5, fill: "var(--accent)", opacity: 0.8 }, gCS);
    const dotL = el("circle", { r: 5, fill: "var(--accent)", stroke: "var(--paper-2)", "stroke-width": 1.5, opacity: 0 }, gCS);
    const dotR = el("circle", { r: 5, fill: "var(--accent)", stroke: "var(--paper-2)", "stroke-width": 1.5, opacity: 0 }, gCS);

    // --- Beschriftung ---
    const gLab = el("g", {}, svg);
    const lab = (txt, x, y, lx, ly, cls = "sk-label small", anchor) => {
      if (lx !== undefined) el("path", { class: "leader", d: `M${anchor === "start" && x < 235 ? x + 60 : x},${y - 4} L${lx},${ly}` }, gLab);
      el("text", { x, y, class: cls, text: txt, "text-anchor": anchor || (x > 235 ? "start" : "end") }, gLab);
    };
    // Kammerbezeichnungen
    for (const [t, x, y] of [["RA", 140, 156], ["LA", 290, 150], ["RV", 160, 300], ["LV", 290, 316]]) {
      el("text", { x, y, class: "sk-label", "text-anchor": "middle", text: t, opacity: 0.85 }, gLab);
    }
    lab("Sinusknoten", 112, 44, 152, 80, "sk-label small red");
    lab("Bachmann-Bündel", 318, 60, 244, 88, "sk-label small red");
    lab("AV-Knoten", 58, 206, 203, 207, "sk-label small red");
    lab("His-Bündel", 440, 228, 217, 224, "sk-label small red");
    lab("rechter Tawara-Schenkel", -88, 440, 206, 350, "sk-label small red", "start");
    lab("linker Tawara-Schenkel", 300, 458, 246, 374, "sk-label small red");
    lab("Purkinje-Fasern", 440, 336, 343, 318, "sk-label small red");
    lab("Endokard", 440, 300, 336, 290, "sk-label small");
    lab("Epikard", 440, 264, 382, 262, "sk-label small");

    const pathPt = (p, f) => { const L = p.getTotalLength(); return p.getPointAtLength(U.clamp(f, 0, 1) * L); };
    const hisEl = cs.his;

    function update(t) {
      // Vorhöfe
      depC.setAttribute("r", Math.max(0, t * T_.atrialDepolRate));
      repC.setAttribute("r", Math.max(0, (t - T_.atrialRepolStart) * T_.atrialDepolRate * 0.9));
      // Septum: von links (LV-Seite) nach rechts
      const sp = ramp(t, LAYERS.septum.on[0], LAYERS.septum.on[1]);
      sRect.setAttribute("x", 258 - sp * 66); sRect.setAttribute("width", sp * 66);
      for (const [k, L] of Object.entries(LAYERS)) {
        const a = ramp(t, L.on[0], L.on[1]) * (1 - ramp(t, L.off[0], L.off[1]));
        act[k].setAttribute("opacity", (k === "septum" ? (1 - ramp(t, L.off[0], L.off[1])) : a) * 0.8);
      }
      // Leitungssystem hervorheben
      const hi = (node, on, base = 0.45) => {
        node.setAttribute("opacity", on ? 1 : base);
        node.setAttribute("stroke-width", node.tagName === "path" ? (on ? 4.2 : (node === cs.his ? 3.4 : 2.6)) : null);
      };
      hi(cs.sa, t >= T_.sa[0] && t < T_.sa[1] + 6, 0.75);
      cs.sa.setAttribute("rx", t < 20 ? 12 : 9); cs.sa.setAttribute("ry", t < 20 ? 8 : 6);
      hi(cs.bach, t >= T_.bach[0] && t < T_.bach[1]);
      const inAV = t >= T_.av[0] && t < T_.av[1];
      hi(cs.av, inAV, 0.75);
      cs.av.setAttribute("rx", inAV ? 8.5 + 2.5 * Math.abs(Math.sin(t / 9)) : 8.5);
      hi(cs.his, t >= T_.his[0] && t < T_.his[1] + 4);
      const inB = t >= T_.bundles[0] && t < T_.bundles[1] + 6;
      [cs.rbb, cs.lbb].forEach((n) => hi(n, inB));
      const inP = t >= T_.purk[0] && t < T_.purk[1];
      [cs.mod, cs.lafasc, cs.lpfasc].forEach((n) => hi(n, inP));
      pk.forEach((n) => n.setAttribute("opacity", inP ? 1 : 0.45));
      // Wandernde Punkte: His → Schenkel
      if (t >= T_.his[0] && t < T_.bundles[1]) {
        let pL, pR;
        if (t < T_.his[1]) { pL = pR = pathPt(hisEl, (t - T_.his[0]) / (T_.his[1] - T_.his[0])); }
        else {
          const f = (t - T_.his[1]) / (T_.bundles[1] - T_.his[1]);
          pL = pathPt(lbb, f); pR = pathPt(rbb, f);
        }
        dotL.setAttribute("cx", pL.x); dotL.setAttribute("cy", pL.y); dotL.setAttribute("opacity", 1);
        dotR.setAttribute("cx", pR.x); dotR.setAttribute("cy", pR.y); dotR.setAttribute("opacity", 1);
      } else { dotL.setAttribute("opacity", 0); dotR.setAttribute("opacity", 0); }
    }
    return { update, labels: gLab };
  }

  function initFig1A() {
    const root = document.getElementById("fig-1a");
    if (!root) return;
    const svg = root.querySelector("svg.heart");
    const heart = buildHeart(svg);
    const canvas = root.querySelector("canvas");
    const slider = root.querySelector("input[type=range]");
    const out = root.querySelector("output");
    const readout = root.querySelector(".readout");
    const playBtn = root.querySelector(".play");
    const labelsCb = root.querySelector(".labels");

    const beat = EKG.makeBeat({ pr: PR, qt: 400 });
    const sig = EKG.render([{ t0: 0, beat }, { t0: 1000, beat }], { fs: 500, duration: 1000, leads: ["II"] }).leads.II;
    let t = 0, speed = 0.25;

    const EVENTS = [
      { name: "Sinusknoten", a: 0, b: 12, vis: false },
      { name: "Vorhöfe · Depolarisation", a: 0, b: 100, vis: true },
      { name: "AV-Knoten · Verzögerung", a: T_.av[0], b: T_.av[1], vis: false },
      { name: "His · Tawara · Purkinje", a: T_.his[0], b: T_.purk[1], vis: false },
      { name: "Ventrikel · Depolarisation", a: 160, b: 252, vis: true },
      { name: "Vorhöfe · Repolarisation", a: 195, b: 330, vis: false },
      { name: "Ventrikel · Repolarisation", a: 390, b: 562, vis: true },
    ];
    const SEG = [["P", 0, 100], ["PQ", 100, 160], ["QRS", 160, 252], ["ST", 252, 390], ["T", 390, 562], ["TP", 562, 1000]];

    const cv = U.canvas(canvas, (w) => {
      const pxmm = (w - 16) / 50;
      return Math.round(24 * pxmm + EVENTS.length * (w < 600 ? 30 : 20) + 58);
    }, draw);

    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const x0 = 8, pxmm = (w - 16) / 50;           // 50 mm/s → 1 s = 50 mm
      const ecgH = 24 * pxmm, y0 = 8 + 17 * pxmm;   // Grundlinie
      U.paper(ctx, x0, 8, w - 16, ecgH, pxmm);
      // Abschnittsbänder
      const pxms = (w - 16) / 1000;
      const cur = SEG.find((s) => t >= s[1] && t < s[2]);
      if (cur) {
        ctx.fillStyle = U.cssVar("--ochre-soft"); ctx.globalAlpha = 0.55;
        ctx.fillRect(x0 + cur[1] * pxms, 8, (cur[2] - cur[1]) * pxms, ecgH); ctx.globalAlpha = 1;
      }
      U.trace(ctx, sig, 500, { x0, y0, pxmm, speed: 50, color: U.cssVar("--ink-faint"), width: 1.1 });
      U.trace(ctx, sig, 500, { x0, y0, pxmm, speed: 50, i1: Math.max(1, Math.round(t / 2)), width: 2 });
      for (const [nm, a, b] of SEG) {
        U.label(ctx, nm, x0 + ((a + b) / 2) * pxms, 8 + ecgH - 6, { align: "center", size: 11, color: U.cssVar("--ink-soft") });
      }
      U.label(ctx, "II · 50 mm/s · 10 mm/mV", x0 + 6, 22, { size: 11, color: U.cssVar("--ink-soft") });
      // Ereignisbalken
      let y = 8 + ecgH + (w < 600 ? 22 : 14);
      ctx.font = `500 11px ${U.cssVar("--f-mono")}`;
      for (const e of EVENTS) {
        const xa = x0 + e.a * pxms, xb = x0 + e.b * pxms;
        const active = t >= e.a && t < e.b;
        ctx.fillStyle = e.vis ? U.cssVar("--ochre") : U.cssVar("--ink-faint");
        ctx.globalAlpha = active ? 0.95 : 0.35;
        if (e.vis) ctx.fillRect(xa, y, Math.max(2, xb - xa), 10);
        else { ctx.save(); ctx.setLineDash([3, 2]); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 1.5; ctx.strokeRect(xa, y + 1, Math.max(2, xb - xa), 8); ctx.restore(); }
        ctx.globalAlpha = 1;
        const txt = e.name + (e.vis ? "" : " (unsichtbar)");
        const tw = ctx.measureText(txt).width;
        const col = active ? U.cssVar("--ink") : U.cssVar("--ink-faint");
        if (w < 600) {
          // schmal: Beschriftung über dem Balken
          U.label(ctx, txt, Math.min(Math.max(x0, xa), w - 8 - tw), y - 2, { size: 10.5, color: col });
          y += 30;
        } else {
          const tx = xb + 6 + tw < w - 4 ? xb + 6 : Math.max(x0, xa - 6 - tw);
          U.label(ctx, txt, tx, y + 9, { size: 11, color: col });
          y += 20;
        }
      }
      // Zeitachse
      ctx.strokeStyle = U.cssVar("--ink-faint"); ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(x0, y + 4); ctx.lineTo(w - 8, y + 4); ctx.stroke();
      for (let ms = 0; ms <= 1000; ms += 100) {
        const X = x0 + ms * pxms;
        ctx.beginPath(); ctx.moveTo(X, y + 1); ctx.lineTo(X, y + 7); ctx.stroke();
        if (ms % 200 === 0) U.label(ctx, ms + " ms", X, y + 20, { size: 10, align: ms === 0 ? "left" : ms === 1000 ? "right" : "center", color: U.cssVar("--ink-faint") });
      }
      // Cursor
      const cx = x0 + t * pxms;
      ctx.strokeStyle = U.cssVar("--accent"); ctx.lineWidth = 1.6; ctx.beginPath();
      ctx.moveTo(cx, 8); ctx.lineTo(cx, y + 6); ctx.stroke();
    }

    let lastPhase = -1;
    function setT(nt) {
      t = ((nt % 1000) + 1000) % 1000;
      heart.update(t);
      slider.value = Math.round(t); out.textContent = Math.round(t) + " ms";
      const pi = PHASES.findIndex((p) => t >= p.t[0] && t < p.t[1]);
      if (pi !== lastPhase) {
        lastPhase = pi;
        const p = PHASES[pi];
        readout.innerHTML = `<span class="tag">${p.tag}</span>${p.txt}`;
      }
      cv.redraw();
    }
    const loop = U.loop(root, (dt) => setT(t + dt * speed));
    const setPlaying = (on) => { on ? loop.play() : loop.pause(); playBtn.textContent = on ? "❚❚ Pause" : "▶ Abspielen"; playBtn.setAttribute("aria-pressed", on); };
    playBtn.addEventListener("click", () => setPlaying(!loop.running));
    slider.addEventListener("input", () => { setPlaying(false); setT(+slider.value); });
    U.seg(root.querySelector(".speed"), (v) => { speed = +v; });
    labelsCb.addEventListener("change", () => heart.labels.style.display = labelsCb.checked ? "" : "none");
    setT(0);
    if (!U.reducedMotion()) setPlaying(true);
  }

  // ======================================================================
  // 1B  Aktionspotenziale: Sinusknoten vs. Arbeitsmyokard, synchron mit EKG
  // ======================================================================
  function initFig1B() {
    const root = document.getElementById("fig-1b");
    if (!root) return;
    const canvas = root.querySelector("canvas");
    const tone = root.querySelector("input[type=range]");
    const hrOut = root.querySelector("output");
    const ionsCb = root.querySelector(".ions");
    const WIN = 3200;
    const THR = -40;

    function model() {
      const v = +tone.value; // −1 (Vagus) … +1 (Sympathikus)
      const s0 = 20 / 657;   // mV/ms → ≈ 70/min in Ruhe
      const slope = v >= 0 ? s0 * (1 + 0.9 * v) : s0 * (1 + 0.35 * v);
      const mdp = -60 - 5 * Math.max(0, -v);
      const t4 = (THR - mdp) / slope;
      const cycle = t4 + 200;
      return { slope, mdp, t4, cycle, hr: 60000 / cycle };
    }
    const ease = (u) => 0.5 - 0.5 * Math.cos(Math.PI * U.clamp(u, 0, 1));

    function saV(t, m, fires) {
      // letzte Zündung vor t
      let f = -Infinity;
      for (const x of fires) if (x <= t) f = x;
      if (f === -Infinity) { // vor der ersten Zündung: Phase 4 aus vorherigem Zyklus
        const u = (t - (fires[0] - m.t4)) / m.t4;
        return m.mdp + (THR - m.mdp) * (0.72 * u + 0.28 * u * u * u);
      }
      const d = t - f;
      if (d < 50) return THR + (10 - THR) * ease(d / 50);              // Phase 0 (I_Ca,L)
      if (d < 200) return 10 + (m.mdp - 10) * ease((d - 50) / 150);     // Phase 3 (I_K)
      const u = U.clamp((d - 200) / m.t4, 0, 1);                        // Phase 4 (I_f u. a.)
      return m.mdp + (THR - m.mdp) * (0.72 * u + 0.28 * u * u * u);
    }
    function ventV(d, apd, epi) {
      // d: ms seit Aufstrich, apd: Dauer bis volle Repolarisation
      const rest = -88;
      if (d < 0) return rest;
      if (d < 2) return rest + (30 - rest) * (d / 2);                    // Phase 0 (I_Na)
      const notch = epi ? -2 : 8;
      if (d < 12) return 30 + (notch - 30) * ease((d - 2) / 10);         // Phase 1 (I_to)
      const p3 = apd - 95;
      if (epi && d < 40) return notch + (14 - notch) * ease((d - 12) / 28); // "Dome" des Epikards
      const top = epi ? 14 : notch;
      const t2 = epi ? 40 : 12;
      if (d < p3) return top + (-12 - top) * ((d - t2) / (p3 - t2));    // Phase 2 Plateau
      if (d < apd) return -12 + (rest + 12) * ease((d - p3) / 95);       // Phase 3
      return rest;                                                       // Phase 4 (I_K1)
    }

    const cv = U.canvas(canvas, (w) => (w < 560 ? 450 : 490), draw);
    function draw(ctx, w, h) {
      const m = model();
      hrOut.textContent = Math.round(m.hr) + " /min";
      ctx.clearRect(0, 0, w, h);
      const L = 70, R = 10, pw = w - L - R;
      const X = (t) => L + (t / WIN) * pw;
      const fires = [];
      for (let f = 260; f < WIN + m.cycle; f += m.cycle) fires.push(f);
      const ink = U.cssVar("--ink"), soft = U.cssVar("--ink-soft"), faint = U.cssVar("--ink-faint");
      const mono = U.cssVar("--f-mono");
      const ions = ionsCb.checked;

      // --- Spur 1: Sinusknoten ---
      const y1 = (v) => 20 + ((20 - v) / 110) * 120;  // +20…−90 mV
      const track = (title, ytop, ybot) => {
        ctx.strokeStyle = U.cssVar("--rule"); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, ybot); ctx.lineTo(w - R, ybot); ctx.stroke();
        U.label(ctx, title, 4, ytop + 10, { size: 11, color: soft });
      };
      track("Sinus-", 14, 140); U.label(ctx, "knoten", 4, 38, { size: 11, color: soft });
      ctx.setLineDash([4, 4]); ctx.strokeStyle = faint; ctx.lineWidth = 1;
      for (const [v, txt] of [[THR, "Schwelle −40"], [m.mdp, "MDP " + Math.round(m.mdp)]]) {
        ctx.beginPath(); ctx.moveTo(L, y1(v)); ctx.lineTo(w - R, y1(v)); ctx.stroke();
        U.label(ctx, txt + " mV", w - R - 4, y1(v) - 3, { size: 10, align: "right", color: faint });
      }
      ctx.setLineDash([]);
      ctx.strokeStyle = U.cssVar("--blue"); ctx.lineWidth = 2; ctx.beginPath();
      for (let t = 0; t <= WIN; t += 2) { const v = saV(t, m, fires); t ? ctx.lineTo(X(t), y1(v)) : ctx.moveTo(X(t), y1(v)); }
      ctx.stroke();
      // Phasen beschriften (erster vollständiger Zyklus)
      const f0 = fires[0];
      const circ = (x, y, n, col) => {
        ctx.fillStyle = U.cssVar("--paper-2"); ctx.strokeStyle = col; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); ctx.stroke();
        U.label(ctx, String(n), x, y + 4, { size: 11, align: "center", color: col });
      };
      const blue = U.cssVar("--blue");
      circ(X(f0 + 22), y1(-10) , 0, blue);
      circ(X(f0 + 120), y1(-15) - 4, 3, blue);
      circ(X(f0 + 200 + m.t4 * 0.5), y1(saV(f0 + 200 + m.t4 * 0.5, m, fires)) - 14, 4, blue);
      if (ions) {
        U.label(ctx, "Phase 4: I_f (HCN4), I_Ca,T, Ca²⁺-Uhr/NCX", X(f0 + 200 + m.t4 * 0.12), y1(-80) + 14, { size: 11, color: blue });
        U.label(ctx, "Phase 0: I_Ca,L (langsam)", X(f0 + 30), y1(18) , { size: 11, color: blue });
      }

      // --- Spur 2: Ventrikel (Epikard / Endokard) ---
      const yb = 186, y2 = (v) => yb + ((40 - v) / 130) * 130;
      track("Ventrikel", yb + 2, yb + 130);
      const rr = m.cycle, qt = EKG.qtForRR(rr);
      const ecgBeat = EKG.makeBeat({ pr: PR, qt });
      const tpk = ecgBeat.tPeak - PR, tend = ecgBeat.tEnd - PR;
      const drawAP = (epi, col, dash) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash); ctx.beginPath();
        let first = true;
        for (let t = 0; t <= WIN; t += 1) {
          let v = -88;
          for (const f of [fires[0] - m.cycle, ...fires]) { const d = t - (f + 10 + PR); if (d >= 0 && d < 600) v = ventV(d, epi ? tpk : tend - 8, epi); }
          first ? ctx.moveTo(X(t), y2(v)) : ctx.lineTo(X(t), y2(v)); first = false;
        }
        ctx.stroke(); ctx.setLineDash([]);
      };
      drawAP(false, U.cssVar("--accent"), []);
      drawAP(true, U.cssVar("--violet"), [6, 3]);
      const q0 = f0 + 10 + PR;
      const red = U.cssVar("--accent");
      circ(X(q0) - 10, y2(10), 0, red); circ(X(q0 + 9), y2(36), 1, red);
      circ(X(q0 + (tend - 95) / 2), y2(8) - 12, 2, red);
      circ(X(q0 + tend - 40) + 12, y2(-50), 3, red);
      circ(X(q0 + tend + 60), y2(-88) - 14, 4, red);
      // Legende im linken Rand
      ctx.lineWidth = 2;
      ctx.strokeStyle = red; ctx.beginPath(); ctx.moveTo(6, yb + 40); ctx.lineTo(24, yb + 40); ctx.stroke();
      ctx.strokeStyle = U.cssVar("--violet"); ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(6, yb + 58); ctx.lineTo(24, yb + 58); ctx.stroke(); ctx.setLineDash([]);
      U.label(ctx, "Endo", 28, yb + 44, { size: 10.5, color: red });
      U.label(ctx, "Epi", 28, yb + 62, { size: 10.5, color: U.cssVar("--violet") });
      if (ions) {
        U.label(ctx, "0: I_Na · 1: I_to · 2: I_Ca,L ↔ I_Kr/I_Ks · 3: I_Kr, I_Ks, I_K1 · 4: I_K1", L + 4, yb - 8, { size: 10.5, color: red });
      }

      // --- Spur 3: EKG Ableitung II ---
      const ecgTop = yb + 146, pxmm = pw / (WIN / 1000 * 25);
      const ecgH = Math.min(h - ecgTop - 8, 22 * pxmm);
      U.paper(ctx, L, ecgTop, pw, ecgH, pxmm);
      U.label(ctx, "EKG II", 4, ecgTop + 14, { size: 11, color: soft });
      const sched = [fires[0] - m.cycle, ...fires].map((f) => ({ t0: f + 10, beat: ecgBeat }));
      const s = EKG.render(sched, { fs: 500, duration: WIN, leads: ["II"] }).leads.II;
      U.trace(ctx, s, 500, { x0: L, y0: ecgTop + ecgH * 0.68, pxmm, speed: 25, width: 1.7 });
      // Verbindungslinien Phase ↔ EKG
      ctx.setLineDash([2, 4]); ctx.strokeStyle = faint; ctx.lineWidth = 1;
      for (const [tt, txt] of [[q0, "QRS ↔ Phase 0"], [q0 + tpk, "T-Gipfel ≈ Ende Epikard-AP"], [q0 + tend, "T-Ende ≈ Ende längste AP"]]) {
        ctx.beginPath(); ctx.moveTo(X(tt), yb); ctx.lineTo(X(tt), ecgTop + ecgH); ctx.stroke();
      }
      ctx.setLineDash([]);
      U.label(ctx, "QRS ↔ Phase 0", X(q0) + 3, ecgTop + 12, { size: 10, color: ink, bg: U.cssVar("--ecg-bg") });
      U.label(ctx, "T-Gipfel ≈ Epikard repolarisiert", X(q0 + tpk) + 3, ecgTop + ecgH - 6, { size: 10, color: ink, bg: U.cssVar("--ecg-bg") });
      U.label(ctx, "T-Ende ≈ längste AP repolarisiert", X(q0 + tend) + 3, ecgTop + 26, { size: 10, color: ink, bg: U.cssVar("--ecg-bg") });
      // Zeitachse
      U.label(ctx, "1 s", X(WIN - 1000) + (X(1000) - X(0)) / 2, h - 2, { size: 10, align: "center", color: faint });
      ctx.strokeStyle = faint; ctx.beginPath(); ctx.moveTo(X(WIN - 1000), h - 14); ctx.lineTo(X(WIN), h - 14); ctx.stroke();
    }
    tone.addEventListener("input", cv.redraw);
    ionsCb.addEventListener("change", cv.redraw);
  }

  // ======================================================================
  // 1C  Hierarchie der Schrittmacher
  // ======================================================================
  function initFig1C() {
    const root = document.getElementById("fig-1c");
    if (!root) return;
    const canvas = root.querySelector("canvas");
    const readout = root.querySelector(".readout");
    const DUR = 10000;
    const VENT_QRS = [
      { name: "Ersatzzentrum Ventrikel, früh", t: 32, sl: 18, sr: 18, v: [-0.6, -0.55, 0.35], a: 1.0 },
      { name: "Ersatzzentrum Ventrikel, spät", t: 98, sl: 24, sr: 22, v: [-0.25, -0.75, 0.45], a: 0.85 },
    ];
    const STATES = {
      sinus: {
        build() { const r = EKG.regular({ hr: 72, duration: DUR, start: 200 }); return { schedule: r.schedule, pMarks: [] }; },
        txt: "<span class='tag'>Sinusrhythmus</span>Der Sinusknoten ist das schnellste Zentrum und gibt den Takt vor. Jeder P-Welle folgt nach konstanter PQ-Zeit ein schmaler QRS-Komplex. Langsamere Zentren werden dabei ständig „überholt“ und unterdrückt (<i>overdrive suppression</i>).",
      },
      junc: {
        build() {
          const rr = 60000 / 48, beat = EKG.makeBeat({ hasP: false, pr: 0, qt: EKG.qtForRR(rr) });
          const schedule = []; for (let t = 600; t < DUR; t += rr) schedule.push({ t0: t, beat });
          return { schedule, pMarks: [] };
        },
        txt: "<span class='tag'>AV-junktionaler Ersatzrhythmus</span>Fällt der Sinusknoten aus, springt das nächste Zentrum im Bereich AV-Knoten/His-Bündel ein – typischerweise mit <b>40–60/min</b>. Der QRS ist schmal, weil die Kammern regulär über das His-Purkinje-System erregt werden. P-Wellen fehlen oder erscheinen retrograd (hier nicht dargestellt).",
      },
      vent: {
        build() {
          const rrV = 60000 / 34, rrA = 60000 / 78;
          const vb = EKG.makeBeat({ hasP: false, pr: 0, qrsComps: VENT_QRS, qrsDuration: 150,
            qt: EKG.qtForRR(rrV) + 40, tVector: [0.5, 0.75, -0.4], tScale: 1.5 });
          const pb = EKG.makeBeat({ pOnly: true });
          const schedule = [], pMarks = [];
          for (let t = 900; t < DUR; t += rrV) schedule.push({ t0: t, beat: vb });
          for (let t = 120; t < DUR; t += rrA) { schedule.push({ t0: t, beat: pb }); pMarks.push(t + 50); }
          return { schedule, pMarks };
        },
        txt: "<span class='tag'>AV-Block III° mit ventrikulärem Ersatzrhythmus</span>Ist die Überleitung unterhalb des AV-Knotens komplett unterbrochen, schlagen Vorhöfe (P-Wellen, rote Marken) und Kammern unabhängig voneinander. Ein ventrikuläres Zentrum übernimmt mit nur etwa <b>15–40/min</b>; der QRS ist <b>breit</b>, weil sich die Erregung langsam von Myozyt zu Myozyt ausbreitet. Die T-Welle ist typischerweise <b>diskordant</b>. Die genaue QRS-Form hängt vom Ursprungsort ab.",
      },
    };
    let state = "sinus", data = null;
    const compute = () => {
      const b = STATES[state].build();
      data = { sig: EKG.render(b.schedule, { fs: 250, duration: DUR, leads: ["II"] }).leads.II, pMarks: b.pMarks };
      readout.innerHTML = STATES[state].txt;
    };
    const cv = U.canvas(canvas, (w) => Math.round(((w - 16) / 250) * 30) + 34, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const pxmm = (w - 16) / 250, top = 8, H = 30 * pxmm;
      U.paper(ctx, 8, top, w - 16, H, pxmm);
      U.trace(ctx, data.sig, 250, { x0: 8, y0: top + H * 0.62, pxmm, speed: 25, width: 1.5 });
      for (const pm of data.pMarks) {
        const x = 8 + (pm / 1000) * 25 * pxmm;
        U.label(ctx, "P", x, top + H * 0.62 - 3.2 * pxmm, { size: 11, align: "center", color: U.cssVar("--accent") });
      }
      U.label(ctx, "II · 25 mm/s · 10 s", 14, top + 14, { size: 11, color: U.cssVar("--ink-soft"), bg: U.cssVar("--ecg-bg") });
      for (let s = 0; s <= 10; s++) {
        const x = 8 + s * 25 * pxmm;
        U.label(ctx, s + " s", x, h - 6, { size: 10, align: s === 0 ? "left" : s === 10 ? "right" : "center", color: U.cssVar("--ink-faint") });
      }
    });
    U.seg(root.querySelector(".states"), (v) => { state = v; compute(); cv.redraw(); });
    compute(); cv.redraw();
  }

  function initQuiz() {
    const m = document.querySelector('[data-quiz="kap1"]');
    if (!m) return;
    U.quiz(m, "kap1", [
      { q: "Warum ist die PQ-Strecke isoelektrisch, obwohl in dieser Zeit Erregung geleitet wird?",
        a: ["Weil in dieser Zeit keine elektrische Aktivität stattfindet", "Weil AV-Knoten und His-Purkinje-System zu wenig Zellmasse haben, um an der Körperoberfläche eine messbare Spannung zu erzeugen", "Weil die Vorhöfe in dieser Zeit repolarisieren", "Weil der Sinusknoten in dieser Zeit refraktär ist"],
        c: 1, e: "Die Erregung läuft durch AV-Knoten, His-Bündel und Tawara-Schenkel – diese Strukturen sind aber so klein, dass ihre Potenziale an der Hautoberfläche nicht ankommen. Nur intrakardial (His-Bündel-EKG) wären sie messbar." },
      { q: "Welche Struktur hat die langsamste Leitungsgeschwindigkeit?",
        a: ["Vorhofmyokard", "AV-Knoten", "Tawara-Schenkel", "Purkinje-Fasern"],
        c: 1, e: "Der AV-Knoten leitet mit etwa 0,05 m/s, Purkinje-Fasern mit etwa 4 m/s (Klabunde). Die Verzögerung gibt den Vorhöfen Zeit, die Kammern zu füllen." },
      { q: "Welcher Teil des Ventrikels wird normalerweise zuerst erregt?",
        a: ["Die posterobasale Wand des linken Ventrikels", "Das Epikard des rechten Ventrikels", "Endokardiale Areale des linken Ventrikels, u. a. die linke Septumseite", "Die Herzspitze vom Epikard aus"],
        c: 2, e: "Durrer et al. (1970) fanden drei endokardiale Areale im linken Ventrikel, die innerhalb von 0–5 ms erregt werden – darunter die linke Septumoberfläche. Das Septum wird daher von links nach rechts depolarisiert; posterobasale Anteile kommen zuletzt." },
      { q: "Welcher Ionenstrom ist für den schnellen Aufstrich (Phase 0) der Arbeitsmyokardzelle verantwortlich – und welcher in der Sinusknotenzelle?",
        a: ["Arbeitsmyokard: I_Na · Sinusknoten: I_Ca,L", "Arbeitsmyokard: I_Ca,L · Sinusknoten: I_Na", "Beide: I_f", "Arbeitsmyokard: I_K1 · Sinusknoten: I_to"],
        c: 0, e: "Im Arbeitsmyokard trägt der schnelle Natriumeinstrom (Nav1.5) den steilen Aufstrich. Sinusknotenzellen haben kaum funktionelle schnelle Na⁺-Kanäle; ihr flacherer Aufstrich wird von L-Typ-Ca²⁺-Kanälen getragen." },
      { q: "Ein Patient hat einen kompletten AV-Block unterhalb des His-Bündels. Was erwartest du am ehesten?",
        a: ["Schmale QRS-Komplexe mit 70/min, jeder mit vorangehender P-Welle", "P-Wellen ohne festen Bezug zu langsamen, breiten QRS-Komplexen", "Keine P-Wellen, schmale QRS mit 50/min", "Unregelmäßige QRS-Komplexe ohne P-Wellen"],
        c: 1, e: "Die Vorhöfe schlagen weiter im Sinusrhythmus, die Kammern werden von einem langsamen ventrikulären Ersatzzentrum (etwa 15–40/min) gesteuert – AV-Dissoziation mit breiten Kammerkomplexen." },
    ]);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initFig1A(); initFig1B(); initFig1C(); initQuiz();
  });
})();
