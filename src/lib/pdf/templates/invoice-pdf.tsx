// src/lib/pdf/templates/invoice-pdf.tsx
// Invoice PDF document template.

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

export interface InvoicePdfData {
  invoiceNo:       string;
  companyName:     string;
  companyAddress?: string;
  applicantName:   string;
  passportNumber:  string;
  phone?:          string;
  description:     string;
  amount:          number;
  outstanding:     number;
  dueDate:         Date | string;
  createdAt:       Date | string;
  status:          "PAID" | "PARTIAL" | "DUE";
}

const s = StyleSheet.create({
  page:         { padding: 40, fontFamily: "Helvetica", color: PDF_TEXT_COLOR, fontSize: 10 },
  header:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  companyName:  { fontSize: 18, fontFamily: "Helvetica-Bold", color: PDF_PRIMARY_COLOR },
  companyAddr:  { fontSize: 8, color: PDF_MUTED_COLOR, marginTop: 2 },
  docTitle:     { fontSize: 22, fontFamily: "Helvetica-Bold", color: PDF_PRIMARY_COLOR, textAlign: "right" },
  invNo:        { fontSize: 9, color: PDF_MUTED_COLOR, textAlign: "right", marginTop: 2 },
  divider:      { borderBottomWidth: 1.5, borderColor: PDF_PRIMARY_COLOR, marginBottom: 16 },
  section:      { marginBottom: 16 },
  sectionLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: PDF_MUTED_COLOR, marginBottom: 4, textTransform: "uppercase" },
  row:          { flexDirection: "row", marginBottom: 4 },
  col:          { flex: 1 },
  label:        { fontSize: 8, color: PDF_MUTED_COLOR },
  value:        { fontSize: 10, fontFamily: "Helvetica-Bold" },
  tableHeader:  { flexDirection: "row", backgroundColor: PDF_PRIMARY_COLOR, padding: 6, borderRadius: 3 },
  tableHeaderCell: { color: "#ffffff", fontSize: 9, fontFamily: "Helvetica-Bold", flex: 1 },
  tableRow:     { flexDirection: "row", borderBottomWidth: 0.5, borderColor: PDF_BORDER_COLOR, padding: 6 },
  tableCell:    { fontSize: 9, flex: 1 },
  totalsBox:    { marginTop: 16, alignItems: "flex-end" },
  totalRow:     { flexDirection: "row", width: 200, justifyContent: "space-between", marginBottom: 4 },
  totalLabel:   { fontSize: 9, color: PDF_MUTED_COLOR },
  totalValue:   { fontSize: 9, fontFamily: "Helvetica-Bold" },
  grandTotal:   { flexDirection: "row", width: 200, justifyContent: "space-between", backgroundColor: PDF_PRIMARY_COLOR, padding: 6, borderRadius: 3, marginTop: 4 },
  grandLabel:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  grandValue:   { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  statusBadge:  { padding: "3 8", borderRadius: 4, marginTop: 8 },
  footer:       { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText:   { fontSize: 7, color: PDF_MUTED_COLOR },
});

function statusColor(status: string) {
  if (status === "PAID")    return { backgroundColor: "#d1fae5" };
  if (status === "PARTIAL") return { backgroundColor: "#fef3c7" };
  return { backgroundColor: "#fee2e2" };
}
function statusTextColor(status: string) {
  if (status === "PAID")    return "#065f46";
  if (status === "PARTIAL") return "#92400e";
  return "#991b1b";
}

export function InvoicePdfDocument({ data }: { data: InvoicePdfData }) {
  const paid = data.amount - data.outstanding;
  return (
    <Document title={`Invoice ${data.invoiceNo}`} author="VisaTek ERP">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>{data.companyName}</Text>
            {data.companyAddress && <Text style={s.companyAddr}>{data.companyAddress}</Text>}
          </View>
          <View>
            <Text style={s.docTitle}>INVOICE</Text>
            <Text style={s.invNo}>{data.invoiceNo}</Text>
          </View>
        </View>
        <View style={s.divider} />

        {/* Dates */}
        <View style={[s.row, s.section]}>
          <View style={s.col}>
            <Text style={s.sectionLabel}>Invoice Date</Text>
            <Text style={s.value}>{formatPdfDate(data.createdAt)}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.sectionLabel}>Due Date</Text>
            <Text style={s.value}>{formatPdfDate(data.dueDate)}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.sectionLabel}>Status</Text>
            <View style={[s.statusBadge, statusColor(data.status)]}>
              <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: statusTextColor(data.status) }}>
                {data.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Bill To */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Bill To</Text>
          <Text style={s.value}>{data.applicantName}</Text>
          <Text style={[s.label, { marginTop: 2 }]}>Passport: {data.passportNumber}</Text>
          {data.phone && <Text style={s.label}>Phone: {data.phone}</Text>}
        </View>

        {/* Line Items */}
        <View style={s.section}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderCell, { flex: 3 }]}>Description</Text>
            <Text style={[s.tableHeaderCell, { textAlign: "right" }]}>Amount</Text>
          </View>
          <View style={s.tableRow}>
            <Text style={[s.tableCell, { flex: 3 }]}>{data.description}</Text>
            <Text style={[s.tableCell, { textAlign: "right" }]}>{formatBDT(data.amount)}</Text>
          </View>
        </View>

        {/* Totals */}
        <View style={s.totalsBox}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Invoice Amount:</Text>
            <Text style={s.totalValue}>{formatBDT(data.amount)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Paid:</Text>
            <Text style={[s.totalValue, { color: "#065f46" }]}>{formatBDT(paid)}</Text>
          </View>
          <View style={s.grandTotal}>
            <Text style={s.grandLabel}>Outstanding:</Text>
            <Text style={s.grandValue}>{formatBDT(data.outstanding)}</Text>
          </View>
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
