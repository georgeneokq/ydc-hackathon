FROM node:22-alpine AS runtime

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Package management
COPY package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  .npmrc \
  ./

COPY web/package.json ./web/

# Database management
COPY prisma ./prisma

# Install dependencies
RUN mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile

# Generate prisma
RUN pnpm exec prisma generate

# Copy code
COPY web/next.config.ts \
  web/postcss.config.mjs \
  web/tsconfig.json \
  ./web/
COPY web/src ./web/src/
COPY web/public ./web/public/

WORKDIR /app/web

# Disable Nextjs telemetry
RUN pnpm exec next telemetry disable

ENTRYPOINT ["pnpm", "dev"]
