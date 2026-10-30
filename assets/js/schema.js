/* Festes Befundschema – genutzt in Kapitel 6 (Assistent, Merkkarte) und Kapitel 15 (Befundbogen) */
window.BEFUND_SCHEMA = [
  { id: "formal", t: "Formales & Technik", en: "technical check",
    ask: "Kann ich dieses EKG überhaupt verwerten?",
    how: ["Name, Datum, Uhrzeit, klinische Fragestellung", "Eichzacke 10 mm/mV, Vorschub 25 oder 50 mm/s", "Artefakte, Grundlinienschwankung, Muskelzittern", "Plausibilität der Elektrodenlage: P in I positiv, P und QRS in aVR negativ"],
    normal: "10 mm/mV, 25 mm/s, keine relevanten Artefakte, Elektrodenlage plausibel", focus: ["I", "aVR"], field: { label: "Formales", ph: "z. B. 10 mm/mV, 25 mm/s, keine Artefakte" } },
  { id: "rhythmus", t: "Rhythmus", en: "rhythm",
    ask: "Woher kommt die Erregung – und wie regelmäßig ist sie?",
    how: ["RR-Abstände regelmäßig? (Rhythmusstreifen)", "Vor jedem QRS eine P-Welle, nach jeder P-Welle ein QRS?", "PQ-Zeit konstant?", "P positiv in I und II (und aVF), negativ in aVR → Sinusrhythmus"],
    normal: "Sinusrhythmus: regelmäßig, jede P-Welle übergeleitet, P positiv in I/II", focus: ["II", "V1"], field: { label: "Rhythmus", ph: "z. B. Sinusrhythmus, regelmäßig" } },
  { id: "frequenz", t: "Frequenz", en: "heart rate",
    ask: "Wie schnell schlagen Vorhöfe und Kammern?",
    how: ["Regelmäßig: 300 / Anzahl großer Kästchen zwischen zwei R (25 mm/s)", "oder 1500 / Anzahl kleiner Kästchen", "Unregelmäßig: QRS-Komplexe im 10-s-Streifen × 6", "Bei AV-Dissoziation Vorhof- und Kammerfrequenz getrennt angeben"],
    normal: "60–100/min (< 60 Bradykardie, > 100 Tachykardie)", focus: ["II"], field: { label: "Frequenz (/min)", ph: "z. B. 72", num: true } },
  { id: "lagetyp", t: "Lagetyp", en: "QRS axis",
    ask: "Wohin zeigt der mittlere QRS-Vektor in der Frontalebene?",
    how: ["Schnelltest: I und aVF positiv → 0° bis +90°", "Ableitung mit dem größten positiven QRS suchen", "Isoelektrische Ableitung suchen – die Achse steht senkrecht darauf", "Im Kontext von Alter und Habitus bewerten"],
    normal: "Erwachsene meist Indifferenz- bis Linkstyp; Steiltyp bei Jüngeren häufig normal", focus: ["I", "II", "III", "aVR", "aVL", "aVF"], field: { label: "Lagetyp", select: ["", "überdrehter Linkstyp", "Linkstyp", "Indifferenztyp", "Steiltyp", "Rechtstyp", "überdrehter Rechtstyp", "Sagittaltyp", "nicht bestimmbar"] } },
  { id: "zeiten", t: "Zeiten", en: "intervals",
    ask: "Sind P, PQ, QRS und QT normal lang?",
    how: ["P-Dauer (in II)", "PQ: Beginn P bis Beginn QRS", "QRS: in der Ableitung mit dem breitesten Komplex", "QT: Beginn QRS bis Ende T (meist II oder V5), dann frequenzkorrigieren"],
    normal: "P < 120 ms · PQ 120–200 ms · QRS ≤ 110 ms · QTc < 450 ms (♂) / < 460 ms (♀)", focus: ["II", "V5"], fields: [
      { id: "pq", label: "PQ (ms)", num: true }, { id: "qrs", label: "QRS (ms)", num: true }, { id: "qt", label: "QT (ms)", num: true }] },
  { id: "p", t: "P-Welle", en: "P wave",
    ask: "Wie sehen die Vorhöfe aus?",
    how: ["Form in II und V1 (in V1 normal oft biphasisch)", "Breit und doppelgipflig → linksatriale Belastung (P mitrale)", "Hoch und spitz → rechtsatriale Belastung (P dextroatriale)", "Fehlende P-Wellen, Flimmer- oder Flatterwellen?"],
    normal: "≤ 0,25 mV in II, < 120 ms, positiv in I/II", focus: ["II", "V1"], field: { label: "P-Welle", ph: "z. B. unauffällig" } },
  { id: "qrs", t: "QRS-Komplex", en: "QRS morphology",
    ask: "Wie wird die Kammer erregt?",
    how: ["Pathologische Q-Zacken? (Infarktnarbe)", "Amplituden: Niedervoltage? Hypertrophie-Indizes?", "R-Progression und Umschlagzone V1–V6", "Blockbilder (RSB, LSB, Hemiblock), Knotung, Delta-Welle"],
    normal: "kein pathologisches Q, Umschlagzone V3/V4, keine Blockbilder", focus: ["V1", "V2", "V3", "V4", "V5", "V6"], field: { id: "qrsm", label: "QRS-Morphologie", ph: "Q, Amplituden, R-Progression, Blockbilder" } },
  { id: "st", t: "ST-Strecke", en: "ST segment",
    ask: "Gibt es Hebungen oder Senkungen?",
    how: ["Am J-Punkt messen – Bezug ist die PQ- bzw. TP-Strecke", "Form: aszendierend, horizontal, deszendierend, muldenförmig, konkav/konvex", "Verteilung: Koronargebiet mit spiegelbildlichen Senkungen? Oder diffus?", "Sekundäre Veränderungen (Schenkelblock, Hypertrophie) abgrenzen"],
    normal: "isoelektrisch; leichte Hebung in V2–V3 kann normal sein", focus: ["II", "III", "aVF", "I", "aVL", "V2", "V3", "V5"], field: { label: "ST-Strecke", ph: "z. B. isoelektrisch" } },
  { id: "t", t: "T-Welle", en: "T wave",
    ask: "Ist die Repolarisation regelrecht?",
    how: ["Polarität: normal positiv in I, II, V3–V6; negativ in aVR; variabel in III, aVL, aVF, V1", "Konkordant zum QRS?", "Form: symmetrisch? hoch und spitz? abgeflacht?", "Neue T-Negativierungen im Vergleich zum Vor-EKG?"],
    normal: "konkordant, asymmetrisch (flacher Anstieg, steilerer Abfall)", focus: ["I", "II", "V3", "V4", "V5", "V6", "aVR"], field: { label: "T-Welle", ph: "z. B. konkordant, unauffällig" } },
  { id: "u", t: "U-Welle", en: "U wave",
    ask: "Folgt der T-Welle noch eine Welle?",
    how: ["Am besten in V2–V3 sichtbar", "Klein und gleichsinnig zu T: normal (v. a. bei Bradykardie)", "Prominent (höher als T): Hypokaliämie, Medikamente", "Negative U-Welle: selten, spricht für Ischämie oder Hypertonie"],
    normal: "fehlend oder klein, gleichsinnig zu T", focus: ["V2", "V3"], field: { label: "U-Welle", ph: "z. B. nicht abgrenzbar" } },
  { id: "beurteilung", t: "Beurteilung", en: "conclusion",
    ask: "Was bedeutet das für diesen Patienten?",
    how: ["Kurze Zusammenfassung der pathologischen Befunde", "Vergleich mit Vor-EKGs", "Einordnung in die Klinik (Symptome, Fragestellung)", "Konsequenz: unauffällig / kontrollbedürftig / akuter Handlungsbedarf"],
    normal: "„Sinusrhythmus, normofrequent, Indifferenztyp, regelrechte Erregungsausbreitung und -rückbildung“", focus: [], field: { label: "Beurteilung", ph: "Zusammenfassung", area: true } },
];

