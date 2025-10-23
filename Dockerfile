# Stage 1: Build admin panel
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only admin panel files to reduce build context
COPY backend/admin-web/package*.json ./admin-web/
RUN cd admin-web && npm ci

# Copy source code and build admin panel
COPY backend/admin-web ./admin-web
RUN cd admin-web && npm run build

# Stage 2: Build backend image
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

# Expose port
EXPOSE 5000

# Start backend
CMD ["node", "server.js"]
