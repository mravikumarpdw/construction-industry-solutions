import {
  LayoutDashboard,
  Activity,
  Building2,
  ShoppingCart,
  HardHat,
  GanttChartSquare,
  Users,
  Package,
  Truck,
  ShieldCheck,
  FolderKanban,
  BarChart3,
  Settings,
  Landmark,
  FileSpreadsheet,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "@/lib/rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  module: ModuleKey;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
      { label: "Activity Feed", href: "/activity", icon: Activity, module: "activity" },
      { label: "Mobile Live", href: "/mobile", icon: Smartphone, module: "activity" },
    ],
  },
  {
    title: "Commercial",
    items: [
      { label: "Projects", href: "/projects", icon: Building2, module: "projects" },
      { label: "Procurement", href: "/procurement", icon: ShoppingCart, module: "erp" },
      { label: "Contractors", href: "/contractor", icon: HardHat, module: "contractor" },
      { label: "Client Billing", href: "/client-billing", icon: Landmark, module: "client-billing" },
      { label: "Tendering", href: "/tendering", icon: FileSpreadsheet, module: "tendering" },
    ],
  },
  {
    title: "Site Operations",
    items: [
      { label: "Project Mgmt", href: "/pm", icon: GanttChartSquare, module: "pm" },
      { label: "Attendance", href: "/attendance", icon: Users, module: "attendance" },
      { label: "Material", href: "/material", icon: Package, module: "material" },
      { label: "Equipment", href: "/equipment", icon: Truck, module: "equipment" },
      { label: "Quality & Safety", href: "/qhse", icon: ShieldCheck, module: "qhse" },
    ],
  },
  {
    title: "Insight",
    items: [
      { label: "Documents", href: "/documents", icon: FolderKanban, module: "documents" },
      { label: "Reports", href: "/reports", icon: BarChart3, module: "reports" },
      { label: "Administration", href: "/admin", icon: Settings, module: "admin" },
    ],
  },
];
