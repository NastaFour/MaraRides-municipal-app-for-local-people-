# Mara Rides — Finalización de Principio a Fin
Branch: main
Delivery strategy: Atomic slices (~400 lines), direct inline, RDD gate, 3 rounds of Judgment Day
Test runner: npm test, npm run build

## Specs
- **S1**: "hagas un plan nuevo desde cero teniendo en cuenta el estado actual del proyecto con las nuevas skills para crear un plan para posteriormente ejecutar de principio a fin para dejar el proyecto finiquitado"
  - Extender Prisma schema y `@mototaxi/shared` con modelo `Rating`, campos en `Trip` (`startedAt`, `distanceKm`, `durationMin`, `paymentMethod`), campos en `Driver` (`ratingAvg`, `totalTrips`).
  - Implementar cálculo automático de tarifa (`fare.ts`).
  - Ciclo de vida completo: `REQUESTED` -> `ACCEPTED` -> `IN_PROGRESS` (con `PATCH /trips/:id/start`) -> `COMPLETED` -> `RATED` (con `POST /trips/:id/rate`).
  - Transacciones atómicas seguras contra condiciones de carrera en `acceptTrip`.
  - Sincronización de eventos WebSockets.
  - Erradicar `any` en TypeScript y crear suite de tests automatizados.
- **S2**: "En caso de rediseñar el frontend se hará el respectivo uso de mis skills."
  - Rediseñar Web Dashboard con `refactoring-ui` y `ui-ux-pro-max` (estética municipal moderna, jerarquía en escala de grises, contraste, mapa Leaflet en vivo).
  - Rediseñar App Móvil con `taste-skill`, `emil-kowalski` y `react-native` (eliminar interfaz terminal cyberpunk; incorporar bottom sheets interactivos, cotización previa, animaciones de resorte y feedback háptico).
- **S3**: "Cuando finalices el código hacemos una fase de RDD"
  - Auditoría bajo `rdd-defect-workflow`, asegurando validación de estado limpio de Git y control de presupuestos.
- **S4**: "monday no judgement day(" -> "y una fase de judgement day mínimo tres veces para dejar con menos errores posibles durante el proceso."
  - Tres rondas completas de Judgment Day (Juez A vs Juez B), síntesis adversarial y fixes quirúrgicos con `jd-fix-agent`:
    - Ronda 1: Seguridad, Auth & Concurrencia
    - Ronda 2: Integridad de Datos, WebSockets & Sincronización GPS
    - Ronda 3: UX Frontend, Edge Cases Móvil & Anti-Slop

## Tasks
- [x] T1 (S1): Actualizar Prisma Schema y Shared Types con Rating, campos de viaje (startedAt, distance, paymentMethod) y conductor | route: inline | status: completed
- [x] T2 (S1): Módulo de cálculo tarifario en backend (packages/api/src/lib/fare.ts) y validadores | route: inline | status: completed
- [x] T3 (S1): Implementar endpoints PATCH /trips/:id/start, POST /trips/:id/rate y blindar acceptTrip con transacciones aisladas | route: inline | status: completed
- [x] T4 (S1): Eventos Socket.io de ciclo de vida completo (trip:started, trip:completed, trip:rated, driver:location) | route: inline | status: completed
- [x] T5 (S2): Rediseño Web Dashboard con tokens Refactoring UI & UI-UX Pro Max (Mapas en vivo, gestión municipal, tablas de auditoría) | route: inline | status: completed
- [x] T6 (S2): Rediseño App Móvil con taste-skill & Emil Kowalski (eliminación de terminal cyberpunk, bottom sheets, cotización y seguimiento en mapa) | route: inline | status: completed
- [x] T7 (S1): Erradicación de tipos `any` y suite de tests para el API de viajes y autenticación | route: inline | status: completed
- [x] T8 (S3): Fase de RDD y verificación de invariantes con gentle-ai review assess | route: inline | status: completed
- [x] T9 (S4): Judgment Day Ronda 1: Seguridad, Auth & Concurrencia (Juez A vs Juez B + fixes) | route: inline | status: completed
- [x] T10 (S4): Judgment Day Ronda 2: Integridad de Datos, WebSockets & Sincronización GPS (Juez A vs Juez B + fixes) | route: inline | status: completed
- [x] T11 (S4): Judgment Day Ronda 3: Usabilidad Frontend, Casos Borde Móvil & Anti-Slop (Juez A vs Juez B + fixes) | route: inline | status: completed

