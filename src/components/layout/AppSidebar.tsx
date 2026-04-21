import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Briefcase,
  Users,
  StickyNote,
  Bell,
  BarChart3,
  Settings,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Money",
    items: [
      { title: "Income", url: "/income", icon: TrendingUp },
      { title: "Expense", url: "/expense", icon: TrendingDown },
      { title: "Capital", url: "/capital", icon: Wallet },
      { title: "Profit & Loss", url: "/profit", icon: PiggyBank },
    ],
  },
  {
    label: "People & Catalog",
    items: [
      { title: "Clients", url: "/clients", icon: Users },
      { title: "Products", url: "/products", icon: Package },
      { title: "Services", url: "/services", icon: Briefcase },
    ],
  },
  {
    label: "Ledger",
    items: [
      { title: "Receivables", url: "/receivables", icon: ArrowDownLeft },
      { title: "Payables", url: "/payables", icon: ArrowUpRight },
    ],
  },
  {
    label: "Productivity",
    items: [
      { title: "Notes", url: "/notes", icon: StickyNote },
      { title: "Reminders", url: "/reminders", icon: Bell },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "Reports", url: "/reports", icon: BarChart3 },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <aside className="bg-gradient-sidebar text-sidebar-foreground flex h-full w-[240px] flex-col">
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
          <PiggyBank className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight">FinTrack Pro</div>
          <div className="text-[11px] font-medium text-white/70">Income · Expense</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active =
                  item.url === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.url);
                return (
                  <li key={item.url}>
                    <NavLink
                      to={item.url}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth",
                        active
                          ? "bg-white text-primary shadow-soft"
                          : "text-white/85 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.title}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mx-3 mb-4 rounded-2xl bg-white/10 p-4 text-xs text-white/85 backdrop-blur-sm">
        <div className="font-semibold text-white">Pro tip</div>
        <p className="mt-1 text-white/70">Press ⌘K to quickly add an income or expense.</p>
      </div>
    </aside>
  );
}