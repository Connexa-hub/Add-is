# =========================
# 1. Base build stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./
RUN npm install

# Copy backend source
COPY backend .

# Build admin panel inside backend/admin-web
WORKDIR /app/admin-web
COPY backend/admin-web/package*.json ./
RUN npm install --legacy-peer-deps && npm run build
# =========================
# 2. Final stage
# =========================
FROM node:20-alpine

WORKDIR /app

# Copy backend code from builder
COPY --from=builder /app /app

# Ensure production environment
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "server.js"]
