// src/lib/pdf/templates/applicant-report-pdf.tsx
// Applicant report PDF template.

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  formatPdfDate,
  PDF_FOOTER_TEXT,
  PDF_PRIMARY_COLOR,
  PDF_TEXT_COLOR,
  PDF_MUTED_COLOR,
  PDF_BORDER_COLOR,
  PDF_BG_LIGHT,
} from "../pdf-service";

export interface ApplicantReportRow {
  fullName:      string;
  passportNumber:string;
  trade:         string;
  currentStage:  string;
  agentCode?:    string;
  phone:         string;
  createdAt:     Date | string;
  isArchived:    boolean;
}

export interface ApplicantReportPdfData {
  companyName:  string;
  filters?:     string;
  totalActive:  number;
  totalArchived:number;
  rows:         ApplicantReportRow[];
}

const s = StyleSheet.create({
  page:       { padding: 40, fontFamily: "Helvetica", color: PDF_TEXT_COLOR, fontSize: 10 },
  title:      { fontSize: 20, fontFamily: "Helvetica-Bold", color: PDF_PRIMARY_COLOR },
  subtitle:   { fontSize: 9, color: PDF_MUTED_COLOR, marginTop: 4, marginBottom: 20 },
  divider:    { borderBottomWidth: 1.5, borderColor: PDF_PRIMARY_COLOR, marginBottom: 16 },
  statsRow:   { flexDirection: "row", marginBottom: 20, gap: 8 },
  statBox:    { flex: 1, backgroundColor: PDF_BG_LIGHT, padding: 12, borderRadius: 4 },
  statLabel:  { fontSize: 8, color: PDF_MUTED_COLOR },
  statValue:  { fontSize: 14, fontFamily: "Helvetica-Bold", color: PDF_PRIMARY_COLOR, marginTop: 4 },
  tableHeader:{ flexDirection: "row", backgroundColor: PDF_PRIMARY_COLOR, padding: 6 },
  thCell:     { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold" },
  tableRow:   { flexDirection: "row", borderBottomWidth: 0.5, borderColor: PDF_BORDER_COLOR, paddingVertical: 5, paddingHorizontal: 6 },
  tdCell:     { fontSize: 8 },
  footer:     { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: PDF_MUTED_COLOR },
});

export function ApplicantReportPdfDocument({ data }: { data: ApplicantReportPdfData }) {
  return (
    <Document title="Applicant Report" author="VisaTek ERP">
      <Page size="A4" style={s.page} orientation="landscape">
        <Text style={s.title}>{data.companyName}</Text>
        <Text style={s.subtitle}>
          Applicant Report{data.filters ? ` — ${data.filters}` : ""} · Generated: {formatPdfDate(new Date())}
        </Text>
        <View style={s.divider} />

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Active</Text>
            <Text style={s.statValue}>{data.totalActive}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Archived</Text>
            <Text style={[s.statValue, { color: "#6b7280" }]}>{data.totalArchived}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Total</Text>
            <Text style={s.statValue}>{data.rows.length}</Text>
          </View>
        </View>

        <View style={s.tableHeader}>
          {["Name", "Passport", "Trade", "Stage", "Agent", "Phone", "Joined"].map((h, i) => (
            <Text key={i} style={[s.thCell, { flex: i === 0 ? 2 : 1 }]}>{h}</Text>
          ))}
        </View>
        {data.rows.map((row, idx) => (
          <View key={idx} style={[s.tableRow, idx % 2 === 0 ? { backgroundColor: PDF_BG_LIGHT } : {}]}>
            <Text style={[s.tdCell, { flex: 2 }]}>{row.fullName}{row.isArchived ? " (Archived)" : ""}</Text>
            <Text style={[s.tdCell, { flex: 1 }]}>{row.passportNumber}</Text>
            <Text style={[s.tdCell, { flex: 1 }]}>{row.trade}</Text>
            <Text style={[s.tdCell, { flex: 1 }]}>{row.currentStage.replace(/_/g, " ")}</Text>
            <Text style={[s.tdCell, { flex: 1 }]}>{row.agentCode ?? "—"}</Text>
            <Text style={[s.tdCell, { flex: 1 }]}>{row.phone}</Text>
            <Text style={[s.tdCell, { flex: 1 }]}>{formatPdfDate(row.createdAt)}</Text>
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>{PDF_FOOTER_TEXT}</Text>
          <Text style={s.footerText}>Generated: {formatPdfDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
}
