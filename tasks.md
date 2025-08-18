# LiverTrack – Task List (MVP + Foundations)

Legend: [ ] Todo  [x] Done  [-] Skipped  [?] Needs decision

## Decisions (Locked-in)
- **Hosting**: Vercel (US region) ✅
- **Platforms**: Web (initial) + iOS/Android (next) ✅
- **Language**: English only (initial) ✅
- **Population**: Adults only (initial) ✅
- **Data retention**: 7 years ✅
- **Sharing in v1**: WhatsApp + Email via system share sheet (no external API) ✅
- **OCR/Extraction**: Cloud AI Vision (OpenAI Vision) ✅
- **Brand**: LiverTrack ✅

## Tech Stack
- **Web app**: Next.js 15 (App Router, TS) on Vercel
- **Backend**: Next.js API routes/server actions; background jobs via Vercel cron/queues
- **DB**: Postgres (Neon) + Prisma ORM
- **File storage**: Google Cloud Storage (signed URLs; Uniform Bucket-Level Access)
- **OCR/NLP**: OpenAI Vision via REST (no SDK conflict)
- **Charts**: Recharts (web)
- **PDF generation**: Server-side `@react-pdf/renderer` on Vercel
- **Mobile**: React Native (Expo) after web MVP
- **Auth**: Email/password or magic link (Auth.js/NextAuth)
- **Frontend UI**: Tailwind v4 + shadcn-style components (Radix primitives) ✅

## MVP Scope (v0.1)
- [ ] Upload reports (photo/PDF) → AI extract key values (ALT, AST, Platelets, Bilirubin, Albumin, Dates, Report type).
- [ ] Review & edit extracted data before save.
- [ ] Digital locker: list, filter by type/date, view original file.
- [ ] Tracking dashboard: trend charts for ALT, AST, Platelets, Albumin, Bilirubin.
- [ ] Timeline view of events/reports.
- [ ] Share summary PDF via system share sheet (WhatsApp/Email).
- [-] Risk calculators (FIB-4/APRI) — deferred to v0.2 unless you want them in v0.1.

## v0.2 (near-term)
- [ ] FIB-4 and APRI calculators with unit normalization and thresholds.
- [ ] Basic alerts (plain-language nudges) based on thresholds/trends.
- [ ] Weight/BMI manual entry and chart.

---

## 0. Product, Privacy, Compliance
- [x] Confirm adult-only for MVP.
- [x] Set data retention at 7 years.
- [x] Brand “LiverTrack.”
- [ ] Privacy Policy, Terms, Consent copy (plain language).
- [ ] Data deletion/export flows copy.
- [ ] PHI/PII classification + handling (storage, masking in exports).
- [ ] Threat model + security baseline (OWASP M/W).

## 1. Architecture & Ops
- [ ] Finalize stack (Next.js + Neon + GCS + Prisma + OpenAI Vision)
- [ ] Environments: Dev/Prod on Vercel; env vars management.
- [ ] Observability: logs/metrics/traces (Vercel + Sentry).
- [ ] Backups: Postgres automated + file storage lifecycle policy.
- [ ] CI/CD rules; feature flags.

## 2. Data Model & APIs
- [ ] ERD: `User`, `ReportFile`, `ExtractedMetric`, `ReportType`, `TimelineEvent`, `PdfExport`, `AuditLog`.
- [ ] Versioning: link `ExtractedMetric` to `ReportFile` with revisions.
- [ ] Units + normalization metadata; reference ranges (adult).
- [ ] API contracts (REST) for upload, extraction, review, metrics, charts, timeline, export.
- [ ] Audit trails for file/PHI access.

## 3. Upload & Storage (GCS)
- [ ] Create GCS bucket (US); Uniform Bucket-Level Access
- [ ] Object Versioning; lifecycle (retain 7y)
- [ ] Service Account (least-privilege) + add to Vercel env
- [x] API: signed URL issuance (upload/download)
- [x] Client: upload via signed URL (basic)
- [ ] Replace/re-upload handling + re-extract trigger

