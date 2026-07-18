import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Zap,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
  Shield,
  Star,
} from "lucide-react";

const tiers = [
  {
    name: "Team Starter",
    badge: "Popular Choice",
    monthlyPrice: 1450,
    annualPrice: 1160,
    description: "Best for teams up to 15 members",
    icon: <Users className="w-6 h-6" />,
    features: [
      "Up to 15 team members",
      "50 AI Document Scans/month",
      "Core Task Management",
      "n8n Integration",
      "5GB Document Storage",
      "Email Support",
      "Basic Reporting",
    ],
    highlighted: false,
    saveBadge: null,
  },
  {
    name: "Growth Tier",
    badge: "Best Value",
    monthlyPrice: 2450,
    annualPrice: 1960,
    description: "Best for teams up to 30 members",
    icon: <Zap className="w-6 h-6" />,
    features: [
      "Up to 30 team members",
      "Unlimited AI Scans",
      "Priority DynamoDB Support",
      "Custom Workflow Automations",
      "25GB Document Storage",
      "Priority Support",
      "Advanced Analytics",
      "Custom Integrations",
    ],
    highlighted: true,
    saveBadge: null,
  },
  {
    name: "Enterprise",
    badge: null,
    monthlyPrice: null,
    annualPrice: null,
    description: "For teams of 30+",
    icon: <Building2 className="w-6 h-6" />,
    features: [
      "Unlimited team members",
      "Dedicated n8n Instance",
      "POPIA-Compliant Data Residency",
      "Custom SLA",
      "Unlimited Storage",
      "Dedicated Account Manager",
      "On-premise Deployment Option",
      "SSO & Advanced Security",
    ],
    highlighted: false,
    saveBadge: null,
  },
];

const PricingPage = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const formatPrice = (price: number) =>
    `R${price.toLocaleString("en-ZA")}`;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Decorative blobs — same as landing page */}
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

      {/* ── Header ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-6">
          <Sparkles size={12} /> AI-Powered Pricing for SA Teams
        </span>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1] mb-4">
          Simple pricing,{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            powerful results
          </span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Start with a 15-day free trial — no credit card required. All
          prices in South African Rand (ZAR).
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted border border-border">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              !isAnnual
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              isAnnual
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annual
            <span className="text-[10px] font-bold bg-success/20 text-success px-1.5 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </section>

      {/* ── Free Trial Banner ── */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 mb-10">
        <div className="rounded-2xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <Shield size={24} />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                15-Day Free Trial — R0
              </p>
              <p className="text-sm text-muted-foreground">
                Full access to all features & AI automations. No credit card required.
              </p>
            </div>
          </div>
          <Button
            className="rounded-full px-6 shrink-0 text-sm font-semibold"
            style={{
              background:
                "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
            }}
            onClick={() => navigate("/login")}
          >
            Start Free Trial <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((tier) => {
            const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-[1px] transition-all duration-300 ${
                  tier.highlighted
                    ? "scale-[1.02] md:scale-105"
                    : "hover:scale-[1.01]"
                }`}
                style={
                  tier.highlighted
                    ? {
                        background:
                          "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                      }
                    : {}
                }
              >
                <div
                  className={`h-full rounded-[15px] p-6 md:p-8 flex flex-col border ${
                    tier.highlighted
                      ? "bg-card border-transparent"
                      : "bg-card border-border"
                  }`}
                >
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-4 min-h-[28px] flex-wrap">
                    {tier.badge && (
                      <Badge
                        className={`text-[10px] font-bold uppercase tracking-wider border-0 ${
                          tier.highlighted
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Star size={10} className="mr-1" />
                        {tier.badge}
                      </Badge>
                    )}
                    {tier.saveBadge && (
                      <Badge className="text-[10px] font-bold uppercase tracking-wider border-0 bg-success/10 text-success">
                        {tier.saveBadge}
                      </Badge>
                    )}
                  </div>

                  {/* Icon & Name */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                      tier.highlighted
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    {tier.description}
                  </p>

                  {/* Price */}
                  <div className="mb-6">
                    {price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground">
                          {formatPrice(price)}
                        </span>
                        <span className="text-muted-foreground text-sm">/month</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-foreground">
                        Custom
                      </span>
                    )}
                    {isAnnual && price !== null && (
                      <p className="text-xs text-success mt-1">
                        Billed annually — save{" "}
                        {formatPrice(
                          ((tier.monthlyPrice ?? 0) - (tier.annualPrice ?? 0)) * 12
                        )}
                        /year
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full rounded-xl text-sm font-semibold mb-2"
                    style={
                      tier.highlighted
                        ? {
                            background:
                              "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                          }
                        : {}
                    }
                    variant={tier.highlighted ? "default" : "outline"}
                    onClick={() => navigate("/login")}
                  >
                    {price !== null ? "Get Started" : "Contact Sales"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center mb-6">
                    {price !== null
                      ? "Includes 15-day free trial • No credit card required"
                      : "Custom onboarding included"}
                  </p>

                  {/* Features */}
                  <div className="border-t border-border pt-5 mt-auto">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      What's included
                    </p>
                    <ul className="space-y-2.5">
                      {tier.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-sm text-muted-foreground"
                        >
                          <Check
                            size={14}
                            className={`mt-0.5 shrink-0 ${
                              tier.highlighted ? "text-primary" : "text-success"
                            }`}
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
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
              Ready to transform your workflow?
            </h3>
            <p className="text-white/80 max-w-md mx-auto mb-8">
              Join thousands of teams already using Taskai to collaborate
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
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Task<span className="text-primary">ai</span>
            </h1>
            <span className="text-xs text-muted-foreground">
              © 2026 All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
