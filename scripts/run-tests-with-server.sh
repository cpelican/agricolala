#!/usr/bin/env bash

# Start the Next.js server in the background
echo "Starting Next.js server..."
npm run dev &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to be ready..."
sleep 5

# Run the tests
echo "Running tests..."
npm test

# Stop the server
echo "Stopping server..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null

echo "Tests completed" 