/** Baut aus Formularwerten einen Befundtext */
window.befundText = function (v) {
  const parts = [];
  const r = (x) => (x || "").trim();
  const hr = parseFloat(String(v.frequenz || "").replace(",", "."));
  const head = [r(v.rhythmus), hr ? `Frequenz ${Math.round(hr)}/min` : "", r(v.lagetyp)].filter(Boolean).join(", ");
  if (head) parts.push(head + ".");
  const times = [];
  if (r(v.pq)) times.push(`PQ ${r(v.pq)} ms`);
  if (r(v.qrs)) times.push(`QRS ${r(v.qrs)} ms`);
  if (r(v.qt)) {
    let t = `QT ${r(v.qt)} ms`;
    const qt = parseFloat(v.qt);
    if (qt && hr) { const rr = 60 / hr; t += ` (QTc ${Math.round(qt / Math.cbrt(rr))} ms nach Fridericia, ${Math.round(qt / Math.sqrt(rr))} ms nach Bazett)`; }
    times.push(t);
  }
  if (times.length) parts.push("Zeiten: " + times.join(", ") + ".");
  for (const [k, lab] of [["p", "P"], ["qrsm", "QRS"], ["st", "ST"], ["t", "T"], ["u", "U"]]) if (r(v[k])) parts.push(`${lab}: ${r(v[k])}.`);
  if (r(v.beurteilung)) parts.push("Beurteilung: " + r(v.beurteilung));
  return parts.join(" ");
};
