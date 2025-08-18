#!/usr/bin/env node

/**
 * Quick Test Data Generator for LiverTracker
 * 
 * This script generates comprehensive test data for all lab parameters
 * to verify the complete implementation works correctly.
 */

const testData = {
  normal: {
    // MELD Score Components
    Bilirubin: { value: 1.0, unit: "mg/dL" },
    Creatinine: { value: 1.0, unit: "mg/dL" },
    INR: { value: 1.0, unit: "ratio" },
    
    // Core Liver Function
    ALT: { value: 25, unit: "U/L" },
    AST: { value: 30, unit: "U/L" },
    Albumin: { value: 4.0, unit: "g/dL" },
    Platelets: { value: 300, unit: "10^9/L" },
    
    // Additional Tests
    ALP: { value: 90, unit: "U/L" },
    GGT: { value: 25, unit: "U/L" },
    TotalProtein: { value: 7.2, unit: "g/dL" },
    
    // Electrolytes
    Sodium: { value: 140, unit: "mEq/L" },
    Potassium: { value: 4.2, unit: "mEq/L" }
  },

  abnormal: {
    // MELD Components (High Priority)
    Bilirubin: { value: 3.5, unit: "mg/dL" },
    Creatinine: { value: 2.2, unit: "mg/dL" },
    INR: { value: 2.1, unit: "ratio" },
    
    // Liver Function (Elevated)
    ALT: { value: 120, unit: "U/L" },
    AST: { value: 150, unit: "U/L" },
    Albumin: { value: 2.8, unit: "g/dL" }, // Low
    Platelets: { value: 80, unit: "10^9/L" }, // Low
    
    // Additional Tests (Elevated)
    ALP: { value: 200, unit: "U/L" },
    GGT: { value: 150, unit: "U/L" },
    TotalProtein: { value: 5.5, unit: "g/dL" }, // Low
    
    // Electrolytes
    Sodium: { value: 128, unit: "mEq/L" }, // Low - affects MELD-Na
    Potassium: { value: 3.0, unit: "mEq/L" } // Low
  },

  internationalUnits: {
    // Test international unit conversions
    Bilirubin: { value: 60, unit: "μmol/L" }, // → 3.5 mg/dL
    Creatinine: { value: 194, unit: "μmol/L" }, // → 2.2 mg/dL
    Albumin: { value: 28, unit: "g/L" }, // → 2.8 g/dL
    TotalProtein: { value: 55, unit: "g/L" }, // → 5.5 g/dL
    Platelets: { value: 80000, unit: "/μL" }, // → 80 10^9/L
    ALT: { value: 120, unit: "IU/L" }, // → 120 U/L
    AST: { value: 150, unit: "IU/L" }, // → 150 U/L
    Sodium: { value: 128, unit: "mmol/L" }, // → 128 mEq/L
    Potassium: { value: 3.0, unit: "mmol/L" } // → 3.0 mEq/L
  }
};

function generateTestInstructions() {
  console.log("🧪 LiverTracker Comprehensive Test Data Generator\n");
  
  console.log("📋 MANUAL ENTRY TEST SEQUENCE");
  console.log("===============================\n");
  
  console.log("1️⃣ TEST NORMAL VALUES:");
  Object.entries(testData.normal).forEach(([param, data]) => {
    console.log(`   ${param}: ${data.value} ${data.unit}`);
  });
  
  console.log("\n2️⃣ TEST ABNORMAL VALUES:");
  Object.entries(testData.abnormal).forEach(([param, data]) => {
    console.log(`   ${param}: ${data.value} ${data.unit}`);
  });
  
  console.log("\n3️⃣ TEST INTERNATIONAL UNITS:");
  Object.entries(testData.internationalUnits).forEach(([param, data]) => {
    console.log(`   ${param}: ${data.value} ${data.unit}`);
  });
  
  console.log("\n🎯 EXPECTED RESULTS:");
  console.log("====================");
  console.log("✅ All 12 parameters should show charts in dashboard");
  console.log("✅ MELD Score should calculate automatically");
  console.log("✅ Unit conversions should display correctly");
  console.log("✅ Debug logs should show for each parameter");
  console.log("✅ Medical intelligence should process all values");
  
  console.log("\n📊 MELD SCORE EXPECTATIONS:");
  console.log("============================");
  console.log("Normal Values → MELD: ~6-8 (Low Priority)");
  console.log("Abnormal Values → MELD: ~18-20 (High Priority)");
  console.log("With Low Sodium → MELD-Na: Higher than MELD");
  
  console.log("\n🔍 DEBUG MONITORING:");
  console.log("=====================");
  console.log("Open browser DevTools (F12) and watch for:");
  console.log("🧠 [METRIC] Intelligence: logs");
  console.log("📊 [METRIC] DEBUG: logs with emoji indicators");
  console.log("🏥 MELD score calculation display");
  
  console.log("\n🚀 START TESTING:");
  console.log("==================");
  console.log("1. Go to http://localhost:3000/manual-entry");
  console.log("2. Enter test values from above");
  console.log("3. Check dashboard at http://localhost:3000/dashboard");
  console.log("4. Monitor console logs");
  console.log("5. Verify all charts appear with data");
}

// Generate JSON for API testing
function generateApiTestData() {
  return {
    reportType: "Lab",
    reportDate: new Date().toISOString().split('T')[0],
    metrics: Object.entries(testData.abnormal).reduce((acc, [key, data]) => {
      acc[key] = data;
      return acc;
    }, {}),
    metricsAll: Object.entries(testData.abnormal).map(([name, data]) => ({
      name,
      value: data.value,
      unit: data.unit,
      category: getCategoryForMetric(name)
    }))
  };
}

function getCategoryForMetric(metric) {
  const categories = {
    Bilirubin: "liver_function",
    Creatinine: "kidney_function", 
    INR: "coagulation",
    ALT: "liver_function",
    AST: "liver_function",
    Albumin: "liver_function",
    Platelets: "hematology",
    ALP: "liver_function",
    GGT: "liver_function",
    TotalProtein: "chemistry",
    Sodium: "electrolytes",
    Potassium: "electrolytes"
  };
  return categories[metric] || "other";
}

// Main execution
if (require.main === module) {
  generateTestInstructions();
  
  console.log("\n💾 API TEST DATA (for curl testing):");
  console.log("=====================================");
  console.log(JSON.stringify(generateApiTestData(), null, 2));
}

module.exports = { testData, generateTestInstructions, generateApiTestData };
