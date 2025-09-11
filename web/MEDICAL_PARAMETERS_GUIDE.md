# 🏥 Essential Medical Parameters for LiverTracker

## 🎯 **Core Liver Function Tests**

### **Primary Liver Enzymes**
- **ALT (Alanine Aminotransferase)**: 7-56 U/L
- **AST (Aspartate Aminotransferase)**: 10-40 U/L
- **ALP (Alkaline Phosphatase)**: 44-147 U/L
- **GGT (Gamma-Glutamyl Transferase)**: 9-48 U/L

### **Liver Synthesis Function**
- **Total Bilirubin**: 0.3-1.2 mg/dL
- **Direct Bilirubin**: 0.0-0.3 mg/dL
- **Albumin**: 3.5-5.0 g/dL
- **Total Protein**: 6.3-8.2 g/dL
- **Prothrombin Time (PT)**: 11-13 seconds
- **INR**: 0.8-1.1

## 🩸 **Complete Blood Count (CBC)**

### **Red Blood Cells**
- **Hemoglobin**: M: 14-18 g/dL, F: 12-16 g/dL
- **Hematocrit**: M: 42-52%, F: 37-47%
- **RBC Count**: M: 4.7-6.1 M/μL, F: 4.2-5.4 M/μL
- **MCV (Mean Corpuscular Volume)**: 80-100 fL

### **White Blood Cells**
- **WBC Count**: 4,500-11,000 /μL
- **Neutrophils**: 1,800-7,800 /μL
- **Lymphocytes**: 1,000-4,000 /μL
- **Monocytes**: 200-800 /μL

### **Platelets**
- **Platelet Count**: 150,000-450,000 /μL

## 🧪 **Comprehensive Metabolic Panel**

### **Kidney Function**
- **Creatinine**: M: 0.74-1.35 mg/dL, F: 0.59-1.04 mg/dL
- **BUN (Blood Urea Nitrogen)**: 7-20 mg/dL
- **eGFR**: >60 mL/min/1.73m²

### **Electrolytes**
- **Sodium**: 136-145 mEq/L
- **Potassium**: 3.5-5.0 mEq/L
- **Chloride**: 98-107 mEq/L
- **CO2**: 22-29 mEq/L

### **Glucose & Metabolism**
- **Glucose (Fasting)**: 70-100 mg/dL
- **HbA1c**: <5.7%

## 💓 **Cardiovascular & Lipid Panel**

### **Lipid Profile**
- **Total Cholesterol**: <200 mg/dL
- **LDL Cholesterol**: <100 mg/dL
- **HDL Cholesterol**: M: >40 mg/dL, F: >50 mg/dL
- **Triglycerides**: <150 mg/dL

## 🦠 **Hepatitis & Viral Markers**

### **Hepatitis B**
- **HBsAg**: Negative
- **Anti-HBs**: Negative/Positive (if vaccinated)
- **Anti-HBc**: Negative

### **Hepatitis C**
- **Anti-HCV**: Negative
- **HCV RNA**: Undetected

### **Other Viral**
- **Anti-HAV**: Negative/Positive
- **CMV IgG/IgM**: Variable
- **EBV**: Variable

## 🧬 **Specialized Liver Tests**

### **Autoimmune Markers**
- **ANA (Antinuclear Antibodies)**: <1:80
- **Anti-Smooth Muscle**: <1:40
- **Anti-Mitochondrial**: <1:40
- **Anti-LKM**: Negative

### **Iron Studies**
- **Serum Iron**: M: 65-175 μg/dL, F: 50-170 μg/dL
- **TIBC**: 250-450 μg/dL
- **Ferritin**: M: 12-300 ng/mL, F: 12-150 ng/mL
- **Transferrin Saturation**: 20-50%

### **Copper Studies**
- **Serum Copper**: 70-140 μg/dL
- **Ceruloplasmin**: 20-35 mg/dL

## 📊 **Scoring Systems**

### **MELD Score Components**
- **Creatinine**: For kidney function
- **Bilirubin**: For liver function
- **INR**: For coagulation

