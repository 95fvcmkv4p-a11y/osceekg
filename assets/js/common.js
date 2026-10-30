/* Gemeinsame Werkzeuge: EKG-Papier, SVG-Helfer, Quiz, Navigation */
(function () {
  "use strict";
  const U = {};
  const SVGNS = "http://www.w3.org/2000/svg";

  U.cssVar = (name, el = document.documentElement) => getComputedStyle(el).getPropertyValue(name).trim();
  U.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  U.reducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- SVG ----------
  U.el = function (tag, attrs = {}, parent) {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined) continue;
      if (k === "text") n.textContent = v;
      else n.setAttribute(k, v);
    }
    if (parent) parent.appendChild(n);
    return n;
  };
  /** Glatter Pfad durch Punkte (Catmull-Rom → kubische Bézier) */
  U.smooth = function (pts, closed = false, tension = 0.5) {
    if (pts.length < 2) return "";
    const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < p.length - 2; i++) {
      const [x0, y0] = p[i - 1], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2];
      const c1x = x1 + ((x2 - x0) / 6) * tension * 2, c1y = y1 + ((y2 - y0) / 6) * tension * 2;
      const c2x = x2 - ((x3 - x1) / 6) * tension * 2, c2y = y2 - ((y3 - y1) / 6) * tension * 2;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
    }
    return closed ? d + " Z" : d;
  };
  /** Leicht "zittrige" Kopie von Punkten für Doppelstrich-Skizzeneffekt */
  U.jitter = function (pts, amt = 1.4, seed = 1) {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280 - 0.5) * 2;
    return pts.map(([x, y]) => [x + rnd() * amt, y + rnd() * amt]);
  };
  /** Globale SVG-Definitionen (Wackel-Filter, Schraffuren) einmalig einfügen */
  U.installDefs = function () {
    if (document.getElementById("sk-defs")) return;
    const svg = U.el("svg", { id: "sk-defs", width: 0, height: 0, "aria-hidden": "true",
      style: "position:absolute;width:0;height:0;overflow:hidden" });
    const defs = U.el("defs", {}, svg);
    const f = U.el("filter", { id: "sk-wobble", x: "-5%", y: "-5%", width: "110%", height: "110%" }, defs);
    U.el("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035", numOctaves: "2", seed: "3", result: "n" }, f);
    U.el("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: "2.6", xChannelSelector: "R", yChannelSelector: "G" }, f);
    const mk = (id, color, angle, gap = 5, w = 1.1) => {
      const p = U.el("pattern", { id, width: gap, height: gap, patternUnits: "userSpaceOnUse", patternTransform: `rotate(${angle})` }, defs);
      U.el("line", { x1: 0, y1: 0, x2: 0, y2: gap, stroke: color, "stroke-width": w }, p);
    };
    mk("hatch-ink", "var(--ink-faint)", 40, 6, 0.8);
    mk("hatch-red", "var(--accent)", -35, 5, 1.1);
    mk("hatch-ochre", "var(--ochre)", 45, 4.5, 1.6);
    mk("hatch-blue", "var(--blue)", 45, 5, 1);
    document.body.prepend(svg);
  };

  // ---------- Canvas / EKG-Papier ----------
  /** Hält ein Canvas scharf (devicePixelRatio) und ruft draw(ctx, w, h) bei Größenänderung auf */
  U.canvas = function (canvas, aspectOrHeight, draw) {
    const ctx = canvas.getContext("2d");
    const state = { w: 0, h: 0, ctx, redraw: () => {} };
    const resize = (force) => {
      const w = canvas.clientWidth || canvas.parentElement.clientWidth;
      if (force !== true && w === state.w && state.w) return; // nur auf Breitenänderungen reagieren
      if (w < 40) return; // versteckt (anderes Kapitel aktiv)
      const h = typeof aspectOrHeight === "function" ? aspectOrHeight(w) : aspectOrHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.style.height = h + "px";
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      state.w = w; state.h = h;
      draw(ctx, w, h);
    };
    state.redraw = () => { if (state.w) draw(ctx, state.w, state.h); };
    state.resize = () => resize(true);
    // erster Aufruf asynchron über den ResizeObserver, damit Daten vorher bereitstehen
    new ResizeObserver(() => resize()).observe(canvas.parentElement);
    // Farbschema-Wechsel → neu zeichnen
    if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", state.redraw);
    document.addEventListener("ekg-theme", state.redraw);
    return state;
  };

  /** Zeichnet EKG-Papier: 1-mm-Kästchen, 5-mm-Großkästchen */
  U.paper = function (ctx, x, y, w, h, pxmm) {
    ctx.save();
    ctx.fillStyle = U.cssVar("--ecg-bg");
    ctx.fillRect(x, y, w, h);
    const minor = U.cssVar("--grid-minor"), major = U.cssVar("--grid-major");
    ctx.lineWidth = 1;
    if (pxmm >= 2.2) {
      ctx.strokeStyle = minor; ctx.beginPath();
      for (let gx = 0; gx <= w + 0.5; gx += pxmm) { const X = Math.round(x + gx) + 0.5; ctx.moveTo(X, y); ctx.lineTo(X, y + h); }
      for (let gy = 0; gy <= h + 0.5; gy += pxmm) { const Y = Math.round(y + gy) + 0.5; ctx.moveTo(x, Y); ctx.lineTo(x + w, Y); }
      ctx.stroke();
    }
    ctx.strokeStyle = major; ctx.beginPath();
    for (let gx = 0; gx <= w + 0.5; gx += pxmm * 5) { const X = Math.round(x + gx) + 0.5; ctx.moveTo(X, y); ctx.lineTo(X, y + h); }
    for (let gy = 0; gy <= h + 0.5; gy += pxmm * 5) { const Y = Math.round(y + gy) + 0.5; ctx.moveTo(x, Y); ctx.lineTo(x + w, Y); }
    ctx.stroke();
    ctx.restore();
  };

  /**
   * Zeichnet eine Ableitung. data in mV, fs in Hz.
   * opt: x0, y0 (Grundlinie), pxmm, speed (mm/s), gain (mm/mV), i0, i1, color, width, t0ms (Startzeit im Signal)
   */
  U.trace = function (ctx, data, fs, opt) {
    const o = Object.assign({ speed: 25, gain: 10, i0: 0, i1: data.length, width: 1.6, color: U.cssVar("--trace") }, opt);
    const pxPerSample = (o.speed * o.pxmm) / fs;
    ctx.save();
    ctx.strokeStyle = o.color; ctx.lineWidth = o.width; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = o.i0; i < o.i1; i++) {
      const X = o.x0 + (i - o.i0) * pxPerSample;
      const Y = o.y0 - data[i] * o.gain * o.pxmm;
      if (i === o.i0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.stroke();
    ctx.restore();
  };
  /** Eichzacke 1 mV */
  U.calPulse = function (ctx, x, y0, pxmm, gain = 10) {
    ctx.save(); ctx.strokeStyle = U.cssVar("--trace"); ctx.lineWidth = 1.4; ctx.beginPath();
    const h = gain * pxmm;
    ctx.moveTo(x, y0); ctx.lineTo(x + 1 * pxmm, y0); ctx.lineTo(x + 1 * pxmm, y0 - h);
    ctx.lineTo(x + 6 * pxmm, y0 - h); ctx.lineTo(x + 6 * pxmm, y0); ctx.lineTo(x + 7 * pxmm, y0);
    ctx.stroke(); ctx.restore();
  };
  U.label = function (ctx, text, x, y, opt = {}) {
    ctx.save();
    ctx.font = opt.font || `600 ${opt.size || 13}px ${U.cssVar("--f-mono") || "monospace"}`;
    ctx.fillStyle = opt.color || U.cssVar("--ink");
    ctx.textAlign = opt.align || "left"; ctx.textBaseline = opt.baseline || "alphabetic";
    if (opt.bg) {
      const m = ctx.measureText(text); const pad = 3;
      ctx.fillStyle = opt.bg;
      const bx = opt.align === "center" ? x - m.width / 2 : x;
      ctx.fillRect(bx - pad, y - (opt.size || 13), m.width + pad * 2, (opt.size || 13) + 4);
      ctx.fillStyle = opt.color || U.cssVar("--ink");
    }
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  // ---------- Animation, die nur läuft, wenn sichtbar ----------
  U.loop = function (rootEl, step) {
    let visible = false, running = false, last = 0, raf = 0;
    const tick = (ts) => {
      if (!running || !visible) { raf = 0; return; }
      const dt = last ? Math.min(ts - last, 60) : 16; last = ts;
      step(dt);
      raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (running && visible && !raf) { last = 0; raf = requestAnimationFrame(tick); } };
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; kick(); }, { threshold: 0.05 }).observe(rootEl);
    return {
      play() { running = true; kick(); }, pause() { running = false; },
      get running() { return running; },
    };
  };

  // ---------- Segment-Buttons ----------
  U.seg = function (container, onChange) {
    const btns = [...container.querySelectorAll("button")];
    const set = (val, fire = true) => {
      btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === String(val))));
      if (fire) onChange(val);
    };
    btns.forEach((b) => b.addEventListener("click", () => set(b.dataset.v)));
    return { set };
  };

  // ---------- Speicher (fehlertolerant) ----------
  U.store = {
    get(k, d) { try { const v = localStorage.getItem("ekg:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("ekg:" + k, JSON.stringify(v)); } catch { /* privat/blockiert */ } },
  };

  // ---------- Quiz ----------
  U.quiz = function (mount, id, questions) {
    const saved = U.store.get("quiz:" + id, {});
    mount.innerHTML = `<h3>Selbsttest</h3><p class="caption">Antwort anklicken – die Erklärung erscheint direkt darunter.</p>`;
    const scoreEl = document.createElement("div");
    scoreEl.className = "score";
    const update = () => {
      const done = Object.keys(saved).length;
      const right = Object.values(saved).filter(Boolean).length;
      scoreEl.textContent = done ? `${right} von ${questions.length} richtig` + (done < questions.length ? ` · ${questions.length - done} offen` : "") : "";
      document.dispatchEvent(new CustomEvent("ekg-progress"));
    };
    questions.forEach((q, qi) => {
      const box = document.createElement("div");
      box.className = "q";
      box.innerHTML = `<p class="stem">${qi + 1}. ${q.q}</p><div class="opts"></div>`;
      const opts = box.querySelector(".opts");
      const expl = document.createElement("p");
      expl.className = "expl"; expl.hidden = true; expl.innerHTML = q.e;
      const buttons = q.a.map((txt, ai) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "opt"; b.innerHTML = txt;
        b.addEventListener("click", () => {
          buttons.forEach((x, xi) => { x.disabled = true; if (xi === q.c) x.classList.add("right"); });
          if (ai !== q.c) b.classList.add("wrong");
          expl.hidden = false;
          saved[qi] = ai === q.c; U.store.set("quiz:" + id, saved); update();
        });
        opts.appendChild(b); return b;
      });
      box.appendChild(expl);
      mount.appendChild(box);
    });
    const reset = document.createElement("button");
    reset.type = "button"; reset.className = "btn ghost"; reset.textContent = "Zurücksetzen";
    reset.style.marginTop = ".8rem";
    reset.addEventListener("click", () => { U.store.set("quiz:" + id, {}); U.quiz(mount, id, questions); });
    mount.append(scoreEl, reset);
    update();
  };

  // ---------- Navigation, Fortschritt, Thema ----------
  U.initChrome = function () {
    U.installDefs();
    U.initRouter();
    const pill = document.getElementById("progress-pill");
    const updateProgress = () => {
      if (!pill) return;
      const ids = [...document.querySelectorAll("[data-quiz]")].map((q) => q.dataset.quiz);
      let right = 0, total = 0;
      ids.forEach((id) => { const s = U.store.get("quiz:" + id, {}); right += Object.values(s).filter(Boolean).length; });
      document.querySelectorAll("[data-quiz]").forEach((q) => { total += q.querySelectorAll(".q").length; });
      pill.textContent = `Selbsttest: ${right}/${total}`;
    };
    document.addEventListener("ekg-progress", updateProgress);
    setTimeout(updateProgress, 0);
    const tb = document.getElementById("theme-toggle");
    if (tb) {
      const apply = (t) => { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; document.dispatchEvent(new Event("ekg-theme")); };
      apply(U.store.get("theme", null));
      tb.addEventListener("click", () => {
        const dark = getComputedStyle(document.documentElement).colorScheme === "dark";
        const next = dark ? "light" : "dark"; U.store.set("theme", next); apply(next);
      });
    }
  };

  // ---------- Ein-Kapitel-Ansicht ----------
  const CHAPTERS = [
    ["erregung", "01", "Erregung", "Grundlagen"], ["vektor", "02", "Dipol", "Grundlagen"], ["ableitungen", "03", "Ableitungen", "Grundlagen"],
    ["zeiten", "04", "Zeiten", "Grundlagen"], ["lagetyp", "05", "Lagetyp", "Grundlagen"],
    ["befundung", "06", "Befundschema", "Befundung"],
    ["brady", "07", "AV-Block", "Pathologien"], ["schenkel", "08", "Schenkel", "Pathologien"], ["svt", "09", "SVT", "Pathologien"],
    ["vt", "10", "VT", "Pathologien"], ["ischaemie", "11", "Infarkt", "Pathologien"], ["hypertrophie", "12", "Hypertrophie", "Pathologien"],
    ["elektrolyte", "13", "Mimics", "Pathologien"], ["schrittmacher", "14", "Schrittmacher", "Pathologien"],
    ["faelle", "15", "Fallklinik", "Übung"],
  ];
  U.CHAPTERS = CHAPTERS;
  U.initRouter = function () {
    const sel = document.getElementById("chapter-select");
    const home = [...document.querySelectorAll(".hero, nav.toc")];
    const sections = Object.fromEntries(CHAPTERS.map(([id]) => [id, document.getElementById(id)]));
    // Kapitelleiste unten
    const bar = document.createElement("nav");
    bar.className = "chapbar"; bar.setAttribute("aria-label", "Kapitel");
    const groups = [];
    CHAPTERS.forEach(([id, n, t, g]) => { let G = groups.find((x) => x.g === g); if (!G) groups.push((G = { g, items: [] })); G.items.push([id, n, t]); });
    bar.innerHTML = `<div class="chapbar-inner"><div class="chapbar-row">` +
      `<div class="cb-group cb-home"><div class="cb-g">&nbsp;</div><a href="#top" class="cb-item" data-id="top"><span class="cb-n">⌂</span><span class="cb-t">Start</span></a></div>` +
      groups.map((G) => `<div class="cb-group"><div class="cb-g">${G.g}</div><div class="cb-items">${G.items.map(([id, n, t]) =>
        `<a href="#${id}" class="cb-item" data-id="${id}"><span class="cb-n">${n}</span><span class="cb-t">${t}</span></a>`).join("")}</div></div>`).join("") +
      `</div><div class="cb-track"><span class="cb-line"></span><span class="cb-dot"></span></div></div>`;
    document.body.appendChild(bar);
    const scroller = bar.querySelector(".chapbar-inner");
    let current = null;
    function show(id, target, noScroll) {
      const isChap = !!sections[id];
      for (const [cid, el] of Object.entries(sections)) if (el) el.hidden = cid !== id;
      home.forEach((el) => (el.hidden = isChap));
      document.body.classList.toggle("is-chapter", isChap);
      if (sel) sel.value = isChap ? id : "top";
      bar.querySelectorAll(".cb-item").forEach((a) => a.classList.toggle("on", a.dataset.id === (isChap ? id : "top")));
      // Fortschrittspunkt
      const on = bar.querySelector(".cb-item.on"), track = bar.querySelector(".cb-track");
      if (on) {
        const r = on.getBoundingClientRect(), rr = bar.querySelector(".chapbar-row").getBoundingClientRect();
        const x = r.left - rr.left + 6;
        track.style.setProperty("--x", x + "px"); track.style.width = bar.querySelector(".chapbar-row").scrollWidth + "px";
        const sr = scroller.getBoundingClientRect();
        if (r.left < sr.left + 20 || r.right > sr.right - 20) scroller.scrollTo({ left: Math.max(0, x - sr.width / 2), behavior: "smooth" });
      }
      if (current !== id) {
        current = id;
        const title = isChap ? sections[id].querySelector("h2")?.textContent : null;
        document.title = title ? `${title} · EKG verstehen` : "EKG verstehen";
        document.dispatchEvent(new CustomEvent("ekg-chapter", { detail: { id } }));
      }
      if (noScroll) return;
      if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
      else window.scrollTo(0, 0);
    }
    function route() {
      const h = decodeURIComponent(location.hash.slice(1));
      if (!h || h === "top") return show("top");
      if (sections[h]) return show(h);
      const el = document.getElementById(h);
      const chap = el && el.closest("section.chapter");
      if (chap) return show(chap.id, el);
      show("top");
    }
    window.addEventListener("hashchange", route);
    if (sel) sel.addEventListener("change", () => { location.hash = sel.value || "top"; });
    document.addEventListener("keydown", (e) => {
      if (e.target.closest("input, select, textarea, [contenteditable]") || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "]" && e.key !== "[") return;
      if (e.target.closest("[role=slider], .seg, .steps")) return;
      const ids = ["top", ...CHAPTERS.map((c) => c[0])], i = ids.indexOf(current);
      const j = (e.key === "ArrowRight" || e.key === "]") ? Math.min(ids.length - 1, i + 1) : Math.max(0, i - 1);
      if (j !== i) { e.preventDefault(); location.hash = ids[j]; }
    });
    window.addEventListener("resize", () => current && show(current, null, true));
    route();
  };

  window.U = U;
})();

