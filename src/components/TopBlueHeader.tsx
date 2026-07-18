import { HelpCircle, ArrowLeftRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TopBlueHeader = () => {
  const { user } = useAuth();
  const isImpersonating = !!localStorage.getItem("taskai_impersonating");

  const stopImpersonating = () => {
    const original = localStorage.getItem("taskai_impersonating");
    if (original) {
      localStorage.setItem("taskai_user", original);
      localStorage.removeItem("taskai_impersonating");
      window.location.reload();
    }
  };

  return (
    <header
      className="h-[46px] flex items-center justify-between px-5 relative z-50"
      style={{
        background: "linear-gradient(90deg, #6D5EF8, #8B5CF6, #FF4D8D)",
        boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.15)",
        color: "#fff",
      }}
    >
      {isImpersonating && (
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "#F59E0B" }} />
      )}

      {/* LEFT — Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium opacity-85 hidden sm:inline" style={{ color: "#fff" }}>
          Acme Corp
        </span>
        <span className="text-[13px] hidden sm:inline mx-2" style={{ color: "rgba(255,255,255,0.4)" }}>&gt;</span>
        <span className="text-[13px] font-medium opacity-85 hidden sm:inline" style={{ color: "#fff" }}>
          {user?.department || "Engineering"}
        </span>

        {isImpersonating && (
          <button
            onClick={stopImpersonating}
            className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded ml-3 hover:opacity-90 transition-opacity"
            style={{ color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <ArrowLeftRight size={11} />
            Viewing as {user?.name} — Switch back
          </button>
        )}
      </div>

      {/* CENTER — App Name */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
        <img src="/logo.png" alt="TaskAI" className="h-20 md:h-35 w-auto" />
      </div>

      {/* RIGHT — Controls */}
      <div className="flex items-center gap-4">
        <button className="hidden sm:block hover:opacity-100 transition-opacity" style={{ color: "rgba(255,255,255,0.6)" }}>
          <HelpCircle size={16} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
};

export default TopBlueHeader;
