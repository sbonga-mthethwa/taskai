import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cognitoConfirmPassword } from "@/services/cognitoAuth";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Mail, Zap, Shield, Lock, Eye, EyeOff } from "lucide-react";

const INPUT_CLASS = "w-full h-11 px-4 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground/50";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await resetPassword(email);
      toast({ title: "Reset code sent!", description: "Check your email for the 6-digit code." });
      setStep("code");
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...code];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || "";
    }
    setCode(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const otp = code.join("");
    if (otp.length < 6) {
      setError("Please enter the full 6-digit code");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsSubmitting(true);
    try {
      await cognitoConfirmPassword(email, otp, newPassword);
      toast({ title: "Password reset!", description: "You can now sign in with your new password." });
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
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
        <Link to="/login">
          <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Back to Login
          </Button>
        </Link>
      </nav>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8 lg:pt-16">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left – branding panel */}
          <div className="hidden lg:block space-y-10">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Zap size={12} /> Account Recovery
              </span>
              <h2 className="text-4xl lg:text-[48px] font-bold tracking-tight text-foreground leading-[1.1]">
                Reset your
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  password securely
                </span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                No worries — it happens to the best of us. We'll get you back into your workspace in no time.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: <Mail size={18} />, text: "Receive a secure reset code via email" },
                { icon: <Shield size={18} />, text: "Your account stays protected at all times" },
                { icon: <Lock size={18} />, text: "Create a new strong password" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-muted-foreground">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right – reset form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] animate-fade-in">
              {/* Mobile logo */}
              <div className="lg:hidden mb-8 text-center">
                <Link to="/"><img src="/logo.png" alt="TaskAI" className="h-20 w-auto inline-block" /></Link>
              </div>

              {step === "email" ? (
                <div className="p-8 rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Reset Password</h2>
                    <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset code</p>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-6 animate-fade-in">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSendCode} className="space-y-5">
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Email address</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        className={INPUT_CLASS}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 gap-2 rounded-xl text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>Send Reset Code <ArrowRight size={16} /></>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Remember your password? <span className="text-primary font-medium">Sign in</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Enter Reset Code</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      We've sent a 6-digit code to
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-1">{email}</p>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-5 animate-fade-in">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-5">
                    {/* OTP inputs */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Verification Code</label>
                      <div className="flex justify-center gap-3" onPaste={handleCodePaste}>
                        {code.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleCodeChange(i, e.target.value)}
                            onKeyDown={e => handleCodeKeyDown(i, e)}
                            className="w-12 h-14 text-center text-xl font-bold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                          />
                        ))}
                      </div>
                    </div>

                    {/* New password */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          required
                          className={INPUT_CLASS}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="text-sm font-medium text-foreground block mb-2">Confirm Password</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        required
                        className={INPUT_CLASS}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 gap-2 rounded-xl text-sm font-semibold"
                      style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <>Reset Password <ArrowRight size={16} /></>
                      )}
                    </Button>
                  </form>

                  <div className="mt-5 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Didn't receive the code?{" "}
                      <button
                        onClick={() => { setStep("email"); setCode(["", "", "", "", "", ""]); setError(""); }}
                        className="text-primary font-medium hover:underline"
                      >
                        Try again
                      </button>
                    </p>
                    <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors block">
                      <ArrowLeft size={12} className="inline mr-1" /> Back to Login
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

export default ForgotPasswordPage;
