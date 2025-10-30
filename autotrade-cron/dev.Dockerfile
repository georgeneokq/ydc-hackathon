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

COPY autotrade-cron/package.json ./autotrade-cron/

# Database management
COPY prisma ./prisma

# Install dependencies
RUN mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile

# Generate prisma
RUN pnpm exec prisma generate

# Copy code
COPY autotrade-cron/src ./autotrade-cron/src/

WORKDIR /app/autotrade-cron

ENTRYPOINT ["pnpm", "dev"]
