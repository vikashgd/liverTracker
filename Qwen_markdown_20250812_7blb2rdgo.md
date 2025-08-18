# 🩺 LiverTrack – Product Requirements Document (PRD)  
*Version 1.0 | Non-technical Overview*

---

## 🎯 Product Vision

**"Empowering people with liver disease to understand, track, and improve their liver health — anytime, anywhere."**

LiverTrack is a mobile and web app that helps users with **fatty liver, cirrhosis, or at-risk liver conditions**:
- Digitally store all their medical reports.
- Automatically extract key health data.
- Visualize disease progression over time.
- Get smart, actionable insights — even with limited test access.
- Share summaries with doctors easily.

> Built for **global accessibility** — works in rural clinics and top hospitals alike.

---

## 🧩 Target Users

- Patients diagnosed with **fatty liver (NAFLD/NASH)** or **liver cirrhosis**.
- People at risk: **diabetes, obesity, high alcohol use, metabolic syndrome**.
- Caregivers helping a loved one manage liver disease.
- Doctors (secondary): who receive clean, organized patient summaries.

---

## 🌍 Key Principles

- **No mandatory reports** – users upload what they have.
- **Works with partial data** – even one blood test is valuable.
- **Globally inclusive** – functional in low-resource settings.
- **Clinically meaningful** – aligns with WHO, AASLD, EASL guidelines.
- **Patient-first design** – simple, secure, and empowering.

---

## 🛠️ Core Features

### ✅ 4.1 Upload Medical Reports

- **How**: Camera scan, photo, or PDF upload (from phone or cloud).
- **Supports**: Blood tests, ultrasound, FibroScan, CT, MRI, biopsy reports.
- **Smart AI**: Automatically detects and extracts key values (e.g., ALT, platelets, spleen size).
- **Editable**: Users can correct mistakes in extracted data.
- **Auto-tag**: Labels report type and date (user can edit).

> Example: Take a photo of a blood report → app reads "ALT: 86 U/L" → saves it.

---

### ✅ 4.2 View Raw Reports (Digital Medical Locker)

- All uploaded reports stored securely.
- Organized by **date**, **type**, and **body system**.
- Search & filter: “Show all ultrasounds” or “Find bilirubin tests”.
- View full PDF/image with zoom.
- Option to delete or re-upload.

> Like Google Drive, but for liver health.

---

### ✅ 4.3 Smart Progression Dashboard

The heart of the app — turns raw data into **actionable insights**.

#### A. Trend Charts

Visual graphs showing how key markers change over time:
- ALT & AST (liver inflammation)
- Platelets (fibrosis risk)
- Albumin & Bilirubin (liver function)
- Weight & BMI
- Liver stiffness (kPa) – from FibroScan
- Spleen size (cm) – from ultrasound

> Color-coded: Green (normal), Yellow (caution), Red (high risk)

#### B. Risk Score Tracker

Auto-calculated scores (no manual input):
- **FIB-4** – estimates fibrosis risk
- **APRI** – simple fibrosis marker
- **NAFLD Fibrosis Score (NFS)** – for fatty liver
- **Child-Pugh** – cirrhosis severity
- **MELD** – transplant urgency

> Updates automatically when new data is added.

#### C. Timeline View

Chronological diary of all visits:
- Each entry shows date, key values, and notes (e.g., “Ascites detected”).
- Tap to see full report.

#### D. Intelligent Alerts & Tips

Smart nudges based on trends:
- 🔹 “Your FIB-4 increased – possible liver scarring.”
- 🔹 “Spleen size is growing – talk to your doctor.”
- 🔹 “ALT has been high for 6 months – lifestyle changes may help.”
- 🔹 “No reports in 6 months – consider a check-up.”

> Language is simple, not medical jargon.

---

### ✅ 4.4 Lifestyle & Symptom Tracker

User-reported data to complete the picture:
- Weight, BMI, waist size
- Alcohol intake (units/week)
- Diabetes status
- Symptoms: fatigue, swelling, jaundice, confusion
- Medications (optional)

> Updated manually, monthly or as needed.

---

### ✅ 4.5 Share with Doctor

One-tap export:
- **Generate PDF Summary**:
  - Patient info
  - Timeline of key reports
  - Trend charts
  - Risk scores
  - Doctor notes section
- Share via WhatsApp, email, print, or QR code.
- Option: “Send to my doctor” (enter email).

> Designed so doctors can quickly understand the patient’s journey.

---

### ✅ 4.6 Profile & Settings