### **Child-Pugh Score Components**
- **Albumin**: <2.8, 2.8-3.5, >3.5 g/dL
- **Bilirubin**: <2, 2-3, >3 mg/dL
- **INR**: <1.7, 1.7-2.3, >2.3
- **Ascites**: None, Slight, Moderate
- **Encephalopathy**: None, Grade 1-2, Grade 3-4

---

# 👥 **Patient Personas for Testing**

## 🟢 **Persona 1: Healthy Individual**
```json
{
  "name": "Sarah Johnson",
  "age": 32,
  "gender": "Female",
  "condition": "Healthy",
  "parameters": {
    "ALT": 25,
    "AST": 22,
    "Bilirubin": 0.8,
    "Albumin": 4.2,
    "INR": 1.0,
    "Hemoglobin": 13.5,
    "Platelets": 280000,
    "Creatinine": 0.9
  }
}
```

## 🟡 **Persona 2: Early Liver Disease**
```json
{
  "name": "Michael Chen",
  "age": 45,
  "gender": "Male",
  "condition": "Fatty Liver Disease",
  "parameters": {
    "ALT": 85,
    "AST": 72,
    "Bilirubin": 1.8,
    "Albumin": 3.8,
    "INR": 1.2,
    "Hemoglobin": 14.2,
    "Platelets": 220000,
    "Creatinine": 1.1
  }
}
```

## 🟠 **Persona 3: Moderate Liver Disease**
```json
{
  "name": "Maria Rodriguez",
  "age": 58,
  "gender": "Female",
  "condition": "Chronic Hepatitis C",
  "parameters": {
    "ALT": 145,
    "AST": 128,
    "Bilirubin": 3.2,
    "Albumin": 3.2,
    "INR": 1.6,
    "Hemoglobin": 11.8,
    "Platelets": 150000,
    "Creatinine": 1.3
  }
}
```

## 🔴 **Persona 4: Advanced Liver Disease**
```json
{
  "name": "Robert Thompson",
  "age": 62,
  "gender": "Male",
  "condition": "Cirrhosis",
  "parameters": {
    "ALT": 95,
    "AST": 110,
    "Bilirubin": 5.8,
    "Albumin": 2.4,
    "INR": 2.1,
    "Hemoglobin": 9.2,
    "Platelets": 85000,
    "Creatinine": 1.8
  }
}
```

## ⚫ **Persona 5: Critical Liver Disease**
```json
{
  "name": "Linda Davis",
  "age": 55,
  "gender": "Female",
  "condition": "End-Stage Liver Disease",
  "parameters": {
    "ALT": 180,
    "AST": 220,
    "Bilirubin": 12.5,
    "Albumin": 2.0,
    "INR": 3.2,
    "Hemoglobin": 7.8,
    "Platelets": 45000,
    "Creatinine": 2.4
  }
}
```

## 💙 **Persona 6: Post-Transplant**
```json
{
  "name": "James Wilson",
  "age": 48,
  "gender": "Male",
  "condition": "Post Liver Transplant",
  "parameters": {
    "ALT": 35,
    "AST": 28,
    "Bilirubin": 1.1,
    "Albumin": 3.9,
    "INR": 1.1,
    "Hemoglobin": 12.5,
    "Platelets": 180000,
    "Creatinine": 1.4
  }
}
```

---

# 🎯 **Testing Strategy**

## **1. Parameter Validation**
- Test normal vs abnormal ranges
- Unit conversion (mg/dL ↔ μmol/L)
- Trend analysis over time

## **2. Scoring Calculations**
- MELD Score accuracy
- Child-Pugh classification
- Risk stratification

## **3. Alert Systems**
- Critical value alerts
- Trend deterioration warnings
- Medication interaction checks

## **4. Data Visualization**
- Time-series charts
- Comparative analysis
- Reference range overlays

## **5. AI Intelligence**
- Pattern recognition
- Predictive analytics
- Personalized recommendations

---

# 📋 **Implementation Checklist**

- [ ] Create test data generator
- [ ] Implement parameter validation
- [ ] Add unit conversion support
- [ ] Build scoring calculators
- [ ] Design alert system
- [ ] Create visualization components
- [ ] Integrate AI analysis
- [ ] Add export functionality