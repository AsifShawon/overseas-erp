// src/lib/pdf/templates/receipt-pdf.tsx
// Receipt PDF document template.

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
} from "../pdf-service";

export interface ReceiptPdfData {
  receiptNo:     string;
  companyName:   string;
  companyAddress?: string;
  applicantName: string;
  passportNumber: string;
  phone?:        string;
  invoiceNo?:    string;
  amountPaid:    number;
  paymentMethod: string;
  referenceNo?:  string;
  receivedBy?:   string;
  createdAt:     Date | string;
}

const s = StyleSheet.create({
  page:        { padding: 40, fontFamily: "Helvetica", color: PDF_TEXT_COLOR, fontSize: 10 },
  header:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: PDF_PRIMARY_COLOR },
  companyAddr: { fontSize: 8, color: PDF_MUTED_COLOR, marginTop: 2 },
  docTitle:    { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#065f46", textAlign: "right" },
  recNo:       { fontSize: 9, color: PDF_MUTED_COLOR, textAlign: "right", marginTop: 2 },
  divider:     { borderBottomWidth: 1.5, borderColor: "#065f46", marginBottom: 16 },
  section:     { marginBottom: 16 },
  sectionLabel:{ fontSize: 8, fontFamily: "Helvetica-Bold", color: PDF_MUTED_COLOR, marginBottom: 4, textTransform: "uppercase" },
  row:         { flexDirection: "row", marginBottom: 6 },
  col:         { flex: 1 },
  label:       { fontSize: 8, color: PDF_MUTED_COLOR },
  value:       { fontSize: 10, fontFamily: "Helvetica-Bold" },
  amountBox:   { backgroundColor: "#d1fae5", padding: 16, borderRadius: 4, alignItems: "center", marginVertical: 20 },
  amountLabel: { fontSize: 9, color: "#065f46" },
  amountValue: { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#065f46", marginTop: 4 },
  infoRow:     { flexDirection: "row", borderBottomWidth: 0.5, borderColor: PDF_BORDER_COLOR, paddingVertical: 6, marginBottom: 2 },
  infoLabel:   { fontSize: 9, color: PDF_MUTED_COLOR, flex: 1 },
  infoValue:   { fontSize: 9, fontFamily: "Helvetica-Bold", flex: 2 },
  footer:      { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText:  { fontSize: 7, color: PDF_MUTED_COLOR },
});

export function ReceiptPdfDocument({ data }: { data: ReceiptPdfData }) {
  return (
    <Document title={`Receipt ${data.receiptNo}`} author="VisaTek ERP">
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>{data.companyName}</Text>
            {data.companyAddress && <Text style={s.companyAddr}>{data.companyAddress}</Text>}
          </View>
          <View>
            <Text style={s.docTitle}>PAYMENT RECEIPT</Text>
            <Text style={s.recNo}>{data.receiptNo}</Text>
          </View>
        </View>
        <View style={s.divider} />

        {/* Big amount display */}
        <View style={s.amountBox}>
          <Text style={s.amountLabel}>Amount Received</Text>
          <Text style={s.amountValue}>{formatBDT(data.amountPaid)}</Text>
        </View>

        {/* Details */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Receipt Details</Text>
          {[
            ["Receipt No",       data.receiptNo],
            ["Date",             formatPdfDate(data.createdAt)],
            ["Received From",    data.applicantName],
            ["Passport No",      data.passportNumber],
            ["Payment Method",   data.paymentMethod],
            ...(data.referenceNo ? [["Reference No", data.referenceNo]] : []),
            ...(data.invoiceNo   ? [["Against Invoice", data.invoiceNo]] : []),
            ...(data.receivedBy  ? [["Recorded By", data.receivedBy]] : []),
          ].map(([label, val]) => (
            <View key={label} style={s.infoRow}>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoValue}>{val}</Text>
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
