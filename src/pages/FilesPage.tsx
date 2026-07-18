import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  MoreHorizontal,
  FileText,
  Code,
  Image,
  File,
  Upload,
  Grid3X3,
  List,
  Tag,
  X,
  Pencil,
  Trash2,
  Share2,
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  Home,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useData } from "@/contexts/DataContext";
import FilePreviewModal from "@/components/FilePreviewModal";
import {
  fetchDocuments,
  requestUploadUrl,
  uploadFileToS3,
  createDocument,
  apiDocToDocFile,
  FOLDER_TO_CATEGORY,
} from "@/services/documentApi";
import {
  fetchFolders,
  createFolder,
  deleteFolder as deleteFolderApi,
  moveDocumentToFolder,
  type ApiFolder,
} from "@/services/folderApi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocFile {
  id: string;
  name: string;
  folderId: string | null;
  uploadedBy: string;
  date: string;
  type: string;
  tags: { label: string; color: string }[];
}

interface DocFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdBy: string;
  date: string;
  projectId?: string | null;
}

const DEFAULT_FOLDERS: DocFolder[] = [
  { id: "contracts", name: "Contracts", parentId: null, createdBy: "system", date: "Mar 1, 2026" },
  { id: "finance", name: "Finance", parentId: null, createdBy: "system", date: "Mar 1, 2026" },
  { id: "hr", name: "HR", parentId: null, createdBy: "system", date: "Mar 1, 2026" },
  { id: "projects", name: "Projects", parentId: null, createdBy: "system", date: "Mar 1, 2026" },
  { id: "uploads", name: "Uploads", parentId: null, createdBy: "system", date: "Mar 1, 2026" },
  { id: "personal", name: "Personal Files", parentId: null, createdBy: "system", date: "Mar 1, 2026" },
];

const typeIcons: Record<string, typeof FileText> = {
  figma: Image,
  code: Code,
  pdf: FileText,
  spreadsheet: File,
  document: FileText,
};

