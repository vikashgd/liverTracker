# Platelet Data Debug Guide

## 🔍 Quick Debugging Steps

### Step 1: Check Your Database
The app is running on `http://localhost:3000`. Open your browser and:

1. **Go to Dashboard**: Check if platelet data appears now
2. **Check Console Logs**: Open browser dev tools (F12) and look for intelligence logs like:
   ```
   🧠 Platelets Intelligence: {qualityScore: "XX%", recommendations: [...], dataPoints: X, shouldShow: true}
   ```

### Step 2: Database Inspection
If you have database access:
```sql
-- Check if platelet data exists
SELECT * FROM "ExtractedMetric" WHERE name LIKE '%platelet%' OR name LIKE '%Platelet%';

-- Check all metric names
SELECT DISTINCT name FROM "ExtractedMetric" ORDER BY name;
```

### Step 3: Manual Entry Test
Try adding a test platelet value:
1. Go to `/manual-entry`
2. Add "Platelet Count" 
3. Enter value: `300`
4. Select unit: `10⁹/L`
5. Save and check dashboard

### Step 4: Check Unit Matching
The system now supports these platelet units:
- `10^9/L` (standard)
- `×10³/μL` 
- `×10⁹/L`
- `/μL` (raw count)

## 🐛 Common Issues Fixed

### Issue 1: Unit System Mismatch ✅ FIXED
**Problem**: Old system used `×10³/μL`, new system uses `10^9/L`
**Solution**: Updated medical intelligence to handle both

### Issue 2: Missing Metrics in Dashboard ✅ FIXED  
**Problem**: Dashboard only loaded 5 original metrics
**Solution**: Added all 12 metrics including new MELD parameters

### Issue 3: Too Aggressive Filtering ✅ IMPROVED
**Problem**: Medical intelligence was filtering out valid data
**Solution**: Made filtering more lenient for recent data

## 🧪 Test Data for Debugging

Try entering these test values:

**Normal Platelets:**
- Value: `300`, Unit: `10⁹/L` → Should show in charts
- Value: `450`, Unit: `×10³/μL` → Should convert and show

**Raw Count Format:**
- Value: `300000`, Unit: `/μL` → Should convert to `300` and show

## 🔧 If Still Not Working

### Check Server Logs
In your terminal where the app is running, look for:
```bash
🧠 Platelets Intelligence: {qualityScore: "XX%", dataPoints: X, shouldShow: true}
```

### Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Check Database Content
The issue might be:
1. **Data not saved**: Check if manual entry actually saves to database
2. **Wrong metric name**: Data might be saved as "Platelet Count" vs "Platelets"
3. **Unit conversion**: Values might be filtered due to unit mismatch

## 📊 Expected Behavior

After the fixes:
1. **Manual Entry**: Platelet values should save successfully
2. **Dashboard**: Platelet chart should appear if data exists
3. **Console**: Should show processing logs for platelets
4. **Units**: All standard platelet units should be supported

## 🚨 Emergency Reset

If nothing works, try:
1. Clear all browser data for localhost:3000
2. Restart the development server
3. Re-enter one simple test value
4. Check dashboard immediately

---

**Next Steps**: 
1. Check your dashboard now at `http://localhost:3000/dashboard`
2. Look for platelet chart or "No data" message
3. Check browser console for intelligence logs
4. Try manual entry test if still not working
