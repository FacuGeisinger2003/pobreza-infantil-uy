# Uruguay en datos

Investigación personal con **datos oficiales** sobre problemas de Uruguay, procesados en Databricks y visualizados en una web con D3.js.

🔗 **Sitio:** _(link de Vercel)_

## Capítulos

| # | Tema | Fuente | Notebook |
|---|---|---|---|
| 01 | Pobreza infantil | ECH 2024–2025 (INE), microdatos | `01_ingesta`, `02_silver`, `03_gold` |
| 02 | Homicidios y cárceles | Ministerio del Interior, datos abiertos | `04_seguridad` |
| 03 | Natalidad | MSP, estadísticas vitales | `06_demografia` |

## Hallazgos

- En 2024, el **32,2%** de los niños de 0 a 5 años vivía en hogares pobres, contra el **6,3%** de los mayores de 65.
- Los homicidios por **conflictos entre criminales** pasaron de 77 (2013) a 215 (2025). Hoy son el 57% del total.
- La población presa pasó de **6.757** (2003) a **16.107** (2024).
- Los nacimientos cayeron **39%** entre 2015 y 2024.

## Pipeline

Arquitectura medallion en Databricks (Unity Catalog, schema `workspace.pobreza`):

- **bronze:** datos crudos tal cual vienen de la fuente
- **silver:** limpieza y selección de variables
- **gold:** agregados, exportados a `data/*.json`

La web (`index.html` + `assets/`) es estática y lee esos JSON.

## Stack

Databricks (PySpark, Delta) · D3.js · Vercel
