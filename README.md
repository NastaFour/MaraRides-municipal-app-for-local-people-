# Sistema de Transporte Local — Mototaxis Municipales

Plataforma de gestión de mototaxis con tracking GPS en tiempo real, panel de administración municipal, app móvil para clientes y conductores.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| App Móvil | React Native + Expo SDK 54 + TypeScript |
| Web Dashboard | React + Vite + TypeScript + Tailwind CSS |
| Backend API | Node.js + Express.js + TypeScript |
| Base de Datos | PostgreSQL |
| ORM | Prisma ORM v5 |
| Tiempo Real | Socket.io |
| Autenticación | JWT + bcryptjs |
| Estructura | Monorepo — NPM Workspaces |

---

## Requisitos Previos

- Node.js 20+
- PostgreSQL (local o en la nube)
- Expo Go instalado en el celular (Android/iOS)

---

## Configuración Local

### 1. Clonar e instalar dependencias

```bash
git clone <repo>
cd sistema-transporte
npm install --legacy-peer-deps
```

### 2. Variables de entorno

```bash
# Copia el ejemplo y edita con tus valores
cp .env.example packages/api/.env
cp .env.example packages/mobile/.env
cp .env.example packages/dashboard/.env
```

Edita `packages/api/.env` con la URL de tu PostgreSQL local.

### 3. Inicializar la base de datos

```bash
# Generar el cliente Prisma
npx prisma generate --schema=packages/api/prisma/schema.prisma

# Crear las tablas
npx prisma db push --schema=packages/api/prisma/schema.prisma

# Cargar datos de prueba
node packages/api/clear-trips.js     # limpiar viajes huérfanos (si los hay)
npx ts-node packages/api/src/prisma/seed.ts
```

**Usuarios de prueba:**
| Rol | Teléfono | Contraseña |
|---|---|---|
| Cliente | 0414-1234567 | cliente123 |
| Conductor | 0416-1111111 | conductor123 |
| Admin | 0000000000 | admin123 |

### 4. Iniciar en desarrollo

```bash
# Terminal 1: API + Sockets
npm run api

# Terminal 2: Dashboard de admin
npm run dashboard

# Terminal 3: App móvil (Expo Go)
npm run dev --workspace=packages/mobile -- --clear
```

Asegúrate de editar `packages/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3001
```
Reemplaza `TU_IP_LOCAL` con tu IP de red WiFi (ej: `192.168.0.104`).

---

## Deployment en Producción

### API → Railway

1. Crea un proyecto en [railway.app](https://railway.app)
2. Conecta el repositorio GitHub
3. Railway detectará el `railway.json` y usará el `Dockerfile`
4. Agrega las variables de entorno en el panel de Railway:
   - `DATABASE_URL` — URL de tu PostgreSQL de Railway
   - `JWT_SECRET` — string aleatorio seguro
   - `NODE_ENV=production`
   - `CORS_ORIGINS` — URL de tu dashboard en Vercel

### Dashboard → Vercel

1. Crea un proyecto en [vercel.com](https://vercel.com)
2. Conecta el repositorio GitHub
3. Configura:
   - **Root directory:** `packages/dashboard`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
4. Agrega variables de entorno:
   - `VITE_API_URL` — URL de Railway
   - `VITE_SOCKET_URL` — URL de Railway (misma)

### App Móvil → APK (Expo EAS Build)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Iniciar sesión en Expo
eas login

# Configurar el proyecto (solo primera vez)
cd packages/mobile
eas init

# Build APK para pruebas internas
eas build --platform android --profile preview

# Build AAB para Play Store
eas build --platform android --profile production
```

> **Nota:** Antes de hacer el build, actualiza la URL del API en `packages/mobile/eas.json`:
> ```json
> "EXPO_PUBLIC_API_URL": "https://tu-proyecto.up.railway.app"
> ```

---

## Scripts Útiles

```bash
npm run api          # Inicia el servidor API en modo desarrollo
npm run dashboard    # Inicia el dashboard en modo desarrollo
npm run build --workspace=packages/api       # Compila API para producción
npm run build --workspace=packages/dashboard  # Compila Dashboard para producción
node packages/api/clear-trips.js            # Limpia viajes atascados en BD
```

---

## Arquitectura del Proyecto

```
/
├── packages/
│   ├── api/          # Servidor Express + Socket.io
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── middlewares/
│   │   │   ├── sockets/
│   │   │   └── lib/
│   │   └── prisma/
│   ├── dashboard/    # React Admin Panel
│   │   └── src/
│   ├── mobile/       # React Native + Expo
│   │   └── app/
│   └── shared/       # Tipos TypeScript compartidos
├── Dockerfile        # Para deployment en Railway
├── railway.json      # Config de Railway
├── vercel.json       # Config de Vercel
└── .env.example      # Variables de entorno documentadas
```
