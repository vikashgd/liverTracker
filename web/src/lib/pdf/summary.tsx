import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";

export interface SummaryPdfProps {
  brandName: string;
  patient: {
    name?: string;
    dateOfBirth?: string;
    id?: string;
  };
  timeline: Array<{
    date: string;
    type: string;
    reportType?: string;
    key?: string;
  }>;
  latestMetrics: Array<{
    name: string;
    value: number | null;
    unit: string | null;
    range: { low: number; high: number };
    status: "normal" | "high" | "low";
  }>;
  chartImages?: Array<{
    title: string;
    imageData: string; // base64 data URL
  }>;
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, color: "#111", fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  headerBar: { backgroundColor: "#1f2937", height: 8, borderRadius: 4 },
  brand: { fontSize: 22, fontWeight: 700, color: "#1f2937", marginTop: 12 },
  subtitle: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  meta: { fontSize: 10, color: "#374151", marginTop: 2 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#111827" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#374151", flex: 1 },
  value: { color: "#111827", flex: 1, textAlign: "right" },
  card: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 12, marginBottom: 8 },
  timelineItem: { marginBottom: 6, paddingBottom: 6, borderBottom: "1px solid #f3f4f6" },
  timelineDate: { fontSize: 9, color: "#6b7280" },
  timelineEvent: { fontSize: 10, fontWeight: 500, marginTop: 2 },
  statusNormal: { color: "#16a34a" },
  statusHigh: { color: "#dc2626" },
  statusLow: { color: "#ea580c" },
  chartContainer: { marginBottom: 16, alignItems: "center" },
  chartTitle: { fontSize: 12, fontWeight: 600, marginBottom: 8, textAlign: "center" },
  chartImage: { width: 280, height: 120, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%", marginBottom: 12 },
});

export function SummaryPdfDocument({ brandName, patient, timeline, latestMetrics, chartImages }: SummaryPdfProps) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "normal": return styles.statusNormal;
      case "high": return styles.statusHigh;
      case "low": return styles.statusLow;
      default: return {};
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerBar} />
          <Text style={styles.brand}>{brandName}</Text>
          <Text style={styles.subtitle}>Liver Health Summary Report</Text>
          {patient.name && <Text style={styles.meta}>Patient: {patient.name}</Text>}
          {patient.dateOfBirth && <Text style={styles.meta}>Date of Birth: {patient.dateOfBirth}</Text>}
          <Text style={styles.meta}>Generated: {new Date().toLocaleDateString()}</Text>
        </View>

        {/* Latest Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Key Metrics</Text>
          <View style={styles.card}>
            {latestMetrics.length === 0 ? (
              <Text style={styles.label}>No metrics available.</Text>
            ) : (
              latestMetrics.map((m, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={styles.label}>{m.name}</Text>
                  <Text style={[styles.value, getStatusStyle(m.status)]}>
                    {m.value != null ? `${m.value} ${m.unit || ""}` : "-"}
                    {m.value != null && (
                      <Text style={{ fontSize: 8, color: "#6b7280" }}>
                        {" "}(Normal: {m.range.low}-{m.range.high})
                      </Text>
                    )}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Recent Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.card}>
            {timeline.length === 0 ? (
              <Text style={styles.label}>No recent activity.</Text>
            ) : (
              timeline.slice(0, 8).map((event, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <Text style={styles.timelineDate}>{formatDate(event.date)}</Text>
                  <Text style={styles.timelineEvent}>
                    {event.type.replace(/_/g, " ")} 
                    {event.reportType && ` - ${event.reportType}`}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </Page>

      {/* Second page for charts if available */}
      {chartImages && chartImages.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.brand}>Trend Charts</Text>
            <Text style={styles.subtitle}>Visual progression over time</Text>
          </View>

          <View style={styles.grid}>
            {chartImages.map((chart, idx) => (
              <View key={idx} style={styles.gridItem}>
                <Text style={styles.chartTitle}>{chart.title}</Text>
                <Image style={styles.chartImage} src={chart.imageData} />
              </View>
            ))}
          </View>
        </Page>
      )}
    </Document>
  );
}

export function buildSummaryPdf(props: SummaryPdfProps): React.ReactElement<DocumentProps> {
  return SummaryPdfDocument(props) as unknown as React.ReactElement<DocumentProps>;
}
