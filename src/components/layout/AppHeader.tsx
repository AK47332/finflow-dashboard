import { useState } from "react";
import {
  Menu,
  Search,
  ChevronDown,
  LogOut,
  Building2,
  Check,
  Settings as SettingsIcon,
  ShoppingCart,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "react-router-dom";
import { NotificationsBell } from "./NotificationsBell";
import { ThemeToggle } from "./ThemeToggle";
import { useLocale } from "@/contexts/LocaleContext";

function initials(name?: string | null, email?: string | null) {
  const src = name || email || "";
  const parts = src.replace(/@.*/, "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const SEARCH_TARGETS: { keywords: string[]; path: string; label: string }[] = [
  { keywords: ["income", "sale", "revenue"], path: "/income", label: "Income" },
  { keywords: ["expense", "cost", "spend"], path: "/expense", label: "Expense" },
  { keywords: ["client", "customer"], path: "/clients", label: "Clients" },
  { keywords: ["product", "inventory", "stock"], path: "/products", label: "Products" },
  { keywords: ["service"], path: "/services", label: "Services" },
  { keywords: ["receivable", "owed"], path: "/receivables", label: "Receivables" },
  { keywords: ["payable", "bill"], path: "/payables", label: "Payables" },
  { keywords: ["capital", "owner"], path: "/capital", label: "Capital" },
  { keywords: ["note"], path: "/notes", label: "Notes" },
  { keywords: ["reminder", "todo"], path: "/reminders", label: "Reminders" },
  { keywords: ["report", "p&l", "profit"], path: "/reports", label: "Reports" },
  { keywords: ["setting", "team", "category", "currency"], path: "/settings", label: "Settings" },
];

export function AppHeader({ onMenu }: { onMenu: () => void }) {
  const { user, signOut } = useAuth();
  const { orgs, currentOrg, switchOrg } = useOrg();
  const navigate = useNavigate();
  const { locale, setLocale, t } = useLocale();
  const [search, setSearch] = useState("");

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Account";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) return;
    const match = SEARCH_TARGETS.find((t) => t.keywords.some((k) => k.includes(q) || q.includes(k)));
    if (match) {
      navigate(match.path);
      setSearch("");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/50 bg-card/80 px-3 backdrop-blur-md sm:gap-3 sm:px-4 md:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenu}
        aria-label={t("header.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Org switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 gap-2 rounded-xl px-2 sm:px-3">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="hidden max-w-[120px] truncate text-sm font-semibold sm:inline lg:max-w-[200px]">
              {currentOrg?.name ?? "Workspace"}
            </span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>{t("header.workspaces")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {orgs.map((o) => (
            <DropdownMenuItem
              key={o.id}
              onClick={() => void switchOrg(o.id)}
              className="flex items-center justify-between"
            >
              <span className="truncate">{o.name}</span>
              {o.id === currentOrg?.id && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/onboarding")}>
            {t("header.createWorkspace")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <form onSubmit={handleSearch} className="relative hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("header.search")}
          className="h-10 rounded-xl border-border/60 bg-background/60 pl-10 focus-visible:ring-primary/40"
        />
      </form>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl"
          onClick={() => navigate("/pos")}
          aria-label={t("header.openPos")}
          title={t("nav.pos")}
        >
          <ShoppingCart className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl"
              aria-label={t("lang.toggle")}
              title={t("lang.toggle")}
            >
              <Languages className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>{t("lang.toggle")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setLocale("en")}
              className="flex items-center justify-between"
            >
              <span>English</span>
              {locale === "en" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLocale("bn")}
              className="flex items-center justify-between"
            >
              <span>বাংলা</span>
              {locale === "bn" && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <NotificationsBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl bg-secondary/70 p-1 pl-2 outline-none transition-smooth hover:bg-secondary sm:gap-3 sm:px-2 sm:py-1.5 sm:pl-3">
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-[13px] font-semibold text-foreground">{displayName}</div>
                <div className="max-w-[160px] truncate text-[11px] text-muted-foreground">{user?.email}</div>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-sm font-semibold text-primary-foreground">
                {initials(displayName, user?.email)}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <SettingsIcon className="mr-2 h-4 w-4" /> {t("nav.settings")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                navigate("/auth", { replace: true });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> {t("header.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ThemeToggle />
      </div>
    </header>
  );
}
