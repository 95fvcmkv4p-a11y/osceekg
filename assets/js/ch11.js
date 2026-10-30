/* Kapitel 11 – Ischämie & Infarkt */
(function () {
  "use strict";
  const N = (v) => EKG.norm(v);
  const TERR = {
    ladProx: { t: "RIVA proximal", dir: [0.32, -0.38, 0.87], amp: 0.28, region: "anterior + hochlateral", artery: "proximaler RIVA (vor dem 1. Diagonalast)",
      txt: "ST-Hebung in V1–V4 (oft bis V6), I und aVL; spiegelbildliche Senkung inferior (III, aVF). Großes Infarktareal; Gefahr von Pumpversagen und Schenkelblöcken." },
    ladDist: { t: "RIVA distal („Wraparound“)", dir: [0.3, 0.55, 0.78], amp: 0.28, region: "anterior + apikal/inferior", artery: "distaler RIVA, der um die Herzspitze greift",
      txt: "ST-Hebung in V2–V5 und zusätzlich inferior (II, III, aVF), keine inferioren Senkungen. Kann wie ein Zwei-Gefäß-Infarkt aussehen." },
    diag: { t: "1. Diagonalast", dir: [0.6, -0.7, 0.45], amp: 0.26, region: "hochlateral", artery: "1. Diagonalast des RIVA (oder R. intermedius)",
      txt: "ST-Hebung in I, aVL und V2 (ggf. V3–V6), Senkung in III und aVF. Gut zu merken als „südafrikanische Flagge“ im Cabrera-Kreis." },
    lcx: { t: "R. circumflexus", dir: [0.78, 0.3, -0.55], amp: 0.26, region: "lateral + posterior", artery: "Ramus circumflexus",
      txt: "ST-Hebung lateral (I, aVL, V5, V6) und oft inferior (II ≥ III), dazu ST-Senkung in V1–V3 als Spiegelbild der posterioren Wand. RCX-Verschlüsse sind im 12-Kanal-EKG am häufigsten „stumm“ – V7–V9 ableiten." },
    rcaProx: { t: "RCA proximal", dir: [-0.42, 0.85, 0.32], amp: 0.28, region: "inferior + rechtsventrikulär", artery: "proximale rechte Koronararterie",
      txt: "ST-Hebung inferior mit <b>III &gt; II</b> und Senkung in I/aVL. ST-Hebung in V1 und <b>V4R</b> zeigt die rechtsventrikuläre Beteiligung: Vorsicht mit Nitraten und Diuretika (Vorlastabhängigkeit). AV-Blockierungen sind häufig." },
    rcaDist: { t: "RCA distal", dir: [-0.12, 0.9, -0.42], amp: 0.28, region: "inferior + posterior", artery: "distale RCA bzw. R. interventricularis posterior",
      txt: "ST-Hebung in II, III, aVF (III &gt; II), Senkung in aVL; zusätzlich ST-Senkung in V1–V3 bei posteriorer Beteiligung. Keine Hebung in V4R." },
    post: { t: "isoliert posterior", dir: [0.12, 0.1, -0.98], amp: 0.26, tMixScale: 0.15, region: "posterior", artery: "R. circumflexus (Marginalast) oder RCA",
      txt: "Im Standard-EKG nur <b>ST-Senkung in V1–V3/V4</b>, oft mit aufrechter, terminal positiver T-Welle – leicht als „Ischämie“ fehlzudeuten. In V7–V9 zeigt sich die ST-Hebung direkt (≥ 0,5 mm). Im Verlauf hohe R-Zacken in V1/V2 als spiegelbildliche Q-Zacken." },
    lm: { t: "Hauptstamm / Mehrgefäß", dir: [-0.55, -0.55, -0.3], amp: 0.22, region: "diffus subendokardial", artery: "Hauptstamm, proximaler RIVA oder Mehrgefäßerkrankung", noStage: true,
      txt: "Ausgedehnte ST-Senkungen ≥ 1 mm in ≥ 6 Ableitungen mit <b>ST-Hebung in aVR</b> (und/oder V1). Nach ESC 2023 Hinweis auf Hauptstamm- oder Mehrgefäßischämie; bei hämodynamischer Instabilität Vorgehen wie beim STEMI." },
  };
  const SPECIAL = {
    dewinter: { t: "de-Winter-Muster", artery: "proximaler RIVA", noStage: true,
      opts: () => ({ stVec: EKG.mul(N([0.05, 0.15, -0.98]), 0.13), tVector: [0.3, 0.3, 0.9], tScale: 2.7, tNarrow: 0.85 }),
      txt: "Aszendierende ST-Senkung 1–3 mm am J-Punkt in V1–V6 mit hohen, symmetrischen T-Wellen, oft leichte ST-Hebung in aVR. Laut ESC 2023 Hinweis auf proximalen RIVA-Verschluss oder hochgradige Stenose – ein STEMI-Äquivalent ohne klassische ST-Hebung." },
    wellensA: { t: "Wellens Typ A", artery: "kritische proximale RIVA-Stenose", noStage: true,
      opts: () => ({ tScale: 0.25, extraComps: [EKG.comp("T, positiver Anteil", 270, 32, 26, [0, 0, 1], 0.22), EKG.comp("T, negativer Anteil", 345, 30, 34, [0.1, 0, -1], 0.32)].map((c) => Object.assign(c, { noRotate: true })) }),
      txt: "<b>Biphasische T-Wellen in V2–V3</b> (erst positiv, dann negativ) im <i>schmerzfreien</i> Intervall, ST-Strecke isoelektrisch oder minimal gehoben, R-Zacken erhalten. Hinweis auf eine kritische RIVA-Stenose (ESC 2023: NSTE-ACS-Muster). Kein Belastungstest – Gefahr eines großen Vorderwandinfarkts." },
    wellensB: { t: "Wellens Typ B", artery: "kritische proximale RIVA-Stenose", noStage: true,
      opts: () => ({ tScale: 0.15, extraComps: [Object.assign(EKG.comp("tief negative, symmetrische T", 300, 44, 44, [0.15, 0.1, -0.98], 0.55), { noRotate: true })] }),
      txt: "<b>Tiefe, symmetrische T-Negativierungen in V2–V3</b> (oft bis V4–V6) im schmerzfreien Intervall bei erhaltenen R-Zacken. Häufigere Form des Wellens-Musters. Differenzialdiagnosen tiefer T-Negativierungen: Takotsubo, zerebrale Ereignisse, apikale hypertrophe Kardiomyopathie." },
  };
  const STAGES = [
    { t: "hyperakut", st: 0.22, tMix: 1.2, tScale: 2.1, q: 0, txt: "Minuten: <b>hyperakute T-Wellen</b> – hoch, breitbasig, symmetrisch – über dem betroffenen Gebiet, ST-Strecke beginnt sich zu heben. Leicht zu übersehen, daher Verlaufs-EKG nach 15–30 min bei anhaltendem Schmerz." },
    { t: "akut", st: 1.0, tMix: 1.0, tScale: 1.4, q: 0, txt: "Minuten bis Stunden: <b>ST-Hebung</b> mit Übergang in die T-Welle („Monophasie“), spiegelbildliche Senkungen in gegenüberliegenden Ableitungen." },
    { t: "subakut", st: 0.45, tMix: -1.5, tScale: 1.0, q: 1, txt: "Stunden bis Tage: <b>Q-Zacken</b> entstehen (Nekrose), die ST-Hebung bildet sich zurück, die T-Welle wird terminal negativ." },
    { t: "chronisch", st: 0.0, tMix: -0.8, tScale: 0.8, q: 1, txt: "Wochen bis Jahre: <b>Q-Zacken persistieren</b> als Narbenzeichen, T-Wellen normalisieren sich oft wieder. Bleibt die ST-Hebung bestehen, an ein Aneurysma denken." },
  ];

  function beatOpts(key, stage) {
    if (SPECIAL[key]) return SPECIAL[key].opts();
    const T = TERR[key], inj = N(T.dir), S = T.noStage ? STAGES[1] : STAGES[stage];
    const base = EKG.NORMAL.T.v;
    const o = { stVec: EKG.mul(inj, T.amp * S.st) };
    if (!T.noStage) {
      o.tVector = EKG.add(N(base), EKG.mul(inj, S.tMix * (T.tMixScale ?? 1)));
      o.tScale = S.tScale;
      if (S.q) o.extraComps = [Object.assign(EKG.comp("Infarktnarbe: Initialvektor zeigt weg", 18, 8, 10, EKG.mul(inj, -1), 0.6), { noRotate: true })];
    }
    return o;
  }
  function thresh(lead, sex) {
    if (lead === "V2" || lead === "V3") return sex === "m40" ? 0.25 : sex === "m" ? 0.2 : 0.15;
    if (/^V[789]$/.test(lead) || /R$/.test(lead)) return 0.05;
    return 0.1;
  }
  const NEIGH = { II: ["III", "aVF"], III: ["II", "aVF"], aVF: ["II", "III"], I: ["aVL"], aVL: ["I"],
    V1: ["V2"], V2: ["V1", "V3"], V3: ["V2", "V4"], V4: ["V3", "V5"], V5: ["V4", "V6"], V6: ["V5"],
    V3R: ["V4R"], V4R: ["V3R"], V7: ["V8"], V8: ["V7", "V9"], V9: ["V8"] };

  function init() {
    const root = document.getElementById("fig-11a");
    if (!root) return;
    const canvas = root.querySelector("canvas.main"), canvas2 = root.querySelector("canvas.extra");
    const readout = root.querySelector(".readout"), stageS = root.querySelector(".stage"), stageO = root.querySelector(".stage-out");
    const sexSel = root.querySelector(".sex");
    U.segButtons(root.querySelector(".terr"), Object.entries(TERR).map(([k, v]) => [k, v.t]), "ladProx");
    U.segButtons(root.querySelector(".spec"), [["none", "keins"], ...Object.entries(SPECIAL).map(([k, v]) => [k, v.t])], "none");
    let key = "ladProx", stage = 1, sig = null, sig2 = null, marks = {}, A = null;
    const EXTRA = ["V3R", "V4R", "V7", "V8", "V9"];
    const cv = U.canvas(canvas, (w) => U.layout12(w, { rhythm: null }).h, (ctx, w, h) => U.draw12(ctx, w, h, sig, { rhythm: null, marks }));
    const cv2 = U.canvas(canvas2, (w) => Math.ceil(w * 0.105), (ctx, w, h) => {
      if (!sig2) return;
      const pxmm = w / 252; ctx.clearRect(0, 0, w, h); U.paper(ctx, 0, 0, w, h, pxmm);
      EXTRA.forEach((l, i) => {
        const x0 = (1 + i * 50) * pxmm, y0 = h * 0.62;
        const m = marks[l];
        if (m && m.tone === "up") { ctx.fillStyle = U.cssVar("--danger"); ctx.globalAlpha = 0.12; ctx.fillRect(x0, 0, 50 * pxmm, h); ctx.globalAlpha = 1; }
        U.trace(ctx, sig2.leads[l], sig2.fs, { x0, y0, pxmm, i0: 0, i1: Math.round(2 * sig2.fs), width: 1.25 });
        U.label(ctx, l, x0 + 3, 14, { size: 12, color: U.cssVar("--accent"), font: `600 12.5px ${U.cssVar("--f-mono")}` });
        if (m && m.text) U.label(ctx, m.text, x0 + 50 * pxmm - 6, 14, { size: 11, align: "right", color: m.tone === "up" ? U.cssVar("--danger") : U.cssVar("--ink-soft") });
      });
    });
    function update() {
      const isSpec = !!SPECIAL[key];
      const T = TERR[key] || SPECIAL[key];
      const noStage = T.noStage;
      stageS.disabled = noStage;
      stageO.textContent = noStage ? "–" : STAGES[stage].t;
      const o = beatOpts(key, stage);
      const hr = 80, rr = 60000 / hr;
      const beat = EKG.makeBeat(Object.assign({ qt: EKG.qtForRR(rr) }, o));
      const sch = []; for (let t0 = 120 - 2 * rr; t0 < 10200; t0 += rr) sch.push({ t0, beat });
      sig = U.model12(sch);
      sig2 = U.model12(sch, { duration: 2200, leads: EXTRA });
      const L = [...EKG.LEADS, ...EXTRA];
      A = EKG.analyzeBeat(beat, { leads: L, jOffset: 0 });
      const sex = sexSel.value;
      marks = {};
      const meets = (l) => A[l].j >= thresh(l, sex);
      const stemi = [];
      for (const l of L) {
        const j = A[l].j, mm = (j * 10).toFixed(1).replace(".", ",");
        const ok = meets(l) && (NEIGH[l] || []).some(meets);
        if (ok) { marks[l] = { tone: "up", text: `↑ ${mm} mm` }; stemi.push(l); }
        else if (j >= 0.05) marks[l] = { tone: "focus", text: `↑ ${mm}` };
        else if (j <= -0.05) marks[l] = { tone: "down", text: `↓ ${(-j * 10).toFixed(1).replace(".", ",")}` };
      }
      const stemi12 = stemi.filter((l) => EKG.LEADS.includes(l));
      const extraUp = stemi.filter((l) => EXTRA.includes(l));
      const std = L.filter((l) => EKG.LEADS.includes(l) && A[l].j <= -0.1);
      const std12 = std.length;
      const rv = extraUp.includes("V4R") || extraUp.includes("V3R"), post = extraUp.some((l) => /V[789]/.test(l));
      let extraTxt = "";
      if (rv && /^rca/.test(key)) extraTxt += " ST-Hebung in V3R/V4R → <b>rechtsventrikuläre Beteiligung</b>.";
      else if (rv) extraTxt += " V3R/V4R sind hier mitbetroffen – bei Vorderwandinfarkt nicht als RV-Infarkt zu werten.";
      if (post) extraTxt += " ST-Hebung ≥ 0,5 mm in V7–V9 → <b>posteriore Beteiligung</b>.";
      const verdict = stemi12.length
        ? `<p><b style="color:var(--danger)">ST-Hebungskriterien erfüllt</b> in ${stemi12.join(", ")} (je ≥ Grenzwert in zwei benachbarten Ableitungen).${extraTxt}</p>`
        : post ? `<p><b style="color:var(--danger)">Posteriorer STEMI</b>: im 12-Kanal-EKG nur ST-Senkungen, aber ST-Hebung ≥ 0,5 mm in V7–V9.</p>`
        : key === "lm" ? `<p><b>Keine STEMI-Kriterien</b>, aber ST-Senkung ≥ 1 mm in ${std12} Ableitungen (${std.join(", ")}) mit ST-Hebung in aVR (${(A.aVR.j * 10).toFixed(1).replace(".", ",")} mm).</p>`
          : `<p><b>Keine ST-Hebungskriterien</b> im 12-Kanal-EKG erfüllt.</p>`;
      readout.innerHTML = `<span class="tag">${T.t}</span>${T.txt} <span class="caption">Typisch: ${T.artery}.</span>${verdict}` + (!noStage ? `<p class="caption">${STAGES[stage].txt}</p>` : "");
      cv.redraw(); cv2.redraw();
    }
    U.seg(root.querySelector(".terr"), (v) => { key = v; root.querySelectorAll(".spec button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === "none"))); update(); });
    U.seg(root.querySelector(".spec"), (v) => { if (v === "none") return; key = v; root.querySelectorAll(".terr button").forEach((b) => b.setAttribute("aria-pressed", "false")); update(); });
    stageS.addEventListener("input", () => { stage = +stageS.value; update(); });
    sexSel.addEventListener("change", update);
    update();
  }

  function initSgarbossa() {
    const root = document.getElementById("fig-11b");
    if (!root) return;
    const f = root.querySelector("form"), out = root.querySelector(".sg-out");
    function calc() {
      const c1 = f.c1.checked, c2 = f.c2.checked, c3 = f.c3.checked;
      const score = (c1 ? 5 : 0) + (c2 ? 3 : 0) + (c3 ? 2 : 0);
      const st = parseFloat(f.st.value), s = parseFloat(f.s.value);
      const ratio = st > 0 && s > 0 ? -st / s : null; // diskordante Hebung über negativem QRS
      const smith = c1 || c2 || (ratio !== null && ratio <= -0.25);
      out.innerHTML = `<p><b>Sgarbossa-Score: ${score} Punkte</b> – ${score >= 3 ? "<span style='color:var(--danger)'>≥ 3: hochspezifisch für einen akuten Infarkt</span>" : "&lt; 3: schließt einen Infarkt nicht aus (geringe Sensitivität)"}.</p>` +
        `<p><b>Modifizierte Kriterien (Smith):</b> ${ratio !== null ? `ST/S-Verhältnis = ${ratio.toFixed(2).replace(".", ",")} → ` : ""}${smith ? "<span style='color:var(--danger)'>positiv</span>" : "negativ"}.</p>`;
    }
    f.addEventListener("input", calc); calc();
  }

  U.quizzes({ kap11: [
    { q: "Welche ST-Hebung in V2–V3 erfüllt bei einem 55-jährigen Mann das STEMI-Kriterium?", a: ["≥ 1 mm", "≥ 1,5 mm", "≥ 2 mm", "≥ 2,5 mm"], c: 2, e: "V2–V3: ≥ 2 mm bei Männern ≥ 40 Jahre, ≥ 2,5 mm bei Männern &lt; 40 Jahre, ≥ 1,5 mm bei Frauen; in allen anderen Ableitungen ≥ 1 mm – jeweils in zwei benachbarten Ableitungen (4. universelle Infarktdefinition, ESC 2023)." },
    { q: "ST-Hebung in II, III, aVF mit III > II und ST-Hebung in V4R. Welches Gefäß und was ist zu beachten?", a: ["RIVA – Nitrate großzügig geben", "Proximale RCA mit rechtsventrikulärer Beteiligung – vorlastabhängig, Vorsicht mit Nitraten", "R. circumflexus – keine Besonderheiten", "Hauptstamm – sofort Lyse"], c: 1, e: "III > II spricht für die RCA, die ST-Hebung in V4R für eine Beteiligung des rechten Ventrikels. Dieser ist vorlastabhängig: Nitrate und Diuretika können zu schwerer Hypotonie führen." },
    { q: "Ein Patient mit Brustschmerz hat ST-Senkungen in V1–V3 mit aufrechten T-Wellen. Was ist der nächste Schritt?", a: ["Als NSTEMI einordnen und abwarten", "V7–V9 ableiten – Verdacht auf posterioren Infarkt", "Belastungs-EKG", "Kein weiterer Schritt"], c: 1, e: "ST-Senkung in V1–V3 kann das Spiegelbild einer posterioren ST-Hebung sein. ST-Hebung ≥ 0,5 mm in V7–V9 bestätigt einen posterioren STEMI (ESC 2023)." },
    { q: "Ein schmerzfreier Patient nach Brustschmerz-Episode hat tiefe, symmetrische T-Negativierungen in V2–V3 bei erhaltenen R-Zacken. Woran denkst du?", a: ["Normvariante", "Wellens-Muster – kritische RIVA-Stenose", "Hyperkaliämie", "Perikarditis"], c: 1, e: "Wellens Typ B. Hinweis auf eine kritische proximale RIVA-Stenose mit hohem Risiko eines Vorderwandinfarkts; Belastungstests sind kontraindiziert, frühe Koronarangiografie." },
    { q: "Welches Muster gilt laut ESC 2023 als Hinweis auf Hauptstamm- oder Mehrgefäßischämie?", a: ["ST-Hebung in V1–V4", "ST-Senkung ≥ 1 mm in ≥ 6 Ableitungen mit ST-Hebung in aVR und/oder V1", "Q-Zacken in II, III, aVF", "Isolierte T-Negativierung in III"], c: 1, e: "Diffuse subendokardiale Ischämie erzeugt ausgedehnte ST-Senkungen; der Vektor zeigt zur Herzbasis, daher die Hebung in aVR (und V1)." },
  ] });

  document.addEventListener("DOMContentLoaded", () => { init(); initSgarbossa(); });
})();
