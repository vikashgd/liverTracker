# Medical Report Sharing System - Phase 1 Testing Guide

## 🎯 Phase 1 Complete - MVP Testing Instructions

Phase 1 of the Medical Report Sharing System is now complete! This guide will walk you through testing all the core functionality.

## ✅ What's Been Implemented

### **Core Infrastructure**
- ✅ Database schema with ShareLink and ShareAccess models
- ✅ Secure token generation and validation
- ✅ Password hashing and access control
- ✅ Comprehensive API endpoints
- ✅ Medical data aggregation using existing platform

### **API Endpoints Created**
- ✅ `POST /api/share-links` - Create share links
- ✅ `GET /api/share-links` - List user share links  
- ✅ `PUT /api/share-links/[id]` - Update share links
- ✅ `DELETE /api/share-links/[id]` - Delete share links
- ✅ `GET /api/share/[token]` - Validate share links
- ✅ `POST /api/share/[token]` - Access with password
- ✅ `POST /api/share/[token]/data` - Get medical data

## 🧪 Testing Steps

### **Step 1: Start the Development Server**

```bash
cd web
npm run dev
```

The server should start on `http://localhost:3000` (or port 8080 if configured).

### **Step 2: Database Verification**

First, verify the database schema is properly set up:

```bash
cd web
npx prisma studio
```

Check that you can see the new tables:
- `ShareLink` - Should have all fields (token, userId, shareType, etc.)
- `ShareAccess` - Should have access logging fields
- `ShareType` enum should show: COMPLETE_PROFILE, SPECIFIC_REPORTS, CONSULTATION_PACKAGE

### **Step 3: Authentication Setup**

1. **Sign up/Sign in** to your application
2. **Upload some medical reports** to have data to share
3. **Ensure you have a user session** (check that you can access `/dashboard`)

### **Step 4: API Testing with Browser/Postman**

#### **Test 1: Create a Share Link (Authenticated)**

**Request:**
```http
POST http://localhost:3000/api/share-links
Content-Type: application/json
Cookie: [your session cookie]

{
  "shareType": "COMPLETE_PROFILE",
  "title": "Medical Report for Dr. Smith",
  "description": "Complete medical history for consultation",
  "includeProfile": true,
  "includeDashboard": true,
  "includeScoring": true,
  "includeAI": true,
  "includeFiles": true,
  "expiryDays": 7
}
```

**Expected Response:**
```json
{
  "success": true,
  "shareLink": {
    "id": "clm...",
    "token": "64-character-hex-token",
    "url": "http://localhost:3000/share/64-character-hex-token",
    "expiresAt": "2025-09-12T..."
  }
}
```

#### **Test 2: List Share Links (Authenticated)**

**Request:**
```http
GET http://localhost:3000/api/share-links
Cookie: [your session cookie]
```

**Expected Response:**
```json
{
  "success": true,
  "shareLinks": [
    {
      "id": "clm...",
      "token": "64-character-hex-token",
      "shareType": "COMPLETE_PROFILE",
      "title": "Medical Report for Dr. Smith",
      "currentViews": 0,
      "expiresAt": "2025-09-12T...",
      "isActive": true
    }
  ]
}
```

#### **Test 3: Access Share Link (Public - No Auth)**

**Request:**
```http
GET http://localhost:3000/api/share/[your-token-from-step-1]
```

**Expected Response:**
```json
{
  "success": true,
  "shareInfo": {
    "id": "clm...",
    "shareType": "COMPLETE_PROFILE",
    "title": "Medical Report for Dr. Smith",
    "expiresAt": "2025-09-12T..."
  }
}
```

#### **Test 4: Get Medical Data (Public - No Auth)**

**Request:**
```http
POST http://localhost:3000/api/share/[your-token]/data
Content-Type: application/json

{}
```

**Expected Response:**
```json
{
  "success": true,
  "medicalData": {
    "patient": {
      "id": "patient_12345678",
      "demographics": { ... },
      "profile": { ... }
    },
    "reports": {
      "summary": { ... },
      "individual": [ ... ],
      "trends": [ ... ]
    },
    "scoring": { ... },
    "aiAnalysis": { ... },
    "files": { ... },
    "metadata": { ... }
  },
  "shareInfo": { ... }
}
```

### **Step 5: Security Testing**

#### **Test 5A: Unauthenticated Access Protection**

**Request:**
```http
POST http://localhost:3000/api/share-links
Content-Type: application/json

{
  "shareType": "COMPLETE_PROFILE",
  "title": "Test"
}
```

**Expected Response:**
```json
{
  "error": "Authentication required"
}
```
**Status Code:** 401

#### **Test 5B: Invalid Token Access**

**Request:**
```http
GET http://localhost:3000/api/share/invalid-token-123
```

**Expected Response:**
```json
{
  "success": false,
  "error": "LINK_NOT_FOUND"
}
```
**Status Code:** 403

