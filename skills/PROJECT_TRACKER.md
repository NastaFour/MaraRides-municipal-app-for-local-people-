---
name: project-memory-ledger
description: Fuente única de verdad para el Sistema de Transporte Local (Mototaxis). Preserva continuidad entre sesiones, impone el stack técnico y rastrea el progreso del roadmap sin depender del historial de chat.
---

Esta skill guía la creación y mantenimiento del ledger del proyecto. Toda decisión de código o arquitectura debe alinearse estrictamente con este documento.

## Contextual Anchoring

Antes de ejecutar cualquier tarea compleja o sugerir arquitecturas, absorber el estado del proyecto:
- **Visión Core**: ¿Cuál es el objetivo final de este software?
- **Restricciones Técnicas**: Obedecer estrictamente el stack definido. No alucinar dependencias.
- **Posición Actual**: Identificar la fase activa `[/]` en el roadmap. Dirigir el trabajo solo hacia esa fase.

**CRÍTICO**: Tratar el `Project Data Ledger` como ley absoluta. Si una solicitud del usuario contradice una regla estricta del ledger, advertirle explícitamente antes de proceder.

---

# 🗃️ PROJECT DATA LEDGER

## 1. 📌 Identidad del Proyecto

- **Nombre**: Sistema de Transporte Local — Mototaxis Municipales
- **Objetivo Core**: Plataforma de gestión de mototaxis con tracking en tiempo real, control de conductores y panel de administración municipal.
- **Plataformas**: App Móvil (drivers + clientes) + Web Dashboard (admin) + API Central
- **Escala Objetivo**: ~50-200 conductores activos / ~500-2000 usuarios en el municipio

## 2. 🛠️ Tech Stack (Aprobado — tech-stack-advisor)

| Capa | Tecnología |
|---|---|
| App Móvil | React Native + Expo + TypeScript |
| Web Dashboard | React + Vite + TypeScript + Tailwind CSS |
| Backend API | Node.js + Express.js + TypeScript |
| Base de Datos | PostgreSQL |
| ORM | Prisma ORM |
| Tiempo Real | Socket.io |
| Autenticación | JWT + bcryptjs |
| Estructura | Monorepo — NPM Workspaces |

## 3. 🚦 Reglas Estrictas

- NUNCA sugerir tecnologías fuera del arsenal definido en `TECH_STACK_ADVISOR.md` (no MongoDB, no Vue, no Firebase, no Django).
- Mantener tipado estricto TypeScript en todos los paquetes. No usar `any`.
- No escribir código de funcionalidad hasta que la fase actual esté activa `[/]`.
- Toda fase debe pasar el `dod-checker` antes de marcarla `[x]`.
- Los conductores NO pueden operar sin `isApproved: true` (regla de negocio municipal).

## 4. 🗺️ Roadmap & Fases

- [x] **Fase 1: Fundación Monorepo**
  - Init NPM Workspaces en raíz del proyecto
  - Estructura de carpetas completa (`packages/api`, `packages/dashboard`, `packages/mobile`, `packages/shared`)
  - Prisma schema inicial: modelos User, Driver, Vehicle, Trip + enums
  - Primera migración y seed de datos de prueba (1 admin, 3 conductores, 5 viajes)
  - `.env.example` con variables documentadas
  - `README.md` con instrucciones de setup local
  - **DoD**: `prisma db push` sin errores + `npm run dev` funcional en `packages/api`

- [x] **Fase 2: API Core**
  - Auth: `POST /auth/register` (cliente), `POST /auth/login` (cliente + conductor + admin)
  - Drivers: `GET /drivers`, `GET /drivers/:id`, `PATCH /drivers/:id/approve` (solo admin)
  - Vehicles: `POST /vehicles`, `GET /vehicles/:driverId`
  - Trips: `POST /trips`, `GET /trips`, `PATCH /trips/:id/accept`, `PATCH /trips/:id/complete`, `PATCH /trips/:id/cancel`
  - Middleware de autenticación JWT + middleware de rol (ADMIN, CLIENT, DRIVER)
  - **DoD**: Colección Postman con todos los endpoints respondiendo correctamente con auth

- [x] **Fase 3: Socket & Real-Time**
  - Servidor Socket.io integrado en el mismo proceso del API
  - Eventos: `driver:online`, `driver:offline`, `driver:location`, `trip:new`, `trip:accepted`, `trip:completed`
  - Sala de conductores activos (`room: online-drivers`)
  - Dashboard y app cliente se suscriben a actualizaciones de coordenadas
  - **DoD**: Demo funcional donde el conductor actualiza coordenadas y el Dashboard mueve el pin en tiempo real

