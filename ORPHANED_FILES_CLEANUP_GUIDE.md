# Orphaned Files Cleanup Guide

## 🚨 **Current Situation**

You're experiencing "File not found" errors because your database contains references to files that don't exist in Google Cloud Storage. This is a **data consistency issue**.

**Example Error:**
```
Error getting signed URL: Error: File not found: reports/1756926635007-423-yasoda 17 sep 4.pdf
HEAD /api/files/reports%2F1756926635007-423-yasoda%2017%20sep%204.pdf 404 in 3804ms
```

**What's Happening:**
- ✅ Database has file reference: `reports/1756926635007-423-yasoda 17 sep 4.pdf`
- ❌ File doesn't exist in Google Cloud Storage bucket
- ✅ Error handling now works gracefully (no crashes)

---

## 🔍 **Diagnostic Steps**

### **Step 1: Check Specific File**
```bash
cd web
node check-specific-file.js "reports/1756926635007-423-yasoda 17 sep 4.pdf"
```

This will tell you:
- Whether the file exists in GCS
- File metadata if it exists
- Similar files in the bucket
- Possible reasons for missing files

### **Step 2: Scan All Files**
```bash
cd web
node cleanup-orphaned-files.js
```

This will:
- Check all database file references against GCS
- Report how many files are missing
- Show detailed list of orphaned references
- Provide cleanup recommendations

---

## 🔧 **Resolution Options**

### **Option 1: Clean Database References (Recommended)**
```bash
cd web
node cleanup-orphaned-files.js --fix
```

**What this does:**
- Clears `objectKey` field for missing files
- Keeps the report data and extracted metrics
- Users see "No file available" instead of errors

### **Option 2: Manual Investigation**
Check why files are missing:
1. **Upload failures** - Files never made it to GCS
2. **Accidental deletion** - Files were removed from GCS
3. **Path changes** - Files moved/renamed in GCS
4. **Bucket issues** - Wrong bucket or permissions

### **Option 3: Re-upload Missing Files**
If you have the original files:
1. Upload them to GCS with the exact same path
2. Files will work immediately (no database changes needed)

---

## 📊 **Understanding the Issue**

### **How Files Should Work:**
```
1. User uploads file → 2. File saved to GCS → 3. Database updated with path
                                ↓
4. User views report ← 5. File loaded from GCS ← 6. Database provides path
```

### **What's Broken:**
```
Database has path → GCS file missing → Error when trying to display
```

### **Common Causes:**
- **Upload interruptions** during file save process
- **GCS bucket cleanup** without database updates
- **Development/testing** file deletions
- **Environment mismatches** (dev vs prod buckets)

---

## 🛠️ **Prevention Strategies**

### **1. Transactional Uploads**
Ensure database is only updated after successful GCS upload:
```javascript
// Good pattern
const uploadResult = await uploadToGCS(file);
if (uploadResult.success) {
  await updateDatabase(uploadResult.path);
}
```

### **2. File Existence Validation**
Periodically check file consistency:
```bash
# Weekly cron job
0 2 * * 0 cd /app && node cleanup-orphaned-files.js
```

### **3. Backup Strategy**
- Keep file backups separate from main bucket
- Log all file operations for audit trail
- Monitor GCS bucket for unexpected deletions

---

## 🧪 **Testing the Fix**

### **Before Cleanup:**
1. Navigate to reports page
2. See "File not found" errors in console
3. Broken file previews

### **After Cleanup:**
1. Navigate to reports page
2. No console errors
3. Graceful "No file available" messages
4. Download buttons show appropriate errors

### **Verification Commands:**
```bash
# Check current status
node cleanup-orphaned-files.js

# Fix orphaned references
node cleanup-orphaned-files.js --fix

# Verify fix worked
node cleanup-orphaned-files.js
```

---

## 📋 **Cleanup Script Features**

### **Safety Features:**
- ✅ **Dry run by default** - won't make changes without `--fix`
- ✅ **Detailed reporting** - shows exactly what will be changed
- ✅ **Preserves data** - keeps reports and metrics, only clears file references
- ✅ **Error handling** - continues if individual files fail

### **What Gets Fixed:**
- ❌ `objectKey: "reports/missing-file.pdf"` 
- ✅ `objectKey: null`

### **What's Preserved:**
- ✅ Report metadata
- ✅ Extracted metrics
- ✅ User associations
- ✅ Creation dates

---

## 🎯 **Expected Results**

### **Immediate Benefits:**
- No more "File not found" server errors
- Clean server logs
- Graceful user experience for missing files
- Faster page loads (no failed file requests)

### **User Experience:**
- **Missing files**: Clear "No file available" message
- **Existing files**: Work normally
- **Downloads**: Appropriate error messages
- **Previews**: Graceful fallbacks

---

## 🚀 **Next Steps**

1. **Run diagnostic**: `node check-specific-file.js`
2. **Scan all files**: `node cleanup-orphaned-files.js`
3. **Review results**: Check how many files are orphaned
4. **Clean database**: `node cleanup-orphaned-files.js --fix`
5. **Verify fix**: Test reports page functionality
6. **Monitor**: Set up periodic consistency checks

---

## 📞 **Support Information**

### **If Scripts Fail:**
- Check environment variables (GCP_PROJECT_ID, GCS_BUCKET, GCP_SA_KEY)
- Verify GCS credentials and permissions
- Ensure database connection is working

### **If Issues Persist:**
- Check specific file paths for encoding issues
- Verify bucket name and project configuration
- Review GCS access logs for deletion events

**Status:** ✅ **Error handling fixed, cleanup tools ready**