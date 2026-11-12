# syntax=docker/dockerfile:1

# Informe a mesma versão do pnpm usada localmente (`pnpm --version`):
#   docker build --build-arg PNPM_VERSION=<versão> .
ARG NODE_VERSION=26

# ---------- Stage 1: instala dependências e gera o Prisma Client ----------
FROM node:${NODE_VERSION}-alpine AS build

COPY --from=ghcr.io/pnpm/pnpm:12-alpine /opt/pnpm /opt/pnpm
RUN for bin in pnpm pn pnpx pnx; do ln -s "/opt/pnpm/$bin" "/usr/local/bin/$bin"; done

WORKDIR /app


# pnpm-workspace.yaml contém o allowBuilds (aprovação dos postinstall)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

# O prisma.config.ts exige DATABASE_URL via env(); o generate não conecta no
# banco, então um valor fictício basta apenas neste passo.
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm prisma generate

# ---------- Stage 2: imagem final de produção ----------
FROM node:${NODE_VERSION}-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=node:node /app/src ./src

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/health" || exit 1

# Executa direto o binário. O tsx resolve o
# alias @src/* via tsconfig.json.
CMD ["node_modules/.bin/tsx", "src/server.ts"]
