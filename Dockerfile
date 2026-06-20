# ----------------------
# Stage 1: Build Admin Web
# ----------------------
FROM node:20-alpine AS admin-build

WORKDIR /app/admin-web

# Copy package files for caching
COPY backend/admin-web/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy admin source files
COPY backend/admin-web/ .

# Build admin for production
RUN npm run build

# ----------------------
# Stage 2: Production Server
# ----------------------
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache bash curl clamav clamav-libunrar \
    && freshclam \
    && mkdir -p /run/clamav \
    && chown clamav:clamav /run/clamav

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (production only)
RUN npm install --omit=dev

# Copy backend source
COPY backend/ .

# Copy built admin dashboard from stage 1
COPY --from=admin-build /app/admin-web/dist ./admin-web/dist

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose port (Cloud providers often provide PORT env)
# The server.js uses process.env.PORT || 3001
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production

# Health check using a shell to handle PORT variable
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3001}/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
