// Test Patient Data Generator for LiverTracker
console.log('🏥 Generating Test Patient Data for LiverTracker...\n');

const testPatients = [
  {
    id: 1,
    name: "Sarah Johnson",
    age: 32,
    gender: "Female",
    condition: "Healthy Individual",
    severity: "Normal",
    color: "🟢",
    parameters: {
      // Liver Function Tests
      ALT: 25,
      AST: 22,
      ALP: 85,
      GGT: 28,
      totalBilirubin: 0.8,
      directBilirubin: 0.2,
      albumin: 4.2,
      totalProtein: 7.1,
      PT: 12.2,
      INR: 1.0,
      
      // Complete Blood Count
      hemoglobin: 13.5,
      hematocrit: 40.5,
      RBC: 4.8,
      WBC: 6500,
      platelets: 280000,
      
      // Metabolic Panel
      creatinine: 0.9,
      BUN: 15,
      sodium: 140,
      potassium: 4.2,
      glucose: 88,
      HbA1c: 5.2,
      
      // Lipid Panel
      totalCholesterol: 185,
      LDL: 110,
      HDL: 58,
      triglycerides: 95
    },
    meldScore: 6,
    childPughScore: "A",
    riskLevel: "Low"
  },
  
  {
    id: 2,
    name: "Michael Chen",
    age: 45,
    gender: "Male",
    condition: "Fatty Liver Disease (NAFLD)",
    severity: "Mild",
    color: "🟡",
    parameters: {
      ALT: 85,
      AST: 72,
      ALP: 125,
      GGT: 68,
      totalBilirubin: 1.8,
      directBilirubin: 0.6,
      albumin: 3.8,
      totalProtein: 6.8,
      PT: 13.5,
      INR: 1.2,
      
      hemoglobin: 14.2,
      hematocrit: 42.8,
      RBC: 5.1,
      WBC: 7200,
      platelets: 220000,
      
      creatinine: 1.1,
      BUN: 18,
      sodium: 138,
      potassium: 4.0,
      glucose: 118,
      HbA1c: 6.1,
      
      totalCholesterol: 245,
      LDL: 165,
      HDL: 38,
      triglycerides: 210
    },
    meldScore: 9,
    childPughScore: "A",
    riskLevel: "Moderate"
  },
  
  {
    id: 3,
    name: "Maria Rodriguez",
    age: 58,
    gender: "Female",
    condition: "Chronic Hepatitis C",
    severity: "Moderate",
    color: "🟠",
    parameters: {
      ALT: 145,
      AST: 128,
      ALP: 185,
      GGT: 95,
      totalBilirubin: 3.2,
      directBilirubin: 2.1,
      albumin: 3.2,
      totalProtein: 6.2,
      PT: 15.8,
      INR: 1.6,
      
      hemoglobin: 11.8,
      hematocrit: 35.4,
      RBC: 4.2,
      WBC: 5800,
      platelets: 150000,
      
      creatinine: 1.3,
      BUN: 22,
      sodium: 136,
      potassium: 3.8,
      glucose: 102,
      HbA1c: 5.8,
      
      totalCholesterol: 165,
      LDL: 95,
      HDL: 45,
      triglycerides: 125
    },
    meldScore: 15,
    childPughScore: "B",
    riskLevel: "High"
  },
  
  {
    id: 4,
    name: "Robert Thompson",
    age: 62,
    gender: "Male",
    condition: "Cirrhosis",
    severity: "Advanced",
    color: "🔴",
    parameters: {
      ALT: 95,
      AST: 110,
      ALP: 220,
      GGT: 125,
      totalBilirubin: 5.8,
      directBilirubin: 4.2,
      albumin: 2.4,
      totalProtein: 5.8,
      PT: 18.5,
      INR: 2.1,
      
      hemoglobin: 9.2,
      hematocrit: 27.6,
      RBC: 3.5,
      WBC: 4200,
      platelets: 85000,
      
      creatinine: 1.8,
      BUN: 35,
      sodium: 132,
      potassium: 3.5,
      glucose: 95,
      HbA1c: 5.9,
      
      totalCholesterol: 140,
      LDL: 75,
      HDL: 35,
      triglycerides: 150
    },
    meldScore: 22,
    childPughScore: "C",
    riskLevel: "Critical"
  },
  
  {
    id: 5,
    name: "Linda Davis",
    age: 55,
    gender: "Female",
    condition: "End-Stage Liver Disease",
    severity: "Critical",
    color: "⚫",
    parameters: {
      ALT: 180,
      AST: 220,
      ALP: 285,
      GGT: 165,
      totalBilirubin: 12.5,
      directBilirubin: 9.8,
      albumin: 2.0,
      totalProtein: 5.2,
      PT: 22.8,
      INR: 3.2,
      
      hemoglobin: 7.8,
      hematocrit: 23.4,
      RBC: 2.9,
      WBC: 3500,
      platelets: 45000,
      
      creatinine: 2.4,
      BUN: 48,
      sodium: 128,
      potassium: 3.2,
      glucose: 88,
      HbA1c: 5.4,
      
      totalCholesterol: 95,
      LDL: 45,
      HDL: 28,
      triglycerides: 110
    },
    meldScore: 35,
    childPughScore: "C",
    riskLevel: "Critical"
  },
  
  {
    id: 6,
    name: "James Wilson",
    age: 48,
    gender: "Male",
    condition: "Post Liver Transplant",
    severity: "Stable",
    color: "💙",
    parameters: {
      ALT: 35,
      AST: 28,
      ALP: 95,
      GGT: 42,
      totalBilirubin: 1.1,
      directBilirubin: 0.4,
      albumin: 3.9,
      totalProtein: 6.9,
      PT: 12.8,
      INR: 1.1,
      
      hemoglobin: 12.5,
      hematocrit: 37.5,
      RBC: 4.5,
      WBC: 5200,
      platelets: 180000,
      
      creatinine: 1.4,
      BUN: 25,
      sodium: 139,
      potassium: 4.1,
      glucose: 105,
      HbA1c: 6.0,
      
      totalCholesterol: 195,
      LDL: 125,
      HDL: 42,
      triglycerides: 140
    },
    meldScore: 8,
    childPughScore: "A",
    riskLevel: "Moderate"
  }
];

