/* Kapitel 3 – Die 12 Ableitungen */
(function () {
  "use strict";
  const { el, smooth, jitter } = U;
  const D2R = Math.PI / 180;

  // ======================================================================
  // 3A  Elektrodenlage und Fehlplatzierung
  // ======================================================================
  const K = 1 / Math.sqrt(3);
  const SCEN = {
    ok: { t: "korrekt", txt: "<span class='tag'>Korrekte Anlage</span>Extremitäten: rechter Arm <b>rot</b>, linker Arm <b>gelb</b>, linkes Bein <b>grün</b>, rechtes Bein <b>schwarz</b> (Neutralelektrode; Farbcode nach IEC, in den USA abweichend). Brustwand V1–V6 nach AHA/ACCF/HRS. P, QRS und T sind in I und II positiv, in aVR negativ; die R-Zacke wächst von V1 nach V5." },
    raLa: { t: "RA ↔ LA", swap: { RA: "LA", LA: "RA" }, txt: "<span class='tag'>Arm-Elektroden vertauscht</span>Häufigste Verwechslung. <b>Ableitung I ist komplett negativ</b> (P, QRS und T), II und III tauschen, aVR und aVL tauschen; aVF und die Brustwandableitungen sind unverändert. Warnsignal: <b>positive P-Welle in aVR</b> bzw. negative P in I. Abgrenzung zur Dextrokardie: Dort fehlt zusätzlich die R-Progression in V1–V6." },
    raLl: { t: "RA ↔ LL", swap: { RA: "LL", LL: "RA" }, txt: "<span class='tag'>Rechter Arm ↔ linkes Bein</span>II wird invertiert, I und III werden zu −III und −I, aVR und aVF tauschen. Typisch: <b>aVR positiv</b>, inferiore Ableitungen negativ – kann einen Hinterwandinfarkt oder einen ektopen Vorhofrhythmus vortäuschen." },
    laLl: { t: "LA ↔ LL", swap: { LA: "LL", LL: "LA" }, txt: "<span class='tag'>Linker Arm ↔ linkes Bein</span>Tückisch, weil das EKG plausibel aussieht: I und II tauschen, III wird invertiert, aVL und aVF tauschen. Hinweis kann eine P-Welle sein, die in I größer ist als in II, oder ein neuer Unterschied zum Vor-EKG." },
    raRl: { t: "RA ↔ RL (Neutral)", swap: { RA: "RL" }, txt: "<span class='tag'>Rechter Arm ↔ Neutralelektrode</span>Das Kabel des rechten Arms misst jetzt praktisch das Potenzial der Beine. <b>Ableitung II wird zur fast flachen Linie</b> (Bein gegen Bein). Eine nahezu isoelektrische Extremitätenableitung ist ein starker Hinweis auf eine vertauschte Neutralelektrode." },
    v12hi: { t: "V1/V2 zu hoch", high: true, txt: "<span class='tag'>V1/V2 im 2. ICR statt 4. ICR</span>Häufiger Anlagefehler, besonders bei Frauen. Typisch: <b>negative oder biphasische P-Welle in V1/V2</b>, rSr′-Muster (inkompletter Rechtsschenkelblock vorgetäuscht), teils negative T. Bei Verdacht Elektrodenlage prüfen und neu ableiten. Bewusst hoch abgeleitete V1/V2 (2./3. ICR) nutzt man dagegen gezielt in der Brugada-Diagnostik (Kapitel 13)." },
    dextro: { t: "Dextrokardie", mirror: true, txt: "<span class='tag'>Zum Vergleich: echte Dextrokardie</span>Keine Fehlanlage, sondern ein spiegelbildlich liegendes Herz. Ableitung I ist negativ wie bei der Armverwechslung – zusätzlich nehmen die R-Zacken von V1 nach V6 <b>ab</b> statt zu. Bestätigung: rechtspräkordiale Ableitungen und Extremitätenelektroden seitenvertauscht anlegen." },
  };

  function leadFnFor(sc) {
    const s = SCEN[sc];
    const E = EKG.ELECTRODES;
    return (H, lead) => {
      const Hm = s.mirror ? [-H[0], H[1], H[2]] : H;
      const phi = { RA: EKG.dot(Hm, E.RA), LA: EKG.dot(Hm, E.LA), LL: EKG.dot(Hm, E.LL) };
      phi.RL = phi.LL; // rechtes Bein ≈ Potenzial der Beine
      const inp = { RA: phi.RA, LA: phi.LA, LL: phi.LL };
      if (s.swap) for (const [cable, at] of Object.entries(s.swap)) inp[cable] = phi[at];
      // Kabel, die getauscht wurden (symmetrisch)
      if (s.swap && s.swap.RA === "LA") { inp.RA = phi.LA; inp.LA = phi.RA; }
      if (s.swap && s.swap.RA === "LL") { inp.RA = phi.LL; inp.LL = phi.RA; }
      if (s.swap && s.swap.LA === "LL") { inp.LA = phi.LL; inp.LL = phi.LA; }
      const wct = (inp.RA + inp.LA + inp.LL) / 3;
      switch (lead) {
        case "I": return (inp.LA - inp.RA) * K;
        case "II": return (inp.LL - inp.RA) * K;
        case "III": return (inp.LL - inp.LA) * K;
        case "aVR": return (inp.RA - (inp.LA + inp.LL) / 2) * K;
        case "aVL": return (inp.LA - (inp.RA + inp.LL) / 2) * K;
        case "aVF": return (inp.LL - (inp.RA + inp.LA) / 2) * K;
        case "-aVR": return -(inp.RA - (inp.LA + inp.LL) / 2) * K;
        default: {
          let L = EKG.LEAD_VECTORS[lead];
          if (s.high && (lead === "V1" || lead === "V2")) L = [L[0], -0.62 * Math.hypot(L[0], L[2]), L[2]];
          return EKG.dot(Hm, L) - wct * K * 0.5;
        }
      }
    };
  }

  function buildTorso(svg) {
    svg.setAttribute("viewBox", "0 0 360 430");
    const g = el("g", { filter: "url(#sk-wobble)" }, svg);
    const body = [[60, 70], [110, 48], [150, 40], [180, 38], [210, 40], [250, 48], [300, 70], [318, 140], [306, 250], [298, 330], [270, 410], [90, 410], [62, 330], [54, 250], [42, 140]];
    el("path", { d: smooth(body, true), class: "sk-stroke", fill: "var(--paper-2)" }, g);
    el("path", { d: smooth(jitter(body, 1.4, 4), true), class: "sk-thin" }, g);
    // Arme (angedeutet)
    el("path", { class: "sk-stroke", d: "M60,70 C30,90 20,150 14,220 M300,70 C330,90 340,150 346,220" }, g);
    // Schlüsselbeine, Sternum
    el("path", { class: "sk-thin", d: "M110,78 C140,70 165,74 178,82 M182,82 C195,74 220,70 250,78" }, g);
    el("path", { class: "sk-stroke", d: "M172,84 L170,214 L180,232 L190,214 L188,84 Z", "stroke-width": 1.3 }, g);
    // Rippen / ICR
    const ribs = [];
    for (let k = 0; k < 6; k++) {
      const y = 100 + k * 25;
      ribs.push(el("path", { class: "sk-thin", d: `M168,${y} C140,${y + 4} 105,${y + 14} 74,${y + 34} M192,${y} C220,${y + 4} 255,${y + 14} 286,${y + 34}` }, g));
    }
    // Hilfslinien
    const gl = el("g", {}, svg);
    for (const [x, t] of [[248, "MCL"], [276, "vAL"], [302, "mAL"]]) {
      el("line", { x1: x, y1: 92, x2: x, y2: 330, stroke: "var(--ink-faint)", "stroke-dasharray": "2 4", "stroke-width": 1 }, gl);
      el("text", { x, y: 344, "text-anchor": "middle", class: "sk-mono", text: t }, gl);
    }
    el("text", { x: 120, y: 160, "text-anchor": "end", class: "sk-mono", text: "4. ICR" }, gl);
    el("text", { x: 120, y: 186, "text-anchor": "end", class: "sk-mono", text: "5. ICR" }, gl);
    el("text", { x: 120, y: 110, "text-anchor": "end", class: "sk-mono", text: "2. ICR" }, gl);
    // Elektroden
    const ge = el("g", {}, svg);
    const elec = {};
    const mk = (id, x, y, fill, label, txtFill = "var(--ink)") => {
      const c = el("circle", { cx: x, cy: y, r: 9, fill, stroke: "var(--ink)", "stroke-width": 1.4 }, ge);
      const below = true;
      const t = el("text", { x, y: below ? y + 22 : y - 13, "text-anchor": "middle", class: "sk-label small", text: label, style: `fill:${txtFill}` }, ge);
      elec[id] = { c, t, x, y };
    };
    mk("RA", 22, 236, "#c94a3d", "RA"); mk("LA", 338, 236, "#e2c23e", "LA");
    mk("RL", 120, 398, "#222", "RL"); mk("LL", 240, 398, "#3e8e4e", "LL");
    const prec = { V1: [158, 152], V2: [202, 152], V3: [224, 168], V4: [248, 184], V5: [276, 186], V6: [302, 188] };
    for (const [k, [x, y]] of Object.entries(prec)) mk(k, x, y, "var(--paper-2)", k, "var(--accent)");
    return { elec, prec };
  }

  function initFig3A() {
    const root = document.getElementById("fig-3a");
    if (!root) return;
    const torso = buildTorso(root.querySelector("svg.torso"));
    const canvas = root.querySelector("canvas");
    const readout = root.querySelector(".readout");
    const seg = root.querySelector(".scen");
    U.segButtons(seg, Object.entries(SCEN).map(([k, v]) => [k, v.t]), "ok");
    let sc = "ok", sig = null;
    const rr = 60000 / 72;
    const beat = EKG.makeBeat({ qt: EKG.qtForRR(rr) });
    const sch = []; for (let t0 = 120 - 2 * rr; t0 < 10200; t0 += rr) sch.push({ t0, beat });
    const MARK = { raLa: ["I", "aVR", "aVL", "II", "III"], raLl: ["II", "aVR", "aVF"], laLl: ["I", "II", "III", "aVL", "aVF"], raRl: ["II"], v12hi: ["V1", "V2"], dextro: ["I", "aVR", "V4", "V5", "V6"] };
    const cv = U.canvas(canvas, (w) => U.layout12(w, {}).h, (ctx, w, h) => {
      const marks = {}; (MARK[sc] || []).forEach((l) => (marks[l] = { tone: "focus" }));
      U.draw12(ctx, w, h, sig, { marks });
    });
    function update() {
      sig = U.model12(sch, { leadFn: leadFnFor(sc) });
      readout.innerHTML = SCEN[sc].txt;
      // Torso: Kabelbeschriftung tauschen
      const s = SCEN[sc];
      const lab = { RA: "RA", LA: "LA", LL: "LL", RL: "RL" };
      if (s.swap) { if (s.swap.RA === "LA") { lab.RA = "LA-Kabel"; lab.LA = "RA-Kabel"; } if (s.swap.RA === "LL") { lab.RA = "LL-Kabel"; lab.LL = "RA-Kabel"; } if (s.swap.LA === "LL") { lab.LA = "LL-Kabel"; lab.LL = "LA-Kabel"; } if (s.swap.RA === "RL") { lab.RA = "RL-Kabel"; lab.RL = "RA-Kabel"; } }
      for (const k of ["RA", "LA", "LL", "RL"]) {
        torso.elec[k].t.textContent = lab[k];
        torso.elec[k].c.setAttribute("stroke-width", lab[k] !== k ? 3 : 1.4);
        torso.elec[k].c.setAttribute("stroke", lab[k] !== k ? "var(--danger)" : "var(--ink)");
      }
      for (const k of ["V1", "V2"]) {
        const e = torso.elec[k], y = s.high ? 102 : torso.prec[k][1];
        e.c.setAttribute("cy", y); e.t.setAttribute("y", y + 22);
        e.c.setAttribute("stroke", s.high ? "var(--danger)" : "var(--ink)"); e.c.setAttribute("stroke-width", s.high ? 3 : 1.4);
      }
      root.querySelector("svg.torso").style.transform = s.mirror ? "scaleX(-1)" : "";
      root.querySelectorAll("svg.torso text").forEach((t) => (t.style.transform = s.mirror ? "scaleX(-1)" : ""));
      root.querySelectorAll("svg.torso text").forEach((t) => { t.style.transformBox = "fill-box"; t.style.transformOrigin = "center"; });
      cv.redraw();
    }
    U.seg(seg, (v) => { sc = v; update(); });
    update();
  }

  // ======================================================================
  // 3B  Blickrichtungen: Frontal- und Horizontalebene
  // ======================================================================
  const GROUPS = {
    inf: { t: "inferior", leads: ["II", "III", "aVF"], txt: "<b>Inferior</b>: II, III, aVF – Hinterwand/Unterwand des linken Ventrikels. Versorgung meist durch die <b>RCA</b> (Rechtsversorgungstyp), sonst den Ramus circumflexus." },
    lat: { t: "lateral", leads: ["I", "aVL", "V5", "V6"], txt: "<b>Lateral</b>: I, aVL (hochlateral) sowie V5, V6 (tief-/apikolateral). Versorgung durch <b>R. circumflexus</b> und/oder <b>Diagonaläste</b> des RIVA." },
    sep: { t: "septal / anterior", leads: ["V1", "V2", "V3", "V4"], txt: "<b>Septal</b>: V1, V2 · <b>anterior</b>: V3, V4 – Vorderwand und Septum. Versorgung durch den <b>RIVA</b> (LAD)." },
    avr: { t: "aVR", leads: ["aVR"], txt: "<b>aVR</b> blickt von rechts oben in den Ventrikel (Basis, Ausflusstrakt). Fast alle Vektoren laufen von ihr weg – deshalb ist sie im Normal-EKG negativ. Eine ST-Hebung in aVR mit ausgedehnten ST-Senkungen ist ein wichtiges Muster (Kapitel 11)." },
    rv: { t: "rechtsventrikulär", leads: ["V3R", "V4R"], txt: "<b>V3R, V4R</b> (spiegelbildlich rechts) – rechter Ventrikel. Bei inferiorem Infarkt ableiten, um eine rechtsventrikuläre Beteiligung (proximale RCA) zu erkennen." },
    post: { t: "posterior", leads: ["V7", "V8", "V9"], txt: "<b>V7–V9</b> (hintere Axillarlinie, Skapularlinie, paravertebral links; auf Höhe von V6) – posteriore Wand. Bei ST-Senkung in V1–V3 ableiten: Ein posteriorer Infarkt zeigt sich im Standard-EKG nur spiegelbildlich." },
  };
  function initFig3B() {
    const root = document.getElementById("fig-3b");
    if (!root) return;
    const sv = root.querySelector("svg");
    sv.setAttribute("viewBox", "0 0 720 340");
    const front = el("g", { transform: "translate(170,170)" }, sv);
    const horiz = el("g", { transform: "translate(530,170)" }, sv);
    el("text", { x: 170, y: 18, "text-anchor": "middle", class: "sk-label", text: "Frontalebene (Extremitäten)" }, sv);
    el("text", { x: 530, y: 18, "text-anchor": "middle", class: "sk-label", text: "Horizontalebene (Brustwand, Blick von unten)" }, sv);
    const R = 115, lines = {};
    // Frontal
    el("circle", { r: R, class: "sk-thin", "stroke-dasharray": "2 5" }, front);
    el("ellipse", { rx: 38, ry: 28, transform: "rotate(40)", class: "sk-stroke", fill: "var(--paper-3)", filter: "url(#sk-wobble)" }, front);
    for (const [nm, deg] of [["I", 0], ["II", 60], ["III", 120], ["aVR", -150], ["aVL", -30], ["aVF", 90]]) {
      const x = Math.cos(deg * D2R) * R, y = Math.sin(deg * D2R) * R;
      const ln = el("line", { x1: 0, y1: 0, x2: x, y2: y, stroke: "var(--ink-faint)", "stroke-width": 1.4 }, front);
      const tx = el("text", { x: x * 1.18, y: y * 1.18 + 5, "text-anchor": "middle", class: "sk-label small", text: nm }, front);
      lines[nm] = { ln, tx };
    }
    // Horizontal (Ansicht von kaudal: anterior oben, links des Patienten rechts im Bild)
    el("ellipse", { rx: 150, ry: 105, class: "sk-thin" }, horiz);
    el("text", { x: 0, y: -132, "text-anchor": "middle", class: "sk-mono", text: "anterior" }, horiz);
    el("text", { x: 0, y: 140, "text-anchor": "middle", class: "sk-mono", text: "posterior" }, horiz);
    el("text", { x: -160, y: 4, "text-anchor": "end", class: "sk-mono", text: "re" }, horiz);
    el("text", { x: 160, y: 4, class: "sk-mono", text: "li" }, horiz);
    el("ellipse", { cx: 18, cy: 10, rx: 44, ry: 34, class: "sk-stroke", fill: "var(--paper-3)", filter: "url(#sk-wobble)" }, horiz);
    // schematische Winkel (nur für diese Skizze): 90° = anterior, 0° = links lateral
    const hdeg = { V1: 104, V2: 86, V3: 72, V4: 57, V5: 32, V6: 6, V3R: 124, V4R: 142, V7: -22, V8: -42, V9: -62 };
    for (const [nm, deg] of Object.entries(hdeg)) {
      const x = Math.cos(deg * D2R) * 140, y = -Math.sin(deg * D2R) * 98;
      const ln = el("line", { x1: 18, y1: 10, x2: x, y2: y, stroke: "var(--ink-faint)", "stroke-width": 1.4, "stroke-dasharray": /R$|V[789]/.test(nm) ? "4 3" : null }, horiz);
      const tx = el("text", { x: x * 1.12, y: y * 1.12 + (y < 0 ? -2 : 12), "text-anchor": "middle", class: "sk-label small", text: nm }, horiz);
      lines[nm] = { ln, tx };
    }
    const readout = root.querySelector(".readout");
    const seg = root.querySelector(".groups");
    U.segButtons(seg, Object.entries(GROUPS).map(([k, v]) => [k, v.t]), "inf");
    const show = (k) => {
      for (const [nm, o] of Object.entries(lines)) {
        const on = GROUPS[k].leads.includes(nm);
        o.ln.setAttribute("stroke", on ? "var(--accent)" : "var(--ink-faint)"); o.ln.setAttribute("stroke-width", on ? 3.2 : 1.4);
        o.tx.setAttribute("class", on ? "sk-label small" : "sk-label small"); o.tx.style.fill = on ? "var(--accent)" : ""; o.tx.style.fontWeight = on ? 700 : "";
      }
      readout.innerHTML = GROUPS[k].txt;
    };
    U.seg(seg, show); show("inf");
  }

  U.quizzes({ kap3: [
    { q: "Wo liegt die Elektrode V4?", a: ["4. ICR links parasternal", "5. ICR in der linken Medioklavikularlinie", "5. ICR in der vorderen Axillarlinie", "Auf Höhe von V3 in der Mamillarlinie"], c: 1, e: "V4: 5. ICR, Medioklavikularlinie. V5 und V6 liegen auf derselben Horizontalen in der vorderen bzw. mittleren Axillarlinie; V3 liegt mittig zwischen V2 und V4 (AHA/ACCF/HRS 2007)." },
    { q: "Ableitung I ist komplett negativ (P, QRS, T), die Brustwandableitungen zeigen eine normale R-Progression. Was ist am wahrscheinlichsten?", a: ["Dextrokardie", "Vertauschte Armelektroden", "Linksanteriorer Hemiblock", "Lateraler Infarkt"], c: 1, e: "Bei vertauschten Armelektroden wird I gespiegelt, die Brustwand bleibt unverändert. Bei Dextrokardie nehmen zusätzlich die R-Zacken von V1 nach V6 ab." },
    { q: "Eine Extremitätenableitung zeigt eine fast flache Linie. Woran solltest du zuerst denken?", a: ["Asystolie", "Niedervoltage bei Perikarderguss", "Vertauschte Neutralelektrode (rechtes Bein)", "Linksschenkelblock"], c: 2, e: "Wird z. B. das Kabel des rechten Arms an das rechte Bein gelegt, misst II Bein gegen Bein – nahezu 0 mV. Eine fast isoelektrische Extremitätenableitung spricht stark für eine vertauschte Neutralelektrode (Batchvarov et al. 2007)." },
    { q: "Welche Ableitungen bilden die „inferiore“ Gruppe?", a: ["I, aVL, V5, V6", "II, III, aVF", "V1–V4", "aVR, V1"], c: 1, e: "II, III und aVF blicken von unten auf das Herz (Hinterwand im deutschen Sprachgebrauch bzw. inferiore Wand)." },
    { q: "Wann leitest du V7–V9 ab?", a: ["Bei jedem Routine-EKG", "Bei ST-Senkungen in V1–V3 und Verdacht auf akutes Koronarsyndrom", "Nur bei Kindern", "Bei Verdacht auf Hyperkaliämie"], c: 1, e: "Ein posteriorer Infarkt zeigt im Standard-EKG nur spiegelbildliche ST-Senkungen in V1–V3. V7–V9 machen die ST-Hebung direkt sichtbar (ESC 2023: ≥ 0,5 mm)." },
  ] });

  document.addEventListener("DOMContentLoaded", () => { initFig3A(); initFig3B(); });
})();
