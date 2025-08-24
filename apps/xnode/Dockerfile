FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    docker-cli \
    curl \
    && rm -rf /var/cache/apk/*

# Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY apps/xnode/package.json ./apps/xnode/
COPY packages/engine/package.json ./packages/engine/

RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the xNode application
RUN npm run build --workspace=@agentflow/xnode

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 xnode
RUN adduser --system --uid 1001 xnode

# Copy built application
COPY --from=builder --chown=xnode:xnode /app/apps/xnode/dist ./dist
COPY --from=builder --chown=xnode:xnode /app/packages/engine/dist ./packages/engine/dist
COPY --from=deps --chown=xnode:xnode /app/node_modules ./node_modules

# Create directories for sandboxed execution
RUN mkdir -p /app/sandbox /app/logs && chown -R xnode:xnode /app/sandbox /app/logs

USER xnode

EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8081/health || exit 1

CMD ["node", "dist/index.js"]
