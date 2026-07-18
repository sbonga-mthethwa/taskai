import { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: { value: string; positive: boolean };
  icon: ReactNode;
  warning?: boolean;
}

const KpiCard = ({ label, value, subtext, trend, icon, warning }: KpiCardProps) => {
  return (
    <div className="bg-card rounded-[14px] border border-border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
      style={{ minHeight: "110px" }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[13px] text-muted-foreground font-medium leading-tight">{label}</span>
        <span className={`${warning ? "text-destructive/60" : "text-muted-foreground/60"} group-hover:text-primary/60 transition-colors`}>{icon}</span>
      </div>
      <div className="flex items-end gap-2.5">
        <span className={`text-[28px] font-semibold tracking-tight tabular-nums leading-none ${warning ? "text-destructive" : "text-foreground"}`}>{value}</span>
        {trend && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
            trend.positive ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
          }`}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
      {subtext && (
        <p className="text-[11px] text-muted-foreground mt-2 leading-tight">{subtext}</p>
      )}
    </div>
  );
};

export default KpiCard;
