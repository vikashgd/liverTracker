# Network Authentication Setup

## Issue: Email Links Use localhost on Mobile

When testing on mobile devices via network, authentication email links point to `localhost:3000` which doesn't work.

## Solution: Configure Network URL

### Step 1: Find Your Network IP
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Example output: `inet 192.168.1.100`

### Step 2: Set Environment Variable
Add to your `.env.local` file:
```bash
NEXTAUTH_URL=http://192.168.1.100:3000
```
Replace `192.168.1.100` with your actual IP address.

### Step 3: Start Network Development
```bash
npm run dev:network
```

### Step 4: Test Authentication
1. On mobile, go to: `http://192.168.1.100:3000`
2. Click sign in
3. Enter email
4. Check email - links should now point to your network IP
5. Links will work when clicked from mobile device

## Alternative: Use ngrok for Public URLs
For a more permanent solution during development:

```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev:network

# In another terminal, expose port 3000
ngrok http 3000

# Use the ngrok URL in NEXTAUTH_URL
NEXTAUTH_URL=https://your-unique-id.ngrok.io
```

## Production Deployment
In production (Vercel, Netlify, etc.), NextAuth automatically uses the correct domain, so this manual configuration isn't needed.
