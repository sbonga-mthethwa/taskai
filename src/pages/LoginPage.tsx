import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight, Zap, CheckCircle2, FolderKanban, Users, FileText } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "You've signed in successfully." });
      navigate("/dashboard");
    } catch (err: any) {
      if (err.message?.includes("Email not confirmed")) {
        setInfo("Please check your email and verify your account before signing in.");
        toast({ title: "Email not verified", description: "Please check your email and verify your account.", variant: "destructive" });
      } else {
        setError(err.message || "Login failed");
        toast({ title: "Sign in failed", description: err.message, variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Decorative blobs matching landing page */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.04] pointer-events-none" style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }} />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none" style={{ background: "radial-gradient(circle, hsl(var(--accent)), transparent 70%)" }} />

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between max-w-7xl mx-auto px-6 py-5">
        <Link to="/"><img src="/logo.png" alt="TaskAI" className="h-20 md:h-35 w-auto" /></Link>
        <Button
          variant="ghost"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </nav>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8 lg:pt-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left – branding panel */}
          <div className="hidden lg:block space-y-10">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Zap size={12} /> Secure & Fast Login
              </span>
              <h2 className="text-4xl lg:text-[48px] font-bold tracking-tight text-foreground leading-[1.1]">
                Welcome back to
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  your workspace
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Pick up right where you left off. Your projects, tasks, and documents are waiting.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: <FolderKanban size={18} />, text: "Manage all your projects in one place" },
                { icon: <Users size={18} />, text: "Collaborate with your team in real-time" },
                { icon: <FileText size={18} />, text: "Access shared documents instantly" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Testimonial card */}
            <div className="p-6 rounded-2xl border border-border bg-card">
              <p className="text-sm text-foreground leading-relaxed mb-4">
                "Taskai transformed how our team collaborates. Projects that took weeks now take days."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
                   SD
                 </div>
                 <div>
                   <p className="text-sm font-semibold text-foreground">Siyabonga Dlamini</p>
                   <p className="text-xs text-muted-foreground">Executive Director, Imaginary Solutions</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Right – login form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] animate-fade-in">
              {/* Mobile logo */}
              <div className="lg:hidden mb-8 text-center">
                <Link to="/"><img src="/logo.png" alt="TaskAI" className="h-20 w-auto inline-block" /></Link>
              </div>

              {/* Login card */}
              <div className="p-8 rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h2>
                  <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue</p>
                </div>

                {info && (
                  <div className="bg-primary/10 border border-primary/20 text-primary text-sm rounded-xl px-4 py-3 mb-6 animate-fade-in">
                    {info}
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-6 animate-fade-in">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">Password</label>
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full h-11 px-4 pr-11 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 gap-2 rounded-xl text-sm font-semibold"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <>
                        Sign In <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/first-login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    First time? <span className="text-primary font-medium">Set up your account</span>
                  </Link>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-5 mt-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-success" /> Encrypted
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-success" /> Secure login
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
