import type React from "react";
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Briefcase,
  CheckCircle,
  Clock,
  Cpu,
  CreditCard,
  FileQuestion,
  FileSearch,
  FileText,
  History,
  Inbox,
  Info,
  Landmark,
  Percent,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

/**
 * Explicit icon registry for components that select an icon by *name*.
 *
 * Why this exists: `import * as Icons from "lucide-react"` combined with a
 * computed `Icons[name]` lookup pulls the entire barrel (~3,900 modules) into
 * the module graph and defeats Next.js's `optimizePackageImports`, which can
 * only rewrite static named imports. In dev that costs a large amount of memory
 * and compile time for no benefit.
 *
 * Named imports here keep the graph to the icons actually used. When a new
 * `iconName` is needed, add it to this map — TypeScript will flag call sites
 * that reference a name which is not registered.
 */
export const ICONS = {
  Activity,
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Briefcase,
  CheckCircle,
  Clock,
  Cpu,
  CreditCard,
  FileQuestion,
  FileSearch,
  FileText,
  History,
  Inbox,
  Info,
  Landmark,
  Percent,
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} satisfies Record<string, React.ComponentType<{ className?: string }>>;

export type IconName = keyof typeof ICONS;

/** Resolves a registered icon name to its component. */
export function getIcon(
  name: IconName
): React.ComponentType<{ className?: string }> {
  return ICONS[name];
}
