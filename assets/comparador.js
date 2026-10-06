// Capítulo 04 — Uruguay frente a la región (datos: data/comparacion_paises.json, notebook 07)
(async function () {
  const rows = await d3.json("data/comparacion_paises.json");

  const IND = [
    { id: "NY.GDP.PCAP.PP.KD", grp: "Economía", label: "PIB per cápita", unit: "US$ PPA", better: "high", fmt: (v) => "US$ " + Math.round(v).toLocaleString("es-UY"), src: "Banco Mundial / ICP · PIB per cápita en paridad de poder adquisitivo, US$ internacionales constantes de 2021" },
    { id: "NY.GDP.MKTP.KD.ZG", grp: "Economía", label: "Crecimiento del PIB", unit: "%", better: "high", src: "Banco Mundial · Crecimiento anual del PIB a precios constantes" },
    { id: "FP.CPI.TOTL.ZG", grp: "Economía", label: "Inflación", unit: "%", better: "low", cap: 25, src: "FMI vía Banco Mundial · Variación anual del índice de precios al consumidor" },
    { id: "SL.UEM.TOTL.ZS", grp: "Economía", label: "Desempleo", unit: "%", better: "low", src: "OIT (estimación modelada) vía Banco Mundial · % de la fuerza laboral" },
    { id: "SL.UEM.1524.ZS", grp: "Economía", label: "Desempleo juvenil", unit: "%", better: "low", src: "OIT (estimación modelada) vía Banco Mundial · % de la fuerza laboral de 15 a 24 años" },
    { id: "SI.POV.GINI", grp: "Social", label: "Desigualdad (Gini)", unit: "", better: "low", fmt: (v) => v.toLocaleString("es-UY", { maximumFractionDigits: 1 }), src: "Banco Mundial, Poverty and Inequality Platform · Índice de Gini (0 = igualdad total, 100 = desigualdad máxima)" },
    { id: "SI.POV.UMIC", grp: "Social", label: "Pobreza (US$ 8,30/día)", unit: "%", better: "low", src: "Banco Mundial, Poverty and Inequality Platform · % de la población que vive con menos de US$ 8,30 por día (PPA 2021)" },
    { id: "VC.IHR.PSRC.P5", grp: "Social", label: "Homicidios", unit: "c/100 mil", better: "low", fmt: (v) => v.toLocaleString("es-UY", { maximumFractionDigits: 1 }), src: "UNODC vía Banco Mundial · Homicidios intencionales cada 100.000 habitantes" },
    { id: "SE.SEC.CUAT.UP.ZS", grp: "Social", label: "Secundaria completa (25+)", unit: "%", better: "high", src: "UNESCO vía Banco Mundial · % de la población de 25 años o más con al menos secundaria superior completa" },
  ];
  const PAISES = ["URY", "ARG", "BRA", "CHL", "PRY", "CRI", "MEX"];
  const REFS = ["LCN", "OED"];
  const NOMBRE = { URY: "Uruguay", ARG: "Argentina", BRA: "Brasil", CHL: "Chile", PRY: "Paraguay", CRI: "Costa Rica", MEX: "México", LCN: "América Latina", OED: "OCDE" };
  const MAX_ANTIG = 5; // un dato con más de 5 años de atraso no entra al ranking

  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const fmtDef = (v) => v.toLocaleString("es-UY", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  const fmtOf = (ind) => ind.fmt || fmtDef;

  // índice: indicador -> iso3 -> [{anio, valor}]
  const data = d3.group(rows, (d) => d.indicador, (d) => d.iso3);
  const serie = (ind, iso) => (data.get(ind)?.get(iso) || []).slice().sort((a, b) => a.anio - b.anio);
  const ultimo = (ind, iso) => { const s = serie(ind, iso); return s[s.length - 1]; };

  const state = { ind: "SL.UEM.1524.ZS", vs: "CHL" };

  // ---------- tooltip ----------
  const tip = document.getElementById("tip");
  function showTip(html, ev) {
    tip.innerHTML = html; tip.hidden = false;
    const pad = 14, r = tip.getBoundingClientRect();
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - pad;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  const hideTip = () => (tip.hidden = true);

  // ---------- stat tiles economía ----------
  function tile(indId, label) {
    const ind = IND.find((i) => i.id === indId);
    const u = ultimo(indId, "URY"), l = ultimo(indId, "LCN"), o = ultimo(indId, "OED");
    const f = fmtOf(ind);
    const refs = [l && `Am. Latina ${f(l.valor)}`, o && `OCDE ${f(o.valor)}`].filter(Boolean).join(" · ");
    return `<div class="stat"><div class="v">${f(u.valor)}</div><div class="l">${label} (${u.anio})</div><div class="d">${refs}</div></div>`;
  }
  document.getElementById("eco-stats").innerHTML = [
    tile("NY.GDP.PCAP.PP.KD", "PIB per cápita, PPA"),
    tile("NY.GDP.MKTP.KD.ZG", "Crecimiento del PIB"),
    tile("FP.CPI.TOTL.ZG", "Inflación"),
    tile("SL.UEM.TOTL.ZS", "Desempleo"),
  ].join("");

  // ---------- picker de indicador ----------
  const picker = document.getElementById("ind-picker");
  ["Economía", "Social"].forEach((g) => {
    const h = document.createElement("div"); h.className = "grp"; h.textContent = g; picker.appendChild(h);
    IND.filter((i) => i.grp === g).forEach((i) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "radio"); b.textContent = i.label; b.dataset.id = i.id;
      b.onclick = () => { state.ind = i.id; syncButtons(); render(); };
      picker.appendChild(b);
    });
  });
  const paisSeg = document.getElementById("pais-seg");
  PAISES.filter((p) => p !== "URY").forEach((p) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("role", "radio"); b.textContent = NOMBRE[p]; b.dataset.id = p;
    b.onclick = () => { state.vs = p; syncButtons(); renderEvo(); };
    paisSeg.appendChild(b);
  });
  function syncButtons() {
    picker.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.id === state.ind)));
    paisSeg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.id === state.vs)));
  }

  // ---------- veredicto automático ----------
  function veredicto(ind, ranking) {
    const f = fmtOf(ind);
    const paises = ranking.filter((r) => PAISES.includes(r.iso3));
    const pos = paises.findIndex((r) => r.iso3 === "URY") + 1;
    const n = paises.length;
    const u = paises.find((r) => r.iso3 === "URY");
    const mejor = (a, b) => (ind.better === "high" ? a > b : a < b);
    let txt = `En <b>${ind.label.toLowerCase()}</b>, Uruguay (${f(u.valor)}) está `;
    txt += pos === 1 ? "<b>primero</b>" : pos === n ? `<b>último</b>` : `<b>${pos}º</b>`;
    txt += ` entre los ${n} países del grupo.`;
    const l = ranking.find((r) => r.iso3 === "LCN"), o = ranking.find((r) => r.iso3 === "OED");
    if (l) txt += ` ${mejor(u.valor, l.valor) ? "Mejor" : "Peor"} que el promedio de América Latina (${f(l.valor)})`;
    if (o) txt += `${l ? "," : ""} ${mejor(u.valor, o.valor) ? "mejor" : "peor"} que la OCDE (${f(o.valor)})`;
    if (l || o) txt += ".";
    return txt;
  }

  // ---------- ranking (último dato) ----------
  function renderRank() {
    const ind = IND.find((i) => i.id === state.ind);
    const f = fmtOf(ind);
    const maxAnio = d3.max(rows.filter((r) => r.indicador === ind.id), (r) => r.anio);
    let list = [...PAISES, ...REFS].map((iso) => ({ iso3: iso, ...ultimo(ind.id, iso) }))
      .filter((r) => r.valor !== undefined && r.anio >= maxAnio - MAX_ANTIG);
    list.sort((a, b) => (ind.better === "high" ? b.valor - a.valor : a.valor - b.valor));
    document.getElementById("verdict").innerHTML = veredicto(ind, list);
    document.getElementById("rank-title").textContent = `${ind.label}: último dato (${ind.better === "high" ? "mejor arriba" : "más bajo es mejor"})`;

    const host = document.getElementById("chart-rank");
    const W = host.clientWidth, rowH = 30, m = { t: 4, r: 100, b: 4, l: 108 };
    const H = m.t + m.b + list.length * rowH;
    const svg = d3.select(host).html("").append("svg").attr("viewBox", `0 0 ${W} ${H}`)
      .attr("role", "img").attr("aria-label", `Ranking de ${ind.label}, último dato disponible`);
    const cap = ind.cap;
    const vmax = d3.max(list, (d) => (cap ? Math.min(d.valor, cap) : d.valor));
    const vmin = Math.min(0, d3.min(list, (d) => d.valor));
    const x = d3.scaleLinear().domain([vmin, vmax]).nice().range([m.l, W - m.r]);
    const y = d3.scaleBand().domain(list.map((d) => d.iso3)).range([m.t, H - m.b]).paddingInner(0.3);
    const color = (iso) => (iso === "URY" ? css("--s2") : REFS.includes(iso) ? css("--ref") : css("--s1"));

    const g = svg.selectAll("g").data(list).join("g").attr("transform", (d) => `translate(0,${y(d.iso3)})`);
    g.append("text").attr("class", "lbl").attr("x", m.l - 8).attr("y", y.bandwidth() / 2).attr("dy", "0.35em")
      .attr("text-anchor", "end").style("font-weight", (d) => (d.iso3 === "URY" ? 700 : 400))
      .style("fill", (d) => (REFS.includes(d.iso3) ? css("--ink-2") : null))
      .text((d) => NOMBRE[d.iso3]);
    g.append("rect").attr("x", (d) => Math.min(x(0), x(d.valor)))
      .attr("width", (d) => Math.max(2, Math.abs(x(cap ? Math.min(d.valor, cap) : d.valor) - x(0))))
      .attr("height", y.bandwidth()).attr("rx", 3)
      .attr("fill", (d) => color(d.iso3))
      .attr("opacity", (d) => (REFS.includes(d.iso3) ? 0.9 : 1));
    g.append("text").attr("class", "val").attr("y", y.bandwidth() / 2).attr("dy", "0.35em")
      .attr("x", (d) => x(cap ? Math.min(d.valor, cap) : Math.max(d.valor, 0)) + 6)
      .text((d) => f(d.valor) + (d.anio < maxAnio ? ` (${d.anio})` : "") + (cap && d.valor > cap ? " ▸" : ""));
    g.append("rect").attr("fill", "transparent").attr("x", 0).attr("width", W).attr("height", y.bandwidth())
      .on("pointermove", (ev, d) => showTip(`<b>${NOMBRE[d.iso3]}</b><div class="row">${ind.label} (${d.anio})<strong>${f(d.valor)}</strong></div>`, ev))
      .on("pointerleave", hideTip);
  }

  // ---------- evolución ----------
  function renderEvo() {
    const ind = IND.find((i) => i.id === state.ind);
    const f = fmtOf(ind);
    document.getElementById("evo-title").textContent = `${ind.label}, 2000–2025`;
    const cU = css("--s2"), cV = css("--s1"), cRef = css("--ink-2"), cOther = css("--axis");
    const lineas = [
      ...PAISES.filter((p) => p !== "URY" && p !== state.vs).map((p) => ({ iso: p, color: cOther, w: 1.25, dash: null, rol: "otro" })),
      ...REFS.map((p) => ({ iso: p, color: cRef, w: 1.5, dash: p === "LCN" ? "5 4" : "2 3", rol: "ref" })),
      { iso: state.vs, color: cV, w: 2, dash: null, rol: "vs" },
      { iso: "URY", color: cU, w: 2.5, dash: null, rol: "uy" },
    ].map((l) => ({ ...l, s: serie(ind.id, l.iso) })).filter((l) => l.s.length);
    // la OCDE sin datos recientes no se dibuja
    const maxAnio = d3.max(rows.filter((r) => r.indicador === ind.id), (r) => r.anio);
    const visibles = lineas.filter((l) => l.s[l.s.length - 1].anio >= maxAnio - MAX_ANTIG);

    document.getElementById("legend-evo").innerHTML = visibles.filter((l) => l.rol !== "otro").reverse().map((l) =>
      l.dash ? `<li><span class="sw sw-dash" style="border-color:${l.color}"></span>${NOMBRE[l.iso]}</li>`
             : `<li><span class="sw sw-line" style="background:${l.color}"></span>${NOMBRE[l.iso]}</li>`).join("") +
      `<li><span class="sw sw-line" style="background:${cOther}"></span>Resto del grupo</li>`;

    const host = document.getElementById("chart-evo");
    const W = host.clientWidth, H = 280, m = { t: 12, r: 12, b: 26, l: 46 };
    const svg = d3.select(host).html("").append("svg").attr("viewBox", `0 0 ${W} ${H}`)
      .attr("role", "img").attr("aria-label", `Evolución de ${ind.label}: Uruguay comparado con ${NOMBRE[state.vs]}`);
    const all = visibles.flatMap((l) => l.s.map((p) => p.valor));
    let ymax = d3.max(all), ymin = Math.min(0, d3.min(all));
    if (ind.cap) ymax = Math.min(ymax, ind.cap);
    const x = d3.scaleLinear().domain([2000, 2025]).range([m.l, W - m.r]);
    const y = d3.scaleLinear().domain([ymin, ymax]).nice().range([H - m.b, m.t]);
    const tf = ind.id === "NY.GDP.PCAP.PP.KD" ? (d) => (d / 1000) + " mil" : (d) => d;

    svg.append("defs").append("clipPath").attr("id", "evo-clip").append("rect")
      .attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", H - m.t - m.b);
    svg.append("g").attr("class", "gridline").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.l - m.r)).tickFormat(""));
    svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(tf).tickSize(0).tickPadding(6)).call((g) => g.select(".domain").remove());
    svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).tickValues([2000, 2005, 2010, 2015, 2020, 2025]).tickFormat(d3.format("d")).tickSize(0).tickPadding(8));
    if (ymin < 0) svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", css("--axis"));

    const line = d3.line().x((d) => x(d.anio)).y((d) => y(d.valor)).curve(d3.curveMonotoneX);
    svg.append("g").attr("clip-path", "url(#evo-clip)").selectAll("path").data(visibles).join("path")
      .attr("fill", "none").attr("stroke", (l) => l.color).attr("stroke-width", (l) => l.w)
      .attr("stroke-dasharray", (l) => l.dash).attr("stroke-linejoin", "round").attr("stroke-linecap", "round")
      .attr("d", (l) => line(l.s));

    // nota de escala / datos faltantes
    const notas = [];
    if (ind.cap && d3.max(all) > ind.cap) {
      const pico = serie(ind.id, "ARG").reduce((a, b) => (b.valor > a.valor ? b : a));
      notas.push(`Escala recortada en ${ind.cap}%: Argentina llegó a ${fmtDef(pico.valor)} en ${pico.anio}.`);
    }
    const faltan = [...PAISES, ...REFS].filter((p) => !visibles.find((l) => l.iso === p));
    if (faltan.length) notas.push(`Sin datos recientes: ${faltan.map((p) => NOMBRE[p]).join(", ")}.`);
    document.getElementById("evo-note").textContent = notas.join(" ");
    document.getElementById("ind-source").textContent = "Fuente: " + ind.src + ".";

    // crosshair
    const foco = visibles.filter((l) => l.rol !== "otro");
    const cross = svg.append("line").attr("stroke", css("--axis")).attr("y1", m.t).attr("y2", H - m.b).attr("opacity", 0);
    const dots = svg.append("g").selectAll("circle").data(foco).join("circle").attr("r", 4)
      .attr("fill", (l) => l.color).attr("stroke", css("--surface")).attr("stroke-width", 2).attr("opacity", 0);
    svg.append("rect").attr("fill", "transparent").attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", H - m.t - m.b)
      .on("pointermove", (ev) => {
        const a = Math.max(2000, Math.min(2025, Math.round(x.invert(d3.pointer(ev)[0]))));
        cross.attr("x1", x(a)).attr("x2", x(a)).attr("opacity", 1);
        dots.each(function (l) {
          const p = l.s.find((q) => q.anio === a);
          d3.select(this).attr("opacity", p && p.valor <= y.domain()[1] ? 1 : 0).attr("cx", x(a)).attr("cy", p ? y(p.valor) : 0);
        });
        const filas = foco.slice().reverse().map((l) => {
          const p = l.s.find((q) => q.anio === a);
          const sw = l.dash ? `<span class="sw sw-dash" style="border-color:${l.color}"></span>` : `<span class="sw sw-line" style="background:${l.color}"></span>`;
          return `<div class="row">${sw}${NOMBRE[l.iso]}<strong>${p ? f(p.valor) : "s/d"}</strong></div>`;
        }).join("");
        showTip(`<b>${a}</b>${filas}`, ev);
      })
      .on("pointerleave", () => { cross.attr("opacity", 0); dots.attr("opacity", 0); hideTip(); });
  }

  function render() { renderRank(); renderEvo(); }
  syncButtons();
  render();
  let raf;
  addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", render);
})();
