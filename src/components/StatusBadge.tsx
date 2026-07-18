interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  "no-progress": "bg-muted text-muted-foreground",
  "in-progress": "bg-primary/10 text-primary",
  "completed": "bg-accent/10 text-accent",
};

const statusLabels: Record<string, string> = {
  "no-progress": "No Progress",
  "in-progress": "In Progress",
  "completed": "Completed",
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusStyles[status] || "bg-muted text-muted-foreground"}`}>
      {statusLabels[status] || status}
    </span>
  );
};

export default StatusBadge;
