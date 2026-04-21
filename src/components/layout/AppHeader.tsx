import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/50 bg-card/80 px-4 backdrop-blur-md md:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transactions, clients, notes…"
          className="h-10 rounded-xl border-border/60 bg-background/60 pl-10 focus-visible:ring-primary/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative rounded-xl">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-expense ring-2 ring-card" />
        </Button>

        <div className="flex items-center gap-3 rounded-xl bg-secondary/70 px-2 py-1.5 pl-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-[13px] font-semibold text-foreground">Alex Morgan</div>
            <div className="text-[11px] text-muted-foreground">Admin</div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-sm font-semibold text-primary-foreground">
            AM
          </div>
        </div>
      </div>
    </header>
  );
}