import { topClients } from "@/data/mock";
import { currency } from "@/lib/format";

const tints = [
  "bg-gradient-primary",
  "bg-gradient-income",
  "bg-gradient-profit",
  "bg-gradient-capital",
  "bg-gradient-expense",
];

export function TopClients() {
  const max = Math.max(...topClients.map((c) => c.revenue));
  return (
    <div className="ft-card p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Top clients</h3>
        <p className="text-xs text-muted-foreground">By revenue this month</p>
      </div>
      <ul className="space-y-4">
        {topClients.map((c, i) => (
          <li key={c.name}>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white ${tints[i]}`}
              >
                {c.initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-semibold text-foreground">{c.name}</span>
                  <span className="text-sm font-bold text-foreground">{currency(c.revenue)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${tints[i]}`}
                    style={{ width: `${(c.revenue / max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}