function toDisplayFolder(f: ApiFolder): DocFolder {
  const createdAt =
    typeof f.createdAt === "number"
      ? f.createdAt
      : typeof f.createdAt === "string" && !Number.isNaN(Number(f.createdAt))
        ? Number(f.createdAt)
        : undefined;

  return {
    id: f.folderId,
    name: f.name,
    parentId: f.parentFolderId ?? null,
    createdBy: f.createdBy || f.ownerUserId || "unknown",
    projectId: f.projectId ?? null,
    date: createdAt
      ? new Date(createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "—",
  };
}

const FilesPage = () => {
  const { user } = useAuth();
  const { users: teamMembers } = useData();
  const permissions = usePermissions();

  const currentUser = user?.name || "Alex Johnson";
  const currentUserId = (user as any)?.userId || (user as any)?.id || "00000000-0000-0000-0000-000000000000";

  // Resolve user ID to friendly name
  const resolveUserName = (nameOrId: string) => {
    if (user && (nameOrId === (user as any).id || nameOrId === currentUserId)) {
      return (user as any).name || "You";
    }
    const member = teamMembers.find((m) => m.id === nameOrId);
    if (member && member.name && member.name !== "Unknown") return member.name;
    if (!nameOrId.includes("-") || nameOrId.length < 20) return nameOrId;
    return nameOrId.slice(0, 8) + "…";
  };

  const [allFiles, setAllFiles] = useState<DocFile[]>([]);
  const [allFolders, setAllFolders] = useState<DocFolder[]>(DEFAULT_FOLDERS);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState<DocFile | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);
  const [uploadShareUsers, setUploadShareUsers] = useState<string[]>([]);
  const [uploadShareSearch, setUploadShareSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [searchParams] = useSearchParams();
  const [folderDragActive, setFolderDragActive] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Create folder state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Modify state
  const [modifyFile, setModifyFile] = useState<DocFile | null>(null);
  const [modifyName, setModifyName] = useState("");

  // Delete state
  const [deleteFile, setDeleteFile] = useState<DocFile | null>(null);
  const [deleteFolder, setDeleteFolder] = useState<DocFolder | null>(null);

  // Share state
  const [shareFile, setShareFile] = useState<DocFile | null>(null);
  const [shareSearch, setShareSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [sharePermission, setSharePermission] = useState<"view" | "edit">("view");

  const DEFAULT_FOLDER_IDS = DEFAULT_FOLDERS.map((f) => f.id);

  // Load documents from API
  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await fetchDocuments();
      const mapped = docs.map(apiDocToDocFile);
      setAllFiles(mapped);
    } catch (err: any) {
      console.warn("Document loading skipped:", err?.message);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Load folders from AWS
  const loadFolders = async () => {
    try {
      const data = await fetchFolders();
      console.log("Fetched folders from AWS:", data);

      const awsFolders: DocFolder[] = (data || []).map((f: any) => ({
        id: f.folderId,
        name: f.name,
        parentId: f.parentFolderId ?? null,
        createdBy: f.createdBy || f.ownerUserId || "unknown",
        projectId: f.projectId ?? null,
        date: f.createdAt
          ? new Date(typeof f.createdAt === "number" ? f.createdAt : Number(f.createdAt)).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—",
      }));

      setAllFolders((prev) => {
        const serverIds = new Set(awsFolders.map((folder) => folder.id));
        const pendingCustomFolders = prev.filter(
          (folder) =>
            !DEFAULT_FOLDER_IDS.includes(folder.id) &&
            !serverIds.has(folder.id) &&
            folder.parentId === currentFolderId,
        );

        return [...DEFAULT_FOLDERS, ...awsFolders, ...pendingCustomFolders];
      });
    } catch (err) {
      console.error("Failed to load folders:", err);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadFolders();
  }, []);

  useEffect(() => {
    if (searchParams.get("upload") === "1") {
      setShowUploadModal(true);
      setUploadFolderId(currentFolderId);
    }
  }, [searchParams, currentFolderId]);

  // Build breadcrumb path
  const getBreadcrumb = (): DocFolder[] => {
    const path: DocFolder[] = [];
    let id = currentFolderId;
    while (id) {
      const folder = allFolders.find((f) => f.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parentId;
    }
    return path;
  };

  const breadcrumb = getBreadcrumb();

  // Recursive file count
  const getRecursiveFileCount = (folderId: string): number => {
    const directFiles = allFiles.filter((f) => f.folderId === folderId).length;
    const childFolders = allFolders.filter((f) => f.parentId === folderId);
    const childFiles = childFolders.reduce((sum, cf) => sum + getRecursiveFileCount(cf.id), 0);
    return directFiles + childFiles;
  };

  // Get items in current folder
  const foldersInView = allFolders.filter((f) => f.parentId === currentFolderId);
  console.log("[Folders] currentFolderId:", currentFolderId, "foldersInView:", foldersInView);
  const filesInView = allFiles.filter((f) => {
    if (f.folderId !== currentFolderId) return false;
    if (currentFolderId === "personal") {
      return f.uploadedBy === currentUser || f.uploadedBy === currentUserId;
    }
    return true;
  });

  const filteredFolders = foldersInView.filter((f) => {
    if (!search) return true;
    return f.name.toLowerCase().includes(search.toLowerCase());
  });

  const filteredFiles = filesInView.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.uploadedBy.toLowerCase().includes(q) ||
      f.tags.some((tag) => tag.label.toLowerCase().includes(q))
    );
  });

  const getFolderUploadCategory = (folderId: string | null) => {
    if (!folderId) return "uploads";
    return FOLDER_TO_CATEGORY[folderId] || "uploads";
  };

  // Upload flow
  const handleUpload = async () => {
    if (!uploadFileName.trim()) {
      toast.error("Please enter a document name");
      return;
    }
    if (uploadedFiles.length === 0) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    try {
      const file = uploadedFiles[0];
      const safeContentType = file.type || "application/octet-stream";
      const category = getFolderUploadCategory(uploadFolderId);
      const isPersonal = uploadFolderId === "personal";

      const { uploadUrl, bucketKey, documentId: presignDocId } = await requestUploadUrl({
        fileName: file.name,
        contentType: safeContentType,
      });

      await uploadFileToS3(uploadUrl, file, safeContentType);

      const created = await createDocument({
        ...(presignDocId ? { documentId: presignDocId } : {}),
        fileName: uploadFileName,
        category,
        ownerUserId: currentUserId,
        uploadedBy: currentUser,
        fileType: safeContentType,
        visibility: isPersonal ? "personal" : uploadShareUsers.length > 0 ? "shared" : "project",
        sharedWith: uploadShareUsers,
        editableBy: [],
        bucketKey,
        tags: [],
      });

      const finalDocId = presignDocId || created?.documentId;

      // If uploading into a custom AWS folder, move document into that folder after create
      if (uploadFolderId && !DEFAULT_FOLDER_IDS.includes(uploadFolderId)) {
        if (!finalDocId) {
          console.error("[Upload] Cannot move to custom folder — documentId missing", { presignDocId, created });
          toast.error("Uploaded but couldn't attach to folder (missing document id)");
        } else {
          console.log("[Upload] Moving document to custom folder", { finalDocId, uploadFolderId });
          await moveDocumentToFolder(finalDocId, uploadFolderId);
        }
      }

      if (uploadShareUsers.length > 0) {
        toast.success(
          `Document uploaded and shared with ${uploadShareUsers.length} user${uploadShareUsers.length > 1 ? "s" : ""}`,
        );
      } else {
        toast.success("Document uploaded successfully");
      }

      setShowUploadModal(false);
      setUploadFileName("");
      setUploadedFiles([]);
      setUploadFolderId(null);
      setUploadShareUsers([]);
      setUploadShareSearch("");

      await loadDocuments();
      await loadFolders();
    } catch (err: any) {
      console.error("[Upload Error]", err);
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Drag-and-drop for upload modal
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...files]);
    if (!uploadFileName && files.length > 0) setUploadFileName(files[0].name);
  };

  // Drag-and-drop directly into folder view (inline upload)
  const handleFolderDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setFolderDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setIsUploading(true);
    const category = getFolderUploadCategory(currentFolderId);
    const isPersonal = currentFolderId === "personal";
    let successCount = 0;

    try {
      for (const file of files) {
        const safeContentType = file.type || "application/octet-stream";
        const { uploadUrl, bucketKey, documentId: presignDocId } = await requestUploadUrl({
          fileName: file.name,
          contentType: safeContentType,
        });

        await uploadFileToS3(uploadUrl, file, safeContentType);

        const created = await createDocument({
          ...(presignDocId ? { documentId: presignDocId } : {}),
          fileName: file.name,
          category,
          ownerUserId: currentUserId,
          uploadedBy: currentUser,
          fileType: safeContentType,
          visibility: isPersonal ? "personal" : "project",
          bucketKey,
          tags: [],
        });

        const finalDocId = presignDocId || created?.documentId;
        if (currentFolderId && !DEFAULT_FOLDER_IDS.includes(currentFolderId)) {
          if (!finalDocId) {
            console.error("[FolderDrop] Cannot move to custom folder — documentId missing", { presignDocId, created });
          } else {
            console.log("[FolderDrop] Moving document to custom folder", { finalDocId, currentFolderId });
            await moveDocumentToFolder(finalDocId, currentFolderId);
          }
        }

        successCount++;
      }

      toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully`);
      await loadDocuments();
      await loadFolders();
    } catch (err: any) {
      console.error("[Upload Error]", err);
      toast.error(err.message || "Upload failed");
      if (successCount > 0) {
        await loadDocuments();
        await loadFolders();
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Drag-and-drop files onto a subfolder
  const handleSubfolderDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    setFolderDragActive(false);

    const draggedFileId = e.dataTransfer.getData("application/x-file-id");
    if (draggedFileId) {
      await handleMoveFileToFolder(draggedFileId, targetFolderId);
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const targetFolder = allFolders.find((f) => f.id === targetFolderId);
    setIsUploading(true);
    const category = getFolderUploadCategory(targetFolderId);
    let successCount = 0;

    try {
      for (const file of files) {
        const safeContentType = file.type || "application/octet-stream";
        const { uploadUrl, bucketKey, documentId: presignDocId } = await requestUploadUrl({
          fileName: file.name,
          contentType: safeContentType,
        });

        await uploadFileToS3(uploadUrl, file, safeContentType);

        const created = await createDocument({
          ...(presignDocId ? { documentId: presignDocId } : {}),
          fileName: file.name,
          category,
          ownerUserId: currentUserId,
          uploadedBy: currentUser,
          fileType: safeContentType,
          visibility: "project",
          bucketKey,
          tags: [],
        });

        const finalDocId = presignDocId || created?.documentId;
        if (!finalDocId) {
          console.error("[SubfolderDrop] documentId missing — cannot attach to folder", { presignDocId, created });
        } else {
          console.log("[SubfolderDrop] Moving document to folder", { finalDocId, targetFolderId });
          await moveDocumentToFolder(finalDocId, targetFolderId);
        }

        successCount++;
      }

      toast.success(
        `${successCount} file${successCount > 1 ? "s" : ""} uploaded to "${targetFolder?.name || "folder"}"`,
      );
      await loadDocuments();
      await loadFolders();
    } catch (err: any) {
      console.error("[Upload Error]", err);
      toast.error(err.message || "Upload failed");
      if (successCount > 0) {
        await loadDocuments();
        await loadFolders();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles((prev) => [...prev, ...files]);
    if (!uploadFileName && files.length > 0) setUploadFileName(files[0].name);
  };

  // Move a file to a different folder via drag-and-drop
  const handleMoveFileToFolder = async (fileId: string, targetFolderId: string) => {
    const file = allFiles.find((f) => f.id === fileId);
    const targetFolder = allFolders.find((f) => f.id === targetFolderId);
    if (!file || !targetFolder) return;
    if (file.folderId === targetFolderId) return;

    try {
      await moveDocumentToFolder(fileId, targetFolderId);

      setAllFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, folderId: targetFolderId } : f)));

      toast.success(`Moved "${file.name}" to "${targetFolder.name}"`);
      await loadDocuments();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to move file");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    try {
      console.log("Creating folder via AWS folderApi only");
      const created = await createFolder({
        name: newFolderName.trim(),
        parentFolderId: currentFolderId || null,
        projectId: null,
        visibility: "private",
      });

      console.log("[Folders] Created folder response:", created);
      console.log("[Folders] currentFolderId:", currentFolderId);

      setShowCreateFolder(false);
      setNewFolderName("");

      // Optimistic insert so the new folder appears immediately
      const optimistic: DocFolder = toDisplayFolder(created);
      setAllFolders((prev) => {
        if (prev.some((f) => f.id === optimistic.id)) return prev;
        return [...prev, optimistic];
      });

      // Then refresh from server to reconcile
      await loadFolders();

      toast.success("Folder created successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create folder");
    }
  };

  const handleModifySave = () => {
    if (!modifyFile || !modifyName.trim()) return;
    setAllFiles((prev) => prev.map((f) => (f.id === modifyFile.id ? { ...f, name: modifyName } : f)));
    setModifyFile(null);
    toast.success("Document updated successfully");
  };

  const handleDeleteFile = async () => {
    if (!deleteFile) return;
    try {
      const { getStoredAccessToken } = await import("@/services/cognitoAuth");
      const token = getStoredAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(
        `https://daiee5zick.execute-api.af-south-1.amazonaws.com/prod/documents/${deleteFile.id}`,
        { method: "DELETE", headers },
      );
    } catch (err: any) {
      console.error("Delete API error (removing locally):", err);
    }

    setAllFiles((prev) => prev.filter((f) => f.id !== deleteFile.id));
    setDeleteFile(null);
    toast.success("Document deleted successfully");
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolder) return;

    const isDefaultFolder = DEFAULT_FOLDERS.some((f) => f.id === deleteFolder.id);
    if (isDefaultFolder) {
      toast.error("Default folders cannot be deleted");
      setDeleteFolder(null);
      return;
    }

    try {
      await deleteFolderApi(deleteFolder.id);
      setAllFolders((prev) => prev.filter((folder) => folder.id !== deleteFolder.id));
      setDeleteFolder(null);
      toast.success("Folder deleted successfully");
      await loadFolders();
      await loadDocuments();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete folder");
    }
  };

  const handleShare = () => {
    if (!shareFile || selectedUsers.length === 0) return;
    toast.success(`Document shared with ${selectedUsers.length} user${selectedUsers.length > 1 ? "s" : ""}`);
    setShareFile(null);
    setSelectedUsers([]);
    setShareSearch("");
  };

  const handlePreviewFile = async (f: DocFile) => {
    setPreviewFile(f);
  };

  const resolveOwnerId = (f: DocFile) => {
    const member = teamMembers.find((m) => m.name === f.uploadedBy || m.id === f.uploadedBy);
    if (member) return member.id;
    if (
      user &&
      (f.uploadedBy === (user as any).name || f.uploadedBy === (user as any).id || f.uploadedBy === currentUser)
    ) {
      return currentUserId;
    }
    return f.uploadedBy;
  };

  const canEditFile = (f: DocFile) => permissions.canEditDocument({ ownerUserId: resolveOwnerId(f) });
  const canDeleteFile = (f: DocFile) => permissions.canDeleteDocument({ ownerUserId: resolveOwnerId(f) });
  const canShareFile = (f: DocFile) => permissions.canShareDocument({ ownerUserId: resolveOwnerId(f) });

  const filteredTeamMembers = teamMembers.filter(
    (m) => !shareSearch || m.name.toLowerCase().includes(shareSearch.toLowerCase()),
  );

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 md:px-6 pt-4 md:pt-6 pb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-lg md:text-2xl font-semibold tracking-tight text-foreground shrink-0">Documents</h1>

        <div className="flex items-center gap-2 flex-1 sm:justify-center max-w-[480px]">
          <div className="relative flex-1 min-w-0">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full h-9 pl-9 pr-4 text-sm bg-muted/40 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-muted-foreground/50 transition-all duration-150"
            />
          </div>
          <div className="hidden sm:flex items-center rounded-lg border border-border overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`w-9 h-9 flex items-center justify-center transition-all duration-150 ${
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Grid3X3 size={15} />
            </button>
            <div className="w-px h-5 bg-border" />
            <button
              onClick={() => setViewMode("list")}
              className={`w-9 h-9 flex items-center justify-center transition-all duration-150 ${
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 md:h-9 gap-1.5 text-xs md:text-sm font-medium hover:scale-[1.03] active:scale-[0.98] transition-transform duration-150"
            onClick={() => setShowCreateFolder(true)}
          >
            <FolderPlus size={15} />
            <span className="hidden sm:inline">New Folder</span>
          </Button>
          <Button
            size="sm"
            className="h-8 md:h-9 gap-1.5 text-xs md:text-sm font-medium hover:scale-[1.03] active:scale-[0.98] transition-transform duration-150"
            onClick={() => {
              setShowUploadModal(true);
              setUploadFolderId(currentFolderId);
            }}
          >
            <Upload size={15} />
            <span className="hidden sm:inline">Upload Document</span>
            <span className="sm:hidden">Upload</span>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-4 mb-2 text-sm">
        <button
          onClick={() => setCurrentFolderId(null)}
          className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors duration-150 ${
            currentFolderId === null
              ? "text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Home size={14} />
          <span>All Documents</span>
        </button>
        {breadcrumb.map((folder) => (
          <div key={folder.id} className="flex items-center gap-1.5">
            <ChevronRight size={12} className="text-muted-foreground" />
            <button
              onClick={() => setCurrentFolderId(folder.id)}
              className={`px-2 py-1 rounded-md transition-colors duration-150 ${
                currentFolderId === folder.id
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>

      {isLoadingDocs && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        </div>
      )}

      {!isLoadingDocs && (
        <div
          className={`mt-2 relative rounded-xl transition-all duration-200 ${
            folderDragActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5" : ""
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setFolderDragActive(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setFolderDragActive(false);
          }}
          onDrop={handleFolderDrop}
        >
          {folderDragActive && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-primary/5 border-2 border-dashed border-primary pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-primary" />
                <p className="text-sm font-medium text-primary">
                  Drop files to upload
                  {currentFolderId ? ` to ${allFolders.find((f) => f.id === currentFolderId)?.name || "folder"}` : ""}
                </p>
              </div>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Loader2 size={20} className="animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Uploading...</p>
              </div>
            </div>
          )}

          {filteredFolders.length > 0 && (
            <div
              className={`mb-4 ${viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4" : "space-y-1"}`}
            >
              {filteredFolders.map((folder) =>
                viewMode === "list" ? (
                  <div
                    key={folder.id}
                    className={`flex items-center gap-4 px-4 py-3 bg-card rounded-lg border transition-all duration-150 cursor-pointer group ${
                      dragOverFolderId === folder.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.02]"
                        : "border-border hover:bg-muted/20"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolderId(folder.id);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolderId(folder.id);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolderId(null);
                    }}
                    onDrop={(e) => handleSubfolderDrop(e, folder.id)}
                  >
                    <div
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => setCurrentFolderId(folder.id)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FolderOpen size={16} className="text-primary" strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium text-foreground truncate">{folder.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto shrink-0">
                        {getRecursiveFileCount(folder.id)} files
                      </span>
                    </div>
                    {!DEFAULT_FOLDER_IDS.includes(folder.id) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all duration-150"
                          >
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => setDeleteFolder(folder)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete Folder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ) : (
                  <div
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={`bg-card rounded-xl border hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 cursor-pointer group overflow-hidden relative p-4 ${
                      dragOverFolderId === folder.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 scale-[1.02]"
                        : "border-border hover:border-primary/20"
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolderId(folder.id);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolderId(folder.id);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolderId(null);
                    }}
                    onDrop={(e) => handleSubfolderDrop(e, folder.id)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Folder size={20} className="text-primary" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                        <p className="text-[11px] text-muted-foreground">{getRecursiveFileCount(folder.id)} files</p>
                      </div>
                    </div>
                    {!DEFAULT_FOLDER_IDS.includes(folder.id) && (
                      <div className="absolute top-2 right-2" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all duration-150"
                            >
                              <MoreHorizontal size={15} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => setDeleteFolder(folder)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" /> Delete Folder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          )}

          {viewMode === "list"
            ? filteredFiles.length > 0 && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_140px_120px_44px] gap-4 px-4 py-3 bg-muted/30 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                    <span>Document Name</span>
                    <span>Uploaded By</span>
                    <span>Date</span>
                    <span />
                  </div>
                  <div className="divide-y divide-border">
                    {filteredFiles.map((f) => {
                      const Icon = typeIcons[f.type] || FileText;
                      return (
                        <div
                          key={f.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("application/x-file-id", f.id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onClick={() => handlePreviewFile(f)}
                          className="grid grid-cols-[1fr_140px_120px_44px] gap-4 px-4 items-center hover:bg-muted/20 transition-colors duration-150 cursor-grab active:cursor-grabbing"
                          style={{ height: 56 }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                              <Icon size={16} className="text-muted-foreground" strokeWidth={1.5} />
                            </div>
                            <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
                            {f.tags.map((tag) => (
                              <span
                                key={tag.label}
                                className="hidden sm:inline-flex text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
                                style={{ backgroundColor: tag.color + "12", color: tag.color }}
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{resolveUserName(f.uploadedBy)}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{f.date}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
                              >
                                <MoreHorizontal size={15} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {canEditFile(f) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setModifyFile(f);
                                    setModifyName(f.name);
                                  }}
                                >
                                  <Pencil size={14} className="mr-2" /> Modify
                                </DropdownMenuItem>
                              )}
                              {canDeleteFile(f) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteFile(f);
                                  }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 size={14} className="mr-2" /> Delete
                                </DropdownMenuItem>
                              )}
                              {canShareFile(f) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShareFile(f);
                                    setSelectedUsers([]);
                                    setShareSearch("");
                                  }}
                                >
                                  <Share2 size={14} className="mr-2" /> Share
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            : filteredFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredFiles.map((f) => {
                    const Icon = typeIcons[f.type] || FileText;
                    return (
                      <div
                        key={f.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("application/x-file-id", f.id);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        className="bg-card rounded-xl border border-border hover:border-primary/20 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing group overflow-hidden relative"
                      >
                        <div className="absolute top-2 right-2 z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-all duration-150"
                              >
                                <MoreHorizontal size={14} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {canEditFile(f) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setModifyFile(f);
                                    setModifyName(f.name);
                                  }}
                                >
                                  <Pencil size={14} className="mr-2" /> Modify
                                </DropdownMenuItem>
                              )}
                              {canDeleteFile(f) && (
                                <DropdownMenuItem
                                  onClick={() => setDeleteFile(f)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 size={14} className="mr-2" /> Delete
                                </DropdownMenuItem>
                              )}
                              {canShareFile(f) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setShareFile(f);
                                    setSelectedUsers([]);
                                    setShareSearch("");
                                  }}
                                >
                                  <Share2 size={14} className="mr-2" /> Share
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div
                          onClick={() => handlePreviewFile(f)}
                          className="h-28 bg-muted/20 flex items-center justify-center"
                        >
                          <Icon
                            size={32}
                            className="text-muted-foreground/60 group-hover:text-primary transition-colors duration-200"
                            strokeWidth={1.2}
                          />
                        </div>
                        <div className="p-4" onClick={() => handlePreviewFile(f)}>
                          <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                          {f.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {f.tags.map((tag) => (
                                <span
                                  key={tag.label}
                                  className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                  style={{ backgroundColor: tag.color + "12", color: tag.color }}
                                >
                                  <Tag size={8} /> {tag.label}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[11px] text-muted-foreground">{resolveUserName(f.uploadedBy)}</span>
                            <span className="text-[11px] text-muted-foreground tabular-nums">{f.date}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

          {filteredFiles.length === 0 && filteredFolders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                <FileText size={24} className="text-muted-foreground" strokeWidth={1.2} />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {currentFolderId ? "This folder is empty" : "No documents found"}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentFolderId ? "Upload documents or create sub-folders" : "Try adjusting your search"}
              </p>
            </div>
          )}
        </div>
      )}

      <FilePreviewModal
        file={previewFile}
        open={!!previewFile}
        onOpenChange={(open) => {
          if (!open) setPreviewFile(null);
        }}
      />

      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
            <DialogDescription>
              {currentFolderId
                ? `Create a new folder inside "${breadcrumb[breadcrumb.length - 1]?.name}"`
                : "Create a new folder in the root directory"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium text-foreground block mb-1.5">Folder Name</label>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-150"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateFolder(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-card rounded-xl border border-border shadow-lg w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-foreground">Upload Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("file-input")?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 hover:bg-muted/20 transition-all duration-150 cursor-pointer"
              >
                <input id="file-input" type="file" multiple className="hidden" onChange={handleFileInput} />
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Upload size={24} className="text-muted-foreground" strokeWidth={1.2} />
                </div>
                <p className="text-sm font-medium text-foreground">Drag & drop files here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                <p className="text-[11px] text-muted-foreground/50 mt-2">PDF, DOCX, XLSX, PNG, JPG up to 10MB</p>
                {uploadedFiles.length > 0 && (
                  <div className="mt-4 space-y-1">
                    {uploadedFiles.map((f, i) => (
                      <p key={i} className="text-xs text-primary font-medium">
                        {f.name}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Document Name</label>
                <input
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="Enter document name"
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-150"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Add to Folder</label>
                <select
                  value={uploadFolderId || ""}
                  onChange={(e) => setUploadFolderId(e.target.value || null)}
                  className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-150 appearance-none cursor-pointer"
                >
                  <option value="">No folder (root)</option>
                  {allFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Share with</label>
                <div className="relative mb-2">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <input
                    value={uploadShareSearch}
                    onChange={(e) => setUploadShareSearch(e.target.value)}
                    placeholder="Search team members..."
                    className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-150"
                  />
                </div>

                {uploadShareUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {uploadShareUsers.map((uid) => {
                      const m = teamMembers.find((t) => t.id === uid);
                      if (!m) return null;
                      return (
                        <span
                          key={uid}
                          className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full"
                        >
                          <img src={(m as any).avatar} alt="" className="w-4 h-4 rounded-full" />
                          {m.name.split(" ")[0]}
                          <button
                            onClick={() => setUploadShareUsers((prev) => prev.filter((id) => id !== uid))}
                            className="hover:text-destructive"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="max-h-[140px] overflow-y-auto space-y-0.5 border border-border rounded-lg p-1">
                  {teamMembers
                    .filter((m) => !uploadShareSearch || m.name.toLowerCase().includes(uploadShareSearch.toLowerCase()))
                    .map((m) => {
                      const selected = uploadShareUsers.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() =>
                            setUploadShareUsers((prev) =>
                              selected ? prev.filter((id) => id !== m.id) : [...prev, m.id],
                            )
                          }
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors duration-150 ${
                            selected
                              ? "bg-primary/10 text-foreground"
                              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}
                        >
                          <img src={(m as any).avatar} alt="" className="w-6 h-6 rounded-full" />
                          <span className="flex-1 text-left truncate text-xs">{m.name}</span>
                          {selected && <span className="text-primary text-xs font-bold">✓</span>}
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-lg"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadShareUsers([]);
                  setUploadShareSearch("");
                }}
              >
                Cancel
              </Button>
              <Button className="flex-1 rounded-lg" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Uploading...
                  </span>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={!!modifyFile}
        onOpenChange={(open) => {
          if (!open) setModifyFile(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modify Document</DialogTitle>
            <DialogDescription>Update the document name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Document Name</label>
              <input
                value={modifyName}
                onChange={(e) => setModifyName(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-150"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModifyFile(null)}>
              Cancel
            </Button>
            <Button onClick={handleModifySave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteFile}
        onOpenChange={(open) => {
          if (!open) setDeleteFile(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteFile?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFile(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFile}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteFolder}
        onOpenChange={(open) => {
          if (!open) setDeleteFolder(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteFolder?.name}"? Folders with child folders or documents cannot be
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFolder(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFolder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!shareFile}
        onOpenChange={(open) => {
          if (!open) {
            setShareFile(null);
            setSelectedUsers([]);
            setShareSearch("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share Document</DialogTitle>
            <DialogDescription>Share "{shareFile?.name}" with team members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <input
                value={shareSearch}
                onChange={(e) => setShareSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all duration-150"
              />
            </div>
            <div className="max-h-[180px] overflow-y-auto space-y-1">
              {filteredTeamMembers.map((m) => {
                const selected = selectedUsers.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() =>
                      setSelectedUsers((prev) => (selected ? prev.filter((id) => id !== m.id) : [...prev, m.id]))
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                      selected
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <img src={(m as any).avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                    <span className="flex-1 text-left">{m.name}</span>
                    {selected && <span className="text-primary text-xs font-semibold">✓</span>}
                  </button>
                );
              })}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Permission</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSharePermission("view")}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium border transition-all duration-150 ${
                    sharePermission === "view"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  View
                </button>
                <button
                  onClick={() => setSharePermission("edit")}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium border transition-all duration-150 ${
                    sharePermission === "edit"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShareFile(null);
                setSelectedUsers([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={selectedUsers.length === 0}>
              Share with {selectedUsers.length || ""} user{selectedUsers.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilesPage;
