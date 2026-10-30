/*
 * Rhythmusgeneratoren für das Vektormodell.
 * Jede Funktion liefert { schedule, extra, ladder } für 10 s.
 * ladder: Liste von Ereignissen für das Leiterdiagramm
 *   { a: Zeitpunkt Vorhoferregung (ms), v: Zeitpunkt Kammererregung (ms) | null, blocked: bool, origin }
 */
(function () {
  "use strict";
  const E = window.EKG;
  const DUR = 10500;

  function seeded(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  const R = {};

  /** Sinusrhythmus mit wählbarer PQ-Zeit und Schlag-Optionen */
  R.sinus = ({ hr = 72, pr = 160, beatOpts = {}, start = 300 } = {}) => {
    const rr = 60000 / hr, beat = E.makeBeat(Object.assign({ pr, qt: E.qtForRR(rr) }, beatOpts));
    const schedule = [], ladder = [];
    for (let t = start - rr; t < DUR; t += rr) { schedule.push({ t0: t, beat }); ladder.push({ a: t, v: t + beat.qrsOn }); }
    return { schedule, ladder };
  };

  /** Sinusarrhythmie (respiratorisch) */
  R.sinusArr = () => {
    const schedule = [], ladder = []; let t = 200, k = 0;
    while (t < DUR) {
      const rr = 900 + 220 * Math.sin(k / 2.2);
      const beat = E.makeBeat({ qt: E.qtForRR(rr) });
      schedule.push({ t0: t, beat }); ladder.push({ a: t, v: t + 160 }); t += rr; k++;
    }
    return { schedule, ladder };
  };

  /** AV-Block II° Typ Wenckebach (Mobitz I): PQ wird länger, bis eine P-Welle blockiert */
  R.wenckebach = ({ pp = 700, prs = [180, 260, 310] } = {}) => {
    const schedule = [], ladder = []; const pOnly = E.makeBeat({ pOnly: true });
    let t = 150, i = 0;
    while (t < DUR) {
      const k = i % (prs.length + 1);
      if (k < prs.length) {
        const beat = E.makeBeat({ pr: prs[k], qt: E.qtForRR(pp) });
        schedule.push({ t0: t, beat }); ladder.push({ a: t, v: t + prs[k] });
      } else { schedule.push({ t0: t, beat: pOnly }); ladder.push({ a: t, v: null, blocked: true }); }
      t += pp; i++;
    }
    return { schedule, ladder };
  };

  /** AV-Block II° Typ Mobitz (Mobitz II): konstante PQ, plötzlich blockierte P-Welle; hier mit RSB (infranodal) */
  R.mobitz2 = ({ pp = 700, n = 3, pr = 180 } = {}) => {
    const schedule = [], ladder = []; const pOnly = E.makeBeat({ pOnly: true });
    const opts = Object.assign(E.PRESETS.rbbb(), { pr, qt: E.qtForRR(pp) });
    const beat = E.makeBeat(opts);
    let t = 150, i = 0;
    while (t < DUR) {
      if (i % (n + 1) < n) { schedule.push({ t0: t, beat }); ladder.push({ a: t, v: t + pr }); }
      else { schedule.push({ t0: t, beat: pOnly }); ladder.push({ a: t, v: null, blocked: true }); }
      t += pp; i++;
    }
    return { schedule, ladder };
  };

  /** AV-Block 2:1 */
  R.block21 = ({ pp = 640, pr = 180 } = {}) => {
    const schedule = [], ladder = []; const pOnly = E.makeBeat({ pOnly: true });
    const beat = E.makeBeat({ pr, qt: E.qtForRR(2 * pp) });
    let t = 150, i = 0;
    while (t < DUR) {
      if (i % 2 === 0) { schedule.push({ t0: t, beat }); ladder.push({ a: t, v: t + pr }); }
      else { schedule.push({ t0: t, beat: pOnly }); ladder.push({ a: t, v: null, blocked: true }); }
      t += pp; i++;
    }
    return { schedule, ladder };
  };

  /** AV-Block III°: Vorhöfe und Kammern unabhängig; Ersatzrhythmus junktional (schmal) oder ventrikulär (breit) */
  R.avb3 = ({ atrial = 85, vent = 36, escape = "vent" } = {}) => {
    const schedule = [], ladder = []; const pOnly = E.makeBeat({ pOnly: true });
    const rrV = 60000 / vent;
    const vb = escape === "vent" ? E.makeBeat(Object.assign({}, E.VENT.escape, { qt: E.qtForRR(rrV) + 40 }))
      : E.makeBeat({ hasP: false, pr: 0, qt: E.qtForRR(rrV) });
    for (let t = 120; t < DUR; t += 60000 / atrial) { schedule.push({ t0: t, beat: pOnly }); ladder.push({ a: t, v: null, blocked: true }); }
    for (let t = 700; t < DUR; t += rrV) { schedule.push({ t0: t, beat: vb }); ladder.push({ a: null, v: t, origin: escape }); }
    return { schedule, ladder };
  };

  /** SA-Block II° (Typ Mobitz): ganzer P-QRS-T-Komplex fällt aus, Pause = 2 × PP */
  R.saBlock = ({ pp = 850 } = {}) => {
    const schedule = [], ladder = []; const beat = E.makeBeat({ qt: E.qtForRR(pp) });
    let t = 200, i = 0;
    while (t < DUR) {
      if (i % 5 !== 3) { schedule.push({ t0: t, beat }); ladder.push({ a: t, v: t + 160 }); }
      else ladder.push({ a: null, v: null, sinusOnly: t });
      t += pp; i++;
    }
    return { schedule, ladder };
  };

  // ---------- Vorhofflimmern / -flattern ----------
  const fWaves = (seed, amp = 0.07) => {
    const rnd = seeded(seed);
    const comps = Array.from({ length: 6 }, () => ({ f: 5 + rnd() * 3.5, ph: rnd() * 6.28, a: 0.4 + rnd() * 0.6, dir: E.norm([rnd() - 0.6, rnd() - 0.2, 0.6 + rnd()]) }));
    return (t) => {
      let H = [0, 0, 0];
      for (const c of comps) {
        const g = amp * c.a * Math.sin(2 * Math.PI * c.f * t / 1000 + c.ph) * (0.6 + 0.4 * Math.sin(t / 900 + c.ph));
        H = [H[0] + c.dir[0] * g, H[1] + c.dir[1] * g, H[2] + c.dir[2] * g];
      }
      return H;
    };
  };
  R.afib = ({ mean = 680, spread = 0.38, seed = 7, beatOpts = {}, amp = 0.07, slowFrom = null, slowTo = null } = {}) => {
    const rnd = seeded(seed); const schedule = [], ladder = [];
    let t = 300;
    while (t < DUR) {
      const slow = slowFrom !== null && t > slowFrom && t < slowTo;
      const rr = (slow ? mean * 2.6 : mean) * (1 - spread + 2 * spread * rnd());
      const beat = E.makeBeat(Object.assign({ hasP: false, pr: 0, qt: E.qtForRR(Math.max(rr, 500)) }, beatOpts));
      schedule.push({ t0: t, beat }); ladder.push({ a: null, v: t, af: true }); t += rr;
    }
    return { schedule, ladder, extra: fWaves(seed, amp) };
  };
  /** Typisches Vorhofflattern: Sägezahn ~300/min, negativ in II/III/aVF, positiv in V1 */
  R.flutter = ({ ratio = 2, atrial = 300, blockFrom = null, blockTo = null } = {}) => {
    const fl = 60000 / atrial; const schedule = [], ladder = [];
    let n = 0;
    for (let t = 200; t < DUR; t += fl) {
      const r = blockFrom !== null && t > blockFrom && t < blockTo ? 8 : ratio;
      const conducted = n % r === 0;
      ladder.push({ a: t, v: conducted ? t + 260 : null, blocked: !conducted, flutter: true });
      if (conducted) schedule.push({ t0: t + 260, beat: E.makeBeat({ hasP: false, pr: 0, qt: E.qtForRR(fl * ratio) }) });
      n++;
    }
    const dir = E.norm([0.05, -0.9, 0.42]);
    const extra = (t) => {
      const ph = ((t - 200) % fl + fl) % fl / fl; // 0..1
      const saw = ph < 0.72 ? -0.5 + ph / 0.72 : 0.5 - (ph - 0.72) / 0.28; // langsamer Anstieg, schneller Abfall
      const g = 0.16 * saw;
      return [dir[0] * g, dir[1] * g, dir[2] * g];
    };
    return { schedule, ladder, extra };
  };

  // ---------- Reentry-Tachykardien ----------
  /** AVNRT (typisch, slow-fast): P retrograd im/kurz nach QRS → Pseudo-r′ in V1, Pseudo-S inferior */
  R.avnrt = ({ hr = 175, stopAt = null } = {}) => {
    const rr = 60000 / hr; const schedule = [], ladder = [];
    const beat = E.makeBeat({ hasP: false, pr: 0, qt: E.qtForRR(rr), extraComps: [E.comp("retrograde P-Welle", 96, 12, 14, [0.1, -0.85, 0.5], 0.13)] });
    let t = 200;
    while (t < DUR && (stopAt === null || t < stopAt)) { schedule.push({ t0: t, beat }); ladder.push({ a: t + 70, v: t, retro: true }); t += rr; }
    if (stopAt !== null) {
      const s = R.sinus({ hr: 88, start: t + 1300 });
      s.schedule.forEach((x) => x.t0 > t + 800 && schedule.push(x)); s.ladder.forEach((x) => x.a > t + 800 && ladder.push(x));
    }
    return { schedule, ladder };
  };
  /** Orthodrome AVRT: retrograde P deutlich nach dem QRS (RP > 70 ms) */
  R.avrt = ({ hr = 190, stopAt = null } = {}) => {
    const rr = 60000 / hr; const schedule = [], ladder = [];
    const beat = E.makeBeat({ hasP: false, pr: 0, qt: E.qtForRR(rr), extraComps: [E.comp("retrograde P-Welle", 165, 14, 16, [0.15, -0.85, 0.4], 0.14)] });
    let t = 200;
    while (t < DUR && (stopAt === null || t < stopAt)) { schedule.push({ t0: t, beat }); ladder.push({ a: t + 140, v: t, retro: true }); t += rr; }
    if (stopAt !== null) {
      const s = R.sinus({ hr: 85, start: t + 1300, beatOpts: E.PRESETS.wpw() });
      s.schedule.forEach((x) => x.t0 > t + 800 && schedule.push(x)); s.ladder.forEach((x) => x.a > t + 800 && ladder.push(x));
    }
    return { schedule, ladder };
  };
  /** Fokale atriale Tachykardie: P-Wellen anderer Achse (hier negativ inferior), langes RP */
  R.focalAT = ({ hr = 155, blockFrom = null, blockTo = null } = {}) => {
    const rr = 60000 / hr; const schedule = [], ladder = []; const pOnly = E.makeBeat({ pOnly: true, pAxis: -150 });
    const beat = E.makeBeat({ pr: 150, pAxis: -150, qt: E.qtForRR(rr) });
    let t = 200, i = 0;
    while (t < DUR) {
      const blk = blockFrom !== null && t > blockFrom && t < blockTo && i % 2 === 1;
      if (blk) { schedule.push({ t0: t, beat: pOnly }); ladder.push({ a: t, v: null, blocked: true }); }
      else { schedule.push({ t0: t, beat }); ladder.push({ a: t, v: t + 150 }); }
      t += rr; i++;
    }
    return { schedule, ladder };
  };
  /** Sinustachykardie mit optionaler vorübergehender Verlangsamung */
  R.sinusTach = ({ hr = 135, slowFrom = null, slowTo = null } = {}) => {
    const schedule = [], ladder = []; let t = 200;
    while (t < DUR) {
      const slow = slowFrom !== null && t > slowFrom && t < slowTo;
      const rr = 60000 / (slow ? hr * 0.72 : hr);
      const beat = E.makeBeat({ pr: 140, qt: E.qtForRR(rr) });
      schedule.push({ t0: t, beat }); ladder.push({ a: t, v: t + 140 }); t += rr;
    }
    return { schedule, ladder };
  };

  // ---------- Ventrikuläre Rhythmen ----------
  const ves = (type, rr) => E.makeBeat(Object.assign({}, E.VENT[type], { qt: E.qtForRR(rr) + 60 }));
  /** Sinusrhythmus mit ventrikulären Extrasystolen nach Muster ("1000" = jeder 4. Schlag, "10" = Bigeminus …) */
  R.pvc = ({ hr = 75, pattern = "0001", coupling = 0.58, type = "rvot" } = {}) => {
    const pp = 60000 / hr; const schedule = [], ladder = [];
    const sb = E.makeBeat({ qt: E.qtForRR(pp) }), pOnly = E.makeBeat({ pOnly: true }), vb = ves(type, pp);
    let t = 200, i = 0, lastQ = null;
    while (t < DUR) {
      const isV = pattern[i % pattern.length] === "1";
      if (isV && lastQ !== null) {
        const vt = lastQ + pp * coupling;
        schedule.push({ t0: vt, beat: vb }); ladder.push({ a: null, v: vt, origin: "ves" });
        schedule.push({ t0: t, beat: pOnly }); ladder.push({ a: t, v: null, blocked: true, refractory: true });
        lastQ = null;
      } else { schedule.push({ t0: t, beat: sb }); ladder.push({ a: t, v: t + 160 }); lastQ = t + 160; }
      t += pp; i++;
    }
    return { schedule, ladder };
  };
  /** Salve/VT: Sinus, dann n ventrikuläre Schläge (n groß = anhaltend) mit AV-Dissoziation */
  R.vt = ({ hr = 175, startAt = 2600, n = 40, type = "lv", sinusHr = 80 } = {}) => {
    const schedule = [], ladder = []; const rr = 60000 / hr; const pp = 60000 / sinusHr;
    const sb = E.makeBeat({ qt: E.qtForRR(pp) }), pOnly = E.makeBeat({ pOnly: true });
    const vb = E.makeBeat(Object.assign({}, E.VENT[type], { qt: E.qtForRR(rr) + 30, tScale: 1.2 }));
    const vtEnd = startAt + n * rr;
    for (let t = 200; t < DUR; t += pp) {
      const inVT = t + 160 > startAt - 120 && t < vtEnd;
      if (inVT) { schedule.push({ t0: t, beat: pOnly }); ladder.push({ a: t, v: null, blocked: true }); }
      else if (t >= vtEnd && t < vtEnd + 500) { /* Pause nach Salve */ }
      else { schedule.push({ t0: t, beat: sb }); ladder.push({ a: t, v: t + 160 }); }
    }
    for (let k = 0, t = startAt; k < n && t < DUR; k++, t += rr) { schedule.push({ t0: t, beat: vb }); ladder.push({ a: null, v: t, origin: "vt" }); }
    return { schedule, ladder };
  };
  /** Torsade de pointes: polymorphe VT mit „Spindel“ um die Grundlinie */
  R.torsade = ({ hr = 230, startAt = 2300, dur = 5200 } = {}) => {
    const schedule = [], ladder = []; const rr = 60000 / hr;
    // Ausgangsrhythmus mit verlängertem QT
    const sb = E.makeBeat({ qt: 560, tScale: 1.1 });
    for (let t = 150; t < startAt - 600; t += 1050) { schedule.push({ t0: t, beat: sb }); ladder.push({ a: t, v: t + 160 }); }
    let k = 0;
    for (let t = startAt; t < startAt + dur; t += rr, k++) {
      const ph = (t - startAt) / 2400 * Math.PI;
      const amp = 0.35 + 0.9 * Math.abs(Math.sin(ph));
      const rot = (t - startAt) / 2400 * 180;
      const comps = [E.comp("Torsade", 70, 38, 38, E.rotFrontal([0.35, 0.9, 0.2], rot), 1.35 * amp)];
      const b = E.makeBeat({ hasP: false, pr: 0, qrsComps: comps, qrsDuration: 160, qt: 230, tScale: 0.15 });
      schedule.push({ t0: t, beat: b }); ladder.push({ a: null, v: t, origin: "vt" });
    }
    for (let t = startAt + dur + 900; t < DUR; t += 1050) { schedule.push({ t0: t, beat: sb }); ladder.push({ a: t, v: t + 160 }); }
    return { schedule, ladder };
  };
  /** Kammerflimmern: unkoordinierte Aktivität ohne abgrenzbare Komplexe */
  R.vf = ({ seed = 3 } = {}) => {
    const rnd = seeded(seed);
    const comps = Array.from({ length: 5 }, () => ({ f: 3.5 + rnd() * 3, ph: rnd() * 6.28, a: 0.25 + rnd() * 0.35, dir: E.norm([rnd() - 0.5, rnd() - 0.3, rnd() - 0.4]) }));
    const extra = (t) => {
      let H = [0, 0, 0]; const env = 0.75 + 0.35 * Math.sin(t / 700);
      for (const c of comps) { const g = c.a * env * Math.sin(2 * Math.PI * c.f * t / 1000 + c.ph + 0.6 * Math.sin(t / 400 + c.ph)); H = [H[0] + c.dir[0] * g, H[1] + c.dir[1] * g, H[2] + c.dir[2] * g]; }
      return H;
    };
    return { schedule: [], ladder: [], extra };
  };

  window.RHYTHMS = R;
})();
