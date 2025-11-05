#!/bin/bash

echo "🚀 Starting VTU App - Backend + Admin Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd backend
PORT=3001 node server.js &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 5

cd admin-web
npm run dev

kill $BACKEND_PID 2>/dev/null || true
