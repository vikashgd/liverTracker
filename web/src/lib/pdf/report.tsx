import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";

type Metric = { name: string; value: number | null; unit: string | null; textValue?: string | null; category?: string | null };

export interface ReportPdfProps {
  brandName: string;
  report: {
    id: string;
    reportType: string | null;
    reportDate: string | null;
    objectKey: string;
  };
  metrics: Metric[];
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, color: "#111" },
  header: { marginBottom: 16 },
  headerBar: { backgroundColor: "#1f2937", height: 6, borderRadius: 3 },
  brand: { fontSize: 18, fontWeight: 700, color: "#1f2937", marginTop: 8 },
  meta: { fontSize: 10, color: "#374151", marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#111827" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#374151" },
  value: { color: "#111827" },
  card: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 6, padding: 8, marginBottom: 8 },
});

export function ReportPdfDocument({ brandName, report, metrics }: ReportPdfProps) {
  const labMetrics = metrics.filter((m) => m.category !== "imaging");
  const imaging = metrics.filter((m) => m.category === "imaging");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerBar} />
          <Text style={styles.brand}>{brandName}</Text>
          <Text style={styles.meta}>Report ID: {report.id}</Text>
          <Text style={styles.meta}>Type: {report.reportType ?? "Unknown"}</Text>
          <Text style={styles.meta}>Date: {report.reportDate ?? "No date"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key metrics</Text>
          <View style={styles.card}>
            {labMetrics.length === 0 ? (
              <Text style={styles.label}>No lab metrics.</Text>
            ) : (
              labMetrics.map((m, idx) => (
                <View key={idx} style={styles.row}>
                  <Text style={styles.label}>{m.name}</Text>
                  <Text style={styles.value}>
                    {m.value != null ? String(m.value) : "-"} {m.unit ?? ""}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imaging</Text>
          <View style={styles.card}>
            {imaging.length === 0 ? (
              <Text style={styles.label}>No imaging findings.</Text>
            ) : (
              imaging.map((m, idx) => (
                <View key={idx} style={{ marginBottom: 6 }}>
                  <View style={styles.row}>
                    <Text style={styles.label}>{m.name}</Text>
                    <Text style={styles.value}>
                      {m.value != null ? String(m.value) : ""} {m.unit ?? ""}
                    </Text>
                  </View>
                  {m.textValue ? <Text style={styles.value}>{m.textValue}</Text> : null}
                </View>
              ))
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function buildReportPdf(props: ReportPdfProps): React.ReactElement<DocumentProps> {
  return ReportPdfDocument(props) as unknown as React.ReactElement<DocumentProps>;
}


