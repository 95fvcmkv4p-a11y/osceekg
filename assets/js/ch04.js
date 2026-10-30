/* Kapitel 4 – Wellen, Strecken, Zeiten */
(function () {
  "use strict";

  // ======================================================================
  // 4A  Ausmess-Übung mit Messzirkel
  // ======================================================================
  function initFig4A() {
    const root = document.getElementById("fig-4a");
    if (!root) return;
    const canvas = root.querySelector("canvas");
    const out = root.querySelector(".cal-out");
    const res = root.querySelector(".result");
    const form = root.querySelector("form");
    let task = null, sig = null, cal = null, geo = null, show = false;
    const DUR = 6;

    function newTask(kind) {
      const r = (a, b) => a + Math.random() * (b - a);
      let hr = Math.round(r(52, 105)), pr = Math.round(r(130, 190)), qt60 = r(370, 430), preset = {};
      if (kind === "avb") pr = Math.round(r(230, 300));
      if (kind === "qt") qt60 = r(470, 540);
      if (kind === "wide") preset = Math.random() < 0.5 ? EKG.PRESETS.rbbb() : EKG.PRESETS.lbbb();
      if (kind === "normal") { hr = 72; pr = 160; qt60 = 400; }
      const rr = 60000 / hr, qt = Math.round(EKG.qtForRR(rr, qt60));
      const beat = EKG.makeBeat(Object.assign({}, preset, { pr, qt }));
      const sch = []; for (let t0 = 150 - 2 * rr; t0 < DUR * 1000 + 300; t0 += rr) sch.push({ t0, beat });
      sig = U.model12(sch, { fs: 500, duration: DUR * 1000, leads: ["II", "V5"] });
      task = { hr, pr: beat.qrsOn, qrs: Math.round(beat.qrsOff - beat.qrsOn), qt, rr, beat, t0: sch.find((s) => s.t0 >= 0).t0 };
      show = false; cal = null; res.innerHTML = ""; form.reset(); out.textContent = "";
      cv.redraw();
    }
    const cv = U.canvas(canvas, (w) => U.stripHeight(w, 2, { dur: DUR, rowMm: 30 }), draw);
    function draw(ctx, w, h) {
      if (!sig) return;
      geo = U.drawStrips(ctx, w, h, sig, ["II", "V5"], { dur: DUR, rowMm: 30 });
      if (show) {
        // Lösung einzeichnen (erster vollständiger Schlag)
        const t0 = task.t0, b = task.beat, X = geo.X, top = 2, bot = h - 2;
        const marks = [[t0, "P"], [t0 + b.qrsOn, "QRS"], [t0 + b.qrsOff, "J"], [t0 + b.qrsOn + task.qt, "T-Ende"]];
        ctx.save(); ctx.strokeStyle = U.cssVar("--accent"); ctx.setLineDash([4, 3]); ctx.lineWidth = 1.3;
        for (const [t, lab] of marks) { ctx.beginPath(); ctx.moveTo(X(t), top); ctx.lineTo(X(t), bot); ctx.stroke(); U.label(ctx, lab, X(t) + 3, bot - 4, { size: 10.5, color: U.cssVar("--accent"), bg: U.cssVar("--ecg-bg") }); }
        ctx.restore();
      }
      if (cal && cal.b) {
        ctx.save(); ctx.strokeStyle = U.cssVar("--accent"); ctx.lineWidth = 1.5;
        for (const p of [cal.a, cal.b]) { ctx.beginPath(); ctx.moveTo(p.x, 2); ctx.lineTo(p.x, h - 2); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(cal.a.x, cal.a.y); ctx.lineTo(cal.b.x, cal.a.y); ctx.stroke(); ctx.restore();
      }
    }
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    canvas.addEventListener("pointerdown", (e) => { cal = { a: pos(e), b: pos(e), drag: true }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => {
      if (!cal || !cal.drag) return; cal.b = pos(e); cv.redraw();
      const ms = Math.abs(cal.b.x - cal.a.x) / (geo.pxmm * 25) * 1000;
      const mv = -(cal.b.y - cal.a.y) / (geo.pxmm * 10);
      out.innerHTML = `Δt = <b>${Math.round(ms)} ms</b> (${(Math.abs(cal.b.x - cal.a.x) / geo.pxmm).toFixed(1).replace(".", ",")} mm)` + (ms > 300 ? ` → ${Math.round(60000 / ms)}/min` : "") + ` · ΔU = <b>${mv.toFixed(2).replace(".", ",")} mV</b>`;
    });
    canvas.addEventListener("pointerup", () => { if (cal) cal.drag = false; });
    root.querySelector(".do-check").addEventListener("click", () => {
      const f = (n) => parseFloat(String(form.elements[n].value).replace(",", "."));
      const items = [["Frequenz", f("hr"), task.hr, 5, "/min"], ["PQ-Zeit", f("pq"), task.pr, 20, "ms"], ["QRS-Dauer", f("qrs"), task.qrs, 20, "ms"], ["QT-Zeit", f("qt"), task.qt, 30, "ms"]];
      res.innerHTML = items.map(([n, v, t, tol, u]) => {
        const ok = !isNaN(v) && Math.abs(v - t) <= tol;
        return `<li class="${isNaN(v) ? "" : ok ? "ok" : "bad"}"><b>${n}</b>: ${isNaN(v) ? "–" : v + " " + u} · Modellwert ${t} ${u} ${isNaN(v) ? "" : ok ? "✓" : "✗ (Toleranz ± " + tol + " " + u + ")"}</li>`;
      }).join("") + `<li>QTc nach Bazett: ${Math.round(task.qt / Math.sqrt(task.rr / 1000))} ms · nach Fridericia: ${Math.round(task.qt / Math.cbrt(task.rr / 1000))} ms</li>`;
      show = true; cv.redraw();
    });
    U.seg(root.querySelector(".kind"), (v) => newTask(v));
    root.querySelector(".new").addEventListener("click", () => newTask(root.querySelector(".kind [aria-pressed=true]").dataset.v));
    newTask("normal");
  }

  // ======================================================================
  // 4B  QTc-Rechner
  // ======================================================================
  function initQTc() {
    const root = document.getElementById("fig-4b");
    if (!root) return;
    const f = root.querySelector("form"), out = root.querySelector(".qtc-out");
    function calc() {
      const qt = parseFloat(f.qt.value), hr = parseFloat(f.hr.value), sex = f.sex.value;
      if (!(qt > 150 && hr > 20)) { out.innerHTML = "<p class='caption'>QT (ms) und Herzfrequenz eingeben.</p>"; return; }
      const rr = 60 / hr; // s
      const F = {
        "Bazett": qt / Math.sqrt(rr),
        "Fridericia": qt / Math.cbrt(rr),
        "Framingham": qt + 154 * (1 - rr),
        "Hodges": qt + 1.75 * (hr - 60),
      };
      const lim = sex === "w" ? 460 : 450;
      const cls = (v) => v >= 500 ? ["bad", "≥ 500 ms: deutlich verlängert – hohes Torsade-Risiko"] : v >= 480 ? ["bad", "≥ 480 ms: verlängert (ESC: LQTS-Kriterium ohne weitere Befunde)"] : v >= lim ? ["warn", `≥ ${lim} ms: verlängert (AHA/ACCF/HRS)`] : v <= 390 ? ["warn", "≤ 390 ms: kurz (AHA/ACCF/HRS)"] : ["ok", "normal"];
      out.innerHTML = `<table class="data"><thead><tr><th>Formel</th><th>QTc</th><th>Einordnung</th></tr></thead><tbody>` +
        Object.entries(F).map(([k, v]) => { const [c, t] = cls(v); return `<tr class="${c}"><td>${k}</td><td class="mono">${Math.round(v)} ms</td><td>${t}</td></tr>`; }).join("") +
        `</tbody></table><p class="caption">RR = ${Math.round(rr * 1000)} ms. ${hr > 90 || hr < 55 ? "Bei dieser Frequenz weichen die Formeln deutlich voneinander ab – Bazett korrigiert bei Tachykardie zu stark (QTc zu lang) und bei Bradykardie zu wenig." : "Im Bereich um 60/min liegen alle Formeln nah beieinander."}</p>`;
    }
    f.addEventListener("input", calc); calc();
  }

  U.quizzes({ kap4: [
    { q: "Wie viele Millisekunden entspricht ein kleines Kästchen (1 mm) bei 25 mm/s?", a: ["20 ms", "40 ms", "100 ms", "200 ms"], c: 1, e: "1 s / 25 mm = 40 ms pro mm. Ein großes Kästchen (5 mm) entspricht 200 ms. Bei 50 mm/s halbieren sich die Werte." },
    { q: "Zwischen zwei R-Zacken liegen bei 25 mm/s genau 4 große Kästchen. Wie hoch ist die Frequenz?", a: ["60/min", "75/min", "100/min", "150/min"], c: 1, e: "300 / Anzahl großer Kästchen = 300 / 4 = 75/min. Alternativ 1500 / Anzahl kleiner Kästchen (1500 / 20 = 75)." },
    { q: "Ab welcher PQ-Zeit spricht man beim Erwachsenen von einem AV-Block I°?", a: ["> 120 ms", "> 160 ms", "> 200 ms", "> 300 ms"], c: 2, e: "Normal sind 120–200 ms. Eine PQ-Zeit > 200 ms bei 1:1-Überleitung ist ein AV-Block I°. Eine kurze PQ-Zeit < 120 ms lässt an Präexzitation denken." },
    { q: "Bei welcher Frequenz überschätzt die Bazett-Formel die QTc-Zeit am stärksten?", a: ["Bei 40/min", "Bei 60/min", "Bei 120/min", "Bazett ist bei allen Frequenzen gleich genau"], c: 2, e: "Bazett teilt durch √RR; bei hoher Frequenz (kleines RR) wird die QTc zu lang. Die AHA/ACCF/HRS-Empfehlungen (2009) raten deshalb zu linearen Korrekturformeln; viele Kliniken nutzen Fridericia." },
    { q: "Ab welcher QTc-Zeit gilt sie laut AHA/ACCF/HRS bei Frauen als verlängert?", a: ["≥ 430 ms", "≥ 450 ms", "≥ 460 ms", "≥ 500 ms"], c: 2, e: "Männer ≥ 450 ms, Frauen ≥ 460 ms; ≤ 390 ms gilt als kurz. QTc ≥ 500 ms ist mit deutlich erhöhtem Torsade-Risiko verbunden." },
  ] });

  document.addEventListener("DOMContentLoaded", () => { initFig4A(); initQTc(); });
})();