#### **Test 5C: Password Protection**

1. **Create a password-protected share:**
```http
POST http://localhost:3000/api/share-links
Content-Type: application/json
Cookie: [your session cookie]

{
  "shareType": "COMPLETE_PROFILE",
  "title": "Password Protected Share",
  "password": "testpass123",
  "expiryDays": 7
}
```

2. **Try to access without password:**
```http
GET http://localhost:3000/api/share/[password-protected-token]
```

**Expected Response:**
```json
{
  "success": false,
  "requiresPassword": true
}
```

3. **Access with correct password:**
```http
POST http://localhost:3000/api/share/[password-protected-token]
Content-Type: application/json

{
  "password": "testpass123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "shareInfo": { ... },
  "message": "Access granted"
}
```

### **Step 6: Data Validation Testing**

#### **Test 6A: Invalid Share Type**

**Request:**
```http
POST http://localhost:3000/api/share-links
Content-Type: application/json
Cookie: [your session cookie]

{
  "shareType": "INVALID_TYPE",
  "title": "Test"
}
```

**Expected Response:**
```json
{
  "error": "Invalid request data",
  "details": [
    {
      "field": "shareType",
      "message": "Invalid enum value..."
    }
  ]
}
```
**Status Code:** 400

#### **Test 6B: Missing Required Fields**

**Request:**
```http
POST http://localhost:3000/api/share-links
Content-Type: application/json
Cookie: [your session cookie]

{
  "shareType": "COMPLETE_PROFILE"
}
```

**Expected Response:**
```json
{
  "error": "Invalid request data",
  "details": [
    {
      "field": "title",
      "message": "Required"
    }
  ]
}
```

### **Step 7: Share Link Management Testing**

#### **Test 7A: Revoke Share Link**

**Request:**
```http
PUT http://localhost:3000/api/share-links/[share-link-id]
Content-Type: application/json
Cookie: [your session cookie]

{
  "action": "revoke"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Share link revoked successfully"
}
```

#### **Test 7B: Extend Share Link**

**Request:**
```http
PUT http://localhost:3000/api/share-links/[share-link-id]
Content-Type: application/json
Cookie: [your session cookie]

{
  "action": "extend",
  "additionalDays": 5
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Share link extended by 5 days"
}
```

#### **Test 7C: Delete Share Link**

**Request:**
```http
DELETE http://localhost:3000/api/share-links/[share-link-id]
Cookie: [your session cookie]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Share link deleted successfully"
}
```

### **Step 8: Access Logging Verification**

1. **Access a share link multiple times** (using the GET and POST endpoints)
2. **Check the database** using Prisma Studio:
   - Go to `ShareAccess` table
   - Verify entries are created with IP addresses, user agents, and timestamps
3. **Check the ShareLink table**:
   - Verify `currentViews` is incrementing
   - Verify `lastAccessedAt` is updating

### **Step 9: Medical Data Integration Testing**

1. **Ensure you have medical reports** in your database
2. **Create a share link** and access the medical data
3. **Verify the response includes**:
   - Patient demographics (anonymized)
   - Report summaries and individual reports
   - Trend data (if available)
   - MELD/Child-Pugh scores (if calculable)
   - File references
   - Proper watermarking metadata

## 🐛 Common Issues and Troubleshooting

### **Issue 1: Database Connection Errors**
```bash
# Wake up the Neon database
cd web
node wake-neon-db.js
```

### **Issue 2: Authentication Issues**
- Ensure you're signed in to the application
- Check that your session cookie is being sent with requests
- Verify `NEXTAUTH_SECRET` is set in your environment

### **Issue 3: Token Generation Errors**
- Check that `crypto` module is available
- Verify database connection for token uniqueness checks

### **Issue 4: Medical Data Aggregation Errors**
- Ensure you have some medical reports uploaded
- Check that the MedicalDataPlatform is properly initialized
- Verify database relationships are intact

## ✅ Success Criteria

Phase 1 is successfully implemented if:

- ✅ **All API endpoints respond correctly** with proper status codes
- ✅ **Authentication protection works** (401 for unauthenticated requests)
- ✅ **Share links are created** with secure tokens
- ✅ **Access validation works** (expiry, passwords, view limits)
- ✅ **Medical data is aggregated** and returned properly
- ✅ **Access logging is working** (entries in ShareAccess table)
- ✅ **Error handling is robust** (proper error messages and status codes)

## 🚀 Next Steps (Phase 2)

Once Phase 1 testing is complete, Phase 2 will add:
- Professional medical interface components
- Share link landing pages
- Executive summary displays
- Medical data visualization
- Export and print functionality

## 📞 Support

If you encounter any issues during testing:
1. Check the browser console for JavaScript errors
2. Check the server logs for API errors
3. Verify database connectivity with Prisma Studio
4. Ensure all environment variables are properly set

The Medical Report Sharing System Phase 1 MVP is ready for testing! 🎉