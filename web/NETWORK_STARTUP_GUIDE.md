# 🌐 Network Startup Guide - Port 8080

## 🚀 Quick Start Commands

### Option 1: Using npm script (Recommended)
```bash
npm run dev:8080
```

### Option 2: Using the custom script
```bash
node start-network-8080.js
```

### Option 3: Manual command
```bash
PORT=8080 HOSTNAME=0.0.0.0 npm run dev
```

## 📡 Network Access

Once started, your medical sharing system will be available at:

- **Local Access**: http://localhost:8080
- **Network Access**: http://[YOUR_IP]:8080

### Finding Your Network IP

**On macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig | findstr "IPv4"
```

## 🔧 Environment Configuration

The app will automatically configure:
- **Port**: 8080
- **Host**: 0.0.0.0 (allows network access)
- **Environment**: Development mode with hot reload

## 🎯 Testing the Medical Sharing System

Once the server is running:

### 1. **Access the App**
- Open http://localhost:8080 in your browser
- Or use your network IP: http://[YOUR_IP]:8080

### 2. **Test Share Creation**
- Go to Reports page
- Click any green "Share" button
- Create a share link
- Verify you see the success screen with a copyable link

### 3. **Test Share Management**
- Click "Manage Shares" in the header
- Verify the page loads without the `shareLinks.map` error
- View your created shares

### 4. **Test Share Links**
- Copy a generated share link
- Open it in a new browser/incognito window
- Verify the professional medical view loads

## 🛡️ Security Notes

- **Development Only**: This network configuration is for development
- **Firewall**: Your system firewall may block external access
- **HTTPS**: Production should use HTTPS for medical data
- **Authentication**: Share links have built-in security tokens

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9
```

### Network Access Issues
- Check firewall settings
- Ensure you're on the same network
- Try different network interfaces

### Share System Issues
- Check browser console for errors
- Verify database connection
- Test API endpoints at http://localhost:8080/api/share-links

## 📱 Mobile Testing

With network access, you can test on mobile devices:
1. Connect mobile device to same WiFi
2. Open http://[YOUR_IP]:8080 on mobile browser
3. Test share creation and management
4. Verify responsive design

## 🎉 Ready to Share!

Your medical sharing system is now accessible across your network on port 8080. The fixes we implemented should resolve:

✅ Share creation now shows the actual link
✅ Share management loads without errors  
✅ Professional medical view works for recipients
✅ Mobile-responsive design
✅ Network access for testing on multiple devices

Happy sharing! 🚀