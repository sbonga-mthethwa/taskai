import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { User, Users, CreditCard, Bell, Shield, Camera, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateUser as saveUserProfile } from "@/services/api";
import { requestAvatarUploadUrl, resolveAvatarUrl, saveUserAvatar, uploadAvatarToS3 } from "@/services/userProfileApi";
import { compressAvatarImage } from "@/lib/imageCompression";
import { toast } from "sonner";
import TeamMemberModal from "@/components/TeamMemberModal";
import AvatarCropModal from "@/components/AvatarCropModal";
import UserAvatar from "@/components/UserAvatar";
import type { TeamMember } from "@/types";

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "team", label: "Team Members", icon: Users },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const { users: teamMembers, refreshUsers } = useData();
  const [searchParams] = useSearchParams();
  const initialSection = searchParams.get("section") || "profile";
  const [active, setActive] = useState(sections.find((s) => s.id === initialSection) ? initialSection : "profile");

  const [profileName, setProfileName] = useState("");
  const [profileDepartment, setProfileDepartment] = useState("");
  const [profileContactNumber, setProfileContactNumber] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");
  const [avatarType, setAvatarType] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const profileEmail = user?.email || "";
  const currentUserId = (user as any)?.userId || (user as any)?.id || "";

  useEffect(() => {
    setProfileName(user?.name || "");
    setProfileDepartment((user as any)?.department || "");
    setProfileContactNumber((user as any)?.contactNumber || "");
    setProfileAvatar((user as any)?.avatarUrl || "");
    setAvatarType((user as any)?.avatarType || ((user as any)?.avatarUrl ? "custom" : "initials"));
  }, [
    (user as any)?.userId,
    user?.name,
    (user as any)?.department,
    (user as any)?.contactNumber,
    (user as any)?.avatarUrl,
    (user as any)?.avatarType,
    user?.email,
  ]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const openCropModal = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setPendingFile(file);
    };
    reader.readAsDataURL(file);
  };

  const validateAndOpenCrop = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Unsupported format. Please use JPG, PNG, or WEBP.");
      return;
    }

    if (!currentUserId) {
      toast.error("Your profile is still loading. Please try again.");
      return;
    }

    openCropModal(file);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    validateAndOpenCrop(file);
    e.target.value = "";
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setCropImageSrc(null);
    setPendingFile(null);
    setAvatarLoading(true);

    try {
      const compressed = await compressAvatarImage(croppedBlob);

      const upload = await requestAvatarUploadUrl(compressed.name, compressed.type || "image/jpeg");

      await uploadAvatarToS3(upload.uploadUrl, compressed, compressed.type || "image/jpeg");

      const nextAvatarUrl = resolveAvatarUrl(upload);
      if (!nextAvatarUrl) {
        throw new Error("Unable to determine the uploaded avatar URL.");
      }

      await saveUserAvatar(currentUserId, nextAvatarUrl);

      const refreshedUser = await refreshUser();
      if (!refreshedUser) {
        throw new Error("Failed to refresh your profile after uploading the photo.");
      }

      setProfileName(refreshedUser.name || "");
      setProfileDepartment((refreshedUser as any).department || "");
      setProfileContactNumber((refreshedUser as any).contactNumber || "");
      setProfileAvatar((refreshedUser as any).avatarUrl || "");
      setAvatarType((refreshedUser as any).avatarType || ((refreshedUser as any).avatarUrl ? "custom" : "initials"));

      await refreshUsers();
      toast.success("Profile photo updated successfully");
    } catch (error: any) {
      console.error("Avatar upload failed:", error);
      toast.error(error?.message || "Failed to update profile photo");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleCropCancel = () => {
    setCropImageSrc(null);
    setPendingFile(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) validateAndOpenCrop(file);
    },
    [currentUserId],
  );

  const handleSaveProfile = async () => {
    if (!currentUserId) {
      toast.error("Your profile is still loading. Please try again.");
      return;
    }

    setSavingProfile(true);

    try {
      const payload: Record<string, string> = {
        name: profileName.trim(),
        department: profileDepartment.trim(),
        contactNumber: profileContactNumber.trim(),
      };

      if (profileAvatar) {
        payload.avatarUrl = profileAvatar;
      }
      if (avatarType) {
        payload.avatarType = avatarType;
      }

      await saveUserProfile(currentUserId, payload);

      const refreshedUser = await refreshUser();
      if (!refreshedUser) {
        throw new Error("Failed to refresh your profile after saving changes.");
      }

      setProfileName(refreshedUser.name || "");
      setProfileDepartment((refreshedUser as any).department || "");
      setProfileContactNumber((refreshedUser as any).contactNumber || "");
      setProfileAvatar((refreshedUser as any).avatarUrl || "");
      setAvatarType((refreshedUser as any).avatarType || ((refreshedUser as any).avatarUrl ? "custom" : "initials"));

      await refreshUsers();
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Profile save failed:", error);
      toast.error(error?.message || "Failed to save profile changes");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-[1000px] mx-auto animate-fade-in">
      <h1 className="text-lg md:text-xl font-semibold tracking-tight text-foreground mb-4 md:mb-6">Settings</h1>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <nav className="flex md:flex-col md:w-48 flex-shrink-0 gap-0.5 overflow-x-auto scrollbar-none border-b md:border-b-0 border-border pb-2 md:pb-0">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                active === s.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 bg-card rounded-lg card-shadow p-6">
          {active === "profile" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Profile Settings</h2>

              <div className="flex items-center gap-4">
                <div
                  className={`relative group cursor-pointer rounded-full transition-all duration-200 ${
                    isDragging ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105" : ""
                  }`}
                  onClick={handleAvatarClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt={profileName || profileEmail || "Profile"}
                      className="w-16 h-16 rounded-full object-cover border-2 border-border"
                      onError={() => {
                        setProfileAvatar("");
                        setAvatarType("initials");
                      }}
                    />
                  ) : (
                    <UserAvatar
                      name={profileName || profileEmail}
                      seed={currentUserId || profileEmail}
                      className="w-16 h-16 text-lg border-2 border-border"
                    />
                  )}

                  <div className="absolute inset-0 rounded-full bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {avatarLoading ? (
                      <Loader2 size={18} className="text-white animate-spin" />
                    ) : isDragging ? (
                      <Upload size={18} className="text-white" />
                    ) : (
                      <Camera size={18} className="text-white" />
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground">{profileName}</p>
                  <p className="text-xs text-muted-foreground">Click or drag photo to change</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Full Name</label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Email</label>
                  <input
                    value={profileEmail}
                    readOnly
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Department</label>
                  <input
                    value={profileDepartment}
                    onChange={(e) => setProfileDepartment(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={profileContactNumber}
                    onChange={(e) => setProfileContactNumber(e.target.value)}
                    className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <Button
                  size="sm"
                  className="mt-2"
                  onClick={handleSaveProfile}
                  disabled={savingProfile || avatarLoading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {active === "team" && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Team Members</h2>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={(member as any).avatarUrl || (member as any).avatar}
                        name={member.name}
                        seed={member.id}
                        size="xl"
                      />
                      <div>
                        <span className="text-sm text-foreground block">{member.name}</span>
                        <span className="text-[11px] text-muted-foreground">{member.department}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">Member</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === "billing" && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-2">Billing</h2>
              <p className="text-sm text-muted-foreground">
                Current plan: <span className="font-medium text-foreground">Pro</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">Next billing date: April 17, 2026</p>
              <Button variant="outline" size="sm" className="mt-4">
                Manage Subscription
              </Button>
            </div>
          )}

          {active === "notifications" && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Notification Preferences</h2>
              {["Email notifications", "Push notifications", "Task assignments", "Project updates"].map((pref) => (
                <div key={pref} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{pref}</span>
                  <div className="w-9 h-5 bg-primary rounded-full relative cursor-pointer">
                    <div className="w-4 h-4 bg-primary-foreground rounded-full absolute right-0.5 top-0.5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {active === "security" && (
            <div>
              <h2 className="text-base font-semibold text-foreground mb-2">Security</h2>
              <p className="text-sm text-muted-foreground mb-4">Manage your account security settings.</p>
              <Button variant="outline" size="sm">
                Change Password
              </Button>
              <div className="mt-4">
                <Button variant="outline" size="sm">
                  Enable Two-Factor Authentication
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TeamMemberModal
        member={selectedMember}
        open={!!selectedMember}
        onOpenChange={(open) => {
          if (!open) setSelectedMember(null);
        }}
      />

      {cropImageSrc && (
        <AvatarCropModal
          open={!!cropImageSrc}
          imageSrc={cropImageSrc}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};

export default SettingsPage;
