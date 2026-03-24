import { ArrowUp, ArrowDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  sparkData?: number[];
  color?: string;
}

export function KPICard({ title, value, change, subtitle, sparkData, color = "hsl(var(--primary))" }: KPICardProps) {
  const isPositive = (change ?? 0) >= 0;
  const chartData = (sparkData || [3, 4, 3.5, 4.2, 3.8, 4.5, 4.1]).map((v, i) => ({ v, i }));

  return (
    <div className="group rounded-xl border border-border bg-card p-5 shadow-kpi transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-card-foreground">{value}</p>
          <div className="mt-2 flex items-center gap-1.5">
            {change !== undefined && (
              <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(change)}%
              </span>
            )}
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        </div>
        <div className="h-12 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`kpi-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} fill={`url(#kpi-${title})`} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
