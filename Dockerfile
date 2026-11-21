# Use the official uv image as base, pinned by digest so a rebuild of the
# same tag uses the same base. To update: read the new digest of
# ghcr.io/astral-sh/uv:debian and change it here in a reviewed commit.
FROM ghcr.io/astral-sh/uv:debian@sha256:75a98164449b633920e26368bbe3217ce546f2d87d8df1eed3a718934e6e1689 AS base

# Install Node.js 22 (the version CI tests on) and pnpm directly. Node 20 is
# end of life and does not get the CVE-2026-111497 fix (upstream issue #378);
# the build fails if the installed Node 22 is older than 22.23.4.
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && node -e "const [a,b,c]=process.versions.node.split('.').map(Number); if (a!==22 || b<23 || (b===23 && c<4)) { console.error('Node '+process.versions.node+' is not 22.23.4 or later'); process.exit(1); }" \
    && npm install -g pnpm@10.12.0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED 1

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package.json files from all workspaces
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/zod-types/package.json ./packages/zod-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Build all packages and apps
RUN pnpm build

# Raise the Next.js rewrite proxy timeout. The glob follows the peer suffix
# pnpm adds to the next directory, which changes whenever React is bumped;
# fail the build if the file is missing or the patch did not apply.
RUN set -eu; \
    files=$(ls node_modules/.pnpm/next@*/node_modules/next/dist/server/lib/router-utils/proxy-request.js \
               node_modules/.pnpm/next@*/node_modules/next/dist/esm/server/lib/router-utils/proxy-request.js); \
    sed -i -e "s/30000/600000/" $files; \
    for f in $files; do grep -q 600000 "$f"; done

# Production runner stage
FROM base AS runner
WORKDIR /app

# OCI image labels
LABEL org.opencontainers.image.source="https://github.com/metatool-ai/metamcp"
LABEL org.opencontainers.image.description="MetaMCP - aggregates MCP servers into a unified MetaMCP"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.title="MetaMCP"
LABEL org.opencontainers.image.vendor="metatool-ai"

# Install curl for health checks
RUN apt-get update && apt-get install -y curl postgresql-client && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user with proper home directory
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --home /home/nextjs nextjs && \
    mkdir -p /home/nextjs/.cache/node/corepack /home/nextjs/.cache/uv && \
    chown -R nextjs:nodejs /home/nextjs

# Copy built applications
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next ./apps/frontend/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/package.json ./apps/frontend/
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/package.json ./apps/backend/
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/drizzle ./apps/backend/drizzle
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/drizzle.config.ts ./apps/backend/

# Copy built packages
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml ./
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./

# Install production dependencies only. CI=true lets pnpm replace the
# node_modules copied from the builder without asking for a TTY, and the
# lockfile keeps the result pinned.
RUN CI=true pnpm install --prod --frozen-lockfile

# Install drizzle-kit locally in backend for migrations. It is a dev
# dependency in the repo, so save it as a production one here; otherwise
# pnpm re-adds dev dependencies and conflicts with the --prod install above.
RUN cd apps/backend && CI=true pnpm add --save-prod --prod drizzle-kit@0.31.1

# Copy startup script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

# Expose frontend port (Next.js)
EXPOSE 12008

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:12008/health || exit 1

# Start both backend and frontend
CMD ["./docker-entrypoint.sh"] 