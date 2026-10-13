import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  Settings,
  Package,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/receipts", label: "Receipts", icon: Receipt },
  { href: "/app/invoices", label: "Invoices", icon: FileText },
  { href: "/app/products", label: "My Products", icon: Package },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/settings/billing", label: "Billing", icon: CreditCard },
];
