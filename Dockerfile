# Stage 1: Build Admin Panel
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only admin panel package files and install dependencies
COPY backend/admin-web/package*.json ./admin-web/
RUN cd admin-web && npm ci

# Copy admin panel source and build
COPY backend/admin-web ./admin-web
RUN cd admin-web && npm run build

# Stage 2: Build Backend Image
FROM node:20-alpine AS backend

WORKDIR /app

# Install backend dependencies (production only)
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend ./

# Copy built admin panel from builder stage
COPY --from=builder /app/admin-web/dist ./admin-web/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend port
EXPOSE 5000

# Start backend
CMD ["node", "server.js"]
