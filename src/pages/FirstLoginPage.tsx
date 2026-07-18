import { useState, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight, Zap, ShieldCheck, Users, FolderKanban, CheckCircle2, Camera, X } from "lucide-react";

const INPUT_CLASS = "w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50";

const FirstLoginPage = () => {
  const location = useLocation();
  const prefillEmail = (location.state as any)?.prefillEmail || "";
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [contactNumber, setContactNumber] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Avatar must be under 5MB.", variant: "destructive" });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      toast({ title: "Validation error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      toast({ title: "Validation error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    try {
      await signup({ name, surname, email, contactNumber, username, password });
      toast({ title: "Account created!", description: "Please check your email for your verification code." });
      navigate("/verify-email", { state: { email, password, contactNumber } });
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Sign up failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Decorative blobs */}
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
                <Zap size={12} /> Quick & Easy Setup
              </span>
              <h2 className="text-4xl lg:text-[48px] font-bold tracking-tight text-foreground leading-[1.1]">
                Set up your
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Taskai account
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                Fill in your details and create a password. Your team is already waiting for you.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: <FolderKanban size={18} />, text: "Jump into projects assigned to you" },
                { icon: <Users size={18} />, text: "Collaborate with your team instantly" },
                { icon: <ShieldCheck size={18} />, text: "Secure, encrypted account setup" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Info card */}
            <div className="p-6 rounded-2xl border border-border bg-card">
              <p className="text-sm text-foreground leading-relaxed mb-4">
                "Getting started with Taskai took less than a minute. The onboarding is seamless."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
                  TK
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Thabo Khumalo</p>
                  <p className="text-xs text-muted-foreground">Operations Manager, Vertex AI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right – setup form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[460px] animate-fade-in">
              {/* Mobile logo */}
              <div className="lg:hidden mb-8 text-center">
                <Link to="/"><img src="/logo.png" alt="TaskAI" className="h-20 w-auto inline-block" /></Link>
              </div>

              {success ? (
                <div className="p-8 rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 text-center">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))" }}>
                    <CheckCircle2 size={32} className="text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Check your email</h2>
                  <p className="text-sm text-muted-foreground mb-2">
                    We've sent a verification link to
                  </p>
                  <p className="text-sm font-semibold text-foreground mb-8">{email}</p>
                  <p className="text-xs text-muted-foreground mb-6">
                    Please click the link in the email to verify your account and sign in.
                  </p>
                  <Link to="/login">
                    <Button
                      className="w-full h-11 gap-2 rounded-xl text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                    >
                      Go to Sign In <ArrowRight size={16} />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Your Account</h2>
                    <p className="text-sm text-muted-foreground mt-1">Fill in your details to get started</p>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-5 animate-fade-in">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar upload */}
                    <div className="flex flex-col items-center gap-2">
                      <label className="text-sm font-medium text-foreground block">Profile Photo <span className="text-xs text-muted-foreground">(optional)</span></label>
                      <div className="relative">
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-20 h-20 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors overflow-hidden bg-muted/30"
                        >
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                          ) : (
                            <Camera size={24} className="text-muted-foreground" />
                          )}
                        </div>
                        {avatarPreview && (
                          <button
                            type="button"
                            onClick={removeAvatar}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="First name" required className={INPUT_CLASS} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1.5">Surname</label>
                        <input type="text" value={surname} onChange={e => setSurname(e.target.value)} placeholder="Last name" required className={INPUT_CLASS} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Email Address</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className={INPUT_CLASS} />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Contact Number</label>
                      <input type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="+27 00 000 0000" required className={INPUT_CLASS} />
                    </div>


                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Username</label>
                      <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" required className={INPUT_CLASS} />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          required
                          className={INPUT_CLASS + " pr-11"}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground block mb-1.5">Confirm Password</label>
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required className={INPUT_CLASS} />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 gap-2 rounded-xl text-sm font-semibold mt-2"
                      style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>Create Account <ArrowRight size={16} /></>
                      )}
                    </Button>
                  </form>

                  <div className="mt-5 text-center">
                    <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Already have an account? <span className="text-primary font-medium">Sign in</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstLoginPage;
