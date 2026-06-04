// src/lib/pdf/templates/statement-pdf.tsx
// Applicant Statement / Ledger Report PDF template.

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import {
  formatBDT,
  formatPdfDate,
  PDF_FOOTER_TEXT,
  PDF_PRIMARY_COLOR,
  PDF_TEXT_COLOR,
  PDF_MUTED_COLOR,
  PDF_BORDER_COLOR,
  PDF_BG_LIGHT,
} from "../pdf-service";

export interface StatementPdfRow {
  timestamp:       Date | string;
  transactionType: string;
  referenceNo:     string;
  debit:           number;
  credit:          number;
  runningBalance:  number;
}

export interface StatementPdfData {
  companyName:        string;
  companyAddress?:    string;
  applicantName:      string;
  passportNumber:     string;
  trade:              string;
  outstandingBalance: number;
  entries:            StatementPdfRow[];
}

const s = StyleSheet.create({
  page:         { padding: 40, fontFamily: "Helvetica", color: PDF_TEXT_COLOR, fontSize: 10 },
  header:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  companyName:  { fontSize: 18, fontFamily: "Helvetica-Bold", color: PDF_PRIMARY_COLOR },
  companyAddr:  { fontSize: 8, color: PDF_MUTED_COLOR, marginTop: 2 },
  docTitle:     { fontSize: 20, fontFamily: "Helvetica-Bold", color: PDF_PRIMARY_COLOR, textAlign: "right" },
  docSubtitle:  { fontSize: 9, color: PDF_MUTED_COLOR, textAlign: "right", marginTop: 2 },
  divider:      { borderBottomWidth: 1.5, borderColor: PDF_PRIMARY_COLOR, marginBottom: 16 },
  section:      { marginBottom: 16 },
  sectionLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PDF_MUTED_COLOR, marginBottom: 4, textTransform: "uppercase" },
  row:          { flexDirection: "row", marginBottom: 4 },
  col:          { flex: 1 },
  label:        { fontSize: 8, color: PDF_MUTED_COLOR },
  value:        { fontSize: 10, fontFamily: "Helvetica-Bold" },
  tableHeader:  { flexDirection: "row", backgroundColor: PDF_PRIMARY_COLOR, padding: 6, borderRadius: 3 },
  tableHeaderCell: { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold", flex: 1 },
  tableRow:     { flexDirection: "row", borderBottomWidth: 0.5, borderColor: PDF_BORDER_COLOR, padding: 6 },
  tableCell:    { fontSize: 8, flex: 1 },
  footer:       { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText:   { fontSize: 7, color: PDF_MUTED_COLOR },
});

export function StatementPdfDocument({ data }: { data: StatementPdfData }) {
  return (
    <Document title={`Statement - ${data.applicantName}`} author="VisaTek ERP">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>{data.companyName}</Text>
            {data.companyAddress && <Text style={s.companyAddr}>{data.companyAddress}</Text>}
          </View>
          <View>
            <Text style={s.docTitle}>LEDGER STATEMENT</Text>
            <Text style={s.docSubtitle}>Applicant Account Summary</Text>
          </View>
        </View>
        <View style={s.divider} />

        {/* Info Grid */}
        <View style={[s.row, s.section]}>
          <View style={s.col}>
            <Text style={s.sectionLabel}>Applicant Info</Text>
            <Text style={s.value}>{data.applicantName}</Text>
            <Text style={[s.label, { marginTop: 2 }]}>Passport: {data.passportNumber}</Text>
            <Text style={s.label}>Trade: {data.trade}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.sectionLabel}>Financial Summary</Text>
            <Text style={[s.label, { fontSize: 9 }]}>Outstanding Balance:</Text>
            <Text style={[s.value, { fontSize: 13, color: data.outstandingBalance > 0 ? "#dc2626" : "#065f46", marginTop: 2 }]}>
              {formatBDT(data.outstandingBalance)}
            </Text>
          </View>
        </View>

        {/* Ledger Entries Table */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Transaction History</Text>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 1.2 }]}>Date</Text>
            <Text style={[s.tableHeaderCell, { flex: 1 }]}>Type</Text>
            <Text style={[s.tableHeaderCell, { flex: 1.5 }]}>Reference</Text>
            <Text style={[s.tableHeaderCell, { textAlign: "right" }]}>Debit</Text>
            <Text style={[s.tableHeaderCell, { textAlign: "right" }]}>Credit</Text>
            <Text style={[s.tableHeaderCell, { textAlign: "right" }]}>Balance</Text>
          </View>

          {data.entries.map((entry, idx) => (
            <View key={idx} style={[s.tableRow, idx % 2 === 0 ? { backgroundColor: PDF_BG_LIGHT } : {}]}>
              <Text style={[s.tableCell, { flex: 1.2 }]}>{formatPdfDate(entry.timestamp)}</Text>
              <Text style={[s.tableCell, { flex: 1, fontFamily: "Helvetica-Bold" }]}>{entry.transactionType}</Text>
              <Text style={[s.tableCell, { flex: 1.5, fontFamily: "Courier" }]}>{entry.referenceNo}</Text>
              <Text style={[s.tableCell, { textAlign: "right", color: entry.debit > 0 ? "#dc2626" : "#64748b" }]}>
                {entry.debit > 0 ? formatBDT(entry.debit) : "—"}
              </Text>
              <Text style={[s.tableCell, { textAlign: "right", color: entry.credit > 0 ? "#065f46" : "#64748b" }]}>
                {entry.credit > 0 ? formatBDT(entry.credit) : "—"}
              </Text>
              <Text style={[s.tableCell, { textAlign: "right", fontFamily: "Helvetica-Bold" }]}>
                {formatBDT(entry.runningBalance)}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{PDF_FOOTER_TEXT}</Text>
          <Text style={s.footerText}>Generated: {formatPdfDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
}
