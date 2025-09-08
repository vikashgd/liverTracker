// Medical Report Sharing System Components
// Phase 2: Professional Medical Interface (Healthcare Provider View)
export { ProfessionalMedicalView } from './professional-medical-view';
export { ExecutiveSummaryPanel } from './executive-summary-panel';
export { LabResultsTab } from './lab-results-tab';
export { ConsolidatedReportTab } from './consolidated-report-tab';
export { TrendsAnalysisTab } from './trends-analysis-tab';
export { ScoringTab } from './scoring-tab';
export { AIInsightsTab } from './ai-insights-tab';
export { OriginalDocumentsTab } from './original-documents-tab';
export { PatientProfileTab } from './patient-profile-tab';
export { ShareLinkError } from './share-link-error';

// Phase 3: Patient Share Management (Patient View)
export { ShareCreationModal } from './share-creation-modal';
export { ShareManagementPanel } from './share-management-panel';
export { ShareReportButton, QuickShareButton, ShareWithDoctorButton } from './share-report-button';

// Types (re-export from types file)
export type { ShareLinkConfig, SharedMedicalData } from '../../types/medical-sharing';