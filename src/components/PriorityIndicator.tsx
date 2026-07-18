interface PriorityIndicatorProps {
  priority: "high" | "medium" | "low";
}

const PriorityIndicator = ({ priority }: PriorityIndicatorProps) => {
  const colors = {
    high: "bg-danger",
    medium: "bg-warning",
    low: "bg-muted-foreground/30",
  };

  return <div className={`w-1 h-3 rounded-full ${colors[priority]}`} />;
};

export default PriorityIndicator;
