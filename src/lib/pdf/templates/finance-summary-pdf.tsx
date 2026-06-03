// src/lib/pdf/templates/finance-summary-pdf.tsx
// Finance summary report PDF template.

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

export interface FinanceSummaryPdfData {
  companyName:     string;
  dateFrom?:       string;
  dateTo?:         string;
  totalInvoiced:   number;
  totalCollected:  number;
  totalOutstanding:number;
  invoiceCount:    number;
  receiptCount:    number;
  topInvoices?:    { invoiceNo: string; applicantName: string; amount: number; outstanding: number; status: string }[];
}

const s = StyleSheet.create({
  page:       { padding: 40, fontFamily: "Helvetica", color: PDF_TEXT_COLOR, fontSize: 10 },
  header:     { marginBottom: 24 },
  title:      { fontSize: 20, fontFamily: "Helvetica-Bold", color: PDF_PRIMARY_COLOR },
  subtitle:   { fontSize: 9, color: PDF_MUTED_COLOR, marginTop: 4 },
  divider:    { borderBottomWidth: 1.5, borderColor: PDF_PRIMARY_COLOR, marginBottom: 16 },
  statsRow:   { flexDirection: "row", marginBottom: 20, gap: 8 },
  statBox:    { flex: 1, backgroundColor: PDF_BG_LIGHT, padding: 12, borderRadius: 4 },
  statLabel:  { fontSize: 8, color: PDF_MUTED_COLOR, textTransform: "uppercase" },
  statValue:  { fontSize: 14, fontFamily: "Helvetica-Bold", color: PDF_PRIMARY_COLOR, marginTop: 4 },
  tableHeader:{ flexDirection: "row", backgroundColor: PDF_PRIMARY_COLOR, padding: 6 },
  thCell:     { color: "#ffffff", fontSize: 8, fontFamily: "Helvetica-Bold" },
  tableRow:   { flexDirection: "row", borderBottomWidth: 0.5, borderColor: PDF_BORDER_COLOR, paddingVertical: 5, paddingHorizontal: 6 },
  tdCell:     { fontSize: 8 },
  footer:     { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: PDF_MUTED_COLOR },
});

export function FinanceSummaryPdfDocument({ data }: { data: FinanceSummaryPdfData }) {
  const dateRange = data.dateFrom && data.dateTo
    ? `${data.dateFrom} to ${data.dateTo}`
    : "All Time";

  return (
    <Document title="Finance Summary Report" author="VisaTek ERP">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>{data.companyName}</Text>
          <Text style={s.subtitle}>Finance Summary Report — {dateRange}</Text>
        </View>
        <View style={s.divider} />

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Total Invoiced</Text>
            <Text style={s.statValue}>{formatBDT(data.totalInvoiced)}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Total Collected</Text>
            <Text style={[s.statValue, { color: "#065f46" }]}>{formatBDT(data.totalCollected)}</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statLabel}>Outstanding</Text>
            <Text style={[s.statValue, { color: "#dc2626" }]}>{formatBDT(data.totalOutstanding)}</Text>
          </View>
        </View>

        <View style={[s.statsRow, { marginBottom: 24 }]}>
          <View style={[s.statBox, { flex: 0.5 }]}>
            <Text style={s.statLabel}>Invoices</Text>
            <Text style={s.statValue}>{data.invoiceCount}</Text>
          </View>
          <View style={[s.statBox, { flex: 0.5 }]}>
            <Text style={s.statLabel}>Receipts</Text>
            <Text style={s.statValue}>{data.receiptCount}</Text>
          </View>
        </View>

        {/* Invoice table */}
        {data.topInvoices && data.topInvoices.length > 0 && (
          <View>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6, color: PDF_PRIMARY_COLOR }}>
              Invoice Details
            </Text>
            <View style={s.tableHeader}>
              {["Invoice No", "Applicant", "Amount", "Outstanding", "Status"].map((h, i) => (
                <Text key={i} style={[s.thCell, { flex: i === 1 ? 2 : 1 }]}>{h}</Text>
              ))}
            </View>
            {data.topInvoices.map((inv, idx) => (
              <View key={idx} style={[s.tableRow, idx % 2 === 0 ? { backgroundColor: PDF_BG_LIGHT } : {}]}>
                <Text style={[s.tdCell, { flex: 1 }]}>{inv.invoiceNo}</Text>
                <Text style={[s.tdCell, { flex: 2 }]}>{inv.applicantName}</Text>
                <Text style={[s.tdCell, { flex: 1 }]}>{formatBDT(inv.amount)}</Text>
                <Text style={[s.tdCell, { flex: 1 }]}>{formatBDT(inv.outstanding)}</Text>
                <Text style={[s.tdCell, { flex: 1 }]}>{inv.status}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.footer} fixed>
          <Text style={s.footerText}>{PDF_FOOTER_TEXT}</Text>
          <Text style={s.footerText}>Generated: {formatPdfDate(new Date())}</Text>
        </View>
      </Page>
    </Document>
  );
}