## 4. AI Extraction (OpenAI Vision)
- [ ] Preprocess images (rotation, crop, denoise).
- [x] Prompt templates + schema for key entities (ALT, AST, Platelets, Bilirubin, Albumin, Report Date, Report Type).
- [x] Extract full lab panel dynamically (`metricsAll`) and persist
- [ ] Confidence scoring; below-threshold requires user confirmation.
- [ ] Unit parsing + normalization; synonyms (ALT/SGPT, AST/SGOT).
- [ ] Error handling + retry/backoff; cost/logging.

## 5. Review & Save
- [x] Review UI of extracted fields; inline edit (key metrics, metricsAll, imaging)
- [ ] Field-level validation (ranges, units)
- [x] Persist metrics with source linkage to file and snapshot JSON

## 6. Digital Locker
- [ ] List/grid of reports; filters (date, type).
- [ ] Preview viewer (PDF/image) with zoom.
- [ ] Delete and re-extract flows.

## 7. Tracking Dashboard
- [x] Charts for ALT, AST, Platelets, Albumin, Bilirubin (time series).
- [x] X-axis ticks and hover tooltips.
- [x] Color bands (adult reference ranges).
- [x] "Last updated" label & units in tooltips.
- [x] Empty states, sparse data handling.
- [x] Performance on large datasets (basic downsampling).

## 8. Timeline
- [x] Chronological events (report saved)
- [x] Tap-through to report
- [ ] Add more events (upload, PDF export, edits)

## 9. Sharing (v0.1)
- [ ] PDF summary layout: patient info, timeline, key charts, latest metrics.
- [x] Generate server-side PDF on GCS with branded header
- [x] Signed URL for share/open
- [x] Client share button (Web Share API or copy link)
- [ ] Access logging for share opens

## 10. Frontend System (shadcn/ui – non-generic UX)
- [x] Setup Tailwind; initial shadcn-style primitives (button, input, card)
- [ ] Design tokens: color palette, typography scale, spacing, radii, shadows
- [ ] Theme: LiverTrack-branded (not generic); dark mode
- [ ] Component inventory:
  - [ ] App shell: Header, Sidebar (collapsible), Command Palette
  - [ ] Data display: Card, Tabs, Tooltip, Badge, Skeleton
  - [ ] Inputs/forms: Input, Select, Date Picker, Combobox, Switch, Slider, Textarea
  - [ ] Overlays: Dialog, Drawer/Sheet, Popover, Toast
  - [ ] Tables: DataTable with sorting/filter/pagination (shadcn table + TanStack Table)
  - [ ] Uploader: Dropzone with previews, drag-and-drop
  - [ ] Chart wrappers: Themed Recharts components
- [ ] Form system: react-hook-form + zod resolvers; field components
- [ ] Accessibility: focus states, keyboard nav, aria labels
- [ ] Micro-interactions: motions on upload/progress, chart hover states
- [ ] Empty states and loading states (friendly, branded)
- [ ] Iconography: Lucide set with semantic mapping

## 11. Mobile (Next)
- [ ] Expo project scaffold.
- [ ] Feature parity subset: upload, review, dashboard, share.
- [ ] Native share sheet integration.

## 12. Security & Compliance
- [ ] HTTPS/TLS everywhere
- [ ] Encryption at rest (DB + GCS)
- [ ] Access logs + anomaly alerts
- [ ] Account deletion + full data export (ZIP)

## 13. Quality & Validation
- [ ] De-identified sample reports set (blood + ultrasound).
- [ ] Accuracy benchmarks for extraction (by field).
- [ ] Unit tests for normalization + API.
- [ ] E2E happy paths (upload → extract → review → charts → share).
- [ ] PDF snapshot tests.

---

## Milestones
- **M1 (2–3 weeks)**: Upload → Extract → Review → Save → Locker.
- **M2 (2 weeks)**: Charts + Timeline + PDF Share (WhatsApp/Email).
- **M3 (2 weeks)**: Stabilization, QA, privacy docs, deploy.

---

## Open Items
1. Do you have brand colors/logo, or should I propose a LiverTrack palette and type scale?
2. Keep risk calculators (FIB-4/APRI) in v0.2, not v0.1? (default: v0.2)
