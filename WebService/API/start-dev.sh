#!/bin/bash

# RakuShield - Relayer Service Quick Start

echo "🚀 Starting Relayer Service..."
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found!"
    echo ""
    echo "For DEMO/TESTING (relayer won't actually work but UI will show toggle):"
    echo "  cp .env.demo .env"
    echo ""
    echo "For PRODUCTION (with real wallet):"
    echo "  cp .env.example .env"
    echo "  # Then edit .env with relayer wallet credentials"
    echo ""
    read -p "Use DEMO mode? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.demo .env
        echo "✅ Created .env from .env.demo"
    else
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo "⚠️  Please edit .env with wallet credentials before continuing"
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start server
echo ""
echo "🚀 Starting relayer service..."
echo "================================"
npm run dev
