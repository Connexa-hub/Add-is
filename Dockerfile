FROM node:20-alpine AS base

WORKDIR /app

FROM base AS backend-deps
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

FROM base AS admin-build
COPY backend/admin-web/package*.json ./backend/admin-web/
WORKDIR /app/backend/admin-web
RUN npm ci
COPY backend/admin-web/ ./
RUN npm run build

FROM base AS production
WORKDIR /app/backend

COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/ ./

COPY --from=admin-build /app/backend/admin-web/dist ./admin-web/dist

RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 8000, path: '/api/health', timeout: 5000 }; const req = http.get(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1));"

CMD ["node", "server.js"]
