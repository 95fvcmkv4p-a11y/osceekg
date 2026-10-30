/*
 * EKG-Vektormodell
 * ----------------
 * Ein zeitabhängiger Herzvektor H(t) (Dipolmodell) wird auf die Ableitungsvektoren
 * der 12 Standardableitungen projiziert. Dadurch sind alle Ableitungen
 * physikalisch konsistent (z. B. gilt II = I + III exakt).
 *
 * Koordinaten (aus Sicht des Patienten):
 *   x = nach links, y = nach kaudal (unten), z = nach anterior (vorne)
 * Frontalebene: Winkel 0° = Ableitung I (links), +90° = aVF (unten); positiv im
 * Uhrzeigersinn, wie im Cabrera-Kreis.
 *
 * Vereinfachungen (didaktisches Modell, keine Patientensimulation):
 *  - idealisiertes Einthoven-Dreieck (gleichseitig, Herz im Mittelpunkt)
 *  - Brustwandableitungen als ideale Richtungsvektoren in der Horizontalebene
 *  - Wellen als Summe gaußförmiger Teilvektoren
 *  - ST-Strecken-Verschiebungen als „Verletzungsvektor“ während der Plateauphase
 */
(function (root) {
  "use strict";
  const D2R = Math.PI / 180;

  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  /** Rotation in der Frontalebene (um die anteriore Achse), positiv = im Uhrzeigersinn (Cabrera). */
  function rotFrontal(v, deg) {
    const a = deg * D2R, c = Math.cos(a), s = Math.sin(a);
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
  }
  /** Rotation in der Horizontalebene (um die kraniokaudale Achse), positiv = nach anterior. */
  function rotHorizontal(v, deg) {
    const a = deg * D2R, c = Math.cos(a), s = Math.sin(a);
    return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c];
  }

  // ---------- Elektroden und Ableitungsvektoren ----------
  const polar = (deg) => [Math.cos(deg * D2R), Math.sin(deg * D2R), 0];
  const ELECTRODES = { RA: polar(-150), LA: polar(-30), LL: polar(90) };
  const K = 1 / Math.sqrt(3); // normiert Ableitung I auf Länge 1
  // Brustwand: Winkel in der Horizontalebene (0° = links lateral, 90° = anterior) und relative Verstärkung
  const PRECORDIAL = { V1: [120, 0.9], V2: [92, 1.35], V3: [75, 1.45], V4: [58, 1.4], V5: [32, 1.15], V6: [5, 0.95] };
  const precVec = (deg, g, tilt = 0) => [g * Math.cos(deg * D2R), tilt, g * Math.sin(deg * D2R)];

  const LEAD_VECTORS = (() => {
    const { RA, LA, LL } = ELECTRODES;
    const L = {
      I: mul(sub(LA, RA), K),
      II: mul(sub(LL, RA), K),
      III: mul(sub(LL, LA), K),
      aVR: mul(sub(RA, mul(add(LA, LL), 0.5)), K),
      aVL: mul(sub(LA, mul(add(RA, LL), 0.5)), K),
      aVF: mul(sub(LL, mul(add(RA, LA), 0.5)), K),
    };
    for (const [name, [deg, g]] of Object.entries(PRECORDIAL)) L[name] = precVec(deg, g);
    // rechtspräkordiale und posteriore Zusatzableitungen (Spiegelungen/Verlängerungen)
    L.V3R = precVec(138, 1.0); L.V4R = precVec(152, 0.9);
    L.V7 = precVec(-20, 0.8); L.V8 = precVec(-40, 0.7); L.V9 = precVec(-60, 0.6);
    L["-aVR"] = mul(L.aVR, -1);
    return L;
  })();

  const LEADS = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"];
  const LIMB_LEADS = ["I", "II", "III", "aVR", "aVL", "aVF"];
  const CABRERA = ["aVL", "I", "-aVR", "II", "aVF", "III"];
  const FRONTAL_ANGLE = { I: 0, II: 60, III: 120, aVR: -150, aVL: -30, aVF: 90, "-aVR": 30 };
  const CONTIGUOUS = [ // anatomisch benachbarte Ableitungsgruppen
    ["II", "III", "aVF"], ["I", "aVL"], ["V1", "V2"], ["V2", "V3"], ["V3", "V4"], ["V4", "V5"], ["V5", "V6"], ["I", "V6"], ["aVL", "I"],
  ];

  function leadValue(H, lead) { return dot(H, LEAD_VECTORS[lead]); }

  // ---------- Normaler Herzzyklus: Teilvektoren ----------
  // t = Zentrum (ms), sl/sr = Breite links/rechts (ms), v = Richtung, a = Betrag (mV)
  // P-Welle: relativ zum P-Beginn; QRS und T: relativ zum QRS-Beginn.
  const NORMAL = {
    P: [
      { name: "rechter Vorhof", t: 32, sl: 14, sr: 14, v: [0.15, 0.8, 0.55], a: 0.13 },
      { name: "linker Vorhof", t: 68, sl: 15, sr: 15, v: [0.75, 0.45, -0.5], a: 0.12 },
    ],
    QRS: [
      { name: "Septum (links → rechts)", t: 12, sl: 6, sr: 6, v: [-0.55, 0.3, 0.78], a: 0.3 },
      { name: "Apex / anteroseptal", t: 31, sl: 9, sr: 9, v: [0.35, 0.75, 0.55], a: 0.85 },
      { name: "freie Wand LV", t: 47, sl: 10, sr: 10, v: [0.85, 0.42, -0.3], a: 1.45 },
      { name: "basal / posterobasal", t: 70, sl: 8, sr: 9, v: [-0.35, -0.5, -0.8], a: 0.38 },
    ],
    QRS_DURATION: 92,
    T: { name: "T-Welle (Repolarisation)", v: [0.72, 0.55, 0.3], a: 0.36 },
  };

  const gauss = (c, t) => {
    const d = t - c.t, s = d < 0 ? c.sl : c.sr;
    if (Math.abs(d) > 4.5 * s) return 0;
    return Math.exp(-0.5 * (d / s) * (d / s)) * c.a;
  };
  const smoothstep = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

  /**
   * Erzeugt ein Schlagmodell (Zeit t in ms ab P-Beginn).
   * Wichtige Optionen:
   *  pr, qt, axis, pAxis, horiz, qrsScale, qrsWidth, tScale, pScale, hasP, pOnly
   *  qrsComps, qrsDuration  – eigene QRS-Teilvektoren (z. B. Schenkelblock)
   *  pComps                 – eigene P-Teilvektoren (z. B. P mitrale)
   *  tVector, tNarrow       – eigene T-Richtung, schmalere T-Welle (Hyperkaliämie)
   *  stVec                  – ST-Verschiebungsvektor in mV (Ischämie, Perikarditis, Strain)
   *  prVec                  – PQ-Strecken-Verschiebung in mV (Perikarditis)
   *  uAmp                   – U-Welle (mV, Richtung wie T)
   *  extraComps             – zusätzliche Teilvektoren relativ zum QRS-Beginn
   *  qrsShift               – verschiebt den regulären QRS nach hinten (Präexzitation)
   */
  function makeBeat(opts = {}) {
    const o = Object.assign({ pr: 160, qt: 400, axis: 0, pAxis: 0, horiz: 0,
      qrsScale: 1, qrsWidth: 1, tScale: 1, pScale: 1, hasP: true, tNarrow: 1, qrsShift: 0 }, opts);
    const comps = [];
    const pSrc = o.pComps || NORMAL.P;
    const pDur = o.pDuration || 100;
    if (o.hasP) {
      for (const c of pSrc) comps.push({ ...c, group: "P", v: rotFrontal(norm(c.v), o.pAxis), a: c.a * o.pScale });
    }
    const vecFrom = (list, extra) => (t) => {
      let H = [0, 0, 0];
      for (const c of list) {
        const g = gauss(c, t);
        if (g) H = [H[0] + c.v[0] * g, H[1] + c.v[1] * g, H[2] + c.v[2] * g];
      }
      return extra ? add(H, extra(t)) : H;
    };
    if (o.pOnly) {
      return { opts: o, comps, pOn: 0, pOff: pDur, qrsOn: null, qrsOff: null, tPeak: null, tEnd: pDur,
        vec: vecFrom(comps), phase: (t) => (t >= 0 && t < pDur ? "P" : "TP") };
    }
    const qrsSrc = o.qrsComps || NORMAL.QRS;
    const place = (v) => rotHorizontal(rotFrontal(norm(v), o.axis), o.horiz);
    for (const c of qrsSrc) {
      comps.push({ ...c, group: "QRS", t: o.pr + o.qrsShift + c.t * o.qrsWidth, sl: c.sl * o.qrsWidth,
        sr: c.sr * o.qrsWidth, v: place(c.v), a: c.a * o.qrsScale });
    }
    for (const c of o.extraComps || []) {
      comps.push({ ...c, group: c.group || "X", t: o.pr + c.t, v: c.noRotate ? norm(c.v) : place(c.v) });
    }
    const qrsDur = (o.qrsDuration || NORMAL.QRS_DURATION) * o.qrsWidth + o.qrsShift;
    // T-Welle: asymmetrisch (flacher Anstieg, steilerer Abfall); Ende ≈ QT
    const f = o.qt / 400;
    const sr = 36 * f * o.tNarrow, sl = 62 * f * o.tNarrow;
    const tCenter = o.qt - 2.5 * 36 * f;
    const tv = o.tVector ? norm(o.tVector) : place(NORMAL.T.v);
    comps.push({ name: NORMAL.T.name, group: "T", t: o.pr + tCenter, sl, sr, v: tv, a: NORMAL.T.a * o.tScale });
    if (o.uAmp) comps.push({ name: "U-Welle", group: "U", t: o.pr + o.qt + 70, sl: 32, sr: 40, v: tv, a: o.uAmp });

    const qrsOn = o.pr, qrsOff = o.pr + qrsDur, tEnd = o.pr + o.qt;
    // Plateau-Fenster für ST-Verschiebung: ab J-Punkt bis zum T-Ende abklingend
    const stWin = (t) => smoothstep(qrsOff - 18, qrsOff, t) * (1 - smoothstep(o.pr + tCenter, tEnd + 30, t));
    const prWin = (t) => smoothstep(pDur - 30, pDur, t) * (1 - smoothstep(qrsOn - 4, qrsOn + 6, t));
    const extra = (o.stVec || o.prVec) ? (t) => {
      let H = [0, 0, 0];
      if (o.stVec) H = add(H, mul(o.stVec, stWin(t)));
      if (o.prVec && o.hasP) H = add(H, mul(o.prVec, prWin(t)));
      return H;
    } : null;

    return {
      opts: o, comps,
      pOn: o.hasP ? 0 : null, pOff: o.hasP ? pDur : null,
      qrsOn, qrsOff, tPeak: o.pr + tCenter, tEnd,
      vec: vecFrom(comps, extra),
      phase(t) {
        if (o.hasP && t >= 0 && t < pDur) return "P";
        if (t >= pDur && t < qrsOn) return "PQ";
        if (t >= qrsOn && t < qrsOff) return "QRS";
        if (t >= qrsOff && t < o.pr + tCenter - 1.6 * sl) return "ST";
        if (t >= o.pr + tCenter - 1.6 * sl && t < tEnd) return "T";
        return "TP";
      },
    };
  }

  /** QT nach Fridericia skaliert (QT bei 60/min = qt60) */
  const qtForRR = (rr, qt60 = 400) => qt60 * Math.cbrt(rr / 1000);

  /**
   * Erzeugt Signale für Ableitungen.
   * schedule: Array von { t0 (ms), beat }; extra(t): zusätzlicher Vektor (Flimmern, Flattern …)
   * leadFn(H, lead): eigene Ableitungsberechnung (z. B. vertauschte Elektroden)
   */
  function render(schedule, { fs = 500, duration = 2500, leads = LEADS, noise = 0, extra = null, leadFn = null } = {}) {
    const n = Math.round((duration / 1000) * fs);
    const out = {};
    for (const l of leads) out[l] = new Float32Array(n);
    const vecs = new Array(n);
    const sorted = schedule.slice().sort((a, b) => a.t0 - b.t0);
    for (let i = 0; i < n; i++) {
      const t = (i * 1000) / fs;
      let H = extra ? extra(t) : [0, 0, 0];
      for (const b of sorted) {
        const tt = t - b.t0;
        if (tt < -80) break;
        if (tt > b.beat.tEnd + 260) continue;
        H = add(H, b.beat.vec(tt));
      }
      vecs[i] = H;
      for (const l of leads) {
        const v = leadFn ? leadFn(H, l) : leadValue(H, l);
        out[l][i] = v + (noise ? (Math.random() - 0.5) * noise : 0);
      }
    }
    return { fs, n, duration, leads: out, vecs };
  }

  /** Regelmäßiger Rhythmus */
  function regular({ hr = 60, duration = 2500, start = 80, beatOpts = {} } = {}) {
    const rr = 60000 / hr;
    const beat = makeBeat(Object.assign({ qt: qtForRR(rr) }, beatOpts));
    const schedule = [];
    for (let t0 = start - rr * 2; t0 < duration; t0 += rr) schedule.push({ t0, beat });
    return { schedule, beat, rr };
  }

  // ---------- Bausteine für Pathologien ----------
  const C = (name, t, sl, sr, v, a) => ({ name, t, sl, sr, v, a });
  const PRESETS = {
    normal: () => ({}),
    rbbb: () => ({
      qrsComps: [
        C("Septum", 12, 6, 6, [-0.55, 0.3, 0.78], 0.3), C("Apex", 31, 9, 9, [0.35, 0.75, 0.55], 0.85),
        C("freie Wand LV", 47, 10, 10, [0.85, 0.42, -0.3], 1.3), C("rechter Ventrikel, verspätet", 104, 16, 18, [-0.62, 0.08, 0.78], 0.85),
      ], qrsDuration: 140, tVector: [0.72, 0.5, -0.25], tScale: 0.9,
    }),
    lbbb: () => ({
      qrsComps: [
        C("Septum (rechts → links)", 16, 9, 9, [0.65, 0.2, -0.3], 0.45),
        C("LV, langsam über Myokard", 58, 22, 20, [0.8, 0.28, -0.45], 1.55),
        C("LV lateral/basal, spät", 108, 18, 16, [0.72, -0.12, -0.62], 1.15),
      ], qrsDuration: 150, tVector: [-0.62, -0.1, 0.62], tScale: 1.2, stVec: [-0.07, -0.02, 0.09],
    }),
    lafb: () => ({
      qrsComps: [
        C("initial inferior", 13, 7, 7, [0.05, 0.85, 0.5], 0.4), C("Hauptvektor superior-links", 46, 12, 12, [0.62, -0.76, -0.12], 1.4),
        C("spät superior", 76, 9, 9, [0.2, -0.9, -0.3], 0.35),
      ], qrsDuration: 102, tVector: [0.75, 0.5, 0.3],
    }),
    lpfb: () => ({
      qrsComps: [
        C("initial superior-links", 13, 7, 7, [0.6, -0.65, 0.35], 0.3), C("Hauptvektor inferior-rechts", 46, 12, 12, [-0.45, 0.9, 0.0], 1.55),
        C("freie Wand LV", 52, 10, 10, [0.75, 0.35, -0.3], 0.3), C("spät", 76, 9, 9, [-0.3, 0.55, -0.6], 0.35),
      ], qrsDuration: 100, tVector: [0.2, 0.9, 0.3],
    }),
    rbbbLafb: () => ({
      qrsComps: [
        C("initial inferior", 13, 7, 7, [0.15, 0.9, 0.25], 0.35), C("Hauptvektor superior-links", 46, 12, 12, [0.62, -0.76, -0.12], 1.3),
        C("rechter Ventrikel, verspätet", 106, 16, 18, [-0.62, 0.3, 0.75], 0.85),
      ], qrsDuration: 142, tVector: [0.72, 0.4, -0.25], tScale: 0.9,
    }),
    lvh: (strain = true) => ({
      qrsComps: [
        C("Septum", 12, 6, 6, [-0.55, 0.3, 0.78], 0.32), C("Apex", 32, 9, 9, [0.35, 0.75, 0.55], 0.95),
        C("freie Wand LV (hypertroph)", 50, 11, 12, [0.82, 0.32, -0.48], 2.75), C("basal", 76, 8, 9, [-0.35, -0.5, -0.8], 0.4),
      ], qrsDuration: 102,
      ...(strain ? { tVector: [-0.72, -0.35, 0.35], tScale: 0.85, stVec: [-0.07, -0.02, 0.04] } : {}),
      pComps: [C("rechter Vorhof", 32, 14, 14, [0.15, 0.8, 0.55], 0.12), C("linker Vorhof", 76, 18, 18, [0.75, 0.4, -0.55], 0.15)], pDuration: 118,
    }),
    rvh: () => ({
      qrsComps: [
        C("Septum", 12, 6, 6, [-0.55, 0.3, 0.78], 0.3), C("Apex", 30, 9, 9, [0.2, 0.85, 0.45], 0.6),
        C("freie Wand LV", 46, 10, 10, [0.85, 0.42, -0.3], 0.55), C("rechter Ventrikel (hypertroph)", 56, 12, 12, [-0.62, 0.45, 0.65], 1.45),
      ], qrsDuration: 98, tVector: [0.45, 0.65, -0.62], tScale: 0.9, stVec: [0.02, 0.0, -0.05],
      pComps: [C("rechter Vorhof (vergrößert)", 34, 15, 15, [0.05, 0.92, 0.35], 0.27), C("linker Vorhof", 68, 15, 15, [0.75, 0.45, -0.5], 0.1)],
    }),
    pMitrale: () => ({ pComps: [C("rechter Vorhof", 32, 14, 14, [0.15, 0.8, 0.55], 0.12), C("linker Vorhof (vergrößert)", 86, 19, 19, [0.6, 0.45, -0.68], 0.17)], pDuration: 128 }),
    pPulmonale: () => ({ pComps: [C("rechter Vorhof (vergrößert)", 34, 14, 14, [0.05, 0.92, 0.35], 0.28), C("linker Vorhof", 68, 15, 15, [0.75, 0.45, -0.5], 0.1)] }),
    wpw: () => ({
      pr: 100, qrsShift: 34, qrsScale: 0.72,
      extraComps: [C("Delta-Welle (akzessorische Bahn, links lateral)", 32, 26, 16, [-0.38, 0.25, 0.9], 0.9)],
      qrsDuration: 92, tVector: [0.7, 0.45, -0.45], tScale: 0.8,
    }),
  };

  // Ventrikuläre Komplexe (Extrasystolen, VT, Ersatzrhythmus)
  const VENT = {
    // RV-Ausflusstrakt-Ursprung: LSB-artig, inferiore Achse
    rvot: { qrsComps: [C("Ursprung RVOT", 34, 20, 18, [0.1, 0.95, -0.35], 1.25), C("spät", 100, 18, 18, [0.4, 0.5, -0.7], 0.8)], qrsDuration: 150, tVector: [-0.2, -0.8, 0.5], tScale: 1.6, hasP: false, pr: 0 },
    // LV-Ursprung: RSB-artig, „Nordwest“-Achse
    lv: { qrsComps: [C("Ursprung LV", 36, 22, 20, [-0.45, -0.55, 0.72], 1.3), C("spät", 104, 18, 18, [-0.55, -0.3, 0.7], 0.8)], qrsDuration: 160, tVector: [0.5, 0.6, -0.6], tScale: 1.6, hasP: false, pr: 0 },
    // posterobasaler Ursprung: positive präkordiale Konkordanz
    pb: { qrsComps: [C("Ursprung posterobasal", 40, 22, 20, [0.35, -0.45, 0.82], 1.4), C("spät", 104, 18, 18, [0.25, -0.2, 0.95], 0.7)], qrsDuration: 160, tVector: [-0.3, 0.4, -0.85], tScale: 1.3, hasP: false, pr: 0 },
    escape: { qrsComps: [C("Ersatzzentrum Ventrikel, früh", 32, 18, 18, [-0.6, -0.55, 0.35], 1.0), C("Ersatzzentrum Ventrikel, spät", 98, 24, 22, [-0.25, -0.75, 0.45], 0.85)], qrsDuration: 150, tVector: [0.5, 0.75, -0.4], tScale: 1.5, hasP: false, pr: 0 },
  };

  /** Hilfsfunktion: misst für einen Schlag ST (ms nach J-Punkt) und QRS-Amplituden je Ableitung */
  function analyzeBeat(beat, { leads = LEADS, jOffset = 60, leadFn = null } = {}) {
    const val = (t, l) => { const H = beat.vec(t); return leadFn ? leadFn(H, l) : leadValue(H, l); };
    const out = {};
    for (const l of leads) {
      let R = 0, S = 0, q = 0, sawR = false;
      for (let t = beat.qrsOn; t <= beat.qrsOff; t += 1) {
        const v = val(t, l) - val(beat.qrsOn - 8, l);
        if (v > R) R = v;
        if (v > 0.05) sawR = true;
        if (!sawR && v < q) q = v;
        if (sawR && v < S) S = v;
      }
      const base = val(beat.qrsOn - 8, l);
      out[l] = { R, S, q, st: val(beat.qrsOff + jOffset, l) - base, j: val(beat.qrsOff, l) - base };
    }
    return out;
  }

  const EKG = {
    D2R, norm, add, sub, mul, dot, rotFrontal, rotHorizontal, smoothstep,
    ELECTRODES, LEAD_VECTORS, PRECORDIAL, LEADS, LIMB_LEADS, CABRERA, FRONTAL_ANGLE, CONTIGUOUS, NORMAL, PRESETS, VENT,
    leadValue, makeBeat, render, regular, qtForRR, analyzeBeat, comp: C,
    frontalAngle: (H) => Math.atan2(H[1], H[0]) / D2R,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = EKG;
  else root.EKG = EKG;
})(typeof window !== "undefined" ? window : globalThis);
