# 🔍 Manual Entry Dashboard Debug Guide

## 🚨 **Issue Identified: Name Mismatch**

Your manual reports are saved correctly (showing in reports/timeline) but not appearing in dashboard charts due to a **name matching issue**.

### **Root Cause:**
- **Manual Entry saves:** CanonicalMetric names like `"Platelets"`, `"ALT"`, etc.
- **Dashboard loads:** Uses complex synonym filtering that may not include the canonical names
- **Result:** Dashboard can't find manually entered data

### **Fix Applied:**
I've updated the dashboard to search for **both** canonical names AND synonyms:

```typescript
// OLD: Only searched synonyms
name: { in: Object.keys(metricSynonyms).filter(...) }

// NEW: Searches canonical + synonyms  
const allPossibleNames = [...new Set([metric, ...synonymKeys])];
name: { in: allPossibleNames }
```

---

## 🧪 **Debug Steps to Verify Fix**

### **Step 1: Check Dashboard Logs**
1. Open dashboard: `http://localhost:3000/dashboard`
2. Open DevTools (F12) → Console
3. Look for new logs:
   ```
   📊 Loading Platelets data. Searching for names: ["Platelets", "Platelet Count"]
   📊 Found 2 raw records for Platelets: [{name: "Platelets", value: 300, unit: "10^9/L"}]
   ```

### **Step 2: Database Inspection** 
You can check Prisma Studio at `http://localhost:5556` to see:
- **ExtractedMetric table**: What names are actually saved
- **ReportFile table**: Manual vs uploaded reports
- **Compare**: Manual entry names vs what dashboard searches for

### **Step 3: Test New Manual Entry**
1. Go to `/manual-entry`
2. Add a test value: Platelets = `250` `10⁹/L`
3. Save report
4. Check dashboard immediately - should appear now

---

## 🔍 **Troubleshooting Guide**

### **If Still Not Working:**

**1. Check Console Logs:**
```bash
# Should see these patterns:
📊 Loading [METRIC] data. Searching for names: [...]
📊 Found X raw records for [METRIC]: [...]
🧠 [METRIC] Intelligence: {rawDataPoints: X, chartDataPoints: Y}
```

**2. Database Query Check:**
```sql
-- Check what names exist in database
SELECT DISTINCT name, COUNT(*) 
FROM "ExtractedMetric" 
WHERE name LIKE '%plate%' OR name LIKE '%Plate%'
GROUP BY name;

-- Check recent manual entries
SELECT * FROM "ExtractedMetric" 
WHERE "createdAt" > NOW() - INTERVAL '1 day'
ORDER BY "createdAt" DESC;
```

**3. Common Issues:**
- **Wrong user context**: Dashboard loads for different user
- **Date filtering**: Reports saved with future/past dates
- **Value filtering**: Medical intelligence rejecting values as invalid
- **Browser cache**: Hard refresh needed (Ctrl+Shift+R)

---

## 🎯 **Expected Behavior After Fix**

### **Manual Entry Data Flow:**
1. **Save**: Manual entry → ExtractedMetric table with canonical names
2. **Load**: Dashboard searches canonical + synonym names
3. **Process**: Medical intelligence validates and converts
4. **Display**: Charts appear with proper data

### **Console Output Example:**
```bash
📊 Loading Platelets data. Searching for names: ["Platelets", "Platelet Count"]
📊 Found 2 raw records for Platelets: [
  {name: "Platelets", value: 300, unit: "10^9/L"},
  {name: "Platelet Count", value: 250, unit: "×10³/μL"}
]
🧠 Platelets Intelligence: {rawDataPoints: 2, chartDataPoints: 2, shouldShow: true}
🩸 PLATELETS DEBUG: {metric: "Platelets", chartDataCount: 2, unitsSeen: ["10^9/L", "×10³/μL"]}
```

---

## 🚀 **Quick Test Protocol**

### **Test 1: Simple Entry**
```
Metric: ALT
Value: 45
Unit: U/L
Expected: Should appear in dashboard immediately
```

### **Test 2: MELD Components**
```
Bilirubin: 1.5 mg/dL
Creatinine: 1.2 mg/dL  
INR: 1.3 ratio
Expected: Charts + MELD score calculation
```

### **Test 3: Unit Conversion**
```
Platelets: 250000 /μL (raw count)
Expected: Converts to 250 10⁹/L and shows chart
```

---

## 🛠️ **If Problem Persists**

1. **Hard Browser Refresh**: Ctrl+Shift+R
2. **Clear Application Data**: DevTools → Application → Storage → Clear
3. **Restart Dev Server**: Stop and restart `npm run dev:network`
4. **Check User Session**: Verify you're logged in as the same user who created manual entries

**Database Reset (Last Resort):**
```bash
# Clear all test data and start fresh
npx prisma studio
# Delete all ExtractedMetric records
# Re-enter test data
```

---

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ Console shows "Found X raw records" for metrics you entered manually  
- ✅ Charts appear in dashboard for manually entered data
- ✅ MELD score calculates when you have all 3 components
- ✅ Unit conversions display correctly
- ✅ Timeline and dashboard show consistent data

**The fix should resolve the name mismatch issue and make your manual entries appear in dashboard charts!**
