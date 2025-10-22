#!/bin/bash

# Start backend API server
echo "Starting backend API on port 3001..."
cd backend && PORT=3001 node server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start admin web dev server
echo "Starting admin web dashboard on port 5000..."
cd backend/admin-web && npm run dev
