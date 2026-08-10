# Production Dockerfile — builds all three SonicStream services in one image.
# Which service runs is selected at deploy time via SONIC_ROLE (server|worker|scheduler).
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
# --ignore-scripts: postinstall runs `npm run build`, which must not fire before
# the source is copied in.
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
# Production deps only. --ignore-scripts is REQUIRED here: postinstall triggers
# a full client build, and vite lives in devDependencies — without this flag the
# image can never build (this was a live bug in the previous Dockerfile).
RUN npm ci --omit=dev --ignore-scripts

# Built bundles + client assets only (never the builder's dev node_modules)
COPY --from=builder /app/dist ./dist
# V12 Constitution anchor files — REQUIRED: production boots fail-closed
# (Art. I §1.3) and will refuse to start if these are absent from the image.
COPY --from=builder /app/constitution ./constitution
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh && mkdir -p /app/storage /app/uploads /app/logs

ENV NODE_ENV=production
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/health/live').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

EXPOSE 8080

# Role-aware entrypoint: previously CMD was hardcoded to server.cjs, so
# "worker" and "scheduler" deployments silently ran the API server instead.
ENTRYPOINT ["./docker-entrypoint.sh"]
