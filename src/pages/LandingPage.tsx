import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Users,
  FileText,
  Zap,
  Shield,
  BarChart3,
  Star,
} from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.png";
import AnimatedProductDemo from "@/components/landing/AnimatedProductDemo";
import ProductScreenshot from "@/components/landing/ProductScreenshot";
import IntegrationsSection from "@/components/landing/IntegrationsSection";

const features = [
  {
    icon: <FolderKanban className="w-6 h-6" />,
    title: "Project Management",
    description:
      "Plan projects with boards, timelines, and real-time progress tracking across your team.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Team Collaboration",
    description:
      "Assign tasks, share updates, and keep everyone aligned with built-in messaging and notifications.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Document Management",
    description:
      "Upload, organize, and securely share documents with role-based access control.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Smart Automation",
    description:
      "Automate repetitive tasks, updates, and workflows to save your team hours every week.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Role-Based Access",
    description:
      "Control who sees and edits content with granular permissions.",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Reports & Insights",
    description:
      "Track progress with visual dashboards, analytics, and deadline insights.",
  },
];

const testimonials = [
  {
    quote:
      "TaskAI transformed how our team collaborates. Projects that used to take weeks now take days.",
    name: "Sarah Miller",
    role: "Design Lead, Acme Corp",
  },
  {
    quote:
      "The document management alone replaced three different tools for our team.",
    name: "Ryan Brooks",
    role: "Engineering Manager, Nexus",
  },
  {
    quote:
      "Finally a project management tool that's simple, powerful, and enjoyable to use.",
    name: "Diana Park",
    role: "Marketing Director, Bloom",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleGetStarted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address to get started.", variant: "destructive" });
      return;
    }
    navigate("/first-login", { state: { prefillEmail: email.trim() } });
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Decorative blobs */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.04] pointer-events-none" style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }} />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none" style={{ background: "radial-gradient(circle, hsl(var(--accent)), transparent 70%)" }} />

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex items-center justify-between max-w-7xl mx-auto px-6 py-5">
        <img src="/logo.png" alt="TaskAI" className="h-20 md:h-35 w-auto cursor-pointer" onClick={() => navigate("/")} />
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/pricing")}
          >
            Pricing
          </Button>
          <Button
            variant="ghost"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            className="text-sm font-semibold rounded-full px-6"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
            }}
            onClick={() => navigate("/login")}
          >
            Get Started Free
          </Button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20 lg:pt-20 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Zap size={12} /> Now with AI-powered insights
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-[56px] font-bold tracking-tight text-foreground leading-[1.1]">
                The AI Workspace
                <br />
                for High-
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Performance Teams
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Manage projects, automate workflows, and collaborate in one
                intelligent workspace built for modern teams.
              </p>
            </div>

            <form
              onSubmit={handleGetStarted}
              className="flex items-center gap-2 max-w-md bg-card border border-border rounded-full p-1.5 shadow-lg shadow-primary/5"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
              />
              <Button
                type="submit"
                disabled={!email.trim()}
                className="rounded-full px-6 py-2.5 text-sm font-semibold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                }}
              >
                Start Free <ArrowRight size={16} className="ml-1" />
              </Button>
            </form>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success" /> Free to start
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success" /> No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-success" /> Cancel anytime
              </span>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <img
              src={heroIllustration}
              alt="Team collaborating on project management dashboard"
              width={1024}
              height={1024}
              className="w-full max-w-lg drop-shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* ── Animated Product Demo ── */}
      <AnimatedProductDemo />

      {/* ── Trusted By ── */}
      <section className="relative z-10 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-6">
            Trusted by growing teams worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-muted-foreground/30 font-bold text-xl tracking-tight">
            <span>Acme Corp</span>
            <span>Nexus</span>
            <span>Bloom</span>
            <span>Vertex AI</span>
            <span>Pulsewave</span>
          </div>
        </div>
      </section>

      {/* ── Product Screenshot ── */}
      <ProductScreenshot />

      {/* ── Features ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Everything your team needs
          </h3>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            From task boards to document vaults — TaskAI is the all-in-one
            workspace for productive teams.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl border border-border bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {f.icon}
              </div>
              <h4 className="font-semibold text-foreground mb-2">{f.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Integrations ── */}
      <IntegrationsSection />

      {/* ── Testimonials ── */}
      <section className="relative z-10 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center mb-14">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Loved by teams everywhere
            </h3>
            <p className="text-muted-foreground mt-3">
              See what our users have to say.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className="flex gap-1 mb-4 text-warning">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5">
                  "{t.quote}"
                </p>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-28">
        <div
          className="rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_60%)]" />
          <div className="relative z-10">
            <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Start your smarter workflow today
            </h3>
            <p className="text-white/80 max-w-md mx-auto mb-8">
              Join thousands of teams using TaskAI to collaborate
              smarter, ship faster, and stay organized.
            </p>
            <Button
              size="lg"
              className="rounded-full px-8 py-3 text-sm font-semibold bg-white text-foreground hover:bg-white/90 shadow-lg"
              onClick={() => navigate("/login")}
            >
              Get Started Free <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <h1 className="text-lg font-bold tracking-tight text-foreground mb-2">
                Task<span className="text-primary">AI</span>
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The AI workspace for high-performance teams.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">Features</a>
                <a href="/pricing" className="block hover:text-foreground transition-colors" onClick={(e) => { e.preventDefault(); navigate("/pricing"); }}>Pricing</a>
                <a href="#" className="block hover:text-foreground transition-colors">Integrations</a>
                <a href="#" className="block hover:text-foreground transition-colors">Roadmap</a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">About</a>
                <a href="#" className="block hover:text-foreground transition-colors">Blog</a>
                <a href="#" className="block hover:text-foreground transition-colors">Careers</a>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Resources</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">Help Center</a>
                <a href="#" className="block hover:text-foreground transition-colors">Documentation</a>
                <a href="#" className="block hover:text-foreground transition-colors">API</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="block hover:text-foreground transition-colors">Terms</a>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center">
            <span className="text-xs text-muted-foreground">
              TaskAI © 2026 All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
