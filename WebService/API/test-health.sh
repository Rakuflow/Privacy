#!/bin/bash

echo "🔍 Testing Relayer Health..."
echo "================================"
echo ""

# Test health endpoint
response=$(curl -s -w "\n%{http_code}" http://localhost:3001/health 2>&1)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "✅ Relayer is RUNNING!"
    echo ""
    echo "Response:"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    echo "================================"
    echo "✅ Frontend will show relayer toggle"
else
    echo "❌ Relayer is NOT running"
    echo ""
    echo "HTTP Code: $http_code"
    echo "Response: $body"
    echo ""
    echo "================================"
    echo "To start relayer:"
    echo "  cd relayer"
    echo "  ./start-dev.sh"
    echo ""
    echo "Or manually:"
    echo "  cd relayer"
    echo "  npm run dev"
fi
