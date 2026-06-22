# 1. Base Image for dependency installation
FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy lockfile and package.json to install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2. Builder Stage - Compile project & generate Prisma client
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN bun prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# 3. Runner Stage - Minimal production environment
FROM node:20-alpine AS runner
# Install OpenSSL (required by Prisma Query Engine)
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Next.js public & static files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and engines for running migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

# Run migrations and then start the standalone server
CMD ["sh", "-c", "bunx prisma migrate deploy && node server.js"]
