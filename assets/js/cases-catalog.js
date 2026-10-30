/* Kuratierte Fälle aus PTB-XL 1.0.3 (PhysioNet), CC BY 4.0 – Wagner et al., Sci Data 2020;7:154 */
window.EKG_CASES = [
{
"n": 1,
"id": 3522,
"cat": "Normal",
"title": "Normales EKG",
"kern": [
"Sinusrhythmus um 55/min – nach der klassischen Grenze von 60/min formal leicht bradykard",
"Indifferenztyp (I, II, aVF positiv)",
"PQ, QRS und QT unauffällig; schmaler QRS",
"Regelrechte R-Progression, T-Wellen konkordant"
],
"hint": "Gutes Referenz-EKG: Präge dir Form und Größe von P, QRS und T in jeder Ableitung ein.",
"age": 54,
"sex": "w",
"codes": [
{
"code": "NORM",
"lik": 100.0,
"desc": "normal ECG"
}
],
"report": "trace only requested.",
"stadium": null,
"fs": 250
},
{
"n": 2,
"id": 16993,
"cat": "Normal",
"title": "Normalbefund eines jungen Mannes",
"kern": [
"Sinusrhythmus um 60/min",
"Hohe, breitbasige T-Wellen in V2–V3 und hohe R-Amplituden in V3–V5",
"Keine ST-Strecken-Abweichung, keine pathologischen Q-Zacken"
],
"hint": "Hohe T-Wellen und Amplituden sind bei jungen, schlanken Männern häufig normal. Eine Hyperkaliämie hätte eher schmalbasige, spitze, „zeltförmige“ T-Wellen.",
"age": 38,
"sex": "m",
"codes": [
{
"code": "NORM",
"lik": 100.0,
"desc": "normal ECG"
}
],
"report": "trace only requested.",
"stadium": null,
"fs": 250
},
{
"n": 3,
"id": 4059,
"cat": "Normal",
"title": "ST-Hebung V2–V3 als Normvariante",
"kern": [
"Sinusbradykardie um 52/min",
"Konkave ST-Hebung in V2–V3 mit positiver T-Welle; T in V1 negativ",
"Keine reziproken ST-Senkungen, keine Q-Zacken"
],
"hint": "Laut 4. universeller Infarktdefinition gelten in V2–V3 erst ≥ 2,5 mm (Männer < 40 J.), ≥ 2 mm (Männer ≥ 40 J.) bzw. ≥ 1,5 mm (Frauen) als ischämieverdächtig. Klinik und Verlauf entscheiden immer mit.",
"age": 37,
"sex": "m",
"codes": [
{
"code": "NORM",
"lik": 50.0,
"desc": "normal ECG"
},
{
"code": "STE_",
"lik": 0.0,
"desc": "non-specific ST elevation"
},
{
"code": "SBRAD",
"lik": 0.0,
"desc": "sinus bradycardia"
}
],
"report": "sinusbradykardie llt st-hebung v2,3 neg. t in v1 wahrscheinlich normales ekg",
"stadium": null,
"fs": 250
},
{
"n": 4,
"id": 9108,
"cat": "Bradykardie & AV-Block",
"title": "AV-Block I° mit peripherer Niedervoltage",
"kern": [
"Sinusrhythmus um 55/min",
"PQ-Zeit konstant verlängert (> 200 ms), jede P-Welle wird übergeleitet",
"Kleine QRS-Amplituden in allen Extremitätenableitungen (periphere Niedervoltage)"
],
"hint": "AV-Block I° ist eigentlich eine Leitungsverzögerung, kein Block: Keine Erregung geht verloren.",
"age": 83,
"sex": "m",
"codes": [
{
"code": "1AVB",
"lik": 100.0,
"desc": "first degree AV block"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinusrhythmus a-v block i lagetyp normal periphere niederspannung",
"stadium": null,
"fs": 250
},
{
"n": 5,
"id": 959,
"cat": "Bradykardie & AV-Block",
"title": "AV-Block III° mit Kammerersatzrhythmus",
"kern": [
"P-Wellen regelmäßig (laut Befund ≈ 98/min)",
"QRS-Komplexe regelmäßig und langsam (≈ 40/min) ohne festen Bezug zu den P-Wellen – AV-Dissoziation",
"Inkompletter Rechtsschenkelblock"
],
"hint": "Trick: Markiere mit dem Messzirkel den P-P-Abstand und „wandere“ ihn durch den Streifen – P-Wellen tauchen auch in T-Wellen und QRS-Komplexen auf.",
"age": 88,
"sex": "w",
"codes": [
{
"code": "ASMI",
"lik": 15.0,
"desc": "anteroseptal myocardial infarction"
},
{
"code": "IRBBB",
"lik": 100.0,
"desc": "incomplete right bundle branch block"
},
{
"code": "3AVB",
"lik": 100.0,
"desc": "third degree AV block"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinus rhythm, 98/min. with complete heart block and ventricular escape rate of 40/min. incomplete right bundle branch block. in view of syncope, permanent pacing should be considered.",
"stadium": "unknown",
"fs": 250
},
{
"n": 6,
"id": 18101,
"cat": "Tachykardie",
"title": "Vorhoftachykardie mit 2:1-Überleitung und RSB",
"kern": [
"Regelmäßige Kammerfrequenz ≈ 115/min",
"Laut Befund ektope Vorhoftachykardie, jede zweite Vorhoferregung wird übergeleitet",
"Kompletter Rechtsschenkelblock, überdrehter Linkstyp"
],
"hint": "Fortgeschritten: Bei regelmäßiger Tachykardie immer nach versteckten P-Wellen in der T-Welle suchen (2:1?).",
"age": 75,
"sex": "m",
"codes": [
{
"code": "CRBBB",
"lik": 100.0,
"desc": "complete right bundle branch block"
},
{
"code": "2AVB",
"lik": 100.0,
"desc": "second degree AV block"
}
],
"report": "rhythm is atrial tachycardia with 2:1 av block and rapid ventricular response. left axis deviation. right bundle branch block.",
"stadium": null,
"fs": 250
},
{
"n": 7,
"id": 8215,
"cat": "Tachykardie",
"title": "Vorhofflimmern, normofrequent",
"kern": [
"Absolute Arrhythmie: RR-Abstände völlig unregelmäßig",
"Keine P-Wellen, feine Flimmerwellen in der Grundlinie",
"Schmaler QRS, Kammerfrequenz ≈ 80/min, Linkstyp"
],
"hint": "Unregelmäßig + keine P-Wellen = Vorhofflimmern, bis das Gegenteil bewiesen ist.",
"age": 71,
"sex": "w",
"codes": [
{
"code": "AFIB",
"lik": 100.0,
"desc": "atrial fibrillation"
}
],
"report": "normokardes vorhofflimmern                              linkstyp",
"stadium": null,
"fs": 250
},
{
"n": 8,
"id": 23,
"cat": "Tachykardie",
"title": "Vorhofflattern mit 2:1-Überleitung",
"kern": [
"Regelmäßige Schmalkomplex-Tachykardie ≈ 128/min",
"Sägezahnartige Flatterwellen in II, III, aVF",
"Laut Befund 2:1-Überleitung unter Medikation (Frequenz von 140 auf 128/min gesunken)"
],
"hint": "Eine regelmäßige Kammerfrequenz um 150/min (hier durch Medikation etwas niedriger) sollte immer an Vorhofflattern 2:1 denken lassen.",
"age": 56,
"sex": "m",
"codes": [
{
"code": "AFLT",
"lik": 100.0,
"desc": "atrial flutter"
}
],
"report": "2:1 Überleitung bei vorhofflattern,jetzt unter 3x1  cordichin + 1x1 novodigal 0,2 etwas langsamer hf von 140 auf 128,sonst unverÄndert.",
"stadium": null,
"fs": 250
},
{
"n": 9,
"id": 8683,
"cat": "Tachykardie",
"title": "Vorhofflattern 2:1 und alter Vorderwandinfarkt",
"kern": [
"Regelmäßige Schmalkomplex-Tachykardie ≈ 155/min",
"Laut Befund Vorhofflattern mit 2:1-Überleitung",
"QS-Komplexe in V2–V4 (alter anteroseptaler Infarkt laut Befund)"
],
"hint": "Zwei Befunde in einem EKG: Nach der Rhythmusdiagnose die Systematik nicht abbrechen.",
"age": 78,
"sex": "w",
"codes": [
{
"code": "ASMI",
"lik": 100.0,
"desc": "anteroseptal myocardial infarction"
},
{
"code": "AFLT",
"lik": 0.0,
"desc": "atrial flutter"
}
],
"report": "rhythm is atrial flutter with 2:1 av block and rapid ventricular response. qs complexes in v2,3,4 consistent with old    anterior myocardial infarction.",
"stadium": "Stadium III",
"fs": 250
},
{
"n": 10,
"id": 14286,
"cat": "Tachykardie",
"title": "Supraventrikuläre Tachykardie bei junger Frau",
"kern": [
"Regelmäßige Schmalkomplex-Tachykardie ≈ 200/min",
"Keine sicher abgrenzbaren P-Wellen",
"Unspezifische ST-T-Veränderungen"
],
"hint": "Bei regelmäßiger Schmalkomplex-Tachykardie ohne sichtbare P-Wellen ist eine AV-Knoten-Reentry-Tachykardie häufig – die Einordnung folgt in Kapitel 9.",
"age": 29,
"sex": "w",
"codes": [
{
"code": "PSVT",
"lik": 100.0,
"desc": "paroxysmal supraventricular tachycardia"
},
{
"code": "NST_",
"lik": 0.0,
"desc": "non-specific ST changes"
},
{
"code": "SVTAC",
"lik": 0.0,
"desc": "supraventricular tachycardia"
}
],
"report": "a rapid, regular supraventricular tachycardia is present. p waves are not evident. non-specific st-t wave changes.",
"stadium": null,
"fs": 250
},
{
"n": 11,
"id": 7889,
"cat": "Tachykardie",
"title": "Regelmäßige Schmalkomplex-Tachykardie mit ST-Senkungen",
"kern": [
"Regelmäßige Schmalkomplex-Tachykardie ≈ 160/min, Linkstyp",
"ST-Senkungen in I, II und V3–V4 (laut Befund)",
"Befund: AV-Tachykardie, DD supraventrikuläre Tachykardie"
],
"hint": "ST-Senkungen während einer Tachykardie sind häufig frequenzbedingt und nicht automatisch ein Ischämienachweis.",
"age": 74,
"sex": "w",
"codes": [
{
"code": "PSVT",
"lik": 100.0,
"desc": "paroxysmal supraventricular tachycardia"
}
],
"report": "av-tachykardie (dd:supraventr. tachykardie) linkstyp st-senkung in i,ii,v3-4 t hoch in v2-4",
"stadium": null,
"fs": 250
},
{
"n": 12,
"id": 11889,
"cat": "Tachykardie",
"title": "Präexzitation (WPW-Muster)",
"kern": [
"Sinusrhythmus um 60/min",
"Kurze PQ-Zeit, träger QRS-Beginn (Delta-Welle), dadurch verbreiterter QRS",
"Sekundäre Repolarisationsstörungen"
],
"hint": "Die automatische Auswertung hatte hier einen Schenkelblock vermutet – die Delta-Welle mit kurzer PQ-Zeit unterscheidet beides.",
"age": 55,
"sex": "m",
"codes": [
{
"code": "WPW",
"lik": 100.0,
"desc": "Wolf-Parkinson-White syndrome"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinusrytm vÄnstersidigt skÄnkelblock",
"stadium": null,
"fs": 250
},
{
"n": 13,
"id": 14501,
"cat": "Extrasystolen",
"title": "Ventrikuläre Extrasystolen im Bigeminus",
"kern": [
"Sinusrhythmus, jeder zweite Schlag ist eine vorzeitige, breite, deformierte Extrasystole",
"Die Extrasystolen haben keine vorangehende P-Welle; T diskordant",
"Sinusschläge sonst unauffällig"
],
"hint": "Bigeminus = regelmäßiger Wechsel Normalschlag – Extrasystole.",
"age": 59,
"sex": "w",
"codes": [
{
"code": "NORM",
"lik": 80.0,
"desc": "normal ECG"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
},
{
"code": "BIGU",
"lik": 0.0,
"desc": "bigeminal pattern (unknown origin, SV or Ventricular)"
}
],
"report": "premature ventricular contraction(s), bigeminy. sinus rhythm. otherwise normal ecg.",
"stadium": null,
"fs": 250
},
{
"n": 14,
"id": 9266,
"cat": "Extrasystolen",
"title": "Monomorphe ventrikuläre Extrasystolen",
"kern": [
"Sinustachykardie",
"Gehäufte, gleichförmige ventrikuläre Extrasystolen (laut Befund > 5/min, Quadrigeminus)",
"Laut Befund ST-Hebung V1–V3"
],
"hint": "Gleichförmig (monomorph) heißt: wahrscheinlich ein einziger Ursprungsort.",
"age": 62,
"sex": "m",
"codes": [
{
"code": "NORM",
"lik": 15.0,
"desc": "normal ECG"
},
{
"code": "PVC",
"lik": 100.0,
"desc": "ventricular premature complex"
}
],
"report": "linkslagetyp ventrikulÄre extrasystolen, uniform >5/min. quadrigeminie sinus-tachykardie st-hebung v1-3 pathologisches ekg",
"stadium": null,
"fs": 250
},
{
"n": 15,
"id": 3990,
"cat": "Schrittmacher",
"title": "Schrittmacher-EKG, ventrikulär stimuliert",
"kern": [
"Regelmäßiger stimulierter Rhythmus ≈ 70/min",
"Schrittmacher-Spikes vor breiten QRS-Komplexen",
"Breite, linksschenkelblockartige Komplexe mit überdrehtem Linkstyp – typisch für Stimulation in der rechtsventrikulären Spitze"
],
"hint": "Bei rechtsventrikulärer Stimulation ist der QRS breit wie beim LSB; ST-T sind sekundär verändert und für die Ischämiediagnostik kaum verwertbar.",
"age": 76,
"sex": "m",
"codes": [
{
"code": "PACE",
"lik": 100.0,
"desc": "normal functioning artificial pacemaker"
}
],
"report": "pacemaker spikes noted. a regular paced rhythm is present. apparently normal pacemaker function. abnormal nature of complexes obscures further    interpretation.",
"stadium": null,
"fs": 500
},
{
"n": 16,
"id": 8504,
"cat": "Schenkelblock",
"title": "Kompletter Rechtsschenkelblock",
"kern": [
"Sinusrhythmus um 67/min",
"QRS ≥ 120 ms mit rSR′ (M-Form) in V1",
"Breite, plumpe S-Zacke in I und V6"
],
"hint": "Der rechte Ventrikel wird zuletzt erregt: Der späte Vektor zeigt nach rechts vorn – positiv in V1, negativ in I und V6.",
"age": 68,
"sex": "m",
"codes": [
{
"code": "CRBBB",
"lik": 100.0,
"desc": "complete right bundle branch block"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinusrhythmus lagetyp normal rechtsschenkelblock vorhofsueberlastung links, moeglich pathologisch",
"stadium": null,
"fs": 250
},
{
"n": 17,
"id": 946,
"cat": "Schenkelblock",
"title": "Kompletter Linksschenkelblock",
"kern": [
"Sinusrhythmus um 80/min",
"QRS deutlich verbreitert; tiefe QS-/rS-Komplexe in V1–V3",
"Breite, gekerbte R-Zacken in I und aVL, kein septales q",
"Diskordante ST-T-Veränderungen (ST-Hebung in V1–V3, Senkung in I/aVL)"
],
"hint": "Die ST-Hebungen in V1–V3 sind beim LSB sekundär (diskordant). Für die Infarktdiagnostik gibt es eigene Kriterien (Sgarbossa, Kapitel 11).",
"age": 74,
"sex": "w",
"codes": [
{
"code": "CLBBB",
"lik": 100.0,
"desc": "complete left bundle branch block"
}
],
"report": "trace only requested.",
"stadium": null,
"fs": 250
},
{
"n": 18,
"id": 1564,
"cat": "Schenkelblock",
"title": "Linksschenkelblock",
"kern": [
"Sinusrhythmus um 52/min",
"Breite QRS-Komplexe, tiefe QS in V1–V3, breite monophasische R in V5–V6",
"Diskordante Repolarisation"
],
"hint": "Vergleiche mit dem vorigen Fall: Das Grundmuster ist identisch, die Amplituden unterscheiden sich stark.",
"age": 76,
"sex": "m",
"codes": [
{
"code": "CLBBB",
"lik": 100.0,
"desc": "complete left bundle branch block"
}
],
"report": "trace only requested.",
"stadium": null,
"fs": 250
},
{
"n": 19,
"id": 4444,
"cat": "Schenkelblock",
"title": "Linksanteriorer Hemiblock",
"kern": [
"Sinusrhythmus um 62/min",
"Überdrehter Linkstyp (≈ −45°)",
"qR in aVL, rS mit tiefem S in II, III, aVF; QRS schmal"
],
"hint": "Kriterien u. a. nach AHA/ACCF/HRS (Teil III): Achse −45° bis −90°, qR in aVL, QRS < 120 ms.",
"age": 57,
"sex": "m",
"codes": [
{
"code": "LAFB",
"lik": 100.0,
"desc": "left anterior fascicular block"
}
],
"report": "trace only requested.",
"stadium": null,
"fs": 250
},
{
"n": 20,
"id": 7419,
"cat": "Schenkelblock",
"title": "Rechtstyp – als LPH befundet",
"kern": [
"Sinusrhythmus um 82/min",
"Rechtstyp (≈ +100°): rS in I und aVL, hohe R in II, III, aVF",
"QRS schmal; PTB-XL-Befund: linksposteriorer Hemiblock"
],
"hint": "Kritisch betrachten: Die Patientin ist 18 Jahre alt. Bei jungen, schlanken Menschen ist ein Steil- oder Rechtstyp häufig normal. Ein LPH ist eine Ausschlussdiagnose (u. a. Rechtsherzbelastung, schlanker Habitus).",
"age": 18,
"sex": "w",
"codes": [
{
"code": "LPFB",
"lik": 100.0,
"desc": "left posterior fascicular block"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinusrhythmus rechtstyp linksposteriorer hemiblock",
"stadium": null,
"fs": 250
},
{
"n": 21,
"id": 19309,
"cat": "Ischämie & Infarkt",
"title": "Akuter inferoposteriorer Infarkt",
"kern": [
"Sinusrhythmus um 77/min",
"ST-Hebung in III und aVF",
"Reziproke ST-Senkung in I und aVL",
"ST-Senkung in V2–V3 als Hinweis auf posteriore Beteiligung"
],
"hint": "Spiegelbildliche Senkungen stützen eine echte Infarkt-ST-Hebung. ST-Senkung in V2–V3 → an Hinterwand denken (V7–V9 ableiten).",
"age": 88,
"sex": "w",
"codes": [
{
"code": "IPMI",
"lik": 100.0,
"desc": "inferoposterior myocardial infarction"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinusrhythmus llt rechts inferiorer, posteriorer infarkt st-hebung iii,avf st-senkung i,avl, v2,v3  pathologisches ekg",
"stadium": "unknown",
"fs": 250
},
{
"n": 22,
"id": 1812,
"cat": "Ischämie & Infarkt",
"title": "Tiefe T-Negativierungen anterior",
"kern": [
"Sinusrhythmus um 63/min",
"Tiefe, symmetrische T-Negativierungen in V2–V6",
"Flache T-Wellen in den Extremitätenableitungen",
"PTB-XL: ischämisch bedingt (anteroseptal/anterolateral)"
],
"hint": "Tiefe, symmetrische T-Negativierungen anterior brauchen eine klinische Einordnung: Ischämie (inkl. Wellens-Muster nach Schmerzepisode), aber auch z. B. Takotsubo oder zerebrale Ursachen.",
"age": 80,
"sex": "w",
"codes": [
{
"code": "INJAS",
"lik": 100.0,
"desc": "subendocardial injury in anteroseptal leads"
},
{
"code": "INJAL",
"lik": 100.0,
"desc": "subendocardial injury in anterolateral leads"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinus rhythm. t waves are flat in limb leads and inverted in v2-6. findings are likely to be due to ischaemic heart    disease. they may represent subendocardial infarction of uncertain age. it is difficult to determine whether any changes are recent. Edit: INJAS, INJAL, Sokolow 2,5(INJAS, INJAL)",
"stadium": "unknown",
"fs": 250
},
{
"n": 23,
"id": 6764,
"cat": "Ischämie & Infarkt",
"title": "Alter posterolateraler Infarkt",
"kern": [
"Sinusrhythmus um 72/min",
"Hohe R-Zacken in V1–V2 mit aufrechten T-Wellen (Spiegelbild einer posterioren Q-Zacke)",
"Laut Befund Q-Zacken in I, aVL, V5–V6; Zustand nach Infarkt vor 7 Jahren"
],
"hint": "Ein hohes R in V1–V2 hat eine kurze Differenzialdiagnose: posteriorer Infarkt, Rechtshypertrophie, RSB, WPW, Normvariante.",
"age": 64,
"sex": "m",
"codes": [
{
"code": "ALMI",
"lik": 100.0,
"desc": "anterolateral myocardial infarction"
},
{
"code": "QWAVE",
"lik": 0.0,
"desc": "Q waves present"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinusrhythmus lagetyp normal st.n. posterolateroapikakem infarkt vor 7 jahren: q in i,avl,v5-6, hohes r in v1-2",
"stadium": "Stadium III",
"fs": 250
},
{
"n": 24,
"id": 234,
"cat": "Ischämie & Infarkt",
"title": "Vorderwandaneurysma mit persistierender ST-Hebung",
"kern": [
"Sinusrhythmus um 82/min, AV-Block I°",
"QS-Komplexe in V1–V4 mit anhaltender ST-Hebung",
"Laut Befund zusätzlich alter inferiorer Infarkt"
],
"hint": "ST-Hebungen, die Wochen nach einem Vorderwandinfarkt mit QS-Komplexen bestehen bleiben, sprechen für ein Aneurysma. Ohne Vor-EKG und Klinik ist die Abgrenzung zum akuten Infarkt schwierig.",
"age": 78,
"sex": "m",
"codes": [
{
"code": "ASMI",
"lik": 100.0,
"desc": "anteroseptal myocardial infarction"
},
{
"code": "IMI",
"lik": 15.0,
"desc": "inferior myocardial infarction"
},
{
"code": "ANEUR",
"lik": 100.0,
"desc": "ST-T changes compatible with ventricular aneurysm"
},
{
"code": "1AVB",
"lik": 100.0,
"desc": "first degree AV block"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinusrhythmus a-v block i steillage    anteriorer infarkt  mit vorderwandaneurysma    inferiorer infarkt pathologische repolarisation",
"stadium": "unknown",
"fs": 250
},
{
"n": 25,
"id": 8344,
"cat": "Ischämie & Infarkt",
"title": "Alter Hinterwandinfarkt",
"kern": [
"Sinusrhythmus um 76/min",
"Q-Zacken in II, III, aVF",
"Sonst keine akuten ST-Veränderungen"
],
"hint": "Eine isolierte Q-Zacke in III kann normal sein; erst Q in mehreren inferioren Ableitungen spricht für einen Infarkt.",
"age": 42,
"sex": "m",
"codes": [
{
"code": "IMI",
"lik": 80.0,
"desc": "inferior myocardial infarction"
},
{
"code": "QWAVE",
"lik": 0.0,
"desc": "Q waves present"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinus rhythm. q waves in ii, iii, avf consistent with old inferior    myocardial infarction. otherwise no definite pathology.",
"stadium": "Stadium III",
"fs": 250
},
{
"n": 26,
"id": 534,
"cat": "Hypertrophie",
"title": "Linksventrikuläre Hypertrophie mit Repolarisationsstörung",
"kern": [
"Sinusrhythmus um 53/min",
"Hohe R-Amplituden links präkordial und tiefe S in V1–V2",
"Deszendierende ST-Senkung mit negativem T in I, aVL und V4–V6 („Strain“)"
],
"hint": "Spannungskriterien allein sind wenig sensitiv; die typische Repolarisationsstörung erhöht die Aussagekraft (Kapitel 12).",
"age": 80,
"sex": "w",
"codes": [
{
"code": "ISC_",
"lik": 100.0,
"desc": ""
},
{
"code": "LVH",
"lik": 100.0,
"desc": "left ventricular hypertrophy"
}
],
"report": "sinus arytmi mÅttliga amplitudkrit. fÖr vÄnster kammarkhypertrofi st-t sÄnkning, sÅsom vid    anterolateral ischemi eller vÄnster belastning t-fÖrÄndring, sÅsom vid    anterior myokardaffektion    inferolateral myokardaffektion",
"stadium": null,
"fs": 250
},
{
"n": 27,
"id": 2417,
"cat": "Hypertrophie",
"title": "Rechtsventrikuläre Hypertrophie",
"kern": [
"Sinusrhythmus um 90/min",
"Hohe R-Zacke in V1",
"T-Negativierungen rechtspräkordial (V1–V3) und inferior",
"Laut Befund medikamentös verlängerte QT-Zeit"
],
"hint": "R in V1 größer als S ist beim Erwachsenen ungewöhnlich – an Rechtsherzbelastung denken.",
"age": 78,
"sex": "w",
"codes": [
{
"code": "RVH",
"lik": 100.0,
"desc": "right ventricular hypertrophy"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinusrhythmus lagetyp normal kammerhypertrophie rvh t neg in v1-v6,ii,iii,avf qt-zeit verlÄngert (medikamente) path. ekg",
"stadium": null,
"fs": 250
},
{
"n": 28,
"id": 5955,
"cat": "Hypertrophie",
"title": "Rechtsatriale Belastung (P dextroatriale)",
"kern": [
"Sinustachykardie ≈ 103/min",
"Hohe, spitze P-Wellen in II, III, aVF",
"QRS sonst unauffällig"
],
"hint": "P dextroatriale (P pulmonale): spitzes, hohes P inferior; klassisch ≥ 0,25 mV in II.",
"age": 72,
"sex": "m",
"codes": [
{
"code": "RAO/RAE",
"lik": 100.0,
"desc": "right atrial overload/enlargement"
},
{
"code": "STACH",
"lik": 0.0,
"desc": "sinus tachycardia"
}
],
"report": "sinustachykardie p-dextrocardiale lagetyp normal Edit: RAO, (RAO)",
"stadium": null,
"fs": 250
},
{
"n": 29,
"id": 2886,
"cat": "Medikamente & Elektrolyte",
"title": "Digitaliseffekt bei Vorhofflimmern",
"kern": [
"Vorhofflimmern, normofrequent",
"Muldenförmige ST-Senkungen in I, II, aVL und V4–V6",
"ST-Hebung in aVR"
],
"hint": "Die muldenförmige ST-Senkung zeigt eine Digitaliswirkung an, keine Vergiftung. Toxizität zeigt sich eher als Rhythmusstörung.",
"age": 82,
"sex": "w",
"codes": [
{
"code": "DIG",
"lik": 100.0,
"desc": "digitalis-effect"
},
{
"code": "STE_",
"lik": 0.0,
"desc": "non-specific ST elevation"
},
{
"code": "AFIB",
"lik": 0.0,
"desc": "atrial fibrillation"
}
],
"report": "vorhofflimmern normocard llt st-hebung in avr   st-senkung in i,ii,avl,v4-v6 digitalisveraenderung pathologisches ekg",
"stadium": null,
"fs": 250
},
{
"n": 30,
"id": 9894,
"cat": "Medikamente & Elektrolyte",
"title": "QT-Verlängerung",
"kern": [
"Sinusrhythmus um 90/min",
"Laut Befund verlängerte QT-Zeit, unspezifische ST-Veränderungen"
],
"hint": "Miss selbst: QT in II oder V5 vom QRS-Beginn bis zum T-Ende, dann frequenzkorrigieren (Kapitel 4).",
"age": 88,
"sex": "w",
"codes": [
{
"code": "LNGQT",
"lik": 100.0,
"desc": "long QT-interval"
},
{
"code": "SR",
"lik": 0.0,
"desc": "sinus rhythm"
}
],
"report": "sinusrytm ospecifik st-fÖrÄndring qt fÖrlÄngd",
"stadium": null,
"fs": 250
}
];
