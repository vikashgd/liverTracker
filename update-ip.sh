#!/bin/bash

# Get current IP address
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

echo "🔍 Current IP Address: $CURRENT_IP"

# Update .env.local file
cd web
if [ -f .env.local ]; then
    # Backup current .env.local
    cp .env.local .env.local.backup
    
    # Update NEXTAUTH_URL with new IP
    sed -i '' "s|NEXTAUTH_URL=http://[0-9.]*:3000|NEXTAUTH_URL=http://$CURRENT_IP:3000|g" .env.local
    
    echo "✅ Updated .env.local with new IP address"
    echo "📝 New NEXTAUTH_URL: http://$CURRENT_IP:3000"
    
    echo ""
    echo "🚀 MOBILE ACCESS INSTRUCTIONS:"
    echo "1. On your mobile device, go to: http://$CURRENT_IP:3000"
    echo "2. Bookmark this URL for easy access"
    echo "3. The server is already running and should work now"
    
    echo ""
    echo "🔄 Restart the development server for changes to take effect:"
    echo "   npm run dev:network"
else
    echo "❌ .env.local file not found!"
fi
