import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { currency } from "@/lib/format";

const palettes: Record<string, string[]> = {
  expense: ["hsl(350 89% 60%)", "hsl(38 92% 55%)", "hsl(262 83% 60%)", "hsl(217 91% 60%)", "hsl(160 70% 45%)"],
  income: ["hsl(160 84% 40%)", "hsl(262 83% 58%)", "hsl(38 92% 55%)", "hsl(217 91% 60%)"],
};

export function CategoryDonut({
  title,
  subtitle,
  data,
  variant,
}: {
  title: string;
  subtitle: string;
  data: { name: string; value: number }[];
  variant: "income" | "expense";
}) {
  const colors = palettes[variant];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="ft-card p-6">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <div className="relative mt-2 h-[200px]">
        <ResponsiveContainer>
          <PieChart>
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                boxShadow: "var(--shadow-card)",
                fontSize: 12,
              }}
            />
            <Pie
              data={data}
              dataKey="value"
              innerRadius={58}
              outerRadius={82}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium text-muted-foreground">Total</span>
          <span className="text-lg font-bold text-foreground">{currency(total)}</span>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors[i % colors.length] }} />
              {d.name}
            </span>
            <span className="font-semibold text-foreground">{currency(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}