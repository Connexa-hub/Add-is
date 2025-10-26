# ----------------------
# Stage 1: Build Admin Web
# ----------------------
FROM node:20-alpine AS admin-build

WORKDIR /app/admin-web

# Copy only package files first for caching
COPY backend/admin-web/package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy admin source files
COPY backend/admin-web .

# Build admin for production
RUN npm run build

# ----------------------
# Stage 2: Build Backend
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

# Install backend dependencies
RUN npm install

# Copy backend source
COPY backend .

# Copy built admin dashboard from previous stage
COPY --from=admin-build /app/admin-web/dist ./admin-web/dist

# Expose port
EXPOSE 5000

# Set environment variable for production
ENV NODE_ENV=production

# Start the server
CMD ["node", "server.js"]