// Generate SQL INSERT statements
console.log('📊 SQL INSERT Statements for Test Data:\n');

testPatients.forEach(patient => {
  console.log(`-- ${patient.color} ${patient.name} (${patient.condition})`);
  console.log(`INSERT INTO reports (userId, reportDate, extractedData, createdAt) VALUES`);
  console.log(`('test-user-id', '2024-01-15', '${JSON.stringify({
    patientInfo: {
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      condition: patient.condition
    },
    labResults: patient.parameters,
    scores: {
      meld: patient.meldScore,
      childPugh: patient.childPughScore
    },
    riskLevel: patient.riskLevel
  })}', NOW());\n`);
});

// Generate JSON for API testing
console.log('\n🧪 JSON Data for API Testing:\n');
console.log(JSON.stringify(testPatients, null, 2));

// Generate parameter ranges for validation
console.log('\n📋 Parameter Validation Ranges:\n');

const parameterRanges = {
  ALT: { min: 7, max: 56, unit: 'U/L', critical: 200 },
  AST: { min: 10, max: 40, unit: 'U/L', critical: 200 },
  ALP: { min: 44, max: 147, unit: 'U/L', critical: 300 },
  GGT: { min: 9, max: 48, unit: 'U/L', critical: 150 },
  totalBilirubin: { min: 0.3, max: 1.2, unit: 'mg/dL', critical: 10 },
  albumin: { min: 3.5, max: 5.0, unit: 'g/dL', critical: 2.0 },
  INR: { min: 0.8, max: 1.1, unit: '', critical: 3.0 },
  hemoglobin: { 
    male: { min: 14, max: 18, unit: 'g/dL', critical: 8 },
    female: { min: 12, max: 16, unit: 'g/dL', critical: 8 }
  },
  platelets: { min: 150000, max: 450000, unit: '/μL', critical: 50000 },
  creatinine: {
    male: { min: 0.74, max: 1.35, unit: 'mg/dL', critical: 3.0 },
    female: { min: 0.59, max: 1.04, unit: 'mg/dL', critical: 3.0 }
  }
};

console.log(JSON.stringify(parameterRanges, null, 2));

console.log('\n✅ Test data generation complete!');
console.log('📝 Use this data to populate your LiverTracker system for testing.');
console.log('🎯 Each persona represents a different stage of liver health.');
console.log('📊 Test your scoring algorithms, alerts, and visualizations with this data.');