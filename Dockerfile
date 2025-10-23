# =========================
# 1. Build Stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend dependencies and install
COPY backend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy backend source
COPY backend .

# Build the admin panel inside backend/admin-web
WORKDIR /app/admin-web
COPY backend/admin-web/package*.json ./
RUN npm install --legacy-peer-deps
COPY backend/admin-web ./
RUN npm run build

# =========================
# 2. Production Stage
# =========================
FROM node:20-alpine

WORKDIR /app

# Copy backend and admin build from builder
COPY --from=builder /app /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start the backend
CMD ["node", "server.js"]
