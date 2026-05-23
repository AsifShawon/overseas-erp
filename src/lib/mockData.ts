// Centralized Mock Data for Overseas Recruitment ERP

export type WorkflowStage =
  | "APPLIED"
  | "INTERVIEWED"
  | "SELECTED"
  | "MEDICAL_WAITING"
  | "MEDICAL_FIT"
  | "MEDICAL_UNFIT"
  | "TRAINING_COMPLETED"
  | "VISA_SUBMITTED"
  | "VISA_STAMPED"
  | "VISA_REJECTED"
  | "TICKETED"
  | "DEPLOYED";

// Friendly Workflow UI Label Map
export const WORKFLOW_LABELS: Record<WorkflowStage, string> = {
  APPLIED: "Application Submitted",
  INTERVIEWED: "Interview Completed",
  SELECTED: "Candidate Selected",
  MEDICAL_WAITING: "Pending Medical Appointment",
  MEDICAL_FIT: "Medical Clearance Passed",
  MEDICAL_UNFIT: "Medical Unfit (Halted)",
  TRAINING_COMPLETED: "Pre-Departure Training Completed",
  VISA_SUBMITTED: "Visa Submission Sent",
  VISA_STAMPED: "Visa Sticker Stamped",
  VISA_REJECTED: "Visa Declined (Halted)",
  TICKETED: "Flight Ticket Issued",
  DEPLOYED: "Candidate Deployed",
};

export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  roleName: string;
  agentCode?: string;
  applicantId?: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: "u-super-admin", email: "admin@agency.com", fullName: "Richard Vance", roleName: "Super Admin" },
  { id: "u-ops-admin", email: "ops@agency.com", fullName: "Helena Rostova", roleName: "Operations Admin" },
  { id: "u-hr-officer", email: "hr@agency.com", fullName: "Sarah Jenkins", roleName: "HR Officer" },
  { id: "u-docs-officer", email: "docs@agency.com", fullName: "David Miller", roleName: "Documentation Officer" },
  { id: "u-visa-officer", email: "visa@agency.com", fullName: "Fatima Al-Sayed", roleName: "Visa Officer" },
  { id: "u-accounts-officer", email: "accounts@agency.com", fullName: "Lawrence Wilde", roleName: "Accounts Officer" },
  { id: "u-agent", email: "agent@agent.com", fullName: "Kabir Chowdhury", roleName: "Agent", agentCode: "AGT-052" },
  { id: "u-applicant", email: "applicant@applicant.com", fullName: "Mohammad Al-Amin", roleName: "Applicant", applicantId: "app-1" },
];

export interface MockAgent {
  id: string;
  agentCode: string;
  companyName: string;
  licenseNo: string;
  tier: "A" | "B" | "C";
  fullName: string;
  email: string;
  phone: string;
  isActive: boolean;
}

export const MOCK_AGENTS: MockAgent[] = [
  {
    id: "agt-052",
    agentCode: "AGT-052",
    companyName: "Chowdhury Sourcing Ltd",
    licenseNo: "RL-9082",
    tier: "A",
    fullName: "Kabir Chowdhury",
    email: "agent@agent.com",
    phone: "+880-1711-234567",
    isActive: true,
  },
  {
    id: "agt-031",
    agentCode: "AGT-031",
    companyName: "Apex Recruiters Bangladesh",
    licenseNo: "RL-8824",
    tier: "B",
    fullName: "Tariqul Islam",
    email: "tariq@apexrecruit.com",
    phone: "+880-1819-765432",
    isActive: true,
  },
  {
    id: "agt-079",
    agentCode: "AGT-079",
    companyName: "Gram Bangla Labor Agency",
    licenseNo: "RL-1025",
    tier: "C",
    fullName: "Mukhlesur Rahman",
    email: "mukhles@grambangla.com",
    phone: "+880-1515-998877",
    isActive: false,
  },
];

export interface MockJobOrder {
  id: string;
  orderNumber: string;
  employerName: string;
  country: string;
  trade: string;
  salary: number;
  totalQuota: number;
  allocatedQuota: number;
  commissionAmount: number;
  status: "OPEN" | "CLOSED";
}

export const MOCK_JOB_ORDERS: MockJobOrder[] = [
  {
    id: "jo-1",
    orderNumber: "JO-KSA-2026-004",
    employerName: "Al-Juraid Contracting Co.",
    country: "Saudi Arabia",
    trade: "Electrician",
    salary: 1800, // SAR
    totalQuota: 50,
    allocatedQuota: 14,
    commissionAmount: 500, // BDT per candidate
    status: "OPEN",
  },
  {
    id: "jo-2",
    orderNumber: "JO-UAE-2026-012",
    employerName: "Emaar Hospitality Group",
    country: "United Arab Emirates",
    trade: "Hospitality Executive",
    salary: 2200, // AED
    totalQuota: 20,
    allocatedQuota: 18,
    commissionAmount: 600,
    status: "OPEN",
  },
  {
    id: "jo-3",
    orderNumber: "JO-MYS-2026-081",
    employerName: "Intel Semiconductor Penang",
    country: "Malaysia",
    trade: "Cleanroom Operator",
    salary: 1600, // MYR
    totalQuota: 100,
    allocatedQuota: 100,
    commissionAmount: 350,
    status: "CLOSED",
  },
];

