# File Download Error Fix

## 🚨 **Issue Identified**

### **Problem:**
When clicking "Download" on reports, users see XML error:
```xml
<Error>
<Code>NoSuchKey</Code>
<Message>The specified key does not exist.</Message>
<Details>No such object: livertrack-uploads/reports/1756230216087-915-IMG_3905.jpeg</Details>
</Error>
```

### **Root Cause:**
1. **Missing file check:** GCS `signDownloadURL` generates signed URLs even for non-existent files
2. **Poor error handling:** Frontend shows generic "Failed to download" message
3. **Database inconsistency:** Database has file references but actual files are missing from storage

---

## ✅ **Comprehensive Fix Applied**

### **1. Backend Storage Layer (web/src/lib/storage/gcs.ts):**
```typescript
async signDownloadURL({ key }: SignDownloadParams): Promise<SignedUrl> {
  const file = this.getBucket().file(key);
  
  // Check if file exists before generating signed URL
  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`File not found: ${key}`);
  }
  
  // Only generate URL if file exists
  const [url] = await file.getSignedUrl({ ... });
  return { url, key, expiresIn: this.expiresInSeconds! };
}
```

### **2. API Error Handling (web/src/app/api/storage/sign-download/route.ts):**
```typescript
try {
  const signed = await new GCSStorage().signDownloadURL({ key });
  return NextResponse.json(signed);
} catch (error) {
  if (error.message.includes('File not found')) {
    return NextResponse.json(
      { error: "File not found", message: "The requested file no longer exists" }, 
      { status: 404 }
    );
  }
  return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
}
```

### **3. Frontend User Experience (web/src/components/reports-interface.tsx):**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  if (response.status === 404) {
    alert('File not found. This file may have been deleted or moved.');
  } else {
    alert(`Download failed: ${errorData.message || 'Unknown error'}`);
  }
  return;
}
```

---

## 🎯 **What's Fixed**

### **✅ Proper File Existence Check:**
- Backend now verifies file exists before generating download URL
- Prevents "NoSuchKey" XML errors from reaching users

### **✅ Clear Error Messages:**
- "File not found" for missing files
- Specific error messages instead of generic failures
- Better user guidance on what went wrong

### **✅ Graceful Error Handling:**
- 404 status for missing files
- 500 status for server errors
- Frontend handles different error types appropriately

---

## 📋 **Expected Behavior**

### **For Existing Files:**
- ✅ Download works normally
- ✅ File opens in new tab/downloads

### **For Missing Files:**
- ✅ Clear message: "File not found. This file may have been deleted or moved."
- ✅ No confusing XML error pages
- ✅ User understands the issue

### **For Other Errors:**
- ✅ Specific error messages from server
- ✅ Fallback to connection/retry guidance

**Files Modified:**
- `web/src/lib/storage/gcs.ts` - Added file existence check
- `web/src/app/api/storage/sign-download/route.ts` - Enhanced error handling  
- `web/src/components/reports-interface.tsx` - Better user error messages

**Status:** ✅ **File download errors now handled gracefully**