## Log
- L1 (2026-10-31): "Necesito que hagas un plan nuevo desde cero teniendo en cuenta el estado actual del proyecto con las nuevas skills para crear un plan para posteriormente ejecutar de principio a fin para dejar el proyecto finiquitado. Cuando finalices el código hacemos una fase de RDD y una fase de use monday mínimo tres veces para dejar con menos errores posibles durante el proceso. En caso de rediseñar el frontend se hará el respectivo uso de mis skills."
- L2 (2026-10-31): "monday no judgement day(" -> Corrección de usuario confirmando que la fase es Judgment Day (3 rondas mínimas). Plan aprobado en artefacto plan-mara-rides-finiquitado.md.
- L3 (2026-10-31): Completadas Fases 1 a 4 (T1 a T7). Core de viajes con inicio y calificación, tarifas Haversine, Socket.io robusto, rediseño completo de Dashboard y App Móvil, 100% TS compilando sin errores, suite de tests en verde.
- L4 (2026-10-31): Judgment Day Ronda 1 (Seguridad, Auth & Concurrencia): Juez A (Red) detectó ventana de concurrencia en `acceptTrip` y `cancelTrip` e insuficiencia en sanitización de teléfono y longitud de contraseña. Juez B (Blue) detectó falta de normalización telefónica venezolana y endpoint universal. Síntesis orquestadora: implementado `updateMany` con condición atómica de estado en `acceptTrip` y `cancelTrip`, sanitizador de teléfono (`sanitizePhone`), validación de contraseña con `trim().length >= 6`, endpoint `POST /auth/login` unificado, y tests automatizados de concurrencia y seguridad (`concurrency-security.test.ts`). 8/8 tests en verde.
- L5 (2026-10-31): Judgment Day Ronda 2 (Integridad de Datos, WebSockets & Sincronización GPS): Juez A detectó falta de validación de coordenadas geográficas (-90..90, -180..180) y conductores descolgados indefinidamente en estado `ONLINE`. Juez B detectó necesidad de redondeo exacto de tarifas y retorno seguro de desconexión sin afectar viajes activos. Síntesis orquestadora: validación estricta de coordenadas GPS en Socket.io, transición automática a `OFFLINE` de conductores inactivos al desconectarse el socket preservando a quienes están `IN_TRIP`, y pre-solicitud de permisos en primer plano antes de segundo plano en Expo Location.
- L6 (2026-10-31): Judgment Day Ronda 3 (Usabilidad Frontend, Casos Borde Móvil & Anti-Slop): Juez A auditó listeners de Socket.io en componentes móviles y manejo de permisos denegados. Juez B auditó retroalimentación para conductores no aprobados por la municipalidad. Síntesis orquestadora: añadida coordinación de coordenadas por defecto (Municipio Mara: 10.7289, -71.7456) ante denegación o demora de GPS, banner visual de advertencia y bloqueo preventivo para mototaxistas con aprobación pendiente, y limpieza garantizada de suscripciones de sockets en unmount.
- L7 (2026-10-31): Verificación final monorepo: `npm test --workspace=packages/api` (8/8 tests passed), `npx tsc --noEmit` en `packages/mobile` (0 errores), `vite build` en `packages/dashboard` (exited 0), `npm run build` monorepo (exited 0). RDD assessment completado exitosamente. Proyecto 100% finiquitado.
