// Role-Based Access Control (SRS §4). A permission matrix maps
// module → allowed actions per role. Enforced server-side on every action
// (V-13) and used to scope the UI nav. Project scoping is enforced separately
// via ProjectAssignment.

export type Action = "view" | "create" | "edit" | "approve" | "delete";

export const MODULES = [
  "dashboard",
  "projects",
  "erp", // procurement + finance/billing + budgets
  "pm", // project management / WBS / DPR
  "attendance",
  "material",
  "contractor",
  "tendering",
  "equipment",
  "qhse",
  "documents",
  "client-billing",
  "reports",
  "activity",
  "admin",
] as const;

export type ModuleKey = (typeof MODULES)[number];

export type PermissionMatrix = Partial<Record<ModuleKey, Action[]>>;

const ALL: Action[] = ["view", "create", "edit", "approve", "delete"];
const VIEW: Action[] = ["view"];
const EDIT: Action[] = ["view", "create", "edit"];
const APPROVE: Action[] = ["view", "create", "edit", "approve"];

export interface RoleDef {
  key: string;
  name: string;
  description: string;
  permissions: PermissionMatrix;
}

// Full-access matrix helper
function fullAccess(): PermissionMatrix {
  return Object.fromEntries(MODULES.map((m) => [m, ALL])) as PermissionMatrix;
}

export const DEFAULT_ROLES: RoleDef[] = [
  {
    key: "admin",
    name: "System Administrator",
    description: "Users, roles, masters, workflows, tenant settings.",
    permissions: fullAccess(),
  },
  {
    key: "md",
    name: "Managing Director / Owner",
    description: "Portfolio dashboards, high-value approvals, profitability.",
    permissions: {
      dashboard: ALL,
      projects: APPROVE,
      erp: APPROVE,
      pm: VIEW,
      attendance: VIEW,
      material: VIEW,
      contractor: APPROVE,
      tendering: APPROVE,
      equipment: VIEW,
      qhse: VIEW,
      documents: VIEW,
      "client-billing": APPROVE,
      reports: ALL,
      activity: VIEW,
    },
  },
  {
    key: "pm",
    name: "Project Manager",
    description: "Plan, assign, approve indents/MBs/RA bills, monitor budget.",
    permissions: {
      dashboard: VIEW,
      projects: APPROVE,
      erp: APPROVE,
      pm: APPROVE,
      attendance: APPROVE,
      material: APPROVE,
      contractor: APPROVE,
      equipment: EDIT,
      qhse: EDIT,
      documents: EDIT,
      "client-billing": EDIT,
      reports: VIEW,
      activity: VIEW,
    },
  },
  {
    key: "planner",
    name: "Planning Engineer",
    description: "WBS / schedule, progress, look-ahead, DPR review.",
    permissions: {
      dashboard: VIEW,
      projects: VIEW,
      pm: EDIT,
      tendering: EDIT,
      material: VIEW,
      contractor: VIEW,
      reports: VIEW,
      activity: VIEW,
    },
  },
  {
    key: "site",
    name: "Site Engineer / Supervisor",
    description: "Attendance, indents, consumption, progress, measurements.",
    permissions: {
      dashboard: VIEW,
      pm: EDIT,
      attendance: EDIT,
      material: EDIT,
      contractor: EDIT,
      qhse: EDIT,
      equipment: EDIT,
      activity: VIEW,
    },
  },
  {
    key: "store",
    name: "Storekeeper",
    description: "GRN, issues, returns, stock counts, gate register.",
    permissions: {
      dashboard: VIEW,
      material: EDIT,
      activity: VIEW,
    },
  },
  {
    key: "purchase",
    name: "Purchase Officer",
    description: "RFQs, rate comparison, POs, vendor management.",
    permissions: {
      dashboard: VIEW,
      erp: EDIT,
      material: EDIT,
      reports: VIEW,
      activity: VIEW,
    },
  },
  {
    key: "billing",
    name: "Billing Engineer / QS",
    description: "Measurement books, subcontractor & client RA bills.",
    permissions: {
      dashboard: VIEW,
      contractor: APPROVE,
      "client-billing": APPROVE,
      pm: VIEW,
      reports: VIEW,
      activity: VIEW,
    },
  },
  {
    key: "hr",
    name: "HR / Time Office",
    description: "Labour master, wage rules, muster approval, payroll.",
    permissions: {
      dashboard: VIEW,
      attendance: APPROVE,
      reports: VIEW,
      activity: VIEW,
    },
  },
  {
    key: "accounts",
    name: "Accounts / Finance",
    description: "Invoices, payments, retention, TDS/GST, accounting sync.",
    permissions: {
      dashboard: VIEW,
      erp: APPROVE,
      "client-billing": APPROVE,
      contractor: VIEW,
      reports: ALL,
      activity: VIEW,
    },
  },
  {
    key: "qhse",
    name: "QHSE Officer",
    description: "Inspections, NCRs, incidents, permits, toolbox talks.",
    permissions: {
      dashboard: VIEW,
      qhse: APPROVE,
      pm: VIEW,
      reports: VIEW,
      activity: VIEW,
    },
  },
];

export function can(
  permissions: PermissionMatrix,
  module: ModuleKey,
  action: Action = "view"
): boolean {
  const allowed = permissions[module];
  if (!allowed) return false;
  return allowed.includes(action);
}

export function allowedModules(permissions: PermissionMatrix): ModuleKey[] {
  return MODULES.filter((m) => can(permissions, m, "view"));
}
