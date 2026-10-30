/* Kapitel 13 – Elektrolyte, Medikamente & Mimics */
(function () {
  "use strict";
  const lerp = (a, b, u) => a + (b - a) * Math.min(1, Math.max(0, u));
  const ramp = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));

  // ---------- Kalium & Kalzium ----------
  function electrolyteOpts(k, ca) {
    const o = { pr: 160, qt60: 400, tScale: 1, tNarrow: 1, pScale: 1, qrsWidth: 1, uAmp: 0.03, stVec: null };
    // Hyperkaliämie
    const hk = ramp(k, 5.5, 7.0);
    o.tScale *= lerp(1, 2.6, hk); o.tNarrow *= lerp(1, 0.62, hk); o.qt60 = lerp(400, 360, hk);
    const hp = ramp(k, 6.5, 8.0);
    o.pScale *= lerp(1, 0.0, hp); o.pr = lerp(160, 230, ramp(k, 6.5, 7.5));
    o.qrsWidth = lerp(1, 2.3, ramp(k, 7.0, 8.5)) * lerp(1, 1.4, ramp(k, 8.5, 9.0));
    // Hypokaliämie
    const lk = ramp(-k, -3.5, -2.4);
    o.tScale *= lerp(1, 0.3, lk); o.uAmp = lerp(0.03, 0.2, lk);
    if (lk > 0) o.stVec = EKG.mul(EKG.norm(EKG.NORMAL.T.v), -0.07 * lk);
    // Kalzium: hoch → kurze ST-Strecke, niedrig → lange ST-Strecke (T-Welle selbst unverändert)
    const caQt = ca === "hoch" ? -80 : ca === "niedrig" ? 110 : 0;
    o.qt60 += caQt; o.caNarrow = 400 / o.qt60;
    return o;
  }
  function stageText(k, ca) {
    let t = "";
    if (k >= 8.0) t = "<b>Sinuswellen-Muster</b>: P-Wellen fehlen, sehr breiter QRS verschmilzt mit der T-Welle. Unmittelbar vor Kammerflimmern oder Asystolie – Notfall.";
    else if (k >= 7.0) t = "<b>QRS-Verbreiterung</b>, P-Welle flach bis fehlend, PQ verlängert, hohe zeltförmige T-Wellen. Gefahr von Bradykardie, AV-Block und Kammerflimmern.";
    else if (k >= 6.5) t = "<b>P-Abflachung und PQ-Verlängerung</b> zusätzlich zu den spitzen T-Wellen.";
    else if (k >= 5.5) t = "<b>Hohe, schmalbasige, spitze („zeltförmige“) T-Wellen</b> – meist das erste Zeichen.";
    else if (k > 3.5) t = "Normokaliämie: keine kaliumbedingten Veränderungen.";
    else if (k > 3.0) t = "<b>Leichte Hypokaliämie</b>: T-Wellen flacher, U-Wellen werden sichtbar.";
    else t = "<b>Hypokaliämie</b>: flache T-Wellen, ST-Senkung, <b>prominente U-Wellen</b> (oft höher als T), scheinbar verlängerte QT (in Wahrheit QU). Erhöhtes Risiko für Arrhythmien und Torsade de pointes.";
    const c = ca === "hoch" ? " <b>Hyperkalzämie</b>: verkürzte ST-Strecke und QT-Zeit." : ca === "niedrig" ? " <b>Hypokalzämie</b>: verlängerte ST-Strecke und QT-Zeit bei normal geformter T-Welle." : "";
    return t + c + " <span class='caption'>Die Kaliumschwellen sind grobe Anhaltspunkte: Die Korrelation zwischen Serumkalium und EKG ist schwach, und ein normales EKG schließt eine schwere Hyperkaliämie nicht aus.</span>";
  }
  function initK() {
    const root = document.getElementById("fig-13a");
    if (!root) return;
    const canvas = root.querySelector("canvas"), ks = root.querySelector(".k"), ko = root.querySelector(".k-out"), readout = root.querySelector(".readout");
    let ca = "normal", sig = null;
    const LEADS = ["II", "V2", "V5"];
    const cv = U.canvas(canvas, (w) => U.stripHeight(w, 3, { dur: 6, rowMm: 26 }), (ctx, w, h) => { if (sig) U.drawStrips(ctx, w, h, sig, LEADS, { dur: 6, rowMm: 26 }); });
    function update() {
      const k = +ks.value / 10;
      ko.textContent = k.toFixed(1).replace(".", ",") + " mmol/l";
      const o = electrolyteOpts(k, ca), hr = k >= 7.5 ? 52 : 70, rr = 60000 / hr;
      const beat = EKG.makeBeat({ pr: o.pr, qt: EKG.qtForRR(rr, o.qt60), tScale: o.tScale, tNarrow: o.tNarrow * o.caNarrow, pScale: o.pScale, qrsWidth: o.qrsWidth, uAmp: o.uAmp, stVec: o.stVec });
      const sch = []; for (let t0 = 150 - 2 * rr; t0 < 6400; t0 += rr) sch.push({ t0, beat });
      sig = U.model12(sch, { fs: 400, duration: 6000, leads: LEADS });
      readout.innerHTML = stageText(k, ca);
      cv.redraw();
    }
    ks.addEventListener("input", update);
    U.seg(root.querySelector(".ca"), (v) => { ca = v; update(); });
    update();
  }

  // ---------- Mimics ----------
  function brugadaPost(sig, beat, rr) {
    // lokale, nicht dipolare Veränderung im RVOT: gewölbte („coved“) ST-Hebung mit negativem T in V1/V2
    const fs = sig.fs;
    const shape = (t) => { // t in ms ab J-Punkt
      if (t < -6 || t > 360) return 0;
      const up = 1 / (1 + Math.exp(-(t + 2) / 2.5));
      const cove = 0.34 * Math.exp(-Math.pow((t - 18) / 70, 2)) + 0.12 * Math.exp(-Math.pow((t - 95) / 80, 2));
      const neg = -0.24 * Math.exp(-Math.pow((t - 230) / 55, 2));
      return up * (cove + neg);
    };
    for (const [lead, g] of [["V1", 1], ["V2", 0.85], ["V3", 0.2]]) {
      const arr = sig.leads[lead];
      for (let i = 0; i < sig.n; i++) {
        const t = (i * 1000) / fs;
        let add = 0;
        for (let t0 = 120 - 2 * rr; t0 < 10200; t0 += rr) add += shape(t - (t0 + beat.qrsOff));
        arr[i] += g * add;
      }
    }
    return sig;
  }
  const MIMICS = {
    stemi: { t: "Vorderwand-STEMI", hr: 85, opts: () => ({ stVec: EKG.mul(EKG.norm([0.32, -0.38, 0.87]), 0.28), tVector: [0.75, 0.1, 0.75], tScale: 1.4 }),
      feat: ["ST-Hebung im Versorgungsgebiet (V1–V4, I, aVL)", "<b>Spiegelbildliche ST-Senkung</b> (III, aVF)", "konvexe oder gerade („Grabstein“) ST-Form", "keine PQ-Senkung", "Verlauf: Q-Zacken, T-Negativierung"] },
    peri: { t: "Perikarditis", hr: 102, opts: () => ({ stVec: EKG.mul(EKG.norm([0.45, 0.65, 0.6]), 0.17), prVec: EKG.mul(EKG.norm([0.35, 0.8, 0.3]), -0.07) }),
      feat: ["<b>Diffuse</b>, konkave ST-Hebung in vielen Ableitungen, keinem Gefäß zuzuordnen", "keine spiegelbildliche Senkung außer in aVR (und oft V1)", "<b>PQ-Senkung</b> (v. a. II, V5, V6), PQ-Hebung in aVR", "häufig Sinustachykardie", "keine Q-Zacken; T-Negativierung erst nach Normalisierung der ST-Strecke"] },
    er: { t: "Frühe Repolarisation", hr: 56, opts: () => ({ stVec: EKG.mul(EKG.norm([0.45, 0.5, 0.65]), 0.1), tScale: 1.35,
        extraComps: [Object.assign(EKG.comp("J-Welle (Knotung am QRS-Ende)", 100, 6, 9, [0.6, 0.7, 0.35], 0.14), { noRotate: true })] }),
      feat: ["J-Punkt-Erhöhung ≥ 0,1 mV mit <b>Knotung oder Verplumpung</b> am Ende des QRS in ≥ 2 benachbarten inferioren oder lateralen Ableitungen", "konkave ST-Hebung, hohe T-Wellen", "typisch bei jungen, sportlichen Männern und niedriger Frequenz", "stabil im Verlauf, keine Spiegelbilder, keine PQ-Senkung"] },
    brugada: { t: "Brugada Typ 1", hr: 72, opts: () => ({}), post: brugadaPost,
      feat: ["<b>Gewölbte („coved“) ST-Hebung ≥ 2 mm</b> in ≥ 1 rechtspräkordialen Ableitung (V1/V2), übergehend in eine <b>negative T-Welle</b>", "auch in höher (2./3. ICR) abgeleiteten V1/V2 diagnostisch", "spontan oder nach Natriumkanalblocker-Test", "Fieber und bestimmte Medikamente können das Muster demaskieren", "Risiko für Kammerflimmern und plötzlichen Herztod"] },
    hypo: { t: "Hypothermie", hr: 44, opts: () => ({ qt: 560,
        extraComps: [Object.assign(EKG.comp("Osborn-Welle (J-Welle)", 104, 9, 20, [0.55, 0.75, 0.35], 0.32), { noRotate: true })] }),
      feat: ["<b>Osborn-Wellen</b> (J-Wellen): Höcker am QRS-Ende, Größe nimmt mit sinkender Temperatur zu", "Bradykardie, verlängerte PQ, QRS und QT", "Muskelzittern-Artefakte", "Vorhofflimmern und Kammerflimmern bei tiefer Hypothermie"] },
    lbbb: { t: "Linksschenkelblock", hr: 72, opts: EKG.PRESETS.lbbb,
      feat: ["ST-Hebung in V1–V3 <b>diskordant</b> zum tiefen QS – erwartbar", "breiter QRS ≥ 120 ms", "Infarktdiagnostik nur mit Sgarbossa-/Smith-Kriterien (Kapitel 11)"] },
    lvh: { t: "Linkshypertrophie", hr: 70, opts: () => EKG.PRESETS.lvh(true),
      feat: ["ST-Hebung rechtspräkordial (V1–V3) diskordant zu tiefen S-Zacken", "ST-Senkung und T-Negativierung lateral („Strain“)", "hohe Amplituden"] },
  };
  function initMimic() {
    const root = document.getElementById("fig-13b");
    if (!root) return;
    const canvas = root.querySelector("canvas"), readout = root.querySelector(".readout");
    U.segButtons(root.querySelector(".mode"), Object.entries(MIMICS).map(([k, v]) => [k, v.t]), "peri");
    let key = "peri", sig = null;
    const cv = U.canvas(canvas, (w) => U.layout12(w, {}).h, (ctx, w, h) => U.draw12(ctx, w, h, sig, {}));
    function update() {
      const M = MIMICS[key];
      const opts = M.opts();
      sig = U.sinus12(opts, M.hr);
      if (M.post) sig = M.post(sig, sig.beat, sig.rr);
      readout.innerHTML = `<b>${M.t}</b><ul>${M.feat.map((f) => `<li>${f}</li>`).join("")}</ul>`;
      cv.redraw();
    }
    U.seg(root.querySelector(".mode"), (v) => { key = v; update(); });
    update();
  }

  U.quizzes({ kap13: [
    { q: "Was ist typischerweise das erste EKG-Zeichen einer Hyperkaliämie?", a: ["QRS-Verbreiterung", "Hohe, schmalbasige, spitze T-Wellen", "U-Wellen", "Verkürzte QT-Zeit"], c: 1, e: "Zuerst steigen und verschmälern sich die T-Wellen; mit zunehmendem Kalium folgen P-Abflachung, PQ-Verlängerung, QRS-Verbreiterung und schließlich das Sinuswellen-Muster. Die Korrelation mit dem Serumwert ist aber schwach." },
    { q: "Welcher Befund passt am besten zur Hypokaliämie?", a: ["Zeltförmige T-Wellen", "Prominente U-Wellen mit flachen T-Wellen", "Osborn-Wellen", "PQ-Senkung"], c: 1, e: "Abgeflachte T-Wellen, ST-Senkung und prominente U-Wellen; T und U können verschmelzen und eine verlängerte QT vortäuschen (eigentlich QU)." },
    { q: "Welcher Befund spricht bei ST-Hebungen eher für eine Perikarditis als für einen STEMI?", a: ["Spiegelbildliche ST-Senkungen inferior", "Diffuse konkave ST-Hebung mit PQ-Senkung, ohne Spiegelbilder außer aVR", "Q-Zacken in V1–V3", "ST-Hebung nur in II, III, aVF"], c: 1, e: "Die Entzündung betrifft das Epikard diffus; deshalb keine Gefäßzuordnung und keine Spiegelbilder (außer aVR/V1). Die PQ-Senkung entsteht durch die Mitbeteiligung der Vorhöfe." },
    { q: "Was kennzeichnet das Brugada-Muster Typ 1?", a: ["Sattelförmige ST-Hebung in V5/V6", "Gewölbte ST-Hebung ≥ 2 mm in V1/V2 mit Übergang in eine negative T-Welle", "Hohe R-Zacke in V1 mit kurzer PQ-Zeit", "Diffuse PQ-Senkung"], c: 1, e: "Coved-type ST-Hebung ≥ 2 mm in mindestens einer rechtspräkordialen Ableitung (auch im 2./3. ICR) mit negativem T. Nur Typ 1 ist diagnostisch (ESC 2022)." },
    { q: "Welches Merkmal gehört zum frühen Repolarisationsmuster?", a: ["Knotung oder Verplumpung am QRS-Ende mit J-Punkt ≥ 0,1 mV inferior oder lateral", "Spiegelbildliche ST-Senkungen", "Neue Q-Zacken", "Verlängerte QT-Zeit"], c: 0, e: "Definition nach dem Konsensuspapier von Macfarlane et al. (2015): J-Peak ≥ 0,1 mV in ≥ 2 benachbarten inferioren und/oder lateralen Ableitungen bei QRS &lt; 120 ms. Meist harmlos." },
  ] });

  document.addEventListener("DOMContentLoaded", () => { initK(); initMimic(); });
})();
