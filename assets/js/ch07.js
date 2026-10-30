/* Kapitel 7 – Bradykardien & AV-Blöcke */
(function () {
  "use strict";
  const R = () => window.RHYTHMS;
  const ITEMS = {
    sb: { t: "Sinusbradykardie", build: () => R().sinus({ hr: 46 }),
      txt: "<span class='tag'>Sinusbradykardie</span>Sinusrhythmus &lt; 60/min (hier 46/min). Jede P-Welle wird mit normaler PQ-Zeit übergeleitet. Häufig physiologisch (Sportler, Schlaf, hoher Vagotonus); sonst Medikamente (Betablocker, Ivabradin, Digitalis), Hypothyreose, Hypothermie, erhöhter Hirndruck oder ein Sinusknotensyndrom." },
    sa: { t: "SA-Block II°", build: () => R().saBlock(),
      txt: "<span class='tag'>Sinuatrialer Block II° (Typ Mobitz)</span>Ein kompletter P-QRS-T-Komplex fällt aus. Die Pause ist genau doppelt so lang wie das normale PP-Intervall – die Sinusknoten-Erregung entsteht, erreicht den Vorhof aber nicht. Im Oberflächen-EKG nur indirekt erkennbar, da die Sinusknotenaktivität selbst unsichtbar ist (Kapitel 1). Ein Sinusarrest hätte dagegen eine Pause ohne festes Verhältnis zum PP-Intervall." },
    avb1: { t: "AV-Block I°", build: () => R().sinus({ hr: 68, pr: 280 }),
      txt: "<span class='tag'>AV-Block I°</span>PQ-Zeit konstant &gt; 200 ms (hier 280 ms), jede P-Welle wird übergeleitet – eigentlich eine Leitungsverzögerung, kein Block. Meist im AV-Knoten. Für sich genommen meist harmlos; bei sehr langer PQ-Zeit (&gt; 300 ms) können Symptome durch die gestörte AV-Synchronie entstehen." },
    wb: { t: "AV-Block II° Wenckebach", build: () => R().wenckebach(),
      txt: "<span class='tag'>AV-Block II° Typ Wenckebach (Mobitz I)</span>Die PQ-Zeit wird von Schlag zu Schlag länger, bis eine P-Welle nicht übergeleitet wird; danach beginnt der Zyklus mit kurzer PQ-Zeit neu (hier 4:3). Typisch: Die längste Pause ist kürzer als zwei PP-Intervalle, und die PQ-Zeit nach der Pause ist die kürzeste. Fast immer im AV-Knoten lokalisiert, oft vagal bedingt (nachts, Sportler); meist gutartig." },
    mb: { t: "AV-Block II° Mobitz", build: () => R().mobitz2(),
      txt: "<span class='tag'>AV-Block II° Typ Mobitz (Mobitz II)</span>Konstante PQ-Zeit, dann plötzlich eine nicht übergeleitete P-Welle. Der Block liegt meist <b>unterhalb des AV-Knotens</b> (His-Purkinje-System), oft mit Schenkelblock (hier RSB). Gefahr des Übergangs in einen kompletten AV-Block mit langsamem, unzuverlässigem Ersatzrhythmus → nach ESC 2021 Schrittmacherindikation, unabhängig von Symptomen." },
    b21: { t: "AV-Block 2:1", build: () => R().block21(),
      txt: "<span class='tag'>AV-Block II° mit 2:1-Überleitung</span>Jede zweite P-Welle wird blockiert. Ob Wenckebach oder Mobitz, lässt sich aus einem 2:1-Block nicht ablesen – es gibt keine zwei aufeinanderfolgend übergeleiteten Schläge zum Vergleich der PQ-Zeit. Hinweise auf eine infranodale Lage: breiter QRS, Verschlechterung unter Belastung oder Atropin. Achtung: Die blockierte P-Welle versteckt sich oft in der T-Welle." },
    avb3v: { t: "AV-Block III° (ventrikulärer Ersatz)", build: () => R().avb3({ escape: "vent" }),
      txt: "<span class='tag'>AV-Block III° mit ventrikulärem Ersatzrhythmus</span>Keine Erregung erreicht die Kammern: Vorhöfe (hier 85/min) und Kammern (hier 36/min) schlagen unabhängig – <b>AV-Dissoziation</b> mit höherer Vorhof- als Kammerfrequenz. Breite Kammerkomplexe sprechen für einen Ersatzrhythmus aus dem Ventrikel (meist 20–40/min) und eine infranodale Blockade. Notfall: Gefahr von Asystolie und Adams-Stokes-Anfällen." },
    avb3j: { t: "AV-Block III° (junktionaler Ersatz)", build: () => R().avb3({ escape: "junc", vent: 48, atrial: 90 }),
      txt: "<span class='tag'>AV-Block III° mit junktionalem Ersatzrhythmus</span>AV-Dissoziation wie oben, aber schmale Kammerkomplexe mit 40–60/min: Das Ersatzzentrum liegt im AV-Knoten/His-Bündel, die Kammern werden regulär erregt. Häufiger bei Blockierung im AV-Knoten (z. B. Hinterwandinfarkt, Medikamente) und stabiler als der ventrikuläre Ersatzrhythmus." },
  };
  ITEMS.avb3j.build = () => { const r = window.RHYTHMS.avb3({ escape: "junc", vent: 48, atrial: 90 }); r.ladder.forEach((e) => { if (e.origin) e.origin = "junc"; }); return r; };

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("fig-7a");
    if (root) U.rhythmFigure(root, ITEMS, { leads: ["II", "V1"] });
  });

  U.quizzes({ kap7: [
    { q: "Die PQ-Zeit wird von Schlag zu Schlag länger, dann fällt ein QRS aus. Welche Diagnose?", a: ["AV-Block I°", "AV-Block II° Typ Wenckebach", "AV-Block II° Typ Mobitz", "SA-Block II°"], c: 1, e: "Zunehmende PQ-Verlängerung bis zur Blockierung ist das Kennzeichen des Wenckebach-Blocks (Mobitz I), meist im AV-Knoten lokalisiert." },
    { q: "Warum ist ein AV-Block II° Typ Mobitz gefährlicher als ein Wenckebach-Block?", a: ["Weil die Frequenz immer unter 30/min liegt", "Weil er meist infranodal liegt und plötzlich in einen kompletten Block mit unzuverlässigem Ersatzrhythmus übergehen kann", "Weil er immer mit Vorhofflimmern einhergeht", "Weil er nur bei Infarkten auftritt"], c: 1, e: "Der Mobitz-Block liegt meist im His-Purkinje-System. Fällt die Leitung dort ganz aus, übernimmt nur ein langsames ventrikuläres Ersatzzentrum. Deshalb besteht eine Schrittmacherindikation auch ohne Symptome (ESC 2021)." },
    { q: "Ein EKG zeigt P-Wellen mit 80/min und breite QRS-Komplexe mit 35/min ohne festen Bezug zueinander. Was liegt vor?", a: ["Sinusbradykardie", "AV-Block II° 2:1", "AV-Block III° mit ventrikulärem Ersatzrhythmus", "Vorhofflimmern mit langsamer Überleitung"], c: 2, e: "AV-Dissoziation mit Vorhoffrequenz &gt; Kammerfrequenz und breitem Ersatzrhythmus um 35/min = kompletter AV-Block mit ventrikulärem Ersatzzentrum." },
    { q: "Was ist beim 2:1-AV-Block diagnostisch nicht möglich?", a: ["Die Vorhoffrequenz bestimmen", "Zwischen Typ Wenckebach und Typ Mobitz sicher zu unterscheiden", "Die Kammerfrequenz bestimmen", "Die blockierten P-Wellen zu erkennen"], c: 1, e: "Weil nie zwei P-Wellen hintereinander übergeleitet werden, kann man keine PQ-Verlängerung beobachten. Die Zuordnung gelingt nur indirekt (QRS-Breite, Verhalten unter Belastung/Atropin, längere Registrierung)." },
    { q: "Eine Pause ist exakt doppelt so lang wie das normale PP-Intervall, und ein kompletter P-QRS-T-Komplex fehlt. Was ist am wahrscheinlichsten?", a: ["SA-Block II°", "AV-Block II° Mobitz", "Supraventrikuläre Extrasystole", "AV-Block I°"], c: 0, e: "Beim SA-Block fällt die Vorhoferregung aus, deshalb fehlt auch die P-Welle. Beim AV-Block wäre die P-Welle sichtbar, nur der QRS fehlt." },
  ] });
})();
