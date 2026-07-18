import { CheckCircle2, BarChart3, Users, Calendar, ListChecks } from "lucide-react";

const ProductScreenshot = () => {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-28">
      <div className="text-center mb-14">
        <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          See TaskAI in action
        </h3>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Everything your team needs to plan, collaborate, and deliver faster.
        </p>
      </div>

      {/* Dashboard Mockup */}
      <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <div className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <span className="text-xs text-muted-foreground ml-2 font-medium">TaskAI — Dashboard</span>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-12 gap-4">
            {/* Sidebar */}
            <div className="col-span-3 space-y-3 hidden md:block">
              <div className="space-y-1.5">
                {["Dashboard", "Projects", "Tasks", "Messages", "Reports"].map((item, i) => (
                  <div
                    key={item}
                    className={`text-xs px-3 py-2 rounded-lg ${
                      i === 0 ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              {/* Team activity */}
              <div className="border border-border rounded-xl p-3 mt-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Users size={12} className="text-primary" />
                  <span className="text-[10px] font-semibold text-foreground">Team Activity</span>
                </div>
                <div className="space-y-2">
                  {[
                    "Sarah updated design specs",
                    "Ryan merged PR #142",
                    "Diana added 3 tasks",
                  ].map((a) => (
                    <div key={a} className="flex items-start gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                      <span className="text-[10px] text-muted-foreground leading-snug">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="col-span-12 md:col-span-9 space-y-4">
              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Active Tasks", value: "24", icon: ListChecks },
                  { label: "Team Members", value: "12", icon: Users },
                  { label: "Due This Week", value: "8", icon: Calendar },
                ].map((kpi) => (
                  <div key={kpi.label} className="p-3 rounded-xl border border-border bg-background">
                    <div className="flex items-center gap-1.5 mb-1">
                      <kpi.icon size={12} className="text-primary" />
                      <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">{kpi.value}</span>
                  </div>
                ))}
              </div>

              {/* Project board + chart row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Board */}
                <div className="p-3 rounded-xl border border-border bg-background">
                  <span className="text-[10px] font-semibold text-foreground mb-2 block">Sprint Board</span>
                  <div className="grid grid-cols-3 gap-2">
                    {["To Do", "In Progress", "Done"].map((col, ci) => (
                      <div key={col} className="space-y-1.5">
                        <span className="text-[9px] font-medium text-muted-foreground">{col}</span>
                        {[0, 1].map((j) => (
                          <div
                            key={j}
                            className="h-6 rounded bg-muted/60 border border-border"
                            style={{ opacity: ci === 2 && j === 1 ? 0.4 : 1 }}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart */}
                <div className="p-3 rounded-xl border border-border bg-background">
                  <div className="flex items-center gap-1.5 mb-2">
                    <BarChart3 size={12} className="text-primary" />
                    <span className="text-[10px] font-semibold text-foreground">Weekly Progress</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 65, 50, 80, 70, 90, 55].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t"
                        style={{
                          height: `${h}%`,
                          background: `linear-gradient(to top, hsl(var(--primary)), hsl(var(--accent)))`,
                          opacity: 0.6 + i * 0.05,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-3 rounded-xl border border-border bg-background">
                <span className="text-[10px] font-semibold text-foreground mb-2 block">Task Timeline</span>
                <div className="space-y-1.5">
                  {[
                    { label: "Homepage Redesign", w: "75%" },
                    { label: "API Integration", w: "45%" },
                    { label: "User Testing", w: "30%" },
                  ].map((t) => (
                    <div key={t.label} className="flex items-center gap-2">
                      <span className="text-[9px] text-muted-foreground w-24 shrink-0">{t.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: t.w,
                            background: `linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights */}
      <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto mt-10">
        {[
          "Plan projects visually",
          "Collaborate across teams",
          "Automate workflows with AI",
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

export default ProductScreenshot;
