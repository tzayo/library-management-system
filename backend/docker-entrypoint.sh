#!/bin/sh
set -e

echo ""
echo "==========================================="
echo "🚀 Library Management System - Starting"
echo "==========================================="
echo ""

# Wait a moment for database to be fully ready
echo "⏳ Waiting for database to be ready..."
sleep 2

# Run database migrations
echo ""
echo "📦 Running database migrations..."
npm run db:migrate

# Check if migration was successful
if [ $? -ne 0 ]; then
  echo "❌ Migration failed! Exiting..."
  exit 1
fi

echo ""
echo "✅ Migrations completed successfully"
echo ""

# Start the application
echo "🚀 Starting application server..."
echo ""
exec npm start
