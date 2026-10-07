// Capítulos 02 (seguridad) y 03 (natalidad) — datos en data/*.json generados por los notebooks 04 y 06
(async function () {
  const [porAnio, porMotivo, ppl, nac] = await Promise.all([
    d3.json("data/homicidios_por_anio.json"),
    d3.json("data/homicidios_por_motivo.json"),
    d3.json("data/carceles_poblacion.json"),
    d3.json("data/nacimientos_por_anio.json"),
  ]);

  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const num = (v) => v.toLocaleString("es-UY");
  const pct = (v) => Math.round(v * 100) + "%";

  // ---------- tooltip (mismo elemento que el capítulo 01) ----------
  const tip = document.getElementById("tip");
  function showTip(html, ev) {
    tip.innerHTML = html;
    tip.hidden = false;
    const pad = 14, r = tip.getBoundingClientRect();
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + r.width > innerWidth - 8) x = ev.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = ev.clientY - r.height - pad;
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }
  const hideTip = () => (tip.hidden = true);
  const sw = (c) => `<span class="sw" style="background:${c}"></span>`;

  function roundedBar(x, y0, w, yt, r = 4) {
    r = Math.max(0, Math.min(r, w / 2, y0 - yt));
    return `M${x},${y0}V${yt + r}Q${x},${yt} ${x + r},${yt}H${x + w - r}Q${x + w},${yt} ${x + w},${yt + r}V${y0}Z`;
  }

  function axes(svg, x, y, W, H, m, yTicks, yFmt, xAxis) {
    svg.append("g").attr("class", "gridline").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(yTicks).tickSize(-(W - m.l - m.r)).tickFormat(""));
    svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(yTicks).tickFormat(yFmt).tickSize(0).tickPadding(6)).call((g) => g.select(".domain").remove());
    svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b})`).call(xAxis);
  }

  // ---------- stat tiles ----------
  const ult = porAnio[porAnio.length - 1];
  const conflictos = porMotivo.find((d) => d.anio === ult.anio && d.motivo === "Conflictos entre criminales").n;
  const pplUlt = ppl[ppl.length - 1], ppl0 = ppl[0];
  document.getElementById("seg-stats").innerHTML = [
    [num(ult.n), `homicidios en ${ult.anio}`],
    [pct(conflictos / ult.n), `fueron conflictos entre criminales (${ult.anio})`],
    [pct(ult.n_fuego / ult.n), `con arma de fuego (${ult.anio})`],
    [num(pplUlt.total), `personas presas (dic. ${pplUlt.anio}), contra ${num(ppl0.total)} en ${ppl0.anio}`],
  ].map(([v, l]) => `<div class="stat"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("");

  // ---------- homicidios por motivo: small multiples ----------
  const MOTIVOS = ["Conflictos entre criminales", "Altercados y conflictos", "Violencia doméstica", "Rapiña o hurto", "Otros / sin dato"];
  const FOCO = MOTIVOS[0];
  const colorMotivo = (m) => (m === FOCO ? css("--s2") : css("--s1"));
  document.getElementById("legend-motivo").innerHTML =
    `<li>${sw(css("--s2"))}Conflictos entre criminales</li><li>${sw(css("--s1"))}Otros motivos</li>`;

  function renderMotivo() {
    const host = document.getElementById("chart-motivo");
    host.innerHTML = "";
    const W = host.clientWidth;
    const gap = 20;
    const ancho = W >= 620;                 // layout: destacado a la izquierda + 2x2 a la derecha
    const grid = d3.select(host).append("div").attr("class", ancho ? "mot-grid" : "mot-grid mot-1col");
    const years = d3.extent(porMotivo, (d) => d.anio);
    const yMax = d3.max(porMotivo, (d) => d.n);
    const smallW = ancho ? (W - gap) / 2 / 2 - gap / 2 : (W - gap) / 2;
    const bigW = ancho ? (W - gap) / 2 : W;

    MOTIVOS.forEach((mot, idx) => {
      const rows = porMotivo.filter((d) => d.motivo === mot).sort((a, b) => a.anio - b.anio);
      const foco = idx === 0;
      const cell = grid.append("div").attr("class", foco ? "mot-cell mot-foco" : "mot-cell");
      const first = rows[0], last = rows[rows.length - 1];
      cell.append("div").attr("class", "mot-name").text(mot);
      cell.append("div").attr("class", "mot-sub").text(`${first.anio}: ${first.n} → ${last.anio}: ${last.n}`);
      const cw = foco ? bigW : smallW, ch = foco ? (ancho ? 300 : 170) : (ancho ? 120 : 110);
      const m = { t: 10, r: 16, b: 22, l: 30 };
      const svg = cell.append("svg").attr("viewBox", `0 0 ${cw} ${ch}`)
        .attr("role", "img").attr("aria-label", `Homicidios por ${mot}: ${first.n} en ${first.anio}, ${last.n} en ${last.anio}`);
      const x = d3.scaleLinear().domain(years).range([m.l, cw - m.r]);
      const y = d3.scaleLinear().domain([0, yMax]).nice().range([ch - m.b, m.t]);
      axes(svg, x, y, cw, ch, m, 3, (d) => d,
        d3.axisBottom(x).tickValues([years[0], 2018, years[1]]).tickFormat(d3.format("d")).tickSize(0).tickPadding(8));
      const c = colorMotivo(mot);
      svg.append("path").datum(rows).attr("fill", c).attr("opacity", 0.12)
        .attr("d", d3.area().x((d) => x(d.anio)).y0(y(0)).y1((d) => y(d.n)).curve(d3.curveMonotoneX));
      svg.append("path").datum(rows).attr("fill", "none").attr("stroke", c).attr("stroke-width", 2)
        .attr("d", d3.line().x((d) => x(d.anio)).y((d) => y(d.n)).curve(d3.curveMonotoneX));
      const dot = svg.append("circle").attr("r", 4.5).attr("fill", c).attr("stroke", css("--surface")).attr("stroke-width", 2).attr("opacity", 0);
      svg.append("rect").attr("fill", "transparent").attr("x", m.l).attr("y", m.t).attr("width", cw - m.l - m.r).attr("height", ch - m.t - m.b)
        .on("pointermove", (ev) => {
          const a = Math.round(x.invert(d3.pointer(ev)[0]));
          const d = rows.find((r) => r.anio === a);
          if (!d) return;
          const tot = porAnio.find((r) => r.anio === a).n;
          dot.attr("cx", x(a)).attr("cy", y(d.n)).attr("opacity", 1);
          showTip(`<b>${mot} · ${a}</b><div class="row">${sw(c)}Homicidios<strong>${d.n}</strong></div><div class="row">Del total del año<strong>${pct(d.n / tot)}</strong></div>`, ev);
        })
        .on("pointerleave", () => { dot.attr("opacity", 0); hideTip(); });
    });
  }

  // ---------- cárceles: barras por año ----------
  const PPL_OPTS = [["total", "Total"], ["hombres", "Hombres"], ["mujeres", "Mujeres"]];
  let pplKey = "total";
  const segEl = document.getElementById("ppl-seg");
  PPL_OPTS.forEach(([k, label]) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("role", "radio"); b.textContent = label;
    b.setAttribute("aria-checked", String(k === pplKey));
    b.onclick = () => {
      pplKey = k;
      segEl.querySelectorAll("button").forEach((x) => x.setAttribute("aria-checked", "false"));
      b.setAttribute("aria-checked", "true");
      renderPpl();
    };
    segEl.appendChild(b);
  });

  function barChart(hostId, rows, key, opts) {
    const host = document.getElementById(hostId);
    const W = host.clientWidth, H = opts.H || 280, m = { t: 24, r: 8, b: 28, l: 48 };
    const svg = d3.select(host).html("").append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", opts.label);
    const x = d3.scaleBand().domain(rows.map((d) => d.anio)).range([m.l, W - m.r]).paddingInner(W < 500 ? 0.15 : 0.25);
    const y = d3.scaleLinear().domain([0, d3.max(rows, (d) => d[key])]).nice().range([H - m.b, m.t]);
    const every = Math.ceil(rows.length / Math.max(4, Math.floor(W / 70)));
    axes(svg, x, y, W, H, m, 4, (d) => num(d),
      d3.axisBottom(x).tickValues(rows.map((d) => d.anio).filter((a, i) => i % every === 0 || i === rows.length - 1)).tickSize(0).tickPadding(8));
    const c = css("--s1");
    const g = svg.append("g").selectAll("g").data(rows).join("g");
    g.append("path").attr("fill", c).attr("d", (d) => roundedBar(x(d.anio), y(0), x.bandwidth(), y(d[key])));
    const labelIdx = opts.labelAll ? rows.map((_, i) => i) : [0, rows.length - 1];
    g.filter((d, i) => labelIdx.includes(i)).append("text").attr("class", "val").attr("text-anchor", "middle")
      .attr("x", (d) => x(d.anio) + x.bandwidth() / 2).attr("y", (d) => y(d[key]) - 6).text((d) => num(d[key]));
    g.append("rect").attr("fill", "transparent").attr("x", (d) => x(d.anio) - 1).attr("width", x.bandwidth() + 2)
      .attr("y", m.t).attr("height", H - m.t - m.b)
      .on("pointermove", (ev, d) => showTip(opts.tip(d), ev)).on("pointerleave", hideTip);
  }

  function renderPpl() {
    const label = PPL_OPTS.find(([k]) => k === pplKey)[1];
    barChart("chart-ppl", ppl, pplKey, {
      label: `Personas privadas de libertad (${label.toLowerCase()}), diciembre de cada año, ${ppl[0].anio}–${pplUlt.anio}`,
      tip: (d) => `<b>Diciembre ${d.anio}</b><div class="row">Total<strong>${num(d.total)}</strong></div><div class="row">Hombres<strong>${num(d.hombres)}</strong></div><div class="row">Mujeres<strong>${num(d.mujeres)}</strong></div>`,
    });
  }

  function renderNac() {
    const base = nac[0].nacimientos;
    barChart("chart-nac", nac, "nacimientos", {
      labelAll: document.getElementById("chart-nac").clientWidth > 520,
      label: `Nacimientos por año, ${nac[0].anio}–${nac[nac.length - 1].anio}`,
      tip: (d) => `<b>${d.anio}</b><div class="row">Nacimientos<strong>${num(d.nacimientos)}</strong></div><div class="row">Contra ${nac[0].anio}<strong>${d.anio === nac[0].anio ? "—" : Math.round((d.nacimientos / base - 1) * 100) + "%"}</strong></div>`,
    });
  }

  function renderAll() { renderMotivo(); renderPpl(); renderNac(); }
  renderAll();
  let raf;
  addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(renderAll); });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderAll);
})();
