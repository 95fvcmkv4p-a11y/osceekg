/* Kapitel 6 – Systematische Befundung */
(function () {
  "use strict";
  const S = window.BEFUND_SCHEMA;

  function measure(beat) {
    let aI = 0, aF = 0;
    for (let t = beat.qrsOn; t <= beat.qrsOff; t++) { const H = beat.vec(t); aI += EKG.leadValue(H, "I"); aF += EKG.leadValue(H, "aVF"); }
    return Math.round(Math.atan2(aF / EKG.LEAD_VECTORS.aVF[1], aI) * 180 / Math.PI);
  }
  const lt = (a) => a < -30 ? "überdrehter Linkstyp" : a < 30 ? "Linkstyp" : a < 60 ? "Indifferenztyp" : a < 90 ? "Steiltyp" : a <= 120 ? "Rechtstyp" : "überdrehter Rechtstyp";

  // Beispiel-EKGs mit exakt bekannten Modellwerten
  const EX = {
    a: { t: "Beispiel A", hr: 72, opts: {} },
    b: { t: "Beispiel B", hr: 64, opts: Object.assign(EKG.PRESETS.rbbbLafb(), { pr: 236 }) },
    c: { t: "Beispiel C", hr: 88, opts: Object.assign(EKG.PRESETS.lvh(true), {}) },
  };
  function findings(key, beat, axis, rr) {
    const qt = Math.round(beat.tEnd - beat.qrsOn), qtcF = Math.round(qt / Math.cbrt(rr / 1000)), qtcB = Math.round(qt / Math.sqrt(rr / 1000));
    const hr = EX[key].hr, pq = beat.qrsOn, qrs = Math.round(beat.qrsOff - beat.qrsOn);
    const common = {
      formal: "Eichzacke 10 mm/mV, 25 mm/s, keine Artefakte. P in I positiv, in aVR negativ – Elektrodenlage plausibel.",
      frequenz: `${hr}/min (RR ${Math.round(rr)} ms ≈ ${(rr / 200).toFixed(1).replace(".", ",")} große Kästchen → 300 / ${(rr / 200).toFixed(1).replace(".", ",")} ≈ ${hr}).`,
      lagetyp: `${lt(axis)} (QRS-Achse ≈ ${axis > 0 ? "+" : ""}${axis}°).`,
      zeiten: `PQ ${pq} ms · QRS ${qrs} ms · QT ${qt} ms → QTc ${qtcF} ms (Fridericia) bzw. ${qtcB} ms (Bazett).`,
      u: "Nicht abgrenzbar.",
    };
    if (key === "a") return Object.assign(common, {
      rhythmus: "Regelmäßig, jede P-Welle wird mit konstanter PQ-Zeit übergeleitet, P positiv in I/II → Sinusrhythmus.",
      p: "Unauffällig: < 120 ms, < 0,25 mV, in V1 biphasisch.",
      qrs: "Schmal, kleines septales q in I, aVL, V6; Umschlagzone V3/V4; keine pathologischen Q-Zacken, keine Hypertrophiezeichen.",
      st: "Isoelektrisch.",
      t: "Konkordant: positiv in I, II, V2–V6, negativ in aVR.",
      beurteilung: "Sinusrhythmus, normofrequent, Indifferenztyp, regelrechte Erregungsausbreitung und -rückbildung. Normales EKG.",
    });
    if (key === "b") return Object.assign(common, {
      rhythmus: "Regelmäßig, jede P-Welle wird übergeleitet, PQ konstant, P positiv in I/II → Sinusrhythmus.",
      zeiten: common.zeiten + " PQ > 200 ms → <b>AV-Block I°</b>; QRS ≥ 120 ms → kompletter Schenkelblock.",
      p: "Unauffällig.",
      qrs: "Terminal positive, breite R′-Zacke in V1 (hier als qR), breite S-Zacken in I und V6 → <b>kompletter Rechtsschenkelblock</b>. Zusätzlich überdrehter Linkstyp mit rS in II, III, aVF und qR in aVL → <b>linksanteriorer Hemiblock</b>.",
      st: "Keine primären ST-Veränderungen.",
      t: "Negativ in V1–V2 – beim RSB sekundär (diskordant zur terminalen R′-Zacke) und erwartbar.",
      beurteilung: "Sinusrhythmus, normofrequent, überdrehter Linkstyp. AV-Block I°, kompletter Rechtsschenkelblock und linksanteriorer Hemiblock. Sekundäre Repolarisationsstörung rechtspräkordial. Die Kombination aus RSB und LAH betrifft zwei der drei Faszikel; mit AV-Block I° ist eine weitere Abklärung (Synkopen? Langzeit-EKG) sinnvoll.",
    });
    return Object.assign(common, {
      rhythmus: "Regelmäßig, Sinusrhythmus.",
      p: "Verbreitert (≈ 120 ms) mit betontem zweiten Gipfel – Hinweis auf linksatriale Belastung.",
      qrs: "Hohe Amplituden: tiefe S-Zacken in V1/V2, hohe R-Zacken in V5/V6 und I. Sokolow-Lyon-Index (SV1 + RV5/V6) > 3,5 mV → <b>Linkshypertrophie-Zeichen</b>.",
      st: "Deszendierende ST-Senkung in I, aVL, V5, V6.",
      t: "Asymmetrisch negativ in I, aVL, V5, V6 (diskordant zum hohen R) – typische Repolarisationsstörung bei Hypertrophie („Strain“).",
      beurteilung: "Sinusrhythmus, normofrequent. Positiver Sokolow-Lyon-Index mit Erregungsrückbildungsstörung lateral – vereinbar mit linksventrikulärer Hypertrophie. Echokardiografie und Blutdruckanamnese; ST-T-Veränderungen nicht als Ischämie fehldeuten, aber im Vergleich mit Vor-EKG und Klinik bewerten.",
    });
  }

  function initAssist() {
    const root = document.getElementById("fig-6a");
    if (!root) return;
    const list = root.querySelector(".steps"), card = root.querySelector(".step-card");
    const canvas = root.querySelector("canvas");
    let ex = "a", step = 0, sig = null, F = null, revealed = {};
    const cv = U.canvas(canvas, (w) => U.layout12(w, {}).h, (ctx, w, h) => {
      const marks = {};
      (S[step].focus || []).forEach((l) => (marks[l] = { tone: "focus" }));
      U.draw12(ctx, w, h, sig, { marks, focusOnly: S[step].focus && S[step].focus.length > 0 });
    });
    function load() {
      const e = EX[ex], rr = 60000 / e.hr;
      const out = U.sinus12(e.opts, e.hr);
      sig = out;
      F = findings(ex, out.beat, measure(out.beat), rr);
      revealed = {};
      render();
    }
    function render() {
      list.innerHTML = S.map((s, i) => `<li><button type="button" class="${i === step ? "on" : ""} ${revealed[i] ? "done" : ""}" data-i="${i}"><span class="n">${i + 1}</span>${s.t}</button></li>`).join("");
      list.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { step = +b.dataset.i; render(); }));
      const s = S[step];
      card.innerHTML = `
        <div class="kicker">Schritt ${step + 1} von ${S.length} <span class="en">${s.en}</span></div>
        <h4>${s.t}</h4>
        <p class="ask">${s.ask}</p>
        <ul>${s.how.map((h) => `<li>${h}</li>`).join("")}</ul>
        <p class="norm"><b>Normal:</b> ${s.normal}</p>
        <div class="reveal-box">${revealed[step] ? `<p><b>In diesem EKG:</b> ${F[s.id]}</p>` : `<button type="button" class="btn ghost rv">Befund für dieses EKG zeigen</button>`}</div>
        <div class="viewer-nav"><button type="button" class="btn ghost prev" ${step === 0 ? "disabled" : ""}>← Zurück</button><button type="button" class="btn next">${step === S.length - 1 ? "Gesamtbefund" : "Weiter →"}</button></div>
        <div class="final"></div>`;
      const rv = card.querySelector(".rv");
      if (rv) rv.addEventListener("click", () => { revealed[step] = true; render(); });
      card.querySelector(".prev").addEventListener("click", () => { step--; render(); });
      card.querySelector(".next").addEventListener("click", () => {
        if (step < S.length - 1) { revealed[step] = true; step++; render(); }
        else {
          S.forEach((_, i) => (revealed[i] = true));
          render();
          card.querySelector(".final").innerHTML = `<div class="befundtext"><div class="panel-label">Befundtext</div><p>${S.slice(1).map((x) => F[x.id]).join(" ")}</p></div>`;
        }
      });
      cv.redraw();
    }
    U.segButtons(root.querySelector(".ex"), Object.entries(EX).map(([k, v]) => [k, v.t]), "a");
    U.seg(root.querySelector(".ex"), (v) => { ex = v; step = 0; load(); });
    load();
  }

  function initMerk() {
    const tb = document.querySelector("#merkkarte tbody");
    if (!tb) return;
    tb.innerHTML = S.map((s, i) => `<tr><td class="mono">${i + 1}</td><td><b>${s.t}</b><br><span class="caption">${s.ask}</span></td><td>${s.how.join("; ")}</td><td>${s.normal}</td></tr>`).join("");
    const btn = document.querySelector(".print-merk");
    if (btn) btn.addEventListener("click", () => { document.body.classList.add("print-merk"); window.print(); setTimeout(() => document.body.classList.remove("print-merk"), 500); });
  }

  U.quizzes({ kap6: [
    { q: "Warum beginnt man die Befundung mit Formalem und Technik?", a: ["Weil das in jedem Befundbericht so verlangt wird", "Weil falsche Eichung, falscher Vorschub oder vertauschte Elektroden alle weiteren Befunde verfälschen", "Weil man daran den Rhythmus ablesen kann", "Das ist nur bei Kindern nötig"], c: 1, e: "Eine Eichung von 5 statt 10 mm/mV halbiert alle Amplituden (Hypertrophie-Indizes, ST-Werte), 50 statt 25 mm/s verdoppelt scheinbar alle Zeiten, vertauschte Elektroden täuschen Infarkte oder Lagetypen vor." },
    { q: "An welchem Punkt wird die ST-Strecken-Abweichung gemessen?", a: ["Am Gipfel der T-Welle", "Am J-Punkt, bezogen auf die PQ- bzw. TP-Strecke", "Am tiefsten Punkt der S-Zacke", "In der Mitte der P-Welle"], c: 1, e: "Die 4. universelle Infarktdefinition bezieht die ST-Kriterien auf den J-Punkt. Als Nulllinie dient die PQ-Strecke (bzw. TP-Strecke)." },
    { q: "In welchen Ableitungen ist eine negative T-Welle beim Erwachsenen regelhaft bzw. oft normal?", a: ["I und II", "aVR (immer) sowie häufig III und V1", "V4–V6", "In keiner Ableitung"], c: 1, e: "T ist in aVR normalerweise negativ; in III, aVL, aVF und V1 ist es variabel. In I, II und V3–V6 sollte T positiv sein." },
    { q: "Du hast eine eindeutige Tachykardie gefunden. Wie geht es weiter?", a: ["Befundung beenden, Rhythmus ist das Wichtigste", "Das Schema trotzdem vollständig durchgehen", "Nur noch die ST-Strecke ansehen", "Sofort mit dem Vor-EKG vergleichen und abbrechen"], c: 1, e: "Der häufigste Fehler ist „satisfaction of search“: Nach dem ersten auffälligen Befund werden weitere übersehen (z. B. Ischämiezeichen bei Tachykardie). Das feste Schema schützt davor." },
    { q: "Ein EKG zeigt PQ 240 ms, QRS 140 ms mit rSR′ in V1 und Achse −60°. Wie beschreibst du die Leitungsstörung laut AHA/ACCF/HRS am besten?", a: ["Trifaszikulärer Block", "AV-Block I°, kompletter RSB und linksanteriorer Hemiblock", "Kompletter AV-Block", "Linksschenkelblock"], c: 1, e: "Die AHA/ACCF/HRS-Empfehlungen (Teil III, 2009) raten von Begriffen wie „trifaszikulärer Block“ ab und empfehlen, jede Leitungsstörung einzeln zu benennen." },
  ] });

  document.addEventListener("DOMContentLoaded", () => { initAssist(); initMerk(); });
})();
