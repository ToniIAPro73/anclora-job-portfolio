# Checklist de validación — unificación al flujo development → main

**Alcance:** el repositorio pasa del modelo `MAIN_ONLY` al flujo único de Anclora: trabajo en `development`, rama por defecto `development`, ramas `staging`, `production` y `main`, y `promote.yml` (fast-forward) para promocionar. Se actualiza el contrato `.anclora/PRODUCTION_RUNTIME.md` y los adaptadores con `anclora-mods/scripts/adopt-repo.mjs migrate`. No cambia código ni comportamiento de la aplicación.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| `adopt-repo.mjs migrate` | MIGRATED |
| `promote.yml` idéntico a la plantilla de `anclora-mods` | PASS |
| Tests del adopter (`adopt-repo.test.mjs`) | PASS — 5 tests |

## Verificación visual

No aplica: solo contrato y workflow.

## Promoción

Se promueve `development` → `staging` → `production` → `main` tras crear las ramas que faltan en el mismo SHA que `main`.
