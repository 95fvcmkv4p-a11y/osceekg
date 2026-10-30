# EKG verstehen

Ein illustrierter, interaktiver Kurs zum 12-Kanal-EKG – statische Website, keine Build-Tools.

## Aufbau

```
index.html              Inhalt aller Kapitel (Texte, Abbildungsrahmen, Quellen)
assets/css/style.css    Skizzen-Stil, Hell/Dunkel
assets/js/ecg-model.js  Dipol-/Vektormodell → 12 Ableitungen
assets/js/common.js     EKG-Papier, SVG-Helfer, Quiz, Navigation
assets/js/rhythms.js    Rhythmusgeneratoren (AV-Blöcke, SVT, VT, Flimmern …)
assets/js/schema.js     festes Befundschema (Kapitel 6 und Fallklinik)
assets/js/ch01.js …     interaktive Abbildungen je Kapitel (ch01–ch15)
assets/js/cases-catalog.js  kuratierte PTB-XL-Fälle (Metadaten, Kernbefunde)
assets/cases/*.js       Signaldaten der Fälle (werden erst beim Öffnen geladen)
```

## Modellhinweis

Die animierten EKG-Kurven werden aus einem vereinfachten Dipolmodell berechnet
(idealisiertes Einthoven-Dreieck, ideale Brustwand-Ableitungsvektoren, gaußförmige Teilvektoren).
Sie dienen dem Verständnis von Mechanismen und sind keine Patientenaufzeichnungen.

## Quellen und Lizenzen

Quellen sind je Kapitel auf der Seite angegeben. Schriften: Google Fonts (SIL Open Font License).
Die echten EKGs der Fallklinik stammen aus PTB-XL (PhysioNet, CC BY 4.0):
Wagner P, Strodthoff N, Bousseljot RD et al. PTB-XL, a large publicly available electrocardiography dataset. Sci Data 2020;7:154.
Die Signale wurden für die Darstellung gefiltert (0,5–100 Hz, nullphasig, 50-Hz-Notch) und auf 250 Hz heruntergetastet.

Lernmaterial – kein Ersatz für klinische Ausbildung, Leitlinien oder ärztliche Beurteilung.