- Personal info: name, age, diagnosis (if known)
- Privacy: data encryption, delete account
- Notifications: alerts, reminders
- Language & units (metric/imperial)
- Data export (download all as ZIP)

> Compliant with global privacy standards (GDPR-ready).

---

## 🔁 User Flow (Step-by-Step)

1. **Sign Up** → Enter name, age, basic health info.
2. **Upload First Report** → Use camera or gallery.
3. **AI Scans Report** → Extracts ALT, AST, platelets, etc.
4. **Review & Confirm** → Fix any errors, save.
5. **Dashboard Updates** → Charts and scores auto-generate.
6. **View Progress** → See trends, alerts, timeline.
7. **Add More** → Upload next report or update weight.
8. **Share** → Send PDF to doctor before appointment.

> Repeat — each new report deepens insights.

---

## 🌐 Platforms

- **Mobile Apps**: iOS and Android (primary)
- **Web App**: Responsive design for desktop/laptop
- Syncs across devices (cloud-based)

---

## 🧠 Intelligence Engine (Behind the Scenes)

- **OCR + NLP**: Reads reports, finds medical values.
- **Auto-Scoring**: Calculates FIB-4, APRI, MELD, etc., when data exists.
- **Trend Detection**: Compares current vs. past values.
- **Alert Logic**: Flags worsening patterns (e.g., rising bilirubin).
- **Missing Data Reminders**: “You haven’t uploaded platelets in 6 months.”

> No manual entry needed for scores — it just works.

---

## 🎯 Why This Works

| Problem | LiverTrack Solution |
|--------|---------------------|
| Reports get lost or disorganized | All in one secure digital locker |
| Hard to see progression over time | Trend charts & timeline |
| Patients don’t understand their risk | Simple scores & plain-language alerts |
| Doctors get incomplete history | One-tap PDF summary |
| Inequality in test access | Works with blood tests only (no FibroScan needed) |

---

## 🚀 Future Possibilities (Phase 2)

- Reminders for lab tests or doctor visits
- Teleconsultation integration
- AI prediction of progression risk
- Community support (anonymous forums)
- Multilingual support (Hindi, Spanish, Arabic, etc.)
- Integration with wearables (weight, activity)

---

## 📎 Sample Use Cases

### 🔹 User in Rural India

- Uploads only **blood tests and ultrasound** from local clinic.
- App calculates **FIB-4 = 2.3** → flags “Possible fibrosis.”
- Suggests: “Ask your doctor about a FibroScan.”
- Shares PDF with city-based hepatologist.

### 🔹 User in the US with NASH

- Uploads **FibroScan, MRI, and labs**.
- App shows **liver stiffness rising from 8 → 12 kPa**.
- Alert: “Fibrosis may be progressing – discuss with specialist.”
- Tracks weight loss impact on CAP score.

---

## 🤝 Next Steps for Discussion

Let’s discuss:
1. Should we **partner with clinics or labs** for early adoption?
2. How to **ensure data privacy** and build trust?
3. Should we include **doctor-facing features** (e.g., dashboard)?
4. What’s the best **name and branding**? (e.g., LiverTrack, HepaPal, CirrhoScan)
5. MVP scope: Start with **blood + ultrasound + FIB-4/APRI**?

---

## 📄 Appendix: Key Medical Parameters Tracked

### Blood Tests
- ALT, AST, ALP, GGT
- Bilirubin (Total & Direct)
- Albumin, Total Protein
- INR / Prothrombin Time
- Platelet Count, Hemoglobin, WBC
- Fasting Glucose, HbA1c, Lipid Profile
- Hepatitis B/C, Ferritin, Autoimmune markers

### Imaging
- **Ultrasound**: Liver echogenicity, size, spleen size, ascites, Doppler flow
- **FibroScan**: Liver Stiffness (kPa), CAP Score (fat)
- **CT/MRI**: Liver texture, nodularity, varices
- **Biopsy** (if uploaded): Steatosis, Fibrosis (F0–F4), Inflammation

### Calculated Scores
- FIB-4, APRI, NAFLD Fibrosis Score (NFS)
- Child-Pugh Score, MELD Score

### Lifestyle & Symptoms
- Weight, BMI, Waist Circumference
- Alcohol Intake
- Diabetes Status
- Symptoms: Fatigue, Jaundice, Swelling, Confusion
- Medications

---

# ✅ Summary

**LiverTrack** is not just a file storage app — it’s a **personal liver health coach** that:
- **Simplifies complexity**
- **Detects danger early**
- **Empowers patients**
- **Saves doctor time**

Ready to help millions take control of their liver health — one scan at a time.