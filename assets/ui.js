// Interfaz: barra de progreso, capítulo activo, animaciones al hacer scroll, contadores y fuentes
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- barra de progreso ----------
  const bar = document.getElementById("progress");
  const topbar = document.getElementById("topbar");
  function onScroll() {
    const h = document.documentElement;
    const p = h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight);
    bar.style.transform = `scaleX(${p})`;
    topbar.classList.toggle("scrolled", h.scrollTop > 40);
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- capítulo activo en el menú ----------
  const links = [...document.querySelectorAll(".topnav a")];
  const secciones = links.map((a) => document.getElementById(a.dataset.ch)).filter(Boolean);
  const activo = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("active", a.dataset.ch === e.target.id));
      const act = links.find((a) => a.dataset.ch === e.target.id);
      if (act && act.scrollIntoView && innerWidth < 760) act.scrollIntoView({ inline: "center", block: "nearest" });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  secciones.forEach((s) => activo.observe(s));

  // ---------- contadores ----------
  function contar(el) {
    const fin = parseFloat(el.dataset.countup), dec = +(el.dataset.dec || 0);
    const fmt = (v) => v.toLocaleString("es-UY", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reduce) { el.textContent = fmt(fin); return; }
    const t0 = performance.now(), dur = 1200;
    (function paso(t) {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(fin * e);
      if (k < 1) requestAnimationFrame(paso);
    })(t0);
  }

  // ---------- aparición al hacer scroll ----------
  const revelar = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      e.target.querySelectorAll("[data-countup]").forEach(contar);
      if (e.target.matches("[data-countup]")) contar(e.target);
      revelar.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
  document.documentElement.classList.add("js");
  document.querySelectorAll(".reveal").forEach((el) => revelar.observe(el));

  // ---------- fuentes debajo de cada gráfico ----------
  fetch("data/fuentes.json").then((r) => r.json()).then((F) => {
    document.querySelectorAll(".fuente[data-fuente]").forEach((p) => {
      const ids = p.dataset.fuente.split(",").map((s) => s.trim());
      const partes = ids.map((id) => F[id]).filter(Boolean).map((f) =>
        `<b>${f.institucion}</b> – ${f.nombre} <a href="${f.url}" target="_blank" rel="noopener">ver ↗</a>`);
      const det = p.dataset.detalle ? ` <span class="f-det">· ${p.dataset.detalle}</span>` : "";
      p.innerHTML = `<span class="f-lbl">Fuente</span> ${partes.join(" · ")}${det}`;
    });
    window.FUENTES = F;
  });
})();
