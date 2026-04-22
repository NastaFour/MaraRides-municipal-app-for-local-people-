# ── Fase de Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifests de monorepo
COPY package.json package-lock.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/shared/package.json ./packages/shared/

# Instalar dependencias
RUN npm ci --legacy-peer-deps --workspace=packages/api --workspace=packages/shared --include-workspace-root

# Copiar código fuente
COPY packages/api ./packages/api
COPY packages/shared ./packages/shared

# Generar el cliente de Prisma
COPY packages/api/prisma ./packages/api/prisma
RUN npx prisma generate --schema=packages/api/prisma/schema.prisma

# Compilar TypeScript
RUN npm run build --workspace=packages/api

# ── Fase de Producción ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Solo copiar lo necesario
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/prisma ./packages/api/prisma
COPY --from=builder /app/packages/api/package.json ./packages/api/
COPY --from=builder /app/package.json ./

EXPOSE 3001

CMD ["node", "packages/api/dist/index.js"]
