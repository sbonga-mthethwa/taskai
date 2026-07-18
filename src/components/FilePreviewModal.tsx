import { useState } from "react";
import { X, Download, Share2, Clock, FileText, Code, Image, File, ChevronDown, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getDownloadUrl } from "@/services/documentApi";
import { toast } from "sonner";

interface FileTag {
  label: string;
  color: string;
}

interface PreviewFile {
  id: string;
  name: string;
  uploadedBy: string;
  date: string;
  type: string;
  folder?: string;
  folderId?: string | null;
  tags: FileTag[];
}

interface FileVersion {
  version: string;
  date: string;
  uploadedBy: string;
  isCurrent: boolean;
}

const mockVersions: FileVersion[] = [
  { version: "v3", date: "Mar 15, 2026", uploadedBy: "Current User", isCurrent: true },
  { version: "v2", date: "Mar 10, 2026", uploadedBy: "Sarah Miller", isCurrent: false },
  { version: "v1", date: "Mar 5, 2026", uploadedBy: "Alex Johnson", isCurrent: false },
];

const teamMembers = [
  { id: "1", name: "Alex Johnson", initials: "AJ" },
  { id: "2", name: "Sarah Miller", initials: "SM" },
  { id: "3", name: "Tom Chen", initials: "TC" },
  { id: "4", name: "Diana Park", initials: "DP" },
  { id: "5", name: "Ryan Brooks", initials: "RB" },
  { id: "6", name: "Maria Nez", initials: "MN" },
];

const typeIcons: Record<string, typeof FileText> = {
  figma: Image,
  code: Code,
  pdf: FileText,
  spreadsheet: File,
  document: FileText,
};

const PREVIEWABLE_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "gif", "svg", "webp", "txt", "md"];

interface FilePreviewModalProps {
  file: PreviewFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FilePreviewModal = ({ file, open, onOpenChange }: FilePreviewModalProps) => {
  const [showShare, setShowShare] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!file) return null;

  const Icon = typeIcons[file.type] || FileText;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isPreviewable = PREVIEWABLE_EXTENSIONS.includes(ext);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const url = await getDownloadUrl(file.id);
      if (!url) throw new Error("No download URL returned");

      if (isPreviewable) {
        window.open(url, "_blank");
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.download = file.name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success(`${isPreviewable ? "Opening" : "Downloading"} ${file.name}...`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Unable to open file");
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleShare = () => {
    if (selectedMembers.length === 0) return;
    setShareSuccess(true);
    setTimeout(() => {
      setShareSuccess(false);
      setShowShare(false);
      setSelectedMembers([]);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Icon size={18} className="text-muted-foreground" />
            {file.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Uploaded by {file.uploadedBy} · {file.date}
          </DialogDescription>
        </DialogHeader>

        {/* Preview area */}
        <div className="mx-5 mt-4 rounded-lg bg-muted/30 border border-border h-[280px] flex items-center justify-center">
          <div className="text-center">
            <Icon
              size={56}
              className="text-muted-foreground/50 mx-auto mb-3"
              strokeWidth={1}
            />
            <p className="text-sm text-muted-foreground">
              Preview of <span className="font-medium text-foreground">{file.name}</span>
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {isPreviewable ? "Click Download to open in a new tab" : "Click Download to save this file"}
            </p>
          </div>
        </div>

        {/* Tags */}
        {file.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 mt-3">
            {file.tags.map((tag) => (
              <span
                key={tag.label}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: tag.color + "15",
                  color: tag.color,
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Version history */}
        <div className="px-5 mt-4">
          <button
            onClick={() => setShowVersions(!showVersions)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock size={13} />
            Version History
            <ChevronDown
              size={13}
              className={`transition-transform ${showVersions ? "rotate-180" : ""}`}
            />
          </button>
          {showVersions && (
            <div className="mt-2 space-y-1 animate-fade-in">
              {mockVersions.map((v) => (
                <div
                  key={v.version}
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-xs ${
                    v.isCurrent
                      ? "bg-primary/5 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{v.version}</span>
                    {v.isCurrent && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="tabular-nums">
                    {v.date} · {v.uploadedBy}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share panel */}
        {showShare && (
          <div className="px-5 mt-3 animate-fade-in">
            <p className="text-xs font-medium text-foreground mb-2">
              Share with team members
            </p>
            <div className="space-y-1 max-h-[160px] overflow-y-auto">
              {teamMembers.map((member) => {
                const selected = selectedMembers.includes(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      selected
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold">
                      {member.initials}
                    </div>
                    <span className="flex-1 text-left text-sm">{member.name}</span>
                    {selected && <Check size={14} className="text-primary" />}
                  </button>
                );
              })}
            </div>
            {shareSuccess ? (
              <div className="flex items-center gap-2 mt-3 text-xs text-accent font-medium">
                <Check size={14} /> Shared successfully!
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleShare}
                disabled={selectedMembers.length === 0}
                className="mt-3 h-8 text-xs"
              >
                Share with {selectedMembers.length} member
                {selectedMembers.length !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 p-5 pt-4 border-t border-border mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="h-9 gap-1.5 text-xs"
          >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isPreviewable ? "Open" : "Download"}
          </Button>
          <Button
            variant={showShare ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowShare(!showShare);
              setShareSuccess(false);
              setSelectedMembers([]);
            }}
            className="h-9 gap-1.5 text-xs"
          >
            <Share2 size={14} />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
