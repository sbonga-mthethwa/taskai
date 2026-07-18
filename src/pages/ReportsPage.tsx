import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const completionData = [
  { name: "Mon", completed: 8, created: 12 },
  { name: "Tue", completed: 14, created: 10 },
  { name: "Wed", completed: 11, created: 16 },
  { name: "Thu", completed: 18, created: 14 },
  { name: "Fri", completed: 22, created: 18 },
];

const workloadData = [
  { name: "Alex", tasks: 8 },
  { name: "Sarah", tasks: 12 },
  { name: "Ryan", tasks: 6 },
  { name: "Diana", tasks: 10 },
  { name: "Tom", tasks: 5 },
  { name: "Maria", tasks: 9 },
];

const statusData = [
  { name: "No Progress", value: 3, color: "hsl(215, 16%, 57%)" },
  { name: "In Progress", value: 2, color: "#6D5EF8" },
  { name: "Completed", value: 1, color: "#16A34A" },
];

const ReportsPage = () => {
  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto animate-fade-in">
      <h1 className="text-lg md:text-xl font-semibold tracking-tight-custom text-foreground mb-4 md:mb-6">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-card rounded-lg card-shadow p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Task Completion</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={completionData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid hsl(228, 28%, 91%)' }} />
              <Bar dataKey="completed" fill="#6D5EF8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="created" fill="rgba(109,94,248,0.2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-lg card-shadow p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Team Workload</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={workloadData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={50} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid hsl(228, 28%, 91%)' }} />
              <Bar dataKey="tasks" fill="#FF4D8D" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-lg card-shadow p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Project Status Summary</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-3">
            {statusData.map(s => (
              <div key={s.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-sm text-foreground">{s.name}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
