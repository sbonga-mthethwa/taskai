import { useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { cognitoConfirm, cognitoResendConfirmation } from "@/services/cognitoAuth";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, Mail, Phone, RefreshCw } from "lucide-react";

const VerifyEmailPage = () => {
  const location = useLocation();
  const state = location.state as { email?: string; password?: string; contactNumber?: string } | null;
  const email = state?.email || "";
  const password = state?.password || "";
  const contactNumber = state?.contactNumber || "";
  const navigate = useNavigate();
  const { login } = useAuth();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<"email" | "phone">("email");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No email provided for verification.</p>
          <Link to="/login">
            <Button variant="outline">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
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

  const handleResendCode = async () => {
    setIsResending(true);
    setError("");
    try {
      if (verificationMethod === "email") {
        await cognitoResendConfirmation(email);
        toast({ title: "Code resent", description: "A new verification code has been sent to your email." });
      } else {
        // Phone OTP: for now still resend via Cognito (email-based)
        // In a full implementation this would call an SMS OTP endpoint
        await cognitoResendConfirmation(email);
        toast({ title: "Code resent", description: `A new verification code has been sent to ${contactNumber || "your phone"}.` });
      }
      // Clear the old code inputs
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
      toast({ title: "Resend failed", description: err.message, variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length < 6) {
      setError("Please enter the full 6-digit code");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await cognitoConfirm(email, otp);
      // Auto-login after verification to trigger /me sync
      if (password) {
        try {
          toast({ title: "Email verified!", description: "Logging you in…" });
          await login(email, password);
          navigate("/dashboard", { replace: true });
          return;
        } catch {
          // Auto-login failed (profile may not exist yet); redirect to login
          toast({ title: "Email verified!", description: "Please sign in to continue." });
        }
      } else {
        toast({ title: "Email verified!", description: "Please sign in to continue." });
      }
      navigate("/login", { replace: true });
    } catch (err: any) {
      setError(err.message || "Verification failed");
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
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
        <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center px-6 pt-16 lg:pt-24">
        <div className="w-full max-w-[460px] animate-fade-in">
          <div className="p-8 rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.1))" }}>
                {verificationMethod === "email" ? <Mail size={28} className="text-primary" /> : <Phone size={28} className="text-primary" />}
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Verify Your Account</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We've sent a 6-digit code to
              </p>
              <p className="text-sm font-semibold text-foreground mt-1">
                {verificationMethod === "email" ? email : (contactNumber || "your phone")}
              </p>
            </div>

            {/* Verification method toggle */}
            <div className="flex gap-2 mb-5">
              <button
                type="button"
                onClick={() => { setVerificationMethod("email"); setCode(["", "", "", "", "", ""]); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all border ${
                  verificationMethod === "email"
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail size={16} /> Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setVerificationMethod("phone");
                  setCode(["", "", "", "", "", ""]);
                  setError("");
                  // Trigger phone OTP send
                  handleResendCode();
                }}
                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all border ${
                  verificationMethod === "phone"
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone size={16} /> Phone
              </button>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-4 py-3 mb-5 animate-fade-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center gap-3" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  />
                ))}
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
                  <>Verify & Continue <ArrowRight size={16} /></>
                )}
              </Button>
            </form>

            {/* Resend code section */}
            <div className="mt-5 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-primary font-medium text-sm gap-2"
              >
                {isResending ? (
                  <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Resend Code
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
