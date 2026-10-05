# De 100 niños uruguayos — pobreza infantil en Uruguay

Investigación personal con microdatos de la **Encuesta Continua de Hogares (ECH, INE)** 2024 y 2025.

**Hallazgo principal:** en 2024, el **32,2%** de los niños de 0 a 5 años vivía en hogares pobres, contra el **6,3%** de las personas de 65 años o más. Es unas 5 veces más.

🔗 **Sitio:** _(link de Vercel)_

## Estructura

| Archivo | Qué hace |
|---|---|
| `00_setup` | Crea el schema `workspace.pobreza` y el volume `raw` en Databricks |
| `01_ingesta` | Carga los CSV de la ECH a tablas **bronze** |
| `02_silver` | Selecciona variables clave, une los años y corrige nombres de departamentos |
| `03_gold` | Calcula tasas ponderadas (por tramo, edad y departamento) y exporta a `data/*.json` |
| `index.html` + `assets/` | Sitio web estático con D3.js que visualiza los resultados |

## Metodología

- Pobreza: variable `pobre17` (método INE 2017).
- Todas las tasas ponderadas con `W_ANO`.
- La ECH 2025 es de implantación: la comparación con 2024 es indicativa.
- Por departamento, las muestras de niños son chicas (100–400 casos), así que las variaciones interanuales tienen bastante ruido.

## Stack

Databricks (PySpark, Delta, Unity Catalog) · arquitectura medallion · D3.js · Vercel
