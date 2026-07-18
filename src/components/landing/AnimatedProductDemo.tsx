import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquare, Sparkles, BarChart3, GripVertical } from "lucide-react";

const CYCLE_DURATION = 7000; // 7s loop

type Step = 0 | 1 | 2 | 3 | 4;

const tasks = [
  { id: 1, title: "Design homepage mockup", assignee: "SM", status: "done" },
  { id: 2, title: "Build onboarding flow", assignee: "RB", status: "todo" },
  { id: 3, title: "API integration tests", assignee: "DP", status: "todo" },
  { id: 4, title: "Write release notes", assignee: "SM", status: "todo" },
];

const AnimatedProductDemo = () => {
  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    const timings = [1400, 1400, 1400, 1400, 1400];
    let timeout: ReturnType<typeof setTimeout>;
    let current = 0;

    const advance = () => {
      current = ((current + 1) % 5) as Step;
      setStep(current as Step);
      timeout = setTimeout(advance, timings[current]);
    };

    timeout = setTimeout(advance, timings[0]);
    return () => clearTimeout(timeout);
  }, []);

  const getTaskStatus = (task: typeof tasks[0]) => {
    if (task.id === 2) {
      if (step >= 1) return "in-progress";
      return "todo";
    }
    if (task.id === 2 && step >= 4) return "done";
    return task.status;
  };

  const statusColor = (s: string) => {
    if (s === "done") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (s === "in-progress") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    return "bg-muted text-muted-foreground";
  };

  const statusLabel = (s: string) => {
    if (s === "done") return "Done";
    if (s === "in-progress") return "In Progress";
    return "To Do";
  };

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-28">
      <div className="text-center mb-14">
        <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          See how TaskAI works
        </h3>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Watch how teams plan, collaborate, and deliver projects faster using TaskAI.
        </p>
      </div>

      {/* Demo Container */}
      <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <div className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <span className="text-xs text-muted-foreground ml-2 font-medium">TaskAI — Sprint Board</span>
        </div>

        {/* Board area */}
        <div className="p-5 min-h-[320px] relative">
          {/* Task list */}
          <div className="space-y-3">
            {tasks.map((task) => {
              const currentStatus = getTaskStatus(task);
              const isActive = task.id === 2;

              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-500 ${
                    isActive && step >= 1
                      ? "border-primary/30 bg-primary/5 shadow-sm"
                      : "border-border bg-background"
                  }`}
                >
                  <GripVertical size={14} className="text-muted-foreground/40 shrink-0" />
                  {currentStatus === "done" ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  ) : (
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                      currentStatus === "in-progress" ? "border-amber-400" : "border-muted-foreground/30"
                    }`} />
                  )}
                  <span className="text-sm text-foreground flex-1">{task.title}</span>
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {task.assignee}
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor(currentStatus)} transition-all duration-500`}>
                    {statusLabel(currentStatus)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Comment overlay */}
          <div
            className={`absolute bottom-16 right-5 max-w-[240px] p-3 rounded-xl border border-border bg-card shadow-lg transition-all duration-500 ${
              step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <MessageSquare size={12} className="text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Ryan Brooks</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Onboarding flow is looking great! Let's add email verification next.
            </p>
          </div>

          {/* AI suggestion overlay */}
          <div
            className={`absolute bottom-16 left-5 max-w-[260px] p-3 rounded-xl border border-primary/20 bg-primary/5 shadow-lg transition-all duration-500 ${
              step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={12} className="text-primary" />
              <span className="text-[11px] font-semibold text-primary">AI Suggestion</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Auto-assign QA review to Sarah when this task is completed.
            </p>
          </div>

          {/* Analytics bar */}
          <div
            className={`absolute bottom-4 left-5 right-5 flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/40 transition-all duration-500 ${
              step >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
            }`}
          >
            <BarChart3 size={14} className="text-primary shrink-0" />
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700" style={{ width: step >= 4 ? "65%" : "0%" }} />
              </div>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">65% complete</span>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-10">
        {[
          "Plan projects visually",
          "Collaborate in real time",
          "Automate repetitive work with AI",
        ].map((text) => (
          <div key={text} className="flex items-center gap-2 justify-center">
            <CheckCircle2 size={16} className="text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">{text}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AnimatedProductDemo;
