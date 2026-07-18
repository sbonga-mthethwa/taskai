interface AvatarStackProps {
  initials: string[];
  max?: number;
}

const colors = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent",
  "bg-warning/10 text-warning",
  "bg-danger/10 text-danger",
];

const AvatarStack = ({ initials, max = 3 }: AvatarStackProps) => {
  const visible = initials.slice(0, max);
  const extra = initials.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((ini, i) => (
        <div
          key={i}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold border-2 border-card ${colors[i % colors.length]}`}
        >
          {ini}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium border-2 border-card bg-muted text-muted-foreground">
          +{extra}
        </div>
      )}
    </div>
  );
};

export default AvatarStack;
