# =========================
# Base image
# =========================
FROM node:20-alpine AS base

# =========================
# Install system dependencies
# =========================
RUN apk add --no-cache \
    bash \
    curl \
    clamav \
    clamav-libunrar \
    && freshclam \
    && mkdir -p /run/clamav \
    && chown clamav:clamav /run/clamav

# =========================
# Set working directory
# =========================
WORKDIR /app

# =========================
# Copy backend package files and install dependencies
# =========================
COPY backend/package*.json ./
RUN npm install

# =========================
# Copy backend source
# =========================
COPY backend .

# =========================
# Build admin panel
# =========================
WORKDIR /app/admin-web
COPY backend/admin-web/package*.json ./
RUN npm install --legacy-peer-deps
COPY backend/admin-web .
RUN npm run build

# =========================
# Set environment variables
# =========================
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# =========================
# Start server
# =========================
WORKDIR /app
CMD ["node", "server.js"]
