/* Kapitel 14 – Schrittmacher-EKG */
(function () {
  "use strict";
  const C = EKG.comp;
  const SPIKE = (t0 = 0, dir = [0.2, 0.95, 0.25]) => Object.assign(C("Schrittmacher-Spike", t0, 0.9, 0.9, dir, 2.0), { noRotate: true });
  const VPACE = {
    qrsComps: [C("RV-apikale Stimulation, früh", 42, 20, 20, [0.55, -0.62, -0.55], 1.3), C("spät", 104, 18, 18, [0.62, -0.38, -0.7], 0.8)],
    qrsDuration: 160, tVector: [-0.5, 0.5, 0.65], tScale: 1.4, hasP: false, pr: 0,
  };
  const pBeat = () => EKG.makeBeat({ pOnly: true });
  const apBeat = (capture) => EKG.makeBeat({ pOnly: true, pComps: capture ? [SPIKE(0, [0.3, 0.9, 0.3]), ...EKG.NORMAL.P.map((c) => Object.assign({}, c, { t: c.t + 6 }))] : [SPIKE(0, [0.3, 0.9, 0.3])], pDuration: 106 });
  const vsBeat = (qt) => EKG.makeBeat({ hasP: false, pr: 0, qt });
  const vpBeat = (qt) => EKG.makeBeat(Object.assign({}, VPACE, { qt: qt + 40, extraComps: [SPIKE(-3)] }));
  const spikeOnly = () => EKG.makeBeat({ pOnly: true, pComps: [SPIKE(0)], pDuration: 5 });

  function simulate(mode, base, fault) {
    const DUR = 10000, LRI = 1000, AVD = 160, AVDs = 140, VRP = 280, PVARP = 300, MAG = 60000 / 85;
    const conducts = base === "sinus" || base === "brady";
    // intrinsische Vorhof-Erregungen
    const atrial = [];
    if (base === "sinus") for (let t = 400; t < DUR; t += 857) atrial.push(t);
    if (base === "brady") for (let t = 200; t < DUR; t += 1550) atrial.push(t);
    if (base === "avb3") for (let t = 300; t < DUR; t += 800) atrial.push(t);
    let s = 5; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const afV = []; if (base === "af") { let t = 500; while (t < DUR) { afV.push(t); t += 900 + 900 * rnd(); } }
    const noise = fault === "oversense" ? [2950, 3600, 6500] : [];

    const sch = [], ev = [];
    let lastVact = -1000, lastVevt = -LRI + 600, lastAevt = -1000, pendingVint = [], pendingVp = null;
    let nextA = mode === "AAI" || mode === "DDD" ? 600 : Infinity;
    let nextV = mode === "VVI" || mode === "VOO" ? 600 : Infinity;
    const qt = 380;
    const activateV = (t, paced) => { lastVact = t; };
    for (let t = 0; t < DUR; t += 2) {
      // Vorhof: intrinsisch
      for (const ta of atrial) if (ta >= t && ta < t + 2) {
        const atrRefr = t - lastAevt < 250;
        if (!atrRefr) {
          sch.push({ t0: ta, beat: pBeat() });
          if (conducts) pendingVint.push(ta + 170);
        } else sch.push({ t0: ta, beat: pBeat() });
        const sensed = (mode === "AAI" || mode === "DDD") && fault !== "undersense" && t - lastVevt > PVARP;
        if (sensed) {
          ev.push({ t: ta, k: "AS" }); lastAevt = ta;
          if (mode === "AAI") nextA = ta + LRI;
          if (mode === "DDD") { pendingVp = ta + AVDs; nextA = Infinity; }
        }
      }
      // AF-Überleitung
      for (const tv of afV) if (tv >= t && tv < t + 2) pendingVint.push(tv);
      // Kammer: intrinsisch
      pendingVint = pendingVint.filter((tv) => {
        if (tv >= t && tv < t + 2) {
          if (t - lastVact > VRP) {
            sch.push({ t0: tv, beat: vsBeat(qt) }); activateV(tv);
            const sensed = (mode === "VVI" || mode === "DDD") && fault !== "undersense";
            if (sensed) {
              ev.push({ t: tv, k: "VS" }); lastVevt = tv;
              if (mode === "VVI") nextV = tv + LRI;
              if (mode === "DDD") { pendingVp = null; nextA = tv + LRI - AVD; }
            }
          }
          return false;
        }
        return tv > t;
      });
      // Störsignale (Oversensing)
      for (const tn of noise) if (tn >= t && tn < t + 2) {
        ev.push({ t: tn, k: "N" }); lastVevt = tn;
        if (mode === "VVI") nextV = tn + LRI;
        if (mode === "DDD") { pendingVp = null; nextA = tn + LRI - AVD; }
        if (mode === "AAI") nextA = tn + LRI;
      }
      // Schrittmacher: Vorhof
      if (t >= nextA) {
        const cap = fault !== "capture" && t - lastAevt > 250;
        sch.push({ t0: t, beat: apBeat(cap) }); ev.push({ t, k: cap ? "AP" : "AP×" });
        lastAevt = t;
        if (cap && conducts) pendingVint.push(t + 6 + 170);
        if (mode === "AAI") nextA = t + LRI;
        if (mode === "DDD") { pendingVp = t + AVD; nextA = Infinity; }
      }
      // Schrittmacher: Kammer
      const vDue = (mode === "DDD" && pendingVp !== null && t >= pendingVp) || ((mode === "VVI" || mode === "VOO") && t >= nextV);
      if (vDue) {
        const cap = fault !== "capture" && t - lastVact > VRP;
        if (cap) { sch.push({ t0: t, beat: vpBeat(qt) }); activateV(t); pendingVint = pendingVint.filter((x) => x < t - 5 || x > t + 300); }
        else sch.push({ t0: t, beat: spikeOnly() });
        ev.push({ t, k: cap ? "VP" : "VP×" });
        lastVevt = t;
        if (mode === "VVI") nextV = t + LRI;
        if (mode === "VOO") nextV = t + MAG;
        if (mode === "DDD") { pendingVp = null; nextA = t + LRI - AVD; }
      }
    }
    return { sch, ev };
  }

  const TXT = {
    mode: {
      VVI: "<b>VVI</b>: Stimulation und Wahrnehmung im Ventrikel, Inhibition bei Eigenaktion. Typisch bei Vorhofflimmern mit Bradykardie. Nachteil: keine AV-Synchronie.",
      AAI: "<b>AAI</b>: Stimulation und Wahrnehmung im Vorhof. Nur sinnvoll bei intakter AV-Überleitung (Sinusknotenerkrankung) – beim AV-Block III° folgt auf den stimulierten Vorhof keine Kammererregung.",
      DDD: "<b>DDD</b>: Vorhof und Kammer werden wahrgenommen und stimuliert. Eine wahrgenommene P-Welle triggert nach der AV-Zeit eine Kammerstimulation (Vorhof-gesteuerte Kammerstimulation) – physiologische AV-Synchronie, z. B. beim AV-Block.",
      VOO: "<b>VOO (Magnet)</b>: Auflegen eines Magneten schaltet die meisten Schrittmacher in einen festfrequenten, asynchronen Modus ohne Wahrnehmung – z. B. zur Prüfung der Stimulation oder bei Störbeeinflussung (Diathermie). Spikes fallen dann auch in Eigenaktionen.",
    },
    fault: {
      none: "Regelrechte Funktion.",
      capture: "<b>Exit-Block (Loss of Capture)</b>: Spikes ohne nachfolgende Depolarisation (×). Ursachen: Sondendislokation, Reizschwellenanstieg, Batterieerschöpfung, Elektrolytstörung.",
      undersense: "<b>Undersensing</b>: Eigenaktionen werden nicht erkannt, der Schrittmacher stimuliert trotzdem – Spikes fallen in oder kurz nach Eigenkomplexe. Gefahr: Spike in der vulnerablen Phase (T-Welle) kann Kammerflimmern auslösen.",
      oversense: "<b>Oversensing</b>: Störsignale (N; z. B. Muskelpotenziale, Sondenbruch, elektromagnetische Störung) werden als Eigenaktion fehlgedeutet und hemmen die Stimulation – es entstehen <b>Pausen</b> ohne Spike.",
    },
  };

  function init() {
    const root = document.getElementById("fig-14a");
    if (!root) return;
    const canvas = root.querySelector("canvas"), readout = root.querySelector(".readout");
    let mode = "DDD", base = "avb3", fault = "none", sig = null, ev = [];
    const LEADS = ["II", "V1"];
    const cv = U.canvas(canvas, (w) => U.stripHeight(w, 2, { dur: 10, rowMm: 26 }) + 26, (ctx, w, h) => {
      if (!sig) return;
      ctx.clearRect(0, 0, w, h);
      ctx.save(); ctx.translate(0, 24);
      const g = U.drawStrips(ctx, w, h - 24, sig, LEADS, { dur: 10, rowMm: 26 });
      ctx.restore();
      ctx.fillStyle = U.cssVar("--paper-2"); ctx.fillRect(0, 0, w, 24);
      for (const e of ev) {
        const x = g.X(e.t);
        const bad = e.k.includes("×") || e.k === "N" || (fault === "undersense" && e.k[1] === "P");
        U.label(ctx, e.k, x, 16, { size: 11, align: "center", color: bad ? U.cssVar("--danger") : e.k[1] === "P" ? U.cssVar("--accent") : U.cssVar("--ink-soft"), font: `600 11px ${U.cssVar("--f-mono")}` });
      }
    });
    function update() {
      const r = simulate(mode, base, fault);
      ev = r.ev;
      sig = U.model12(r.sch, { fs: 1000, duration: 10000, leads: LEADS });
      readout.innerHTML = `${TXT.mode[mode]}<br>${TXT.fault[fault]}`;
      cv.redraw();
    }
    U.seg(root.querySelector(".mode"), (v) => { mode = v; update(); });
    U.seg(root.querySelector(".base"), (v) => { base = v; update(); });
    U.seg(root.querySelector(".fault"), (v) => { fault = v; update(); });
    update();
  }

  U.quizzes({ kap14: [
    { q: "Was bedeutet der NBG-Code „DDD“?", a: ["Nur Vorhofstimulation", "Stimulation und Wahrnehmung in Vorhof und Kammer, Antwort: inhibiert und getriggert", "Festfrequente Kammerstimulation", "Defibrillator"], c: 1, e: "1. Buchstabe: stimulierte Kammer (D = beide), 2.: wahrgenommene Kammer (D = beide), 3.: Antwort auf Wahrnehmung (D = Inhibition und Triggerung)." },
    { q: "Wie sieht ein QRS bei rechtsventrikulär-apikaler Stimulation typischerweise aus?", a: ["Schmal, normale Achse", "Breit, linksschenkelblockartig, meist überdrehter Linkstyp", "Rechtsschenkelblockartig mit Rechtstyp", "Wie ein normaler Sinusschlag"], c: 1, e: "Die Erregung startet in der rechten Herzspitze und breitet sich langsam nach links-oben aus: breiter QRS mit LSB-Morphologie und superiorer Achse." },
    { q: "Im EKG eines Schrittmacherpatienten folgen mehreren Kammer-Spikes keine QRS-Komplexe. Was liegt vor?", a: ["Undersensing", "Oversensing", "Exit-Block (Loss of Capture)", "Normale Funktion"], c: 2, e: "Der Impuls wird abgegeben, depolarisiert das Myokard aber nicht. Ursachen: Sondendislokation, Reizschwellenanstieg, Batterie, Elektrolyte." },
    { q: "Ein VVI-Schrittmacher gibt Spikes mitten in Eigenkomplexe ab. Welche Störung?", a: ["Oversensing", "Undersensing", "Exit-Block", "Magnetmodus ist ausgeschlossen"], c: 1, e: "Eigenaktionen werden nicht wahrgenommen. Differenzialdiagnose: Magnetauflage (asynchroner Modus) – deshalb immer nach Magnet fragen." },
    { q: "Lange Pausen ohne Schrittmacher-Spike bei bekannter Bradykardie sprechen am ehesten für …", a: ["Oversensing", "Undersensing", "zu hohe Grundfrequenz", "Vorhofflattern"], c: 0, e: "Störsignale werden fälschlich als Eigenaktion gewertet und hemmen die Stimulation." },
  ] });

  document.addEventListener("DOMContentLoaded", init);
})();