export interface MockDocument {
  id: string;
  documentType: "PASSPORT" | "PHOTO" | "CV" | "MEDICAL_REPORT" | "POLICE_CLEARANCE" | "VISA_STICKER" | "AIR_TICKET" | "OTHER";
  fileName: string;
  fileUrl: string;
  status: "PENDING_UPLOAD" | "PENDING_VERIFICATION" | "VERIFIED" | "REJECTED" | "EXPIRED";
  expiryDate?: string;
  verifiedBy?: string;
}

export interface MockApplicant {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  dateOfBirth: string;
  nidNumber: string | null;
  address: string | null;
  emergencyContact: string | null;
  trade: string;
  currentStage: WorkflowStage;
  isArchived: boolean;
  archivedAt: string | null;
  agentId: string | null;
  jobOrderId: string | null;
  userId: string | null; // Nullable if unclaimed
  documents: MockDocument[];
}

export const MOCK_APPLICANTS: MockApplicant[] = [
  {
    id: "app-1",
    fullName: "Mohammad Al-Amin",
    phone: "+880-1912-345678",
    email: "applicant@applicant.com",
    passportNumber: "A03498822",
    passportExpiry: "2031-10-15",
    nationality: "Bangladesh",
    dateOfBirth: "1997-04-12",
    nidNumber: "4529082312",
    address: "House 14, Road 3, Dhanmondi, Dhaka",
    emergencyContact: "Mst. Amina Begum (Mother) - +880-1912-998877",
    trade: "Electrician",
    currentStage: "VISA_SUBMITTED",
    isArchived: false,
    archivedAt: null,
    agentId: "agt-052",
    jobOrderId: "jo-1",
    userId: "u-applicant", // Claimed
    documents: [
      { id: "doc-1-1", documentType: "PASSPORT", fileName: "Passport_AlAmin.pdf", fileUrl: "#", status: "VERIFIED", verifiedBy: "David Miller" },
      { id: "doc-1-2", documentType: "CV", fileName: "CV_AlAmin.pdf", fileUrl: "#", status: "VERIFIED", verifiedBy: "David Miller" },
      { id: "doc-1-3", documentType: "MEDICAL_REPORT", fileName: "Medical_AlAmin.pdf", fileUrl: "#", status: "VERIFIED", verifiedBy: "David Miller" },
      { id: "doc-1-4", documentType: "POLICE_CLEARANCE", fileName: "Police_AlAmin.pdf", fileUrl: "#", status: "PENDING_VERIFICATION" },
      { id: "doc-1-5", documentType: "VISA_STICKER", fileName: "Visa_Draft.pdf", fileUrl: "#", status: "PENDING_UPLOAD" },
    ],
  },
  {
    id: "app-2",
    fullName: "Jasim Uddin",
    phone: "+880-1712-445566",
    email: null,
    passportNumber: "A04992211",
    passportExpiry: "2030-05-18",
    nationality: "Bangladesh",
    dateOfBirth: "1994-08-22",
    nidNumber: "8911002341",
    address: "Village: Kazipur, Dist: Sirajganj",
    emergencyContact: "Md. Rofiqul Islam (Brother) - +880-1712-001122",
    trade: "Electrician",
    currentStage: "SELECTED",
    isArchived: false,
    archivedAt: null,
    agentId: "agt-052",
    jobOrderId: "jo-1",
    userId: null, // Unclaimed
    documents: [
      { id: "doc-2-1", documentType: "PASSPORT", fileName: "Passport_Jasim.pdf", fileUrl: "#", status: "VERIFIED", verifiedBy: "David Miller" },
      { id: "doc-2-2", documentType: "MEDICAL_REPORT", fileName: "Med_Jasim.pdf", fileUrl: "#", status: "REJECTED", verifiedBy: "David Miller" },
    ],
  },
  {
    id: "app-3",
    fullName: "Abu Bakar Siddique",
    phone: "+880-1511-332211",
    email: "abubakar@gmail.com",
    passportNumber: "A05882200",
    passportExpiry: "2029-12-01",
    nationality: "Bangladesh",
    dateOfBirth: "1991-11-05",
    nidNumber: "1234908871",
    address: "Vill: Ghorashal, Upazila: Palash, Narsingdi",
    emergencyContact: "Siddique Rahman (Father) - +880-1511-999999",
    trade: "Hospitality Executive",
    currentStage: "TICKETED",
    isArchived: false,
    archivedAt: null,
    agentId: "agt-031",
    jobOrderId: "jo-2",
    userId: null,
    documents: [
      { id: "doc-3-1", documentType: "PASSPORT", fileName: "Passport_Bakar.pdf", fileUrl: "#", status: "VERIFIED", verifiedBy: "David Miller" },
      { id: "doc-3-2", documentType: "VISA_STICKER", fileName: "Visa_Bakar.pdf", fileUrl: "#", status: "VERIFIED", verifiedBy: "David Miller" },
      { id: "doc-3-3", documentType: "AIR_TICKET", fileName: "FlightTicket_Bakar.pdf", fileUrl: "#", status: "VERIFIED", verifiedBy: "David Miller" },
    ],
  },
  {
    id: "app-4",
    fullName: "Tariqul Anam",
    phone: "+880-1814-556677",
    email: "tariqul@yahoo.com",
    passportNumber: "A08776655",
    passportExpiry: "2026-06-30", // Near expiration
    nationality: "Bangladesh",
    dateOfBirth: "1988-02-14",
    nidNumber: "3489110022",
    address: "Sector 4, Uttara, Dhaka",
    emergencyContact: "Shamim Anam (Brother) - +880-1814-112233",
    trade: "Cleanroom Operator",
    currentStage: "MEDICAL_UNFIT",
    isArchived: true, // Soft-archived due to medical failure
    archivedAt: "2026-05-10T12:00:00Z",
    agentId: "agt-079",
    jobOrderId: "jo-3",
    userId: null,
    documents: [
      { id: "doc-4-1", documentType: "PASSPORT", fileName: "Passport_Tariqul.pdf", fileUrl: "#", status: "VERIFIED", verifiedBy: "David Miller" },
      { id: "doc-4-2", documentType: "MEDICAL_REPORT", fileName: "Unfit_Report.pdf", fileUrl: "#", status: "VERIFIED", verifiedBy: "David Miller" },
    ],
  },
];

