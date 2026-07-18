import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(error: string, status = 400) {
  return jsonResponse({ success: false, error }, status);
}

// Extract user from JWT in Authorization header
async function getAuthUser(req: Request, supabase: any) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// Check if user has admin role
async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── GET ENDPOINTS ───────────────────────────────────────
    if (req.method === "GET") {

      // GET ?action=by-token&token=xxx — Public/semi-public token validation
      if (action === "by-token") {
        const token = url.searchParams.get("token");
        if (!token) return errorResponse("Token is required", 400);

        const { data, error } = await supabase
          .from("invitations")
          .select("id, workspace_name, invited_email, invited_role, invited_department, invited_by_name, message, status, expires_at, created_at")
          .eq("token", token)
          .single();

        if (error || !data) return errorResponse("Invitation not found", 404);

        // Check expiry
        const isExpired = new Date(data.expires_at) < new Date();
        const isValid = data.status === "pending" && !isExpired;

        if (isExpired && data.status === "pending") {
          await supabase
            .from("invitations")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .eq("id", data.id);
          data.status = "expired";
        }

        return jsonResponse({
          success: true,
          invite: {
            ...data,
            is_valid: isValid,
            requires_auth: true,
          },
        });
      }

      // GET ?action=me — Get invites for current user
      if (action === "me") {
        const user = await getAuthUser(req, supabase);
        if (!user) return errorResponse("Authentication required", 401);

        const { data, error } = await supabase
          .from("invitations")
          .select("*")
          .eq("invited_email", user.email)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Group by status
        const invites = data || [];
        return jsonResponse({
          success: true,
          invites,
          summary: {
            pending: invites.filter((i: any) => i.status === "pending").length,
            accepted: invites.filter((i: any) => i.status === "accepted").length,
            declined: invites.filter((i: any) => i.status === "declined").length,
            expired: invites.filter((i: any) => i.status === "expired" || i.status === "revoked").length,
          },
        });
      }

      // GET ?action=sent — Admin: list sent invites
      if (action === "sent") {
        const user = await getAuthUser(req, supabase);
        if (!user) return errorResponse("Authentication required", 401);
        if (!(await isAdmin(supabase, user.id))) return errorResponse("Admin access required", 403);

        const workspaceId = url.searchParams.get("workspace_id");
        let query = supabase
          .from("invitations")
          .select("*")
          .order("created_at", { ascending: false });

        if (workspaceId) {
          query = query.eq("workspace_id", workspaceId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return jsonResponse({ success: true, invites: data || [] });
      }

      // GET ?action=list — Legacy: list all (admin only)
      if (action === "list" || !action) {
        const user = await getAuthUser(req, supabase);
        if (!user) return errorResponse("Authentication required", 401);
        if (!(await isAdmin(supabase, user.id))) return errorResponse("Admin access required", 403);

        const { data, error } = await supabase
          .from("invitations")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return jsonResponse(data || []);
      }

      return errorResponse("Unknown action", 400);
    }

    // ─── POST ENDPOINTS ──────────────────────────────────────
    if (req.method === "POST") {
      const body = await req.json();
      const postAction = body.action;

      // POST action=create — Admin creates invitation
      if (postAction === "create") {
        const user = await getAuthUser(req, supabase);
        if (!user) return errorResponse("Authentication required", 401);
        if (!(await isAdmin(supabase, user.id))) return errorResponse("Admin access required", 403);

        const {
          invited_email,
          invited_role,
          invited_department,
          invited_by_user_id,
          invited_by_name,
          message,
          full_name,
          employee_number,
          workspace_id,
          workspace_name,
          project_id,
        } = body;

        if (!invited_email) return errorResponse("Email is required", 400);

        // Check for existing pending invite
        const { data: existing } = await supabase
          .from("invitations")
          .select("id")
          .eq("invited_email", invited_email)
          .eq("status", "pending")
          .maybeSingle();

        if (existing) return errorResponse("An invitation is already pending for this email", 409);

        const { data, error } = await supabase
          .from("invitations")
          .insert({
            invited_email,
            invited_role: invited_role || "employee",
            invited_department: invited_department || null,
            invited_by_user_id: invited_by_user_id || user.id,
            invited_by_name: invited_by_name || user.email,
            message: message || null,
            full_name: full_name || null,
            employee_number: employee_number || null,
            workspace_id: workspace_id || "default",
            workspace_name: workspace_name || "TaskAI",
            project_id: project_id || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Create notification for invitee if they already have an account
        const { data: existingUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", invited_email)
          .maybeSingle();

        if (existingUser) {
          await supabase.from("notifications").insert({
            user_id: existingUser.id,
            type: "invite",
            title: "Team Invitation",
            message: `${invited_by_name || "An admin"} invited you to join ${workspace_name || "TaskAI"} as ${invited_role || "employee"}`,
            invitation_id: data.id,
            metadata: { workspace_name: workspace_name || "TaskAI", invited_role },
          });
        }

        return jsonResponse({
          success: true,
          invite: data,
          invite_url: `${body.origin || ""}/invite/${data.token}`,
        });
      }

      // POST action=accept — Accept invitation
      if (postAction === "accept") {
        const user = await getAuthUser(req, supabase);
        if (!user) return errorResponse("Authentication required", 401);

        const { token } = body;
        if (!token) return errorResponse("Token is required", 400);

        const { data: invite, error: fetchErr } = await supabase
          .from("invitations")
          .select("*")
          .eq("token", token)
          .single();

        if (fetchErr || !invite) return errorResponse("Invitation not found", 404);

        // Validate status
        if (invite.status !== "pending") {
          return errorResponse(`Invitation has already been ${invite.status}`, 400);
        }

        // Check expiry
        if (new Date(invite.expires_at) < new Date()) {
          await supabase
            .from("invitations")
            .update({ status: "expired", updated_at: new Date().toISOString() })
            .eq("id", invite.id);
          return errorResponse("Invitation has expired", 410);
        }

        // Validate email match
        if (invite.invited_email.toLowerCase() !== user.email?.toLowerCase()) {
          return errorResponse("This invitation is for a different email address", 403);
        }

        const now = new Date().toISOString();

        // Update invitation
        const { data: updatedInvite, error: updateErr } = await supabase
          .from("invitations")
          .update({
            status: "accepted",
            accepted_at: now,
            accepted_by_user_id: user.id,
            accepted_by_email: user.email,
            used_at: now,
            updated_at: now,
          })
          .eq("id", invite.id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        // Create workspace membership
        const { error: memberErr } = await supabase
          .from("workspace_members")
          .upsert({
            workspace_id: invite.workspace_id || "default",
            workspace_name: invite.workspace_name || "TaskAI",
            user_id: user.id,
            role: invite.invited_role || "employee",
            department: invite.invited_department || null,
            invited_by: invite.invited_by_user_id,
            invitation_id: invite.id,
            status: "active",
          }, { onConflict: "workspace_id,user_id" });

        if (memberErr) {
          console.error("Membership creation error:", memberErr);
        }

        // Notify the admin who sent the invite
        if (invite.invited_by_user_id) {
          const projectNote = invite.project_id ? ` for project` : "";
          await supabase.from("notifications").insert({
            user_id: invite.invited_by_user_id,
            type: "invite_accepted",
            title: "Invitation Accepted",
            message: `${user.email} accepted your invitation to join ${invite.workspace_name || "TaskAI"}${projectNote} and is now part of the team`,
            invitation_id: invite.id,
            metadata: { accepted_by_email: user.email, project_id: invite.project_id },
          });
        }

        return jsonResponse({
          success: true,
          invite: updatedInvite,
          membership: {
            workspace_id: invite.workspace_id || "default",
            workspace_name: invite.workspace_name || "TaskAI",
            role: invite.invited_role,
          },
        });
      }

      // POST action=decline — Decline invitation
      if (postAction === "decline") {
        const user = await getAuthUser(req, supabase);
        if (!user) return errorResponse("Authentication required", 401);

        const { token } = body;
        if (!token) return errorResponse("Token is required", 400);

        const { data: invite, error: fetchErr } = await supabase
          .from("invitations")
          .select("*")
          .eq("token", token)
          .single();

        if (fetchErr || !invite) return errorResponse("Invitation not found", 404);

        if (invite.status !== "pending") {
          return errorResponse(`Invitation has already been ${invite.status}`, 400);
        }

        const now = new Date().toISOString();

        const { data: updatedInvite, error: updateErr } = await supabase
          .from("invitations")
          .update({
            status: "declined",
            declined_at: now,
            used_at: now,
            updated_at: now,
          })
          .eq("id", invite.id)
          .select()
          .single();

        if (updateErr) throw updateErr;

        // Notify admin
        if (invite.invited_by_user_id) {
          await supabase.from("notifications").insert({
            user_id: invite.invited_by_user_id,
            type: "invite_declined",
            title: "Invitation Declined",
            message: `${user.email} declined your invitation to join ${invite.workspace_name || "TaskAI"}`,
            invitation_id: invite.id,
            metadata: { declined_by_email: user.email, project_id: invite.project_id },
          });
        }

        return jsonResponse({ success: true, invite: updatedInvite });
      }

      // POST action=resend — Admin resends invitation
      if (postAction === "resend") {
        const user = await getAuthUser(req, supabase);
        if (!user) return errorResponse("Authentication required", 401);
        if (!(await isAdmin(supabase, user.id))) return errorResponse("Admin access required", 403);

        const { invite_id } = body;
        if (!invite_id) return errorResponse("invite_id is required", 400);

        const { data: invite, error: fetchErr } = await supabase
          .from("invitations")
          .select("*")
          .eq("id", invite_id)
          .single();

        if (fetchErr || !invite) return errorResponse("Invitation not found", 404);

        if (!["pending", "expired"].includes(invite.status)) {
          return errorResponse(`Cannot resend invitation with status: ${invite.status}`, 400);
        }

        const { data, error } = await supabase
          .from("invitations")
          .update({
            status: "pending",
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", invite_id)
          .select()
          .single();

        if (error) throw error;

        return jsonResponse({ success: true, invite: data });
      }

      // POST action=revoke — Admin revokes invitation
      if (postAction === "revoke") {
        const user = await getAuthUser(req, supabase);
        if (!user) return errorResponse("Authentication required", 401);
        if (!(await isAdmin(supabase, user.id))) return errorResponse("Admin access required", 403);

        const { invite_id } = body;
        if (!invite_id) return errorResponse("invite_id is required", 400);

        const { data: invite, error: fetchErr } = await supabase
          .from("invitations")
          .select("status")
          .eq("id", invite_id)
          .single();

        if (fetchErr || !invite) return errorResponse("Invitation not found", 404);

        if (invite.status !== "pending") {
          return errorResponse(`Cannot revoke invitation with status: ${invite.status}`, 400);
        }

        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("invitations")
          .update({
            status: "revoked",
            revoked_at: now,
            used_at: now,
            updated_at: now,
          })
          .eq("id", invite_id)
          .select()
          .single();

        if (error) throw error;

        return jsonResponse({ success: true, invite: data });
      }

      return errorResponse("Unknown action", 400);
    }

    return errorResponse("Method not allowed", 405);
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});
