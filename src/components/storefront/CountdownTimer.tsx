import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type Props = {
  endsAt: Date;
  label?: string;
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function CountdownTimer({ endsAt, label = "Price Discount Ends" }: Props) {
  const [diff, setDiff] = useState(() => endsAt.getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(endsAt.getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const cells: { label: string; value: string }[] = [];
  if (days > 0) cells.push({ label: "DAYS", value: pad(days) });
  cells.push({ label: "HRS", value: pad(hours) });
  cells.push({ label: "MIN", value: pad(minutes) });
  cells.push({ label: "SEC", value: pad(seconds) });

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-primary text-primary-foreground shadow-primary-glow">
      <div className="flex items-center gap-3 px-4 py-3">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wider opacity-95">
          {label}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {cells.map((c, i) => (
            <div key={c.label} className="flex items-center gap-1.5">
              <div className="rounded-md bg-foreground/20 px-2 py-1 text-center backdrop-blur">
                <div className="font-mono text-sm font-bold tabular-nums leading-none">
                  {c.value}
                </div>
                <div className="mt-0.5 text-[8px] font-semibold tracking-wider opacity-80">
                  {c.label}
                </div>
              </div>
              {i < cells.length - 1 && <span className="font-bold opacity-60">:</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
