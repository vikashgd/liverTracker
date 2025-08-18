# 📱 Mobile Upload & Authentication Troubleshooting

## 🚨 Current Issues Identified

1. **NextAuth CLIENT_FETCH_ERROR** - Authentication not working on mobile
2. **Camera Upload Issues** - Mobile camera capture not optimized

---

## ✅ **IMMEDIATE FIXES APPLIED**

### 1. Mobile Camera Support Enhanced
- ✅ Added `capture="environment"` to file inputs
- ✅ This enables direct camera access on mobile devices
- ✅ Users can now take photos directly instead of selecting from gallery

### 2. Debug Tools Added
- ✅ Mobile debug component shows real-time auth status
- ✅ Network connectivity diagnostics
- ✅ Cookie and storage availability checks
- ✅ API endpoint testing buttons

---

## 🔧 **STEP-BY-STEP TROUBLESHOOTING**

### **Step 1: Restart with Clean Environment**
```bash
# Kill any running processes
pkill -f "node.*next"
pkill -f "prisma"

# Restart the server with network access
cd /Users/vikashkr/Downloads/LiverTracker/web
npm run dev:network
```

### **Step 2: Verify Environment Configuration**
Check your `.env.local` file contains:
```bash
NEXTAUTH_URL=http://192.168.1.4:3000
NEXTAUTH_SECRET=your-secret-here
DATABASE_URL=your-database-url
EMAIL_SERVER_HOST=your-email-host
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email
EMAIL_SERVER_PASSWORD=your-password
EMAIL_FROM=your-email
```

### **Step 3: Test from Mobile**
1. **Open mobile browser**
2. **Go to**: `http://192.168.1.4:3000`
3. **Look for debug panel** (red box in bottom-right if there are issues)
4. **Check debug info** - shows auth status, network connectivity, etc.

### **Step 4: Test Camera Upload**
1. **Go to**: `http://192.168.1.4:3000/reports`
2. **Click "Upload & Extract"**
3. **You should see camera option** (not just file gallery)
4. **Take a photo of a medical report**
5. **Upload should work without auth errors**

---

## 🐛 **COMMON MOBILE ISSUES & FIXES**

### **Issue: "CLIENT_FETCH_ERROR"**
**Cause**: NextAuth can't reach authentication endpoints

**Fixes**:
1. **Check Network**: Ensure mobile and computer on same WiFi
2. **Verify URL**: `NEXTAUTH_URL` must match your actual IP
3. **Clear Browser Cache**: Hard refresh on mobile (Settings → Clear Data)
4. **Test Direct API**: Click "Test Session API" in debug panel

### **Issue: Camera Not Opening**
**Cause**: Browser permissions or mobile compatibility

**Fixes**:
1. **Grant Permissions**: Allow camera access when prompted
2. **Use Chrome/Safari**: Avoid mobile browsers with restricted permissions  
3. **HTTPS Required**: Some features need secure context (we're working on this)

### **Issue: Upload Fails After Photo**
**Cause**: File size or network timeout

**Fixes**:
1. **Check File Size**: Debug panel shows network connection type
2. **Retry Upload**: Network issues are common on mobile
3. **Use WiFi**: Avoid cellular for large uploads

---

## 🔍 **DEBUG TOOLS USAGE**

### **Mobile Debug Panel**
- **Appears automatically** when authentication fails
- **Shows real-time status** of all critical systems
- **Test buttons** for manual API verification
- **Copy debug info** to share with developers

### **Console Debugging**
```javascript
// Test session manually (paste in mobile browser console)
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Test upload endpoint
fetch('/api/storage/upload?key=test.jpg', {
  method: 'POST',
  body: new Blob(['test'], {type: 'image/jpeg'})
})
  .then(r => r.json())
  .then(console.log);
```

---

## 🚀 **TESTING CHECKLIST**

### **Before Testing:**
- [ ] Server running: `npm run dev:network`
- [ ] Environment variables set
- [ ] Mobile and computer on same WiFi
- [ ] Mobile browser has camera permissions

### **Authentication Test:**
- [ ] Can access: `http://192.168.1.4:3000`
- [ ] Sign-in page loads
- [ ] Email authentication works (check email for working links)
- [ ] No red debug panel visible

### **Camera Upload Test:**
- [ ] File input opens camera (not just gallery)
- [ ] Can take photo of medical report
- [ ] Upload progress shows
- [ ] Extraction completes successfully

### **Network Test:**
- [ ] IP address is correct in `NEXTAUTH_URL`
- [ ] Port 3000 accessible from mobile
- [ ] No firewall blocking connections
- [ ] WiFi network allows device-to-device communication

---

## 🆘 **IF STILL NOT WORKING**

### **Alternative Solution: ngrok**
For a more reliable network setup:

```bash
# Install ngrok (if not already installed)
npm install -g ngrok

# In terminal 1: Start your app
npm run dev

# In terminal 2: Expose to internet
ngrok http 3000

# Update .env.local with ngrok URL
NEXTAUTH_URL=https://your-unique-id.ngrok.io
```

### **Development vs Production**
- **Development**: Use IP address for local network testing
- **Production**: Deploy to Vercel/Netlify for proper HTTPS and reliability

### **Contact Support**
If issues persist, share:
1. **Debug panel output** (copy button in red debug box)
2. **Console errors** (F12 → Console on mobile browser)
3. **Network setup** (IP address, WiFi configuration)
4. **Mobile device details** (iOS/Android version, browser)

---

## ✨ **EXPECTED WORKING BEHAVIOR**

### **Mobile Camera Upload Flow:**
1. **Tap file input** → Camera opens directly
2. **Take photo** → Photo appears as selected file
3. **Upload & Extract** → Progress indicator shows
4. **AI Processing** → Medical data extracted automatically
5. **Review & Save** → Data appears in dashboard

### **Authentication Flow:**
1. **Enter email** → Email sent with magic link
2. **Click link on mobile** → Redirects to app with auth token
3. **Automatic sign-in** → Dashboard accessible immediately
4. **Session persists** → No re-authentication needed

**This should all work seamlessly on mobile now with the fixes applied!**
