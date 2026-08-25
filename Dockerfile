FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat python3 make g++

ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/build?schema=public

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json tsconfig.build.json nest-cli.json webpack.config.js ./
COPY src ./src

RUN npm ci
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl libc6-compat wget

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src/prisma ./src/prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
