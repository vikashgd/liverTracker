# LiverTracker Network Access Guide

## 🌐 Accessing LiverTracker from Other Devices on Same Network

### Quick Start

1. **Start the app for network access:**
   ```bash
   cd /Users/vikashkr/Downloads/LiverTracker/web
   npm run dev:network
   ```

2. **Find your Mac's IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   Look for something like: `inet 192.168.1.xxx`

3. **Access from other devices:**
   Open browser on any device on same WiFi network and go to:
   ```
   http://YOUR_MAC_IP:3000
   ```
   Example: `http://192.168.1.100:3000`

---

## 📱 Detailed Instructions by Device Type

### iPhone/iPad
1. Connect to the same WiFi network as your Mac
2. Open Safari
3. Type: `http://192.168.1.xxx:3000` (replace with your Mac's IP)
4. Add to Home Screen for easy access:
   - Tap Share button
   - Select "Add to Home Screen"
   - Name it "LiverTracker"

### Android Phone/Tablet
1. Connect to same WiFi network
2. Open Chrome/Browser
3. Navigate to: `http://192.168.1.xxx:3000`
4. Add to Home Screen:
   - Tap menu (⋮)
   - Select "Add to Home screen"

### Windows PC/Laptop
1. Connect to same WiFi network
2. Open any browser (Chrome, Edge, Firefox)
3. Go to: `http://192.168.1.xxx:3000`
4. Bookmark for easy access

### Other Mac/MacBook
1. Connect to same WiFi network
2. Open Safari/Chrome
3. Navigate to: `http://192.168.1.xxx:3000`

---

## 🔧 Configuration Details

### Available Commands
```bash
# Development with network access
npm run dev:network          # Starts dev server on 0.0.0.0:3000

# Production with network access  
npm run build                # Build the app
npm run start:network        # Start production server on 0.0.0.0:3000

# Local only (default)
npm run dev                  # Local development only
npm start                    # Local production only
```

### Finding Your IP Address

**Method 1: Command Line**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Method 2: System Preferences**
1. Apple Menu → System Preferences
2. Network
3. Select your WiFi connection
4. Your IP address is shown on the right

**Method 3: Network Utility**
1. Applications → Utilities → Network Utility
2. Select "Info" tab
3. Choose your network interface

---

## 🔒 Security Considerations

### Firewall Settings
Your Mac's firewall might block incoming connections:

1. **Check Firewall:**
   - System Preferences → Security & Privacy → Firewall
   - If enabled, click "Firewall Options..."
   - Ensure Node.js/Terminal is allowed

2. **Alternative: Disable temporarily**
   - Turn off firewall while testing
   - Remember to turn back on later

### Network Security
- This setup only works on your local network
- Data stays within your home/office network
- Not accessible from the internet
- Use strong WiFi password

---

## 🛠️ Troubleshooting

### Common Issues

**1. Cannot Connect from Other Device**
```bash
# Check if app is running with network binding
netstat -an | grep 3000
# Should show: *.3000 or 0.0.0.0:3000
```

**2. App Starts but Shows Error**
- Ensure you're using `npm run dev:network` not `npm run dev`
- Check firewall settings
- Verify IP address is correct

**3. Slow Loading**
- This is normal for development mode
- For faster access, use production mode:
  ```bash
  npm run build
  npm run start:network
  ```

**4. Authentication Issues**
- Clear browser cache on the accessing device
- Ensure both devices use same network time

### Debug Commands
```bash
# Check what's listening on port 3000
lsof -i :3000

# Test connectivity from another device
ping YOUR_MAC_IP

# Check network interface
ifconfig en0    # Usually WiFi interface
```

---

## 🚀 Advanced Setup

### Custom Port
If port 3000 is busy:
```bash
# Edit package.json
"dev:network": "next dev --turbopack -H 0.0.0.0 -p 3001"
```

### HTTPS Setup (Optional)
For secure connections:
1. Generate self-signed certificate
2. Modify Next.js config
3. Access via `https://YOUR_IP:3000`

### Router Configuration
For access from outside your local network:
1. Set up port forwarding on your router
2. Configure dynamic DNS
3. Use VPN for secure remote access

---

## 📚 Additional Resources

- [Next.js CLI Documentation](https://nextjs.org/docs/api-reference/cli)
- [Network Troubleshooting Guide](https://support.apple.com/guide/mac-help/troubleshoot-your-internet-connection-mh15072/mac)
- [Firewall Configuration](https://support.apple.com/guide/mac-help/block-connections-to-your-mac-with-a-firewall-mh34041/mac)

---

## 🆘 Need Help?

If you're still having issues:
1. Check all devices are on the same WiFi network
2. Try accessing from the Mac's browser first: `http://localhost:3000`
3. Verify the IP address hasn't changed
4. Restart the development server
5. Check for macOS software updates

**Quick Test:**
```bash
# On your Mac, test network binding:
curl http://0.0.0.0:3000
# Should return the LiverTracker homepage
```