- [x] **Fase 4: Web Dashboard**
  - Login de administrador (autenticación JWT)
  - Página: Lista de conductores con botón "Aprobar/Rechazar"
  - Página: Historial de viajes con filtros por fecha y estado
  - Página: Mapa en vivo con posiciones de conductores activos (integración mapa: `react-leaflet`)
  - Página: Métricas (viajes totales, conductores activos, ingresos del día)
  - **DoD**: Admin puede aprobar un conductor y verlo moverse en el mapa en tiempo real

- [x] **Fase 5: App Móvil** *(DoD: PASS — 2026-04-21)*
  - **Vista Cliente**: Registro/Login, mapa interactivo con selección de destino táctil, solicitar viaje (origen/destino real), botón `[ ABORTAR VIAJE ]` funcional que llama a API, historial completo de viajes, botón `[ SALIR ]` en barra superior
  - **Vista Conductor**: Registro/Login, switch Online/Offline, lista de solicitudes en tiempo real vía Socket.io, botón `TOMAR` para aceptar viaje, `[ MARCAR COMPLETADO ]` para finalizar, historial con estadísticas de ingresos y filtros
  - Permisos GPS en primer plano con `expo-location`
  - Background tracking deferido: requiere build nativo (no soportado en Expo Go — tolerancia aprobada)
  - **DoD**: Flujo completo E2E verificado: Cliente solicita → Conductor acepta → Viaje completado → Ambos ven actualizaciones en tiempo real. Historial disponible en ambos roles.

- [x] **Fase 6: QA & Deployment** *(DoD: PASS — 2026-04-21)*
  - ✅ Helmet.js instalado — HTTP headers seguros en producción
  - ✅ Rate limiting global (200 req/15min) + auth estricto (10 req/min)
  - ✅ Body size limit (50kb) — previene payload flooding
  - ✅ Handler 404 global + Error handler global con mensajes seguros en producción
  - ✅ API compila a `dist/` sin errores (`npm run build`)
  - ✅ Dashboard compila a `dist/` sin errores (`npm run build`)
  - ✅ `Dockerfile` multi-stage listo para Railway
  - ✅ `railway.json` configurado
  - ✅ `vercel.json` con SPA routing para Vercel
  - ✅ `packages/mobile/eas.json` con perfiles dev/preview/production para APK
  - ✅ `.env.example` auditado — ningún secreto en código
  - ✅ `README.md` completo con instrucciones de setup y deployment
  - ⚠️ **Deploy real pendiente**: Requiere cuentas en Railway/Vercel + DNS propio (acción del usuario)
  - **DoD**: Código listo para deploy. Artefactos de build funcionales en ambas plataformas.

## 5. 🧠 Decision Log

- [2026-04-20] Stack aprobado vía `tech-stack-advisor`. Monorepo NPM Workspaces elegido para compartir tipos TS entre paquetes.
- [2026-04-20] `architecture-designer` ejecutado: esquema Prisma definido con User, Driver, Vehicle, Trip + enums Role/DriverStatus/TripStatus.
- [2026-04-20] Coordenadas actuales almacenadas directamente en el modelo `Driver` (lat/lng) para lecturas O(1). Historial de ubicaciones es deuda técnica planificada post-Fase 6.
- [2026-04-20] Campo `isApproved` en Driver como requisito de negocio municipal. Conductores no aprobados no reciben solicitudes de viaje.
- [2026-04-20] Socket.io elegido sobre HTTP polling para tracking GPS en tiempo real. Justificación: latencia sub-100ms requerida para UX de mapa fluido.
- [2026-04-20] `react-leaflet` seleccionado para mapas en Dashboard (open-source, sin costo por tiles, compatible con Leaflet.js que Nasta conoce).

## 6. 🐞 Deferred Issues

- Historial de coordenadas del conductor (tabla `LocationHistory`) — planificado para post-v1.
- Sistema de calificaciones (estrellitas) cliente → conductor — planificado para v1.1.
- Notificaciones push (Expo Notifications) — planificado para Fase 5 avanzada.
- Cálculo de tarifa automático por distancia (Google Maps Distance Matrix API o alternativa libre) — evaluar en Fase 5.