/* ======================================================================
   Gemeinsame EKG-Darstellungen für Modell-Abbildungen (Kapitel 3–14)
   ====================================================================== */
(function () {
  "use strict";
  const U = window.U;

  /** Erzeugt 10 s Modellsignal für alle 12 Ableitungen (plus Zusatzableitungen) */
  U.model12 = function (schedule, { fs = 250, duration = 10000, extra = null, leadFn = null, leads = null } = {}) {
    const L = leads || [...EKG.LEADS, "-aVR"];
    const r = EKG.render(schedule, { fs, duration, leads: L, extra, leadFn });
    return { fs, n: r.n, leads: r.leads };
  };
  U.sinus12 = function (beatOpts = {}, hr = 70, more = {}) {
    const rr = 60000 / hr;
    const beat = EKG.makeBeat(Object.assign({ qt: EKG.qtForRR(rr) }, beatOpts));
    const sch = [];
    for (let t0 = 120 - 2 * rr; t0 < 10200; t0 += rr) sch.push({ t0, beat });
    return Object.assign(U.model12(sch, more), { beat, rr });
  };

  /**
   * 12-Kanal-Raster (3 × 4 à 2,5 s + Rhythmusstreifen) auf ein Canvas.
   * opt: gain, order ('std'|'cab'), rhythm (Ableitung oder null), marks {lead: {tone:'up'|'down'|'focus'|'dim', text}}
   */
  U.layout12 = function (w, opt = {}) {
    const pxmm = w / 252, rowMm = (opt.gain || 10) >= 20 ? 46 : (opt.gain || 10) <= 5 ? 16 : 26;
    const rows = opt.rhythm === null ? 3 : 4;
    return { pxmm, rowMm, h: Math.ceil((rows * rowMm + 4) * pxmm) };
  };
  U.draw12 = function (ctx, w, h, sig, opt = {}) {
    const o = Object.assign({ gain: 10, order: "std", rhythm: "II", marks: {} }, opt);
    const L = U.layout12(w, o);
    ctx.clearRect(0, 0, w, h);
    U.paper(ctx, 0, 0, w, h, L.pxmm);
    const cols = [["I", "II", "III"], ["aVR", "aVL", "aVF"], ["V1", "V2", "V3"], ["V4", "V5", "V6"]];
    if (o.order === "cab") { cols[0] = ["aVL", "I", "-aVR"]; cols[1] = ["II", "aVF", "III"]; }
    const panels = [];
    const rows = [];
    for (let r = 0; r < 3; r++) rows.push(cols.map((c, ci) => ({ lead: c[r], t0: ci * 2.5, dur: 2.5, x: 1 + ci * 62.5 })));
    if (o.rhythm) rows.push([{ lead: o.rhythm, t0: 0, dur: 10, x: 1, rhythm: true }]);
    const accent = U.cssVar("--accent"), danger = U.cssVar("--danger"), soft = U.cssVar("--ink-soft");
    rows.forEach((row, ri) => {
      const top = (2 + ri * L.rowMm) * L.pxmm, bot = (2 + (ri + 1) * L.rowMm) * L.pxmm;
      const y0 = (2 + ri * L.rowMm + L.rowMm * 0.62) * L.pxmm;
      row.forEach((p) => {
        const x0 = p.x * L.pxmm, x1 = x0 + p.dur * 25 * L.pxmm;
        const m = !p.rhythm && o.marks[p.lead];
        if (m && m.tone !== "dim") {
          ctx.save(); ctx.globalAlpha = m.tone === "focus" ? 0.16 : 0.13;
          ctx.fillStyle = m.tone === "up" ? danger : m.tone === "down" ? soft : accent;
          ctx.fillRect(x0, top + 1, x1 - x0, bot - top - 2); ctx.restore();
        }
        const i0 = Math.round(p.t0 * sig.fs), i1 = Math.min(sig.n, Math.round((p.t0 + p.dur) * sig.fs));
        const dim = (m && m.tone === "dim") || (o.focusOnly && !m && !p.rhythm);
        U.trace(ctx, sig.leads[p.lead], sig.fs, { x0, y0, pxmm: L.pxmm, gain: o.gain, i0, i1, width: 1.25,
          color: dim ? U.cssVar("--ink-faint") : U.cssVar("--trace") });
        U.label(ctx, p.lead.replace("-", "−"), x0 + 3, top + 13, { size: 12, color: accent, font: `600 12.5px ${U.cssVar("--f-mono")}` });
        if (m && m.text) U.label(ctx, m.text, x1 - 4, top + 13, { size: 11, align: "right",
          color: m.tone === "up" ? danger : m.tone === "down" ? soft : accent, font: `600 11px ${U.cssVar("--f-sans")}` });
        if (p.x > 1) { ctx.strokeStyle = U.cssVar("--ink"); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, y0 - 4 * L.pxmm); ctx.lineTo(x0, y0 + 2 * L.pxmm); ctx.stroke(); }
        panels.push({ x0, x1, top, bot, y0, p });
      });
    });
    U.label(ctx, `25 mm/s · ${String(o.gain).replace(".", ",")} mm/mV · Modell`, w - 6, h - 6, { size: 10, align: "right", color: soft, bg: U.cssVar("--ecg-bg") });
    return { ...L, panels };
  };

  /** Mehrere volle Streifen untereinander (Rhythmusanalyse) */
  U.drawStrips = function (ctx, w, h, sig, leads, opt = {}) {
    const o = Object.assign({ dur: 10, gain: 10, rowMm: 24, t0: 0 }, opt);
    const pxmm = w / (o.dur * 25 + 2);
    ctx.clearRect(0, 0, w, h);
    U.paper(ctx, 0, 0, w, h, pxmm);
    const panels = [];
    leads.forEach((l, ri) => {
      const top = (1 + ri * o.rowMm) * pxmm, y0 = top + o.rowMm * 0.62 * pxmm;
      const i0 = Math.round(o.t0 * sig.fs), i1 = Math.min(sig.n, Math.round((o.t0 + o.dur) * sig.fs));
      U.trace(ctx, sig.leads[l], sig.fs, { x0: pxmm, y0, pxmm, gain: o.gain, i0, i1, width: 1.35 });
      U.label(ctx, l.replace("-", "−"), pxmm + 3, top + 13, { size: 12, color: U.cssVar("--accent"), font: `600 12.5px ${U.cssVar("--f-mono")}` });
      panels.push({ top, y0, lead: l });
    });
    return { pxmm, panels, X: (ms) => pxmm + ((ms / 1000 - o.t0) * 25) * pxmm };
  };
  U.stripHeight = (w, nLeads, opt = {}) => Math.ceil(((opt.rowMm || 24) * nLeads + 2) * (w / ((opt.dur || 10) * 25 + 2)));

  /** Kleine Hilfe: Segment-Buttons aus Array erzeugen */
  U.segButtons = function (container, items, active) {
    container.innerHTML = items.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="${v === active}">${t}</button>`).join("");
  };
  /** Mehrere Quiz-Blöcke auf einmal registrieren */
  U.quizzes = function (map) {
    document.addEventListener("DOMContentLoaded", () => {
      for (const [id, qs] of Object.entries(map)) {
        const m = document.querySelector(`[data-quiz="${id}"]`);
        if (m) U.quiz(m, id, qs);
      }
    });
  };
  /** Querverweis auf einen Fall der Fallklinik */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-case]");
    if (!a) return;
    e.preventDefault();
    location.hash = "faelle";
    if (window.openCase) window.openCase(+a.dataset.case);
  });
})();

/* Leiterdiagramm (A – AV – V) unter einem Rhythmusstreifen */
(function () {
  "use strict";
  const U = window.U;
  U.ladder = function (ctx, x0, y0, w, rowH, ladder, X, opt = {}) {
    const ink = U.cssVar("--ink"), soft = U.cssVar("--ink-soft"), accent = U.cssVar("--accent"), danger = U.cssVar("--danger");
    const yA = y0, yAV = y0 + rowH, yV = y0 + 2 * rowH, yEnd = y0 + 3 * rowH;
    ctx.save();
    ctx.fillStyle = U.cssVar("--paper-2"); ctx.fillRect(x0, y0, w, 3 * rowH);
    ctx.strokeStyle = U.cssVar("--rule"); ctx.lineWidth = 1;
    for (const y of [yA, yAV, yV, yEnd]) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke(); }
    const lab = (t, y) => U.label(ctx, t, x0 + 4, y + rowH / 2 + 4, { size: 11, color: soft, font: `600 11px ${U.cssVar("--f-mono")}` });
    lab("A", yA); lab("AV", yAV); lab("V", yV);
    const inX = (x) => x > x0 + 26 && x < x0 + w - 2;
    ctx.lineWidth = 2; ctx.lineCap = "round";
    if (opt.af) {
      ctx.strokeStyle = soft; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let x = x0 + 28; x < x0 + w; x += 5) ctx.lineTo(x, yA + rowH * (0.3 + 0.4 * ((x * 7) % 10) / 10));
      ctx.stroke(); ctx.lineWidth = 2;
    }
    for (const e of ladder) {
      if (e.a !== null && e.a !== undefined && !e.retro) {
        const xa = X(e.a);
        if (inX(xa)) { ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(xa, yA + 2); ctx.lineTo(xa + 4, yAV); ctx.stroke(); }
        if (e.v !== null && e.v !== undefined) {
          const xv = X(e.v);
          if (inX(xa) || inX(xv)) { ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(xa + 4, yAV); ctx.lineTo(xv, yV); ctx.stroke(); }
        } else if (e.blocked && inX(xa)) {
          const xb = xa + 4 + (e.refractory ? 10 : 22);
          ctx.strokeStyle = danger; ctx.beginPath(); ctx.moveTo(xa + 4, yAV); ctx.lineTo(xb, yAV + rowH * 0.55); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(xb - 6, yAV + rowH * 0.55); ctx.lineTo(xb + 6, yAV + rowH * 0.55); ctx.stroke();
        }
      }
      if (e.retro && e.v !== null) {
        const xv = X(e.v), xa = X(e.a);
        if (inX(xv)) {
          ctx.strokeStyle = accent; ctx.beginPath(); ctx.moveTo(xv, yV); ctx.lineTo(xv + 3, yEnd - 2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(xv, yV); ctx.lineTo(xa - 4, yAV); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(xa - 4, yAV); ctx.lineTo(xa, yA + 2); ctx.stroke();
        }
        continue;
      }
      if (e.v !== null && e.v !== undefined) {
        const xv = X(e.v); if (!inX(xv)) continue;
        if (e.origin) {
          ctx.fillStyle = e.origin === "junc" ? ink : accent; ctx.strokeStyle = ctx.fillStyle;
          const yo = e.origin === "junc" ? yAV + rowH * 0.7 : yV + rowH * 0.5;
          ctx.beginPath(); ctx.arc(xv, yo, 3.5, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.moveTo(xv, yo); ctx.lineTo(xv - 5, yEnd - 2); ctx.moveTo(xv, yo); ctx.lineTo(xv + 5, yEnd - 2); ctx.stroke();
        } else { ctx.strokeStyle = ink; ctx.beginPath(); ctx.moveTo(xv, yV); ctx.lineTo(xv + 3, yEnd - 2); ctx.stroke(); }
      }
    }
    ctx.restore();
  };
})();

/* Rhythmus-Abbildung: Auswahl → Streifen (+ Leiterdiagramm) + Erklärung */
(function () {
  "use strict";
  const U = window.U;
  U.rhythmFigure = function (root, items, opt = {}) {
    const o = Object.assign({ leads: ["II", "V1"], ladder: true, dur: 10, first: Object.keys(items)[0] }, opt);
    const canvas = root.querySelector("canvas"), readout = root.querySelector(".readout"), seg = root.querySelector(".items");
    U.segButtons(seg, Object.entries(items).map(([k, v]) => [k, v.t]), o.first);
    let key = o.first, data = null, mod = null;
    const rowMm = 24;
    const cv = U.canvas(canvas, (w) => U.stripHeight(w, o.leads.length, { dur: o.dur, rowMm }) + (o.ladder ? 66 : 0), (ctx, w, h) => {
      if (!data) return;
      const sh = h - (o.ladder ? 66 : 0);
      const g = U.drawStrips(ctx, w, sh, data.sig, o.leads, { dur: o.dur, rowMm });
      if (data.band) {
        ctx.save(); ctx.fillStyle = U.cssVar("--accent"); ctx.globalAlpha = 0.08;
        ctx.fillRect(g.X(data.band[0]), 0, g.X(data.band[1]) - g.X(data.band[0]), sh); ctx.restore();
        U.label(ctx, data.band[2], g.X(data.band[0]) + 4, sh - 6, { size: 11, color: U.cssVar("--accent"), bg: U.cssVar("--ecg-bg") });
      }
      if (o.ladder) U.ladder(ctx, 0, sh + 4, w, 20, data.ladder || [], g.X, { af: items[key].af });
    });
    function build() {
      const it = items[key];
      const r = it.build(mod);
      const sig = U.model12(r.schedule, { fs: it.fs || 250, duration: o.dur * 1000, extra: r.extra, leads: o.leads });
      data = { sig, ladder: r.ladder, band: r.band || null };
      readout.innerHTML = typeof it.txt === "function" ? it.txt(mod) : it.txt;
      cv.redraw();
      if (o.onChange) o.onChange(key, mod);
    }
    U.seg(seg, (v) => { key = v; mod = null; build(); });
    build();
    return { rebuild: (m) => { mod = m; build(); }, get key() { return key; } };
  };
})();