export interface MockInvoice {
  id: string;
  invoiceNo: string;
  applicantId: string;
  amount: number;
  outstanding: number;
  dueDate: string;
  description: string;
  createdAt: string;
}

export const MOCK_INVOICES: MockInvoice[] = [
  {
    id: "inv-1",
    invoiceNo: "INV-2026-042",
    applicantId: "app-1",
    amount: 2500, // BDT
    outstanding: 1200,
    dueDate: "2026-06-10",
    description: "KSA Electrician Package Fee (Consulate, Training & Service Charge)",
    createdAt: "2026-05-10",
  },
  {
    id: "inv-2",
    invoiceNo: "INV-2026-048",
    applicantId: "app-2",
    amount: 2500,
    outstanding: 2500,
    dueDate: "2026-06-25",
    description: "KSA Electrician Package Fee",
    createdAt: "2026-05-15",
  },
  {
    id: "inv-3",
    invoiceNo: "INV-2026-021",
    applicantId: "app-3",
    amount: 3200,
    outstanding: 0,
    dueDate: "2026-05-20",
    description: "UAE Hospitality Executive Package Fee",
    createdAt: "2026-05-01",
  },
];

export interface MockReceipt {
  id: string;
  receiptNo: string;
  applicantId: string;
  invoiceId: string | null;
  amountPaid: number;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "MOBILE_BANKING";
  referenceNo: string | null;
  receivedBy: string;
  createdAt: string;
}

export const MOCK_RECEIPTS: MockReceipt[] = [
  {
    id: "rec-1",
    receiptNo: "REC-2026-015",
    applicantId: "app-1",
    invoiceId: "inv-1",
    amountPaid: 1300,
    paymentMethod: "BANK_TRANSFER",
    referenceNo: "TXN8922119028",
    receivedBy: "Lawrence Wilde",
    createdAt: "2026-05-12",
  },
  {
    id: "rec-2",
    receiptNo: "REC-2026-004",
    applicantId: "app-3",
    invoiceId: "inv-3",
    amountPaid: 3200,
    paymentMethod: "CASH",
    referenceNo: null,
    receivedBy: "Lawrence Wilde",
    createdAt: "2026-05-05",
  },
];

export interface MockLedgerEntry {
  id: string;
  applicantId: string;
  transactionType: "INVOICE" | "RECEIPT" | "CREDIT_NOTE" | "DEBIT_NOTE";
  referenceNo: string;
  debit: number;
  credit: number;
  runningBalance: number;
  timestamp: string;
}

