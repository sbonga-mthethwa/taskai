import { MessageSquare, HardDrive, Users, BookOpen, GitBranch, Zap, FolderOpen, LayoutGrid } from "lucide-react";

const integrations = [
  { name: "Slack", icon: MessageSquare },
  { name: "Google Drive", icon: HardDrive },
  { name: "Microsoft Teams", icon: Users },
  { name: "Notion", icon: BookOpen },
  { name: "GitHub", icon: GitBranch },
  { name: "Zapier", icon: Zap },
  { name: "Dropbox", icon: FolderOpen },
  { name: "Jira", icon: LayoutGrid },
];

const IntegrationsSection = () => {
  return (
    <section className="relative z-10 bg-muted/30 border-y border-border">
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="text-center mb-14">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Works with tools your team already uses
          </h3>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Connect TaskAI with your favorite tools for a seamless workflow.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <integration.icon size={20} className="text-muted-foreground/70" />
              </div>
              <span className="text-sm font-medium text-foreground">{integration.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
