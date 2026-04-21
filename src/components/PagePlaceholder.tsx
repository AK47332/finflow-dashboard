import { Sparkles, type LucideIcon } from "lucide-react";

export function PagePlaceholder({
  title,
  description,
  icon: Icon = Sparkles,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="animate-fade-in space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>

      <div className="ft-card flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-primary-glow">
          <Icon className="h-7 w-7" />
        </div>
        <div className="max-w-md space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Coming up next</h2>
          <p className="text-sm text-muted-foreground">
            This module is part of FinTrack Pro. The design system, layout, and dashboard
            are ready — let me know to build this section next and I'll wire up full CRUD,
            search, filters, and exports.
          </p>
        </div>
      </div>
    </div>
  );
}