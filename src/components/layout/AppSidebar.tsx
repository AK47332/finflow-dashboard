import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  ShoppingCart,
  Briefcase,
  Users,
  StickyNote,
  Bell,
  BarChart3,
  Settings,
  ShieldCheck,
  Globe,
  ShoppingBag,
  Image as ImageIcon,
  ListOrdered,
  Tags,
  Megaphone,
  Instagram,
  Palette,
  ChevronDown,
  UserCircle2,
  FileText,
  MessageCircle,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[]; collapsible?: boolean };

const groups: NavGroup[] = [
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
      { title: "POS", url: "/pos", icon: ShoppingCart },
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
  {
    label: "Ecommerce",
    collapsible: true,
    items: [
      { title: "Orders", url: "/ecom/orders", icon: ListOrdered },
      { title: "Products", url: "/products", icon: Package },
      { title: "Categories", url: "/ecom/categories", icon: Tags },
      { title: "Banners", url: "/ecom/banners", icon: ImageIcon },
      { title: "Announcements", url: "/ecom/announcements", icon: Megaphone },
      { title: "Instagram Feed", url: "/ecom/instagram", icon: Instagram },
      { title: "Pages", url: "/ecom/pages", icon: FileText },
      { title: "Contact Widget", url: "/ecom/contact-widget", icon: MessageCircle },
      { title: "Footer", url: "/ecom/footer", icon: FileText },
      { title: "Customers", url: "/ecom/customers", icon: UserCircle2 },
    ],
  },
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { isSuperAdmin } = useSuperAdmin();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Account";
  const avatarInitials = (displayName || "?").slice(0, 2).toUpperCase();
  const visibleGroups: NavGroup[] = isSuperAdmin
    ? [
        ...groups,
        {
          label: "Admin",
          items: [
            { title: "Frontend Mood", url: "/frontend-mood", icon: Palette },
            { title: "Customers", url: "/admin/customers", icon: ShieldCheck },
          ],
        },
      ]
    : groups;

  // Track open state for collapsible groups; auto-open the group containing the active route
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      visibleGroups.forEach((g) => {
        if (!g.collapsible) return;
        const hasActive = g.items.some((item) =>
          item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url),
        );
        if (hasActive) next[g.label] = true;
        else if (next[g.label] === undefined) next[g.label] = false;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isSuperAdmin]);

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

      {/* Profile block */}
      <div className="mx-3 mb-4 flex items-center gap-3 rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-bold text-primary">
          {avatarInitials}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[13px] font-semibold text-white">{displayName}</div>
          <div className="truncate text-[11px] text-white/70">{currentOrg?.name ?? user?.email}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {visibleGroups.map((group) => {
          if (group.collapsible) {
            const isOpen = !!openGroups[group.label];
            const hasActive = group.items.some((item) => location.pathname.startsWith(item.url));
            return (
              <div key={group.label} className="mb-3">
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((p) => ({ ...p, [group.label]: !p[group.label] }))
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-smooth",
                    hasActive
                      ? "bg-white/15 text-white"
                      : "text-white/85 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <ShoppingBag className="h-[18px] w-[18px]" />
                    {group.label}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isOpen ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>
                {isOpen && (
                  <ul className="mt-1 space-y-1 border-l border-white/10 pl-3 ml-4">
                    {group.items.map((item) => {
                      const active = location.pathname.startsWith(item.url);
                      return (
                        <li key={item.url}>
                          <NavLink
                            to={item.url}
                            onClick={onNavigate}
                            className={cn(
                              "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-smooth",
                              active
                                ? "bg-white text-primary shadow-soft"
                                : "text-white/80 hover:bg-white/10 hover:text-white",
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          }
          return (
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
          );
        })}
      </nav>

      <div className="relative mx-3 mb-4 overflow-hidden rounded-2xl bg-white/10 p-4 text-xs text-white/85 backdrop-blur-sm">
        <svg
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 opacity-20"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="white" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="16" fill="none" stroke="white" strokeWidth="1.5" />
        </svg>
        <div className="relative font-semibold text-white">Pro tip</div>
        <p className="relative mt-1 text-white/70">Press ⌘K to quickly add an income or expense.</p>
      </div>
    </aside>
  );
}