import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchInvitations, acceptInvitation, declineInvitation, Invitation } from "@/services/invitationApi";
import { Check, X, Clock, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface InvitesSectionProps {
  filterByEmail?: string;
  compact?: boolean;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
  expired: "bg-muted text-muted-foreground",
};

const InvitesSection = ({ filterByEmail, compact }: InvitesSectionProps) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
    const onUpdated = () => loadInvites();
    window.addEventListener("invites-updated", onUpdated);
    window.addEventListener("notifications-updated", onUpdated);
    return () => {
      window.removeEventListener("invites-updated", onUpdated);
      window.removeEventListener("notifications-updated", onUpdated);
    };
  }, [user?.email]);

  const loadInvites = async () => {
    setLoading(true);
    try {
      const data = await fetchInvitations();
      // Email is already normalized by the API layer, but double-check filter
      const normalizedFilter = filterByEmail?.trim().toLowerCase();
      setInvites(normalizedFilter
        ? data.filter(i => i.invited_email === normalizedFilter)
        : data
      );
    } catch {
      console.error("Failed to load invites");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inv: Invitation) => {
    setResponding(inv.id);
    try {
      await acceptInvitation(inv.id);
      toast.success("Invitation accepted!");
      loadInvites();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setResponding(null);
    }
  };

  const handleDecline = async (inv: Invitation) => {
    setResponding(inv.id);
    try {
      await declineInvitation(inv.id);
      toast.info("Invitation declined.");
      loadInvites();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail size={24} className="mx-auto text-muted-foreground/40 mb-2" />
        <p className="text-sm text-muted-foreground">No invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invites.map(inv => (
        <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Mail size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {inv.workspace_name || "TaskAI Workspace"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {compact ? inv.invited_email : `From ${inv.invited_by_name} · ${inv.invited_email}`}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${statusColors[inv.status]}`}>
                {inv.status}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(inv.created_at).toLocaleDateString("en-ZA")}
              </span>
            </div>
          </div>
          {inv.status === "pending" && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleDecline(inv)}
                disabled={responding === inv.id}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X size={14} />
              </button>
              <button
                onClick={() => handleAccept(inv)}
                disabled={responding === inv.id}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-success hover:bg-success/10 transition-colors"
              >
                {responding === inv.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default InvitesSection;
