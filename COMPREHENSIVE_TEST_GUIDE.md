# 🧪 Comprehensive Test Guide - ALL Lab Parameters

## 🎯 **Complete Implementation Strategy Applied to ALL Elements**

I've implemented the same comprehensive strategy for **EVERY** lab parameter that I applied to platelets:

### ✅ **What's Been Applied to ALL Parameters:**

1. **Medical Intelligence Rules** - Every parameter now has complete rules
2. **Unit Conversion Support** - All standard + international units  
3. **Debug Logging** - Comprehensive logging for every metric
4. **API Extraction** - Enhanced prompt to capture all parameters
5. **Dashboard Integration** - All 12 parameters load automatically
6. **Chart Display** - Priority-based organization with filtering

---

## 🧪 **TEST DATA for ALL Parameters**

### **MELD Score Components (Priority 1)**
```
🟡 Bilirubin:
- Normal: 1.0 mg/dL
- High: 3.5 mg/dL  
- International: 60 μmol/L → converts to 3.5 mg/dL

🔴 Creatinine:
- Normal: 1.0 mg/dL
- High: 2.5 mg/dL
- International: 220 μmol/L → converts to 2.5 mg/dL

🩸 INR:
- Normal: 1.0 ratio
- High: 2.5 ratio
- Critical: 4.0 ratio
```

### **Core Liver Function Tests**
```
🧪 ALT:
- Normal: 25 U/L
- High: 120 U/L
- Alternative: 120 IU/L → same as U/L

🧪 AST:
- Normal: 30 U/L  
- High: 150 U/L
- Alternative: 150 IU/L → same as U/L

🔵 Albumin:
- Normal: 4.0 g/dL
- Low: 2.8 g/dL
- International: 28 g/L → converts to 2.8 g/dL

🩸 Platelets:
- Normal: 300 10⁹/L
- Low: 80 10⁹/L  
- Raw count: 80000 /μL → converts to 80 10⁹/L
```

### **Additional Liver Tests**
```
⚗️ ALP:
- Normal: 90 U/L
- High: 200 U/L
- Alternative: 200 IU/L → same as U/L

🔬 GGT:
- Normal: 25 U/L
- High: 150 U/L
- Alternative: 150 IU/L → same as U/L

🟢 Total Protein:
- Normal: 7.2 g/dL
- Low: 5.5 g/dL
- International: 55 g/L → converts to 5.5 g/dL
```

### **Electrolytes (MELD-Na)**
```
🧂 Sodium:
- Normal: 140 mEq/L
- Low: 128 mEq/L (affects MELD-Na)
- International: 128 mmol/L → same as mEq/L

🍌 Potassium:
- Normal: 4.2 mEq/L  
- Low: 3.0 mEq/L
- High: 5.8 mEq/L
- International: 4.2 mmol/L → same as mEq/L
```

---

## 🧪 **Step-by-Step Testing Protocol**

### **Phase 1: Test Individual Parameters**
1. Go to `/manual-entry`
2. Test each parameter with normal values first
3. Check dashboard for chart appearance
4. Monitor browser console for debug logs

### **Phase 2: Test Unit Conversions**  
1. Enter same parameter with different units
2. Verify automatic conversions work
3. Check converted values display correctly

### **Phase 3: Test MELD Calculation**
1. Enter Bilirubin: `2.0 mg/dL`
2. Enter Creatinine: `1.5 mg/dL`  
3. Enter INR: `1.8 ratio`
4. Should see MELD score calculation appear

### **Phase 4: Test Complete System**
1. Enter all 12 parameters
2. Check dashboard shows all charts
3. Verify MELD score with sodium (MELD-Na)
4. Test data persistence across browser refresh

---

## 📊 **Expected Debug Output**

When you load the dashboard, you should see console logs like:

```bash
🧠 ALT Intelligence: {rawDataPoints: 2, qualityScore: "95%", chartDataPoints: 2, shouldShow: true}
🧪 ALT DEBUG: {metric: "ALT", rawDataCount: 2, chartDataCount: 2, unitsSeen: ["U/L"], valueRange: {min: 25, max: 120}}

🧠 Bilirubin Intelligence: {rawDataPoints: 2, qualityScore: "90%", chartDataPoints: 2, shouldShow: true}  
🟡 BILIRUBIN DEBUG: {metric: "Bilirubin", rawDataCount: 2, chartDataCount: 2, unitsSeen: ["mg/dL"], valueRange: {min: 1.0, max: 3.5}}

🧠 Platelets Intelligence: {rawDataPoints: 2, qualityScore: "88%", chartDataPoints: 2, shouldShow: true}
🩸 PLATELETS DEBUG: {metric: "Platelets", rawDataCount: 2, chartDataCount: 2, unitsSeen: ["10^9/L", "/μL"], valueRange: {min: 80, max: 300}}
```

**For ALL 12 parameters!**

---

## 🎯 **Quick Test Scenario**

**Enter this complete lab panel to test everything:**

```
MELD Components:
- Bilirubin: 2.5 mg/dL  
- Creatinine: 1.8 mg/dL
- INR: 2.1 ratio

Liver Function:  
- ALT: 85 U/L
- AST: 95 U/L
- Albumin: 3.2 g/dL
- Platelets: 120 10⁹/L

Additional Tests:
- ALP: 180 U/L
- GGT: 75 U/L  
- Total Protein: 6.8 g/dL

Electrolytes:
- Sodium: 132 mEq/L
- Potassium: 4.1 mEq/L
```

**Expected Results:**
- ✅ All 12 charts appear in dashboard
- ✅ MELD Score: ~15 (Medium Priority)
- ✅ MELD-Na Score: ~17 (due to low sodium)
- ✅ Comprehensive debug logs for all parameters
- ✅ Unit conversions work for international formats

---

## 🚨 **Troubleshooting Guide**

### **If a parameter doesn't show:**
1. Check console for `[METRIC] DEBUG` logs
2. Verify `chartDataCount > 0`
3. Look for unit conversion issues
4. Check if medical intelligence filtered the value

### **If MELD score doesn't calculate:**
1. Ensure Bilirubin, Creatinine, AND INR are all entered
2. Check console for extraction errors
3. Verify values are reasonable (not extreme outliers)

### **If charts don't appear:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Check if data was actually saved to database
3. Look for TypeScript errors in console
4. Verify you're on the dashboard page

---

**Ready to Test!** 🚀

The comprehensive strategy is now applied to **every single lab parameter**. Each one has the same level of:
- Intelligence processing
- Unit conversion support  
- Debug visibility
- Chart integration
- API extraction capability

Test away and let me know which specific parameters need adjustment!
