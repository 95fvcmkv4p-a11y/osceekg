/*
 * 3D-Ansicht: Herz im Thorax, Herzvektor, Vektorschleifen und ihre Projektionen
 * auf Frontal- und Horizontalebene. Reines Canvas-2D mit einfacher Perspektive.
 *
 * Modellkoordinaten wie im EKG-Modell: x = links, y = kaudal, z = anterior.
 * Bildschirm: Blick von vorn auf den Patienten (Patient links = Bildschirm rechts).
 */
(function () {
  "use strict";
  const U = window.U, E = window.EKG;
  const D2R = Math.PI / 180;
  const N = (v) => E.norm(v);
  const add = E.add, mul = E.mul, sub = E.sub, dot = E.dot;
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  // Anatomische Längsachse Basis → Apex (links, kaudal, anterior); wird wie die QRS-Vektoren gedreht
  const APEX_DIR = [0.62, 0.52, 0.58];
  const CENTER = [0.3, 0.2, 0.15];
  const VSCALE = 0.85;            // Einheiten pro mV
  const Z_FRONT = -1.6;          // Lage der Frontalebene (hinter dem Herzen)
  const Y_HORIZ = 1.95;           // Lage der Horizontalebene (unter dem Herzen)
  const TORSO = { rx: 1.95, rz: 1.3, y0: -1.75, y1: 1.65 };

  const VIEWS = { vorn: [0, 0], schräg: [34, 16], links: [80, 8], unten: [0, -89], oben: [0, 89] };

  U.heart3d = function (canvas, opt = {}) {
    const o = Object.assign({ frontal: true, horizontal: true, axes: null, electrodes: true, view: "schräg", height: 0.82, toolbar: true }, opt);
    let yaw = VIEWS[o.view][0], pitch = VIEWS[o.view][1];
    let S = { frontRot: 0, horizRot: 0, loops: [], vec: null, vec2: null, highlight: null, hidden: false, label: null };

    // Werkzeugleiste (Ansichten, Ebenen)
    if (o.toolbar) {
      const bar = document.createElement("div");
      bar.className = "h3d-bar";
      bar.innerHTML = `<div class="seg h3d-views">${Object.keys(VIEWS).filter((k) => k !== "oben").map((k) => `<button type="button" data-v="${k}" aria-pressed="${k === o.view}">${k}</button>`).join("")}</div>
        <label class="check"><input type="checkbox" class="pf" ${o.frontal ? "checked" : ""}> Frontalebene</label>
        <label class="check"><input type="checkbox" class="ph" ${o.horizontal ? "checked" : ""}> Horizontalebene</label>
        <span class="caption h3d-hint">ziehen zum Drehen</span>`;
      canvas.parentElement.insertBefore(bar, canvas);
      U.seg(bar.querySelector(".h3d-views"), (v) => { animateTo(VIEWS[v]); });
      bar.querySelector(".pf").addEventListener("change", (e) => { o.frontal = e.target.checked; cv.redraw(); });
      bar.querySelector(".ph").addEventListener("change", (e) => { o.horizontal = e.target.checked; cv.redraw(); });
    }

    let anim = null;
    function animateTo([y1, p1]) {
      const y0 = yaw, p0 = pitch, t0 = performance.now(), dur = U.reducedMotion() ? 1 : 450;
      cancelAnimationFrame(anim);
      const step = (now) => {
        const u = Math.min(1, (now - t0) / dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        yaw = y0 + (y1 - y0) * e; pitch = p0 + (p1 - p0) * e; cv.redraw();
        if (u < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }

    // Projektion
    let W = 0, H = 0, SC = 1, CX = 0, CY = 0;
    function proj(p) {
      const X = p[0], Y = -p[1], Z = p[2];
      const cy = Math.cos(yaw * D2R), sy = Math.sin(yaw * D2R), cp = Math.cos(pitch * D2R), sp = Math.sin(pitch * D2R);
      const X1 = X * cy + Z * sy, Z1 = -X * sy + Z * cy;
      const Y2 = Y * cp - Z1 * sp, Z2 = Y * sp + Z1 * cp;
      const f = 11, s = f / (f - Z2);
      return [CX + X1 * s * SC, CY - Y2 * s * SC, Z2];
    }
    const depthAlpha = (z) => U.clamp(0.35 + 0.65 * ((z + 2.2) / 4.4), 0.18, 1);

    function line(ctx, pts, { color, width = 1.2, alpha = 1, dash = null, depth = false }) {
      if (pts.length < 2) return;
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (dash) ctx.setLineDash(dash);
      if (!depth) {
        ctx.globalAlpha = alpha; ctx.beginPath();
        pts.forEach((p, i) => { const q = proj(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
        ctx.stroke();
      } else {
        let prev = proj(pts[0]);
        for (let i = 1; i < pts.length; i++) {
          const q = proj(pts[i]);
          ctx.globalAlpha = alpha * depthAlpha((prev[2] + q[2]) / 2);
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
          prev = q;
        }
      }
      ctx.restore();
    }
    function arrow(ctx, from, to, color, width = 3, alpha = 1, head = 9) {
      const a = proj(from), b = proj(to);
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
      if (L < 2) return;
      ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = "round";
      const ux = dx / L, uy = dy / L, hb = Math.min(head, L * 0.5);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] - ux * hb * 0.8, b[1] - uy * hb * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - ux * hb - uy * hb * 0.55, b[1] - uy * hb + ux * hb * 0.55);
      ctx.lineTo(b[0] - ux * hb + uy * hb * 0.55, b[1] - uy * hb - ux * hb * 0.55); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    function text(ctx, t, p, { color, size = 11, align = "center", font = null, dy = 0, bg = false }) {
      const q = proj(p);
      U.label(ctx, t, q[0], q[1] + dy, { size, align, color, font: font || `500 ${size}px ${U.cssVar("--f-sans")}`, bg: bg ? U.cssVar("--paper-2") : null });
    }

    function heartFrame() {
      const u = N(E.rotHorizontal(E.rotFrontal(N(APEX_DIR), S.frontRot), S.horizRot));
      let v = cross(u, [0, 0, 1]); if (Math.hypot(...v) < 0.2) v = cross(u, [0, 1, 0]);
      v = N(v); const w = N(cross(u, v));
      return { u, v, w };
    }

    function draw(ctx, w, h) {
      W = w; H = h; SC = Math.min(w * 0.8, h) * 0.205; CX = w * 0.5; CY = h * 0.48;
      ctx.clearRect(0, 0, w, h);
      const ink = U.cssVar("--ink"), soft = U.cssVar("--ink-soft"), faint = U.cssVar("--ink-faint"), accent = U.cssVar("--accent"),
        danger = U.cssVar("--danger"), rule = U.cssVar("--rule"), ochre = U.cssVar("--ochre"), violet = U.cssVar("--violet");
      // Hintergrund
      ctx.fillStyle = U.cssVar("--paper-2"); ctx.fillRect(0, 0, w, h);

      const C = CENTER;
      // ---------- Ebenen ----------
      if (o.frontal) {
        const z = Z_FRONT, ext = 1.75;
        const corners = [[-ext, -ext, z], [ext, -ext, z], [ext, ext, z], [-ext, ext, z]].map((p) => add(p, [C[0], C[1], 0]));
        ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = U.cssVar("--accent-soft"); ctx.beginPath();
        corners.forEach((p, i) => { const q = proj(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill(); ctx.restore();
        line(ctx, [...corners, corners[0]], { color: rule, width: 1 });
        text(ctx, "Frontalebene", add(corners[1], [-0.08, 0.2, 0]), { color: soft, size: 10.5, align: "right" });
        if (o.axes === "frontal") {
          for (const [nm, deg] of [["I", 0], ["II", 60], ["III", 120], ["aVR", -150], ["aVL", -30], ["aVF", 90]]) {
            const d = [Math.cos(deg * D2R), Math.sin(deg * D2R), 0], c0 = [C[0], C[1], z];
            line(ctx, [add(c0, mul(d, -1.55)), add(c0, mul(d, 1.55))], { color: faint, width: 1, dash: [2, 3] });
            text(ctx, nm, add(c0, mul(d, 1.72)), { color: soft, size: 10.5, dy: 4 });
          }
        }
      }
      if (o.horizontal) {
        const y = Y_HORIZ, ext = 1.75;
        const corners = [[-ext, y, -ext], [ext, y, -ext], [ext, y, ext], [-ext, y, ext]].map((p) => add(p, [C[0], 0, C[2]]));
        ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = U.cssVar("--accent-soft"); ctx.beginPath();
        corners.forEach((p, i) => { const q = proj(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill(); ctx.restore();
        line(ctx, [...corners, corners[0]], { color: rule, width: 1 });
        text(ctx, "Horizontalebene", add(corners[3], [0.1, 0, -0.18]), { color: soft, size: 10.5, align: "left" });
        if (o.axes === "horizontal") {
          for (const [nm, [deg]] of Object.entries({ V1: [120], V2: [92], V3: [75], V4: [58], V5: [32], V6: [5] })) {
            const d = [Math.cos(deg * D2R), 0, Math.sin(deg * D2R)], c0 = [C[0], y, C[2]];
            line(ctx, [c0, add(c0, mul(d, 1.55))], { color: faint, width: 1, dash: [2, 3] });
            text(ctx, nm, add(c0, mul(d, 1.75)), { color: soft, size: 10.5, dy: 4 });
          }
        }
      }

      // ---------- Thorax ----------
      const T = TORSO;
      const ring = (y, k = 1) => { const pts = []; for (let a = 0; a <= 360; a += 10) pts.push([T.rx * k * Math.cos(a * D2R), y, T.rz * k * Math.sin(a * D2R)]); return pts; };
      for (const y of [T.y0, 0.25, T.y1]) line(ctx, ring(y), { color: faint, width: 1, alpha: 0.75, depth: true });
      for (const a of [0, 90, 180, 270]) line(ctx, [[T.rx * Math.cos(a * D2R), T.y0, T.rz * Math.sin(a * D2R)], [T.rx * Math.cos(a * D2R), T.y1, T.rz * Math.sin(a * D2R)]], { color: faint, width: 1, alpha: 0.5, depth: true });
      // Sternum
      line(ctx, [[0, T.y0 + 0.2, T.rz], [0, 0.9, T.rz]], { color: faint, width: 2.2, alpha: 0.7, depth: true });

      if (S.hidden) {
        U.label(ctx, S.label || "verborgen", w / 2, h / 2, { size: 13, align: "center", color: soft, bg: U.cssVar("--paper-2") });
        return;
      }

      // ---------- Herz ----------
      const F = heartFrame(), A = 0.95, B = 0.6;
      const hl = S.highlight ? N(S.highlight) : null;
      const surf = (t, phi) => {
        const r = B * Math.pow(Math.max(0, 1 - t * t), 0.5) * (1 - 0.28 * Math.max(0, t));
        const axisPt = add(C, mul(F.u, A * t));
        const nrm = add(mul(F.v, Math.cos(phi)), mul(F.w, Math.sin(phi)));
        return { p: add(axisPt, mul(nrm, r)), n: N(add(nrm, mul(F.u, 0.35 * t))) };
      };
      // Vorhöfe (an der Basis, nach rechts-hinten versetzt)
      const atrC = add(add(C, mul(F.u, -A * 0.92)), [-0.12, -0.05, -0.18]);
      for (const [a, b] of [[F.v, F.w], [F.v, F.u], [F.w, F.u]]) {
        const pts = []; for (let k = 0; k <= 36; k++) { const ph = (k / 36) * 2 * Math.PI; pts.push(add(atrC, add(mul(a, 0.5 * Math.cos(ph)), mul(b, 0.42 * Math.sin(ph))))); }
        line(ctx, pts, { color: soft, width: 1, alpha: 0.8, depth: true });
      }
      // Ventrikel-Meridiane und Breitenkreise (Skizzenlinien, Tiefe über Transparenz)
      const MER = 14;
      for (let m = 0; m < MER; m++) {
        const phi = (m / MER) * 2 * Math.PI, pts = [], hot = [];
        for (let k = 0; k <= 26; k++) { const t = -0.98 + (k / 26) * 1.98; const s = surf(t, phi); pts.push(s.p); hot.push(hl ? dot(s.n, hl) : 0); }
        line(ctx, pts, { color: ink, width: 1.15, alpha: 0.9, depth: true });
        if (hl) {
          let seg = [];
          for (let i = 0; i < pts.length; i++) {
            if (hot[i] > 0.45) seg.push(pts[i]); else { if (seg.length > 1) line(ctx, seg, { color: danger, width: 3.2, alpha: 0.85, depth: true }); seg = []; }
          }
          if (seg.length > 1) line(ctx, seg, { color: danger, width: 3.2, alpha: 0.85, depth: true });
        }
      }
      for (const t of [-0.7, -0.3, 0.1, 0.5, 0.8]) {
        const pts = []; for (let k = 0; k <= 40; k++) pts.push(surf(t, (k / 40) * 2 * Math.PI).p);
        line(ctx, pts, { color: ink, width: 1, alpha: 0.75, depth: true });
      }
      text(ctx, "Apex", add(C, mul(F.u, A * 1.18)), { color: soft, size: 10.5 });
      text(ctx, "Vorhöfe", add(atrC, mul(F.u, -0.62)), { color: soft, size: 10.5 });

      // ---------- Elektroden ----------
      if (o.electrodes) {
        const dotAt = (p, color, lab, lc) => {
          const q = proj(p); ctx.save(); ctx.globalAlpha = depthAlpha(q[2]);
          ctx.fillStyle = color; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q[0], q[1], 4.2, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
          if (lab) U.label(ctx, lab, q[0] + 6, q[1] - 5, { size: 10, color: lc || soft, font: `600 10px ${U.cssVar("--f-mono")}` });
        };
        dotAt([-2.25, -1.6, 0], "#c94a3d", "RA"); dotAt([2.25, -1.6, 0], "#e2c23e", "LA"); dotAt([0.9, 1.8, 0.2], "#3e8e4e", "LL");
        for (const [nm, [deg]] of Object.entries(E.PRECORDIAL || { V1: [120], V2: [92], V3: [75], V4: [58], V5: [32], V6: [5] })) {
          dotAt([T.rx * Math.cos(deg * D2R), 0.25, T.rz * Math.sin(deg * D2R)], U.cssVar("--paper-2"), nm, accent);
        }
      }

      // ---------- Schleifen und Projektionen ----------
      const vecPt = (v, k = 1) => add(C, mul(v, VSCALE * k));
      for (const L of S.loops) {
        const pts = L.pts.map((v) => vecPt(v, L.scale || 1));
        if (o.frontal && L.proj !== false) line(ctx, pts.map((p) => [p[0], p[1], Z_FRONT]), { color: L.color || accent, width: 1.3, alpha: 0.75, dash: [4, 3] });
        if (o.horizontal && L.proj !== false) line(ctx, pts.map((p) => [p[0], Y_HORIZ, p[2]]), { color: L.color || accent, width: 1.3, alpha: 0.75, dash: [4, 3] });
        line(ctx, pts, { color: L.color || accent, width: L.width || 1.8, alpha: L.alpha ?? 0.95 });
      }
      for (const [V, color, k] of [[S.vec, accent, S.vecScale || 1], [S.vec2, danger, S.vec2Scale || 1]]) {
        if (!V || Math.hypot(...V) < 1e-3) continue;
        const tip = vecPt(V, k);
        if (o.frontal) {
          const c0 = [C[0], C[1], Z_FRONT], t0 = [tip[0], tip[1], Z_FRONT];
          line(ctx, [tip, t0], { color: faint, width: 1, dash: [2, 3] });
          arrow(ctx, c0, t0, color, 2.4, 0.75, 8);
        }
        if (o.horizontal) {
          const c0 = [C[0], Y_HORIZ, C[2]], t0 = [tip[0], Y_HORIZ, tip[2]];
          line(ctx, [tip, t0], { color: faint, width: 1, dash: [2, 3] });
          arrow(ctx, c0, t0, color, 2.4, 0.75, 8);
        }
        arrow(ctx, C, tip, color, 3.4, 1, 11);
      }

      // ---------- Orientierung ----------
      const gx = 34, gy = h - 34, gl = 22;
      const dirs = [[[1, 0, 0], "links"], [[0, -1, 0], "kranial"], [[0, 0, 1], "anterior"]];
      const o0 = proj([0, 0, 0]);
      for (const [d, t] of dirs) {
        const q = proj(d); const dx = q[0] - o0[0], dy = q[1] - o0[1], L = Math.hypot(dx, dy) || 1;
        const ex = gx + (dx / SC) * gl, ey = gy + (dy / SC) * gl;
        ctx.save(); ctx.strokeStyle = soft; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.restore();
        if (L / SC > 0.25) U.label(ctx, t, ex + (dx / L) * 4, ey + (dy / L) * 4 + 3, { size: 9.5, align: dx < -2 ? "right" : "left", color: soft, font: `500 9.5px ${U.cssVar("--f-sans")}` });
      }
    }

    const cv = U.canvas(canvas, (w) => Math.round(Math.min(w * o.height, 560)), draw);
    // Drehen per Ziehen
    let drag = null;
    canvas.style.touchAction = "none"; canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = "grabbing"; cancelAnimationFrame(anim); });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      yaw = drag.yaw + (e.clientX - drag.x) * 0.45;
      pitch = U.clamp(drag.pitch + (e.clientY - drag.y) * 0.45, -89, 89);
      cv.redraw();
    });
    const end = () => { drag = null; canvas.style.cursor = "grab"; };
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Dreidimensionales Schema des Herzens im Brustkorb mit Herzvektor und Projektionen; zum Drehen ziehen");

    return {
      set(p) { Object.assign(S, p); cv.redraw(); },
      view(name) { if (VIEWS[name]) animateTo(VIEWS[name]); },
      redraw: () => cv.redraw(),
    };
  };

  /** Hilfsfunktion: 3D-Schleife eines Schlags zwischen t0 und t1 (ms) */
  U.loop3d = function (beat, t0, t1, step = 2) {
    const pts = []; for (let t = t0; t <= t1; t += step) pts.push(beat.vec(t)); return pts;
  };
  /** mittlerer QRS-Vektor (Flächenintegral, auf Spitzenbetrag skaliert) */
  U.meanQRS = function (beat) {
    let s = [0, 0, 0], peak = 0;
    for (let t = beat.qrsOn; t <= beat.qrsOff; t++) { const v = beat.vec(t); s = add(s, v); peak = Math.max(peak, Math.hypot(...v)); }
    const L = Math.hypot(...s) || 1;
    return mul(s, peak / L);
  };
})();
