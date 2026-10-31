<!-- skillsGV:kernel:start -->
## skillsGV — catálogo de skills (modo gentle-ai)

Este repositorio tiene el catálogo skillsGV instalado y el harness gentle-ai activo.

- **Skills**: elegí ≤5 skills relevantes por tarea desde tu índice de skills y leé solo esos `SKILL.md`; el catálogo es capa de conocimiento, no capa de proceso.
- **Proceso**: ODD exclusivo (Organic Driven Development), gobernado por Gentle-AI 4.3.1 (`default-inline`: ningún trigger aplica por defecto; delegación solo por razón real: exploración >1 batch de ≤3 llamadas/~10k tokens o >~5 búsquedas secuenciales, 2+ writers paralelos con superficies disjuntas o backstop de ~150k tokens, o verificador independiente para ítems de alto riesgo 1-6 en tmpdir aislado `mktemp -d`). Clasificación por 3 criterios (Understood, Contained risk, Resumable from `git diff` alone); micro-blueprint pre-flight de 5 líneas para ejecución one-shot; commits en slices revisables de ~400 líneas (alto riesgo aislado); gate final de CVEs recientes (`live-cve-security-intel`); cierre con evidencia observada y línea `Risk: item N (reason)` o `Risk: none`.
- **Instalaciones ya gitignoradas** (`.skills-install/` y skills): no las commitees.
- **Floor, Not Ceiling (Enseñanza > Dogma)**: Las skills proveen el piso de ingeniería y diseño; salvo en invariantes de seguridad, `pnpm-only` y verificación real, el modelo está autorizado a proponer mejoras, APIs modernas o direcciones creativas que superen el baseline cuando beneficien al proyecto.
<!-- skillsGV:kernel:end -->
