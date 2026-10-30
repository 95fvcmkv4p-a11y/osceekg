/* Kapitel 15 – Fallklinik mit echten EKGs (PTB-XL) */
(function () {
  "use strict";
  const LEADS = ["I", "II", "III", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"];

  // ---------- Laden der Fall-Daten (per <script>, funktioniert auch über file://) ----------
  const cache = {}, waiting = {};
  window.EKGCases = {
    register(id, fs, b64) {
      const bin = atob(b64), n = bin.length / 2;
      const i16 = new Int16Array(n);
      for (let i = 0; i < n; i++) { const lo = bin.charCodeAt(2 * i), hi = bin.charCodeAt(2 * i + 1); i16[i] = (hi << 8) | lo; }
      const per = n / 12, leads = {};
      LEADS.forEach((l, k) => { const a = new Float32Array(per); for (let j = 0; j < per; j++) a[j] = i16[k * per + j] / 1000; leads[l] = a; });
      leads["-aVR"] = leads.aVR.map((v) => -v);
      cache[id] = { fs, n: per, leads };
      (waiting[id] || []).forEach((f) => f(cache[id])); delete waiting[id];
    },
  };
  function load(id) {
    return new Promise((res, rej) => {
      if (cache[id]) return res(cache[id]);
      (waiting[id] = waiting[id] || []).push(res);
      if (waiting[id].length > 1) return;
      const s = document.createElement("script");
      s.src = `assets/cases/ptbxl-${id}.js`;
      s.onerror = () => rej(new Error("Fall konnte nicht geladen werden"));
      document.head.appendChild(s);
    });
  }

  function init() {
    const root = document.getElementById("klinik");
    if (!root || !window.EKG_CASES) return;
    const CASES = window.EKG_CASES;
    const grid = root.querySelector(".case-grid");
    const viewer = root.querySelector(".viewer");
    const canvas = viewer.querySelector("canvas");
    const head = viewer.querySelector(".case-head");
    const sol = viewer.querySelector(".solution");
    const form = viewer.querySelector("form.befund");
    const calOut = viewer.querySelector(".cal-out");
    const filterBox = root.querySelector(".case-filter");
    let cur = null, data = null, speed = 25, gain = 10, order = "std", calOn = false, cal = null, showCat = true;

    // ---------- Fallübersicht ----------
    const cats = [...new Set(CASES.map((c) => c.cat))];
    filterBox.innerHTML = `<button type="button" data-v="Alle" aria-pressed="true">Alle</button>` + cats.map((c) => `<button type="button" data-v="${c}">${c}</button>`).join("");
    let filt = "Alle";
    const done = () => U.store.get("klinik:done", {});
    function renderGrid() {
      const d = done();
      grid.innerHTML = "";
      CASES.filter((c) => filt === "Alle" || c.cat === filt).forEach((c) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "case-card" + (d[c.id] ? " seen" : "") + (cur && cur.id === c.id ? " active" : "");
        b.innerHTML = `<span class="n">Fall ${String(c.n).padStart(2, "0")}</span><span class="m">${c.age ?? "?"} J., ${c.sex === "w" ? "w" : c.sex === "m" ? "m" : "?"}</span>` +
          (showCat ? `<span class="c">${c.cat}</span>` : "") + (d[c.id] ? `<span class="ok">✓ aufgelöst</span>` : "");
        b.addEventListener("click", () => open(c));
        grid.appendChild(b);
      });
    }
    U.seg(filterBox, (v) => { filt = v; renderGrid(); });
    root.querySelector(".show-cat").addEventListener("change", (e) => { showCat = e.target.checked; renderGrid(); });
    root.querySelector(".random").addEventListener("click", () => {
      const pool = CASES.filter((c) => filt === "Alle" || c.cat === filt);
      open(pool[Math.floor(Math.random() * pool.length)]);
    });

    // ---------- Darstellung ----------
    function layout(w) {
      // 25 mm/s: 3 Zeilen × 4 Spalten à 2,5 s + Rhythmusstreifen II (10 s) = 250 mm Breite
      // 50 mm/s: 6 Zeilen × 2 Spalten à 2,5 s (Extremitäten | Brustwand) = 250 mm Breite
      const pxmm = w / 252;
      const rowMm = gain >= 20 ? 46 : gain >= 10 ? 26 : 16;
      const rows = [];
      if (speed === 25) {
        const cols = [["I", "II", "III"], ["aVR", "aVL", "aVF"], ["V1", "V2", "V3"], ["V4", "V5", "V6"]];
        if (order === "cab") { cols[0] = ["aVL", "I", "-aVR"]; cols[1] = ["II", "aVF", "III"]; }
        for (let r = 0; r < 3; r++) rows.push(cols.map((c, ci) => ({ lead: c[r], t0: ci * 2.5, dur: 2.5, x: 1 + ci * 62.5 })));
        rows.push([{ lead: "II", t0: 0, dur: 10, x: 1 }]);
      } else {
        const limb = order === "cab" ? ["aVL", "I", "-aVR", "II", "aVF", "III"] : ["I", "II", "III", "aVR", "aVL", "aVF"];
        const prec = ["V1", "V2", "V3", "V4", "V5", "V6"];
        for (let r = 0; r < 6; r++) rows.push([{ lead: limb[r], t0: 0, dur: 2.5, x: 1 }, { lead: prec[r], t0: 0, dur: 2.5, x: 126 }]);
      }
      return { pxmm, rowMm, rows, h: Math.ceil((rows.length * rowMm + 4) * pxmm) };
    }
    const cv = U.canvas(canvas, (w) => layout(w).h, draw);
    let geo = null;
    function draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      const L = layout(w); geo = { ...L, panels: [] };
      U.paper(ctx, 0, 0, w, h, L.pxmm);
      if (!data) { U.label(ctx, "Fall wählen …", w / 2, h / 2, { align: "center", size: 14, color: U.cssVar("--ink-soft") }); return; }
      L.rows.forEach((row, ri) => {
        const y0 = (2 + ri * L.rowMm + L.rowMm * 0.62) * L.pxmm;
        row.forEach((p) => {
          const i0 = Math.round(p.t0 * data.fs), i1 = Math.min(data.n, Math.round((p.t0 + p.dur) * data.fs));
          const x0 = p.x * L.pxmm;
          U.trace(ctx, data.leads[p.lead], data.fs, { x0, y0, pxmm: L.pxmm, speed, gain, i0, i1, width: 1.15 });
          U.label(ctx, p.lead, x0 + 3, y0 - (L.rowMm * 0.42) * L.pxmm, { size: 12, color: U.cssVar("--accent"), font: `700 13px ${U.cssVar("--f-mono")}` });
          // Trennstrich zwischen Spalten
          if (p.x > 1) { ctx.strokeStyle = U.cssVar("--ink"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0 - 4 * L.pxmm); ctx.lineTo(x0, y0 + 2 * L.pxmm); ctx.stroke(); }
          geo.panels.push({ x0, x1: x0 + p.dur * speed * L.pxmm, y0, top: (2 + ri * L.rowMm) * L.pxmm, bot: (2 + (ri + 1) * L.rowMm) * L.pxmm, p });
        });
      });
      U.label(ctx, `${speed} mm/s · ${gain} mm/mV · 0,5–100 Hz`, w - 6, h - 6, { size: 10.5, align: "right", color: U.cssVar("--ink-soft"), bg: U.cssVar("--ecg-bg") });
      if (cal) drawCal(ctx);
    }
    function drawCal(ctx) {
      const { a, b } = cal; if (!b) return;
      ctx.save(); ctx.strokeStyle = U.cssVar("--blue"); ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
      for (const p of [a, b]) { ctx.beginPath(); ctx.moveTo(p.x, cal.panel.top); ctx.lineTo(p.x, cal.panel.bot); ctx.stroke(); }
      ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.fillStyle = U.cssVar("--blue"); for (const p of [a, b]) { ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    // Messzirkel
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const panelAt = (p) => geo && geo.panels.find((q) => p.x >= q.x0 && p.x <= q.x1 && p.y >= q.top && p.y <= q.bot);
    function updateCalOut() {
      if (!cal || !cal.b) { calOut.textContent = calOn ? "Im EKG ziehen: Startpunkt drücken, zum Endpunkt ziehen." : ""; return; }
      const dt = Math.abs(cal.b.x - cal.a.x) / (geo.pxmm * speed) * 1000;
      const dv = -(cal.b.y - cal.a.y) / (geo.pxmm * gain);
      calOut.innerHTML = `Δt = <b>${Math.round(dt)} ms</b>` + (dt > 150 ? ` (entspricht ${Math.round(60000 / dt)}/min)` : "") + ` · ΔU = <b>${dv >= 0 ? "+" : "−"}${Math.abs(dv).toFixed(2).replace(".", ",")} mV</b> · Ableitung ${cal.panel.p.lead}`;
    }
    canvas.addEventListener("pointerdown", (e) => {
      if (!calOn || !data) return;
      const p = pos(e), pan = panelAt(p); if (!pan) return;
      cal = { a: p, b: p, panel: pan, drag: true }; canvas.setPointerCapture(e.pointerId); cv.redraw(); updateCalOut();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!cal || !cal.drag) return;
      const p = pos(e); cal.b = { x: U.clamp(p.x, cal.panel.x0, cal.panel.x1), y: p.y }; cv.redraw(); updateCalOut();
    });
    canvas.addEventListener("pointerup", () => { if (cal) cal.drag = false; });

    U.seg(viewer.querySelector(".speed"), (v) => { speed = +v; cal = null; updateCalOut(); cv.resize(); });
    U.seg(viewer.querySelector(".gain"), (v) => { gain = +v; cal = null; updateCalOut(); cv.resize(); });
    U.seg(viewer.querySelector(".order"), (v) => { order = v; cal = null; cv.redraw(); });
    const calBtn = viewer.querySelector(".cal");
    calBtn.addEventListener("click", () => {
      calOn = !calOn; cal = null; calBtn.setAttribute("aria-pressed", calOn);
      calBtn.textContent = calOn ? "Messzirkel an" : "Messzirkel aus";
      canvas.style.cursor = calOn ? "crosshair" : ""; canvas.style.touchAction = calOn ? "none" : "pan-y";
      updateCalOut(); cv.redraw();
    });

    // ---------- Befundbogen & Auflösung ----------
    // Befundbogen aus dem festen Schema (Kapitel 6) erzeugen
    const FIELDS = [];
    form.innerHTML = window.BEFUND_SCHEMA.filter((st) => st.field || st.fields).map((st, i) => {
      const fl = st.fields || [Object.assign({ id: st.id }, st.field)];
      const inner = fl.map((f) => {
        const id = f.id || st.id; FIELDS.push(id);
        if (f.select) return `<select name="${id}" aria-label="${f.label}">${f.select.map((o) => `<option>${o}</option>`).join("")}</select>`;
        if (f.area) return `<textarea name="${id}" aria-label="${f.label}" placeholder="${f.ph || ""}"></textarea>`;
        return `<input name="${id}" aria-label="${f.label}" placeholder="${f.ph || f.label}" ${f.num ? 'inputmode="decimal"' : ""} autocomplete="off">`;
      }).join("");
      return `<div class="bf-row"><label><span class="n">${i + 1}</span>${st.t}</label><div class="bf-in ${st.fields ? "multi" : ""}">${inner}</div></div>`;
    }).join("") + `<div class="bf-actions"><button type="button" class="btn ghost mk-text">Befundtext erzeugen</button><span class="qtc-live caption"></span></div><div class="befundtext" hidden><div class="panel-label">Dein Befundtext</div><p class="bt"></p><button type="button" class="btn ghost copy">Kopieren</button></div>`;
    const qtcLive = form.querySelector(".qtc-live");
    const updQtc = () => {
      const qt = parseFloat(String(form.elements.qt.value).replace(",", ".")), hr = parseFloat(String(form.elements.frequenz.value).replace(",", "."));
      qtcLive.textContent = qt > 150 && hr > 20 ? `QTc ≈ ${Math.round(qt / Math.cbrt(60 / hr))} ms (Fridericia) · ${Math.round(qt / Math.sqrt(60 / hr))} ms (Bazett)` : "";
    };
    form.querySelector(".mk-text").addEventListener("click", () => {
      const v = {}; FIELDS.forEach((f) => (v[f] = form.elements[f].value));
      const box = form.querySelector(".befundtext"); box.hidden = false;
      box.querySelector(".bt").textContent = window.befundText(v) || "Noch keine Einträge.";
    });
    form.querySelector(".copy").addEventListener("click", () => { try { navigator.clipboard.writeText(form.querySelector(".bt").textContent); } catch { /* nicht verfügbar */ } });
    function saveForm() {
      if (!cur) return;
      const v = {}; FIELDS.forEach((f) => (v[f] = form.elements[f].value));
      U.store.set("klinik:form:" + cur.id, v);
    }
    form.addEventListener("input", () => { saveForm(); updQtc(); });
    const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    function showSolution(show) {
      sol.hidden = !show;
      viewer.querySelector(".reveal").textContent = show ? "Lösung verbergen" : "Lösung zeigen";
      if (show && cur) { const d = done(); d[cur.id] = true; U.store.set("klinik:done", d); renderGrid(); }
    }
    viewer.querySelector(".reveal").addEventListener("click", () => showSolution(sol.hidden));
    function fillSolution(c) {
      const codes = c.codes.map((k) => `<li><span class="mono">${esc(k.code)}</span> – ${esc(k.desc || "–")}${k.lik ? ` <span class="en">Likelihood ${k.lik} %</span>` : ""}</li>`).join("");
      sol.innerHTML = `
        <h4>${esc(c.title)}</h4>
        <ul class="kern">${c.kern.map((k) => `<li>${esc(k)}</li>`).join("")}</ul>
        <p class="hint">✎ ${esc(c.hint)}</p>
        <details><summary>PTB-XL-Annotation und Originalbefund</summary>
          <ul class="codes">${codes}</ul>
          ${c.stadium ? `<p class="caption">Infarktstadium laut PTB-XL: ${esc(c.stadium)}</p>` : ""}
          <p class="caption">Originalbefund (Deutsch, Englisch oder Schwedisch, unverändert): <i>${esc(c.report)}</i></p>
          <p class="caption">PTB-XL ecg_id ${c.id}. Die Kernbefunde oben fassen die Annotation zusammen; sie wurden für diesen Kurs gesichtet, ersetzen aber keine eigene Befundung.</p>
        </details>`;
    }
    async function open(c) {
      cur = c; cal = null; updateCalOut();
      head.innerHTML = `<b>Fall ${String(c.n).padStart(2, "0")}</b> · ${c.age ?? "?"} Jahre, ${c.sex === "w" ? "weiblich" : c.sex === "m" ? "männlich" : "?"} <span class="en">PTB-XL #${c.id}</span>`;
      const v = U.store.get("klinik:form:" + c.id, {});
      FIELDS.forEach((f) => (form.elements[f].value = v[f] || ""));
      updQtc(); form.querySelector(".befundtext").hidden = true;
      fillSolution(c); showSolution(false);
      data = null; cv.redraw();
      viewer.hidden = false;
      renderGrid();
      try { data = await load(c.id); } catch (e) { head.innerHTML += ` – <span style="color:var(--accent)">${e.message}</span>`; }
      if (cur === c) cv.redraw();
      const i = CASES.indexOf(c);
      viewer.querySelector(".prev").disabled = i <= 0;
      viewer.querySelector(".next").disabled = i >= CASES.length - 1;
    }
    viewer.querySelector(".prev").addEventListener("click", () => { const i = CASES.indexOf(cur); if (i > 0) open(CASES[i - 1]); });
    viewer.querySelector(".next").addEventListener("click", () => { const i = CASES.indexOf(cur); if (i < CASES.length - 1) open(CASES[i + 1]); });
    document.querySelectorAll(".case-count").forEach((n) => (n.textContent = CASES.length));
    renderGrid();
    open(CASES[0]);
    window.openCase = (id) => { const c = CASES.find((x) => x.id === id); if (c) { open(c); setTimeout(() => viewer.scrollIntoView({ behavior: "smooth", block: "start" }), 60); } };
  }
  document.addEventListener("DOMContentLoaded", init);
})();