export const MOCK_LEDGERS: MockLedgerEntry[] = [
  // App-1 Ledger
  {
    id: "ldg-1",
    applicantId: "app-1",
    transactionType: "INVOICE",
    referenceNo: "INV-2026-042",
    debit: 2500,
    credit: 0,
    runningBalance: 2500,
    timestamp: "2026-05-10T10:00:00Z",
  },
  {
    id: "ldg-2",
    applicantId: "app-1",
    transactionType: "RECEIPT",
    referenceNo: "REC-2026-015",
    debit: 0,
    credit: 1300,
    runningBalance: 1200,
    timestamp: "2026-05-12T14:30:00Z",
  },
  // App-3 Ledger
  {
    id: "ldg-3",
    applicantId: "app-3",
    transactionType: "INVOICE",
    referenceNo: "INV-2026-021",
    debit: 3200,
    credit: 0,
    runningBalance: 3200,
    timestamp: "2026-05-01T09:15:00Z",
  },
  {
    id: "ldg-4",
    applicantId: "app-3",
    transactionType: "RECEIPT",
    referenceNo: "REC-2026-004",
    debit: 0,
    credit: 3200,
    runningBalance: 0,
    timestamp: "2026-05-05T11:45:00Z",
  },
];

export interface MockCommission {
  id: string;
  agentId: string;
  applicantId: string;
  jobOrderId: string;
  amount: number;
  status: "ACCRUED" | "PAID" | "CANCELLED";
  payoutRef: string | null;
  payoutDate: string | null;
  createdAt: string;
}

export const MOCK_COMMISSIONS: MockCommission[] = [
  {
    id: "com-1",
    agentId: "agt-052",
    applicantId: "app-1",
    jobOrderId: "jo-1",
    amount: 500,
    status: "ACCRUED",
    payoutRef: null,
    payoutDate: null,
    createdAt: "2026-05-12T14:30:00Z",
  },
  {
    id: "com-2",
    agentId: "agt-031",
    applicantId: "app-3",
    jobOrderId: "jo-2",
    amount: 600,
    status: "PAID",
    payoutRef: "BANK-AGT-3199",
    payoutDate: "2026-05-18",
    createdAt: "2026-05-05T11:45:00Z",
  },
];

export interface MockNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "not-1",
    userId: "u-applicant",
    title: "Visa Application Progressing",
    message: "Your documents have been verified and submitted to the Saudi Consulate.",
    isRead: false,
    createdAt: "2026-05-20T10:00:00Z",
  },
  {
    id: "not-2",
    userId: "u-agent",
    title: "Commission Accrued",
    message: "Candidate Mohammad Al-Amin has reached VISA_SUBMITTED. Commission of $500 accrued.",
    isRead: false,
    createdAt: "2026-05-12T14:35:00Z",
  },
  {
    id: "not-3",
    userId: "u-docs-officer",
    title: "Expiring Passport Warning",
    message: "Candidate Tariqul Anam passport (A08776655) expires in less than 2 months (2026-06-30).",
    isRead: true,
    createdAt: "2026-05-01T08:00:00Z",
  },
];

export interface MockAuditLog {
  id: string;
  userId: string | null;
  roleName: string | null;
  actionType: string;
  tableName: string;
  recordId: string | null;
  delta: string | null;
  ipAddress: string | null;
  timestamp: string;
}

export const MOCK_AUDIT_LOGS: MockAuditLog[] = [
  {
    id: "aud-1",
    userId: "u-hr-officer",
    roleName: "HR Officer",
    actionType: "CREATE_APPLICANT",
    tableName: "Applicant",
    recordId: "app-1",
    delta: JSON.stringify({ fullName: "Mohammad Al-Amin", passportNumber: "A03498822", trade: "Electrician" }),
    ipAddress: "192.168.10.44",
    timestamp: "2026-05-10T10:05:00Z",
  },
  {
    id: "aud-2",
    userId: "u-accounts-officer",
    roleName: "Accounts Officer",
    actionType: "RECORD_RECEIPT",
    tableName: "Receipt",
    recordId: "rec-1",
    delta: JSON.stringify({ amountPaid: 1300, paymentMethod: "BANK_TRANSFER", invoiceId: "inv-1" }),
    ipAddress: "192.168.10.51",
    timestamp: "2026-05-12T14:31:00Z",
  },
  {
    id: "aud-3",
    userId: "u-docs-officer",
    roleName: "Documentation Officer",
    actionType: "VERIFY_DOCUMENT",
    tableName: "Document",
    recordId: "doc-1-1",
    delta: JSON.stringify({ status: "VERIFIED", documentType: "PASSPORT" }),
    ipAddress: "192.168.10.42",
    timestamp: "2026-05-11T11:15:00Z",
  },
];
