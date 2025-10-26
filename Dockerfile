# ========================= 1. Build Stage 
# =========================
FROM node:20-alpine AS builder WORKDIR /app
# Install required tools for building and 
# ClamAV engine
RUN apk add --no-cache \ git \ python3 \ make 
    \ g++ \ clamav \ clamav-libunrar \ 
    clamav-daemon
# Copy backend dependencies and install
COPY backend/package*.json ./ RUN npm install 
--legacy-peer-deps
# Copy backend source
COPY backend .
# Build the admin panel inside 
# backend/admin-web
WORKDIR /app/admin-web COPY 
backend/admin-web/package*.json ./ RUN npm 
install --legacy-peer-deps COPY 
backend/admin-web ./ RUN npm run build
# ========================= 2. Production 
# Stage =========================
FROM node:20-alpine WORKDIR /app
# Install ClamAV runtime dependencies
RUN apk add --no-cache \ clamav \ 
    clamav-libunrar \ clamav-daemon
# Copy everything from builder
COPY --from=builder /app /app
# Update ClamAV database before startup
RUN freshclam || true
# Set environment variables
ENV NODE_ENV=production ENV PORT=5000
# Expose port
EXPOSE 5000
# Start ClamAV daemon before the app
CMD freshclam && clamd & node server.js
