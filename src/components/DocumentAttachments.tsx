import { useState, useRef, useEffect } from "react";
import { FileText, Upload, Paperclip, X, Search, File, Code, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchDocuments,
  requestUploadUrl,
  uploadFileToS3,
  createDocument,
  apiDocToDocFile,
  type ApiDocument,
} from "@/services/documentApi";

interface DocFile {
  id: string;
  name: string;
  type: string;
  date?: string;
}

const typeIcons: Record<string, typeof FileText> = {
  figma: Image,
  code: Code,
  pdf: FileText,
  spreadsheet: File,
  document: FileText,
};

interface DocumentAttachmentsProps {
  attachedDocIds: string[];
  onChange: (ids: string[]) => void;
  editing: boolean;
  entityId?: string; // project or task ID to show project-linked docs
}

const DocumentAttachments = ({ attachedDocIds, onChange, editing, entityId }: DocumentAttachmentsProps) => {
  const { user } = useAuth();
  const [showAttachExisting, setShowAttachExisting] = useState(false);
  const [attachSearch, setAttachSearch] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [allDocs, setAllDocs] = useState<DocFile[]>([]);
  const [allApiDocs, setAllApiDocs] = useState<ApiDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show explicitly attached docs + docs linked via projectId
  const projectLinkedIds = entityId
    ? allApiDocs.filter(d => d.projectId === entityId).map(d => d.documentId)
    : [];
  const mergedIds = Array.from(new Set([...attachedDocIds, ...projectLinkedIds]));
  const attachedDocs = allDocs.filter(doc => mergedIds.includes(doc.id));

  // Load documents from API when attach panel is opened
  const loadDocs = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await fetchDocuments();
      setAllApiDocs(docs);
      setAllDocs(docs.map(d => {
        const mapped = apiDocToDocFile(d);
        return { id: mapped.id, name: mapped.name, type: mapped.type, date: mapped.date };
      }));
    } catch {
      // Backend doesn't support listing all documents — silently ignore
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);

    try {
      const newIds: string[] = [];
      for (const file of files) {
        const safeContentType = file.type || "application/octet-stream";

        // Phase 1: Get presigned URL
        const { uploadUrl, bucketKey, documentId } = await requestUploadUrl({
          fileName: file.name,
          contentType: safeContentType,
        });

        // Phase 2: Upload to S3
        await uploadFileToS3(uploadUrl, file, safeContentType);

        // Phase 3: Save metadata
        const doc = await createDocument({
          ...(documentId ? { documentId } : {}),
          fileName: file.name,
          category: "uploads",
          ownerUserId: user?.id || "1",
          uploadedBy: user?.name || "Unknown",
          fileType: safeContentType,
          visibility: "project",
          bucketKey,
          tags: [],
        });

        newIds.push(doc.documentId);
      }

      onChange([...attachedDocIds, ...newIds]);
      toast.success(`${files.length} document${files.length > 1 ? "s" : ""} uploaded and attached`);
      await loadDocs();
    } catch (err: any) {
      console.error("[Upload Error]", err);
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(event.target.files || []));
  };

  const handleRemove = (docId: string) => {
    onChange(attachedDocIds.filter(id => id !== docId));
    toast.success("Document unlinked");
  };

  const handleAttach = (docId: string) => {
    onChange([...attachedDocIds, docId]);
    toast.success("Document attached");
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(Array.from(event.dataTransfer.files || []));
  };

  const filteredAvailable = allDocs
    .filter(doc => !attachedDocIds.includes(doc.id))
    .filter(doc => !attachSearch || doc.name.toLowerCase().includes(attachSearch.toLowerCase()));

  return (
    <div>

      {attachedDocs.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No documents attached yet.</p>
      ) : (
        <div className="space-y-1.5 mb-4">
          {attachedDocs.map(doc => {
            const Icon = typeIcons[doc.type] || FileText;
            return (
              <div key={doc.id} className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg group border border-transparent hover:border-border transition-colors">
                <Icon size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-medium text-foreground truncate flex-1">{doc.name}</span>
                {doc.date && <span className="text-[10px] text-muted-foreground flex-shrink-0">{doc.date}</span>}
                {editing && (
                  <button type="button" onClick={() => handleRemove(doc.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={event => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              disabled={isUploading}
              className={`flex items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2.5 text-xs font-medium transition-colors ${dragActive ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/20 hover:bg-muted/30 text-foreground"} ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {isUploading ? "Uploading..." : "Upload Document"}
            </button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-auto py-2.5 rounded-lg"
              onClick={() => {
                setShowAttachExisting(!showAttachExisting);
                if (!showAttachExisting) loadDocs();
              }}
            >
              <Paperclip size={13} /> {showAttachExisting ? "Hide Existing" : "Attach Existing"}
            </Button>
          </div>

          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
        </div>
      )}

      {editing && showAttachExisting && (
        <div className="mt-3 border border-border rounded-xl bg-card p-3 animate-fade-in">
          <div className="relative mb-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={attachSearch}
              onChange={event => setAttachSearch(event.target.value)}
              placeholder="Search documents..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="max-h-[180px] overflow-y-auto space-y-0.5">
            {isLoadingDocs && (
              <div className="flex items-center justify-center py-3">
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoadingDocs && filteredAvailable.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No documents available</p>}
            {!isLoadingDocs && filteredAvailable.map(doc => {
              const Icon = typeIcons[doc.type] || FileText;
              return (
                <button key={doc.id} type="button" onClick={() => handleAttach(doc.id)} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs hover:bg-muted/50 transition-colors text-left">
                  <Icon size={13} className="text-muted-foreground flex-shrink-0" />
                  <span className="truncate flex-1 text-foreground">{doc.name}</span>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{doc.date}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-border flex justify-end">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setShowAttachExisting(false); setAttachSearch(""); }}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentAttachments;
