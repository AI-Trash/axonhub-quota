FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN npm install -g pnpm@10.32.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build:all

FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

RUN npm install -g pnpm@10.32.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/

RUN pnpm install --filter ./server... --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
