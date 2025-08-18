export type CanonicalMetric = "ALT" | "AST" | "Platelets" | "Bilirubin" | "Albumin" | "Creatinine" | "INR" | "ALP" | "GGT" | "TotalProtein" | "Sodium" | "Potassium";

export const metricSynonyms: Record<string, CanonicalMetric> = {
  ALT: "ALT",
  SGPT: "ALT",
  AST: "AST",
  SGOT: "AST",
  Platelets: "Platelets",
  "Platelet Count": "Platelets",
  Bilirubin: "Bilirubin",
  "Total Bilirubin": "Bilirubin",
  TBil: "Bilirubin",
  Albumin: "Albumin",
  Creatinine: "Creatinine",
  "Serum Creatinine": "Creatinine",
  SCr: "Creatinine",
  INR: "INR",
  "International Normalized Ratio": "INR",
  ALP: "ALP",
  "Alkaline Phosphatase": "ALP",
  "Alk Phos": "ALP",
  GGT: "GGT",
  "Gamma GT": "GGT",
  "γ-GT": "GGT",
  "Gamma-Glutamyl Transferase": "GGT",
  "Total Protein": "TotalProtein",
  "Serum Protein": "TotalProtein",
  Sodium: "Sodium",
  "Serum Sodium": "Sodium",
  Na: "Sodium",
  Potassium: "Potassium",
  "Serum Potassium": "Potassium",
  K: "Potassium",
};

export function canonicalizeMetricName(name: string): CanonicalMetric | undefined {
  const key = name.trim();
  if (metricSynonyms[key] !== undefined) return metricSynonyms[key];
  // case-insensitive match
  const lower = key.toLowerCase();
  const match = Object.keys(metricSynonyms).find((k) => k.toLowerCase() === lower);
  return match ? metricSynonyms[match] : undefined;
}

export const metricColors: Record<CanonicalMetric, string> = {
  ALT: "#2563eb",
  AST: "#16a34a",
  Platelets: "#ea580c",
  Bilirubin: "#9333ea",
  Albumin: "#0ea5e9",
  Creatinine: "#dc2626",
  INR: "#7c2d12",
  ALP: "#059669",
  GGT: "#7c3aed",
  TotalProtein: "#0d9488",
  Sodium: "#1f2937",
  Potassium: "#991b1b",
};

export type UnitOption = {
  value: string;
  label: string;
  description?: string;
  isStandard: boolean;
  conversionFactor?: number; // multiply by this to get standard unit
};

export type ReferenceRange = { 
  low: number; 
  high: number; 
  unit: string;
  standardUnit: string;
  unitOptions: UnitOption[];
};

// Adult reference ranges (typical lab ranges; may vary by lab)
export const referenceRanges: Record<CanonicalMetric, ReferenceRange> = {
  ALT: { 
    low: 7, 
    high: 56, 
    unit: "U/L",
    standardUnit: "U/L",
    unitOptions: [
      { value: "U/L", label: "U/L", description: "Units per liter (standard)", isStandard: true },
      { value: "IU/L", label: "IU/L", description: "International units per liter", isStandard: false, conversionFactor: 1 }
    ]
  },
  AST: { 
    low: 10, 
    high: 40, 
    unit: "U/L",
    standardUnit: "U/L",
    unitOptions: [
      { value: "U/L", label: "U/L", description: "Units per liter (standard)", isStandard: true },
      { value: "IU/L", label: "IU/L", description: "International units per liter", isStandard: false, conversionFactor: 1 }
    ]
  },
  Platelets: { 
    low: 150, 
    high: 450, 
    unit: "10^9/L",
    standardUnit: "10^9/L",
    unitOptions: [
      { value: "10^9/L", label: "10⁹/L", description: "Billion per liter (standard)", isStandard: true },
      { value: "×10³/μL", label: "×10³/μL", description: "Thousand per microliter", isStandard: false, conversionFactor: 1 },
      { value: "/μL", label: "/μL", description: "Per microliter (raw count)", isStandard: false, conversionFactor: 0.001 }
    ]
  },
  Bilirubin: { 
    low: 0.1, 
    high: 1.2, 
    unit: "mg/dL",
    standardUnit: "mg/dL",
    unitOptions: [
      { value: "mg/dL", label: "mg/dL", description: "Milligrams per deciliter (US standard)", isStandard: true },
      { value: "μmol/L", label: "μmol/L", description: "Micromoles per liter (international)", isStandard: false, conversionFactor: 0.058 }
    ]
  },
  Albumin: { 
    low: 3.5, 
    high: 5.5, 
    unit: "g/dL",
    standardUnit: "g/dL",
    unitOptions: [
      { value: "g/dL", label: "g/dL", description: "Grams per deciliter (US standard)", isStandard: true },
      { value: "g/L", label: "g/L", description: "Grams per liter (international)", isStandard: false, conversionFactor: 0.1 }
    ]
  },
  Creatinine: { 
    low: 0.6, 
    high: 1.2, 
    unit: "mg/dL",
    standardUnit: "mg/dL",
    unitOptions: [
      { value: "mg/dL", label: "mg/dL", description: "Milligrams per deciliter (US standard)", isStandard: true },
      { value: "μmol/L", label: "μmol/L", description: "Micromoles per liter (international)", isStandard: false, conversionFactor: 0.0113 }
    ]
  },
  INR: { 
    low: 0.8, 
    high: 1.1, 
    unit: "ratio",
    standardUnit: "ratio",
    unitOptions: [
      { value: "ratio", label: "ratio", description: "International Normalized Ratio (dimensionless)", isStandard: true }
    ]
  },
  ALP: { 
    low: 44, 
    high: 147, 
    unit: "U/L",
    standardUnit: "U/L",
    unitOptions: [
      { value: "U/L", label: "U/L", description: "Units per liter (standard)", isStandard: true },
      { value: "IU/L", label: "IU/L", description: "International units per liter", isStandard: false, conversionFactor: 1 }
    ]
  },
  GGT: { 
    low: 9, 
    high: 48, 
    unit: "U/L",
    standardUnit: "U/L",
    unitOptions: [
      { value: "U/L", label: "U/L", description: "Units per liter (standard)", isStandard: true },
      { value: "IU/L", label: "IU/L", description: "International units per liter", isStandard: false, conversionFactor: 1 }
    ]
  },
  TotalProtein: { 
    low: 6.0, 
    high: 8.3, 
    unit: "g/dL",
    standardUnit: "g/dL",
    unitOptions: [
      { value: "g/dL", label: "g/dL", description: "Grams per deciliter (US standard)", isStandard: true },
      { value: "g/L", label: "g/L", description: "Grams per liter (international)", isStandard: false, conversionFactor: 0.1 }
    ]
  },
  Sodium: { 
    low: 136, 
    high: 145, 
    unit: "mEq/L",
    standardUnit: "mEq/L",
    unitOptions: [
      { value: "mEq/L", label: "mEq/L", description: "Milliequivalents per liter (US standard)", isStandard: true },
      { value: "mmol/L", label: "mmol/L", description: "Millimoles per liter (international)", isStandard: false, conversionFactor: 1 }
    ]
  },
  Potassium: { 
    low: 3.5, 
    high: 5.0, 
    unit: "mEq/L",
    standardUnit: "mEq/L",
    unitOptions: [
      { value: "mEq/L", label: "mEq/L", description: "Milliequivalents per liter (US standard)", isStandard: true },
      { value: "mmol/L", label: "mmol/L", description: "Millimoles per liter (international)", isStandard: false, conversionFactor: 1 }
    ]
  },
};


