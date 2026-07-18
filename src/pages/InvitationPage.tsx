import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchInvitationByToken, acceptInvitation, declineInvitation, InviteValidation } from "@/services/invitationApi";
import { Check, X, Loader2, Mail, UserPlus, Clock, AlertTriangle, Zap } from "lucide-react";
import { toast } from "sonner";

const InvitationPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [invitation, setInvitation] = useState<InviteValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchInvitationByToken(token)
      .then(result => {
        setInvitation(result.invite);
        if (result.invite.status !== "pending") {
          setResponded(result.invite.status as any);
        }
      })
      .catch(err => setError(err.message || "Invitation not found or invalid"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!invitation?.id) return;
    setResponding(true);
    try {
      await acceptInvitation(invitation.id);
      setResponded("accepted");
      toast.success("Invitation accepted! Welcome to the team.");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to accept invitation");
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation?.id) return;
    setResponding(true);
    try {
      await declineInvitation(invitation.id);
      setResponded("declined");
      toast.info("Invitation declined.");
    } catch (err: any) {
      toast.error(err.message || "Failed to decline invitation");
    } finally {
      setResponding(false);
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
        {!isAuthenticated && (
          <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => navigate("/login")}>
            Sign In
          </Button>
        )}
      </nav>

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-12">
        {loading && (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground text-sm">Loading invitation...</p>
          </div>
        )}

        {error && (
          <div className="p-8 rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Invalid Invitation</h2>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")} variant="outline">Go to Home</Button>
          </div>
        )}

        {!loading && !error && invitation && (
          <div className="p-8 rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}>
                <UserPlus className="w-7 h-7 text-primary-foreground" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-3">
                <Zap size={12} /> Team Invitation
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                You've been invited!
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                to join <span className="font-semibold text-foreground">{invitation.workspace_name}</span>
              </p>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserPlus size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Invited by</p>
                  <p className="text-sm font-medium text-foreground">{invitation.invited_by_name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{invitation.invited_email}</p>
                </div>
              </div>

              {invitation.invited_role && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium text-foreground capitalize">{invitation.invited_role}</p>
                  </div>
                </div>
              )}

              {invitation.message && (
                <div className="p-3 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Message</p>
                  <p className="text-sm text-foreground italic">"{invitation.message}"</p>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(invitation.expires_at).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {responded === "accepted" && (
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-center">
                <Check className="w-6 h-6 text-success mx-auto mb-2" />
                <p className="text-sm font-semibold text-success">Invitation Accepted</p>
                <p className="text-xs text-muted-foreground mt-1">Redirecting to dashboard...</p>
              </div>
            )}

            {responded === "declined" && (
              <div className="p-4 rounded-xl bg-muted border border-border text-center">
                <X className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">Invitation Declined</p>
                <p className="text-xs text-muted-foreground mt-1">You chose not to join this team.</p>
              </div>
            )}

            {invitation.status === "expired" && !responded && (
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-center">
                <AlertTriangle className="w-6 h-6 text-warning mx-auto mb-2" />
                <p className="text-sm font-semibold text-warning">Invitation Expired</p>
                <p className="text-xs text-muted-foreground mt-1">Ask the admin to resend the invitation.</p>
              </div>
            )}

            {!responded && invitation.status === "pending" && (
              <>
                {!isAuthenticated && (
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      You need to sign in first.{" "}
                      <Link to={`/login?invite=${token}`} className="text-primary font-medium hover:underline">Sign in</Link>
                      {" "}or{" "}
                      <Link to={`/first-login?invite=${token}`} className="text-primary font-medium hover:underline">create your account</Link>
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 gap-2"
                    onClick={handleDecline}
                    disabled={responding}
                  >
                    <X size={16} /> Decline
                  </Button>
                  <Button
                    className="flex-1 h-11 gap-2"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
                    onClick={handleAccept}
                    disabled={responding || !isAuthenticated}
                  >
                    {responding ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={16} /> Accept & Join
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationPage;
