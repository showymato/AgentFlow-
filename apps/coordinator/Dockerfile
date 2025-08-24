FROM node:20-alpine AS base

# Install Redis for local development
RUN apk add --no-cache redis

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

# Build the coordinator
RUN npm run build --workspace=@agentflow/xnode

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 coordinator
RUN adduser --system --uid 1001 coordinator

# Copy built application
COPY --from=builder --chown=coordinator:coordinator /app/apps/xnode/dist ./dist
COPY --from=deps --chown=coordinator:coordinator /app/node_modules ./node_modules

USER coordinator

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "dist/coordinator.js"]
