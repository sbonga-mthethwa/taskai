import { useState, useEffect } from "react";
import { fetchSentInvitations, resendInvitation, revokeInvitation, Invitation } from "@/services/invitationApi";
import { Mail, RotateCcw, XCircle, Loader2, Clock, Check, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: "bg-warning/10 text-warning" },
  accepted: { icon: Check, color: "bg-success/10 text-success" },
  declined: { icon: X, color: "bg-destructive/10 text-destructive" },
  expired: { icon: AlertTriangle, color: "bg-muted text-muted-foreground" },
};

const AdminInvitesSection = () => {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
    const onUpdated = () => loadInvites();
    window.addEventListener("invites-updated", onUpdated);
    return () => window.removeEventListener("invites-updated", onUpdated);
  }, []);

  const loadInvites = async () => {
    try {
      const result = await fetchSentInvitations();
      setInvites(result.invites || []);
    } catch {
      console.error("Failed to load invites");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (id: string) => {
    setActing(id);
    try {
      await resendInvitation(id);
      toast.success("Invitation resent!");
      loadInvites();
    } catch (err: any) {
      toast.error(err.message || "Failed to resend");
    } finally {
      setActing(null);
    }
  };

  const handleRevoke = async (id: string) => {
    setActing(id);
    try {
      await revokeInvitation(id);
      toast.success("Invitation revoked");
      loadInvites();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke");
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail size={28} className="mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No invitations sent yet</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg card-shadow overflow-hidden mt-4">
      <div className="grid grid-cols-[1fr_120px_100px_100px_100px_80px] gap-4 px-5 py-3 bg-muted/30 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
        <span>Invited Email</span><span>Role</span><span>Invited By</span><span>Date Sent</span><span>Status</span><span>Actions</span>
      </div>
      <div className="divide-y divide-border">
        {invites.map(inv => {
          const sc = statusConfig[inv.status] || statusConfig.pending;
          const Icon = sc.icon;
          return (
            <div key={inv.id} className="grid grid-cols-[1fr_120px_100px_100px_100px_80px] gap-4 px-5 py-3 items-center hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <Mail size={14} className="text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{inv.full_name || inv.invited_email}</p>
                  {inv.full_name && <p className="text-xs text-muted-foreground truncate">{inv.invited_email}</p>}
                </div>
              </div>
              <span className="text-xs text-muted-foreground capitalize">{inv.invited_role}</span>
              <span className="text-xs text-muted-foreground truncate">{inv.invited_by_name}</span>
              <span className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString("en-ZA")}</span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full w-fit ${sc.color}`}>
                <Icon size={10} />
                <span className="capitalize">{inv.status}</span>
              </span>
              <div className="flex items-center gap-1">
                {(inv.status === "pending" || inv.status === "expired") && (
                  <button
                    onClick={() => handleResend(inv.id)}
                    disabled={acting === inv.id}
                    title="Resend"
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    {acting === inv.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  </button>
                )}
                {inv.status === "pending" && (
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    disabled={acting === inv.id}
                    title="Revoke"
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <XCircle size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminInvitesSection;
