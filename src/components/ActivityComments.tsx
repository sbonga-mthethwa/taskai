import { useState, useEffect, useRef, useMemo } from "react";
import { MessageSquare, Send, Pencil, Trash2, X, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { apiFetch } from "@/services/apiBase";

interface Comment {
  id: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ActivityCommentsProps {
  entityType: "task" | "project";
  entityId: string;
}

function normalizeComment(raw: any): Comment {
  return {
    id: raw.id || raw.commentId || raw.comment_id || "",
    entity_type: raw.entity_type || raw.entityType || "",
    entity_id: raw.entity_id || raw.entityId || "",
    user_id: raw.user_id || raw.userId || raw.authorId || "",
    content: raw.content || raw.message || "",
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.updatedAt || raw.created_at || raw.createdAt || new Date().toISOString(),
  };
}

const ActivityComments = ({ entityType, entityId }: ActivityCommentsProps) => {
  const { user } = useAuth();
  const { users: teamMembers } = useData();
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const currentUserId = user?.id || "";
  const [loading, setLoading] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load comments from AWS
  const fetchComments = async () => {
    try {
      const data = await apiFetch<any>(
        `/comments?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
      );
      const arr: any[] = Array.isArray(data) ? data : data?.comments || data?.items || [];
      setComments(arr.map(normalizeComment));
    } catch (err) {
      // Silent: endpoint may not exist yet
      console.warn("Failed to load comments:", err);
    }
  };

  useEffect(() => {
    if (!entityId) return;
    fetchComments();
    const interval = setInterval(fetchComments, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityType]);

  // Scroll to bottom on new comments
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [comments.length]);

  const resolveUser = (userId: string) => {
    const profile = teamMembers.find(m => m.id === userId);
    return profile || { name: "Unknown User", avatar: "" };
  };

  const filteredMentions = useMemo(() => {
    if (!mentionSearch) return teamMembers.slice(0, 6);
    const q = mentionSearch.toLowerCase();
    return teamMembers.filter(m => m.name.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionSearch, teamMembers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setDraft(value);

    const textBeforeCursor = value.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    if (atIndex >= 0 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === " ")) {
      const searchText = textBeforeCursor.slice(atIndex + 1);
      if (!searchText.includes(" ")) {
        setShowMentions(true);
        setMentionSearch(searchText);
        setMentionCursorPos(atIndex);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (memberName: string) => {
    const before = draft.slice(0, mentionCursorPos);
    const afterAtSearch = draft.slice(mentionCursorPos).replace(/^@\S*/, "");
    setDraft(`${before}@${memberName} ${afterAtSearch}`);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!draft.trim() || !currentUserId) return;
    setLoading(true);
    try {
      await apiFetch(`/comments`, {
        method: "POST",
        body: JSON.stringify({
          entityType,
          entityId,
          content: draft.trim(),
        }),
      });
      setDraft("");
      fetchComments();
    } catch (err) {
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await apiFetch(`/comments/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ content: editContent.trim() }),
      });
      setEditingId(null);
      setEditContent("");
      fetchComments();
    } catch {
      toast.error("Failed to update comment");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/comments/${encodeURIComponent(id)}`, { method: "DELETE" });
      fetchComments();
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  // Render content with @mentions highlighted
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w[\w\s]*?\b)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const name = part.slice(1).trim();
        const found = teamMembers.find(m => m.name.toLowerCase().startsWith(name.toLowerCase()));
        if (found) {
          return (
            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/15 text-primary text-xs font-medium">
              @{found.name}
            </span>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <section className="space-y-3 pt-1 border-t border-border">
      <div className="flex items-center gap-2">
        <MessageSquare size={14} className="text-muted-foreground" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Activity {comments.length > 0 && `(${comments.length})`}
        </p>
      </div>

      {/* Comments list */}
      <div ref={scrollRef} className="max-h-[280px] overflow-y-auto space-y-3 pr-1">
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground/60 pl-1">No comments yet. Be the first to add a note.</p>
        )}
        {comments.map(comment => {
          const author = resolveUser(comment.user_id);
          const isOwn = comment.user_id === currentUserId;
          const isEditing = editingId === comment.id;
          const wasEdited = comment.updated_at !== comment.created_at;

          return (
            <div key={comment.id} className="group rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                {author.avatar ? (
                  <img src={author.avatar} alt={author.name} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                    {getInitials(author.name)}
                  </div>
                )}
                <span className="text-xs font-semibold text-foreground">{author.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                {wasEdited && <span className="text-[10px] text-muted-foreground italic">(edited)</span>}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full text-sm bg-background border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEdit(comment.id)} className="text-[11px] font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                      <Check size={10} /> Save
                    </button>
                    <button onClick={() => { setEditingId(null); setEditContent(""); }} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <X size={10} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-foreground/90 leading-relaxed">{renderContent(comment.content)}</p>
                  {isOwn && (
                    <div className="flex gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                        className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <Pencil size={10} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                      >
                        <Trash2 size={10} /> Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* New comment input */}
      <div className="relative">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={handleInputChange}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
            }}
            placeholder="Add a comment... (use @ to mention team members)"
            rows={2}
            className="w-full text-sm bg-muted/30 border border-border rounded-lg p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none placeholder:text-muted-foreground/50"
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute right-1.5 bottom-1.5 h-7 w-7 p-0"
            onClick={handleSubmit}
            disabled={!draft.trim() || loading}
          >
            <Send size={14} />
          </Button>
        </div>

        {/* Mentions dropdown */}
        {showMentions && filteredMentions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-50 animate-fade-in">
            {filteredMentions.map(m => (
              <button
                key={m.id}
                onClick={() => insertMention(m.name)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
              >
                {m.avatar ? (
                  <img src={m.avatar} alt={m.name} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                    {getInitials(m.name)}
                  </div>
                )}
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ActivityComments;
