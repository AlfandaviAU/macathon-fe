import { useState, useEffect, useRef } from "react";
import { useApp } from "../store";
import { TENANT_ONBOARDING_QUESTIONS } from "./TenantOnboarding";
import { Camera, Save, Check, RefreshCw, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";
import { updateUser, uploadProfilePic } from "../services/auth";
import { toast } from "sonner";

export function ProfileEdit() {
  const { user, refreshUser, setUser } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    profile_image_url: user?.photo || "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        profile_image_url: user.photo || "",
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    if (!user.id) return;
    setLoading(true);
    try {
      await updateUser(user.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        profile_image_url: form.profile_image_url,
      });
      await refreshUser();
      setSaved(true);
      toast.success("Profile updated");
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user.id) return;

    setUploading(true);
    try {
      const res = await uploadProfilePic(user.id, file);
      setForm(prev => ({ ...prev, profile_image_url: res.profile_image_url }));
      // Also update store immediately for UI feedback
      setUser({ ...user, photo: res.profile_image_url });
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto pb-8">
      <h2 className="mb-6">Edit Profile</h2>

      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted overflow-hidden border-4 border-card shadow relative">
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
            {form.profile_image_url ? (
              <img src={form.profile_image_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-[2rem] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:scale-105 transition-transform"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        <p className="text-muted-foreground text-[0.8rem] mt-2 capitalize">{user.type} account</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[0.8rem] text-muted-foreground block mb-1">Full name</label>
          <input
            className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[0.8rem] text-muted-foreground block mb-1">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[0.8rem] text-muted-foreground block mb-1">Phone</label>
          <input
            type="tel"
            className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[0.8rem] text-muted-foreground block mb-1">Bio</label>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border min-h-[100px] resize-none"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell others about yourself..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 transition-opacity"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save changes</>}
        </button>
      </div>

      {user.type === "tenant" && user.onboarded && (
        <div className="mt-8 bg-card rounded-xl border border-border p-4">
          <h3 className="text-[0.9rem] mb-3">Your Profile Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-[1.25rem] font-bold">{Object.keys(user.onboardingAnswers).length}</div>
              <div className="text-[0.7rem] text-muted-foreground">Profile questions</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-[1.25rem] font-bold">{TENANT_ONBOARDING_QUESTIONS.length}</div>
              <div className="text-[0.7rem] text-muted-foreground">Total questions</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-[0.85rem] mb-1 font-medium">Recalibrate your profile</h4>
            <p className="text-[0.8rem] text-muted-foreground mb-3">
              Retake the profile questionnaire to refresh your matching preferences.
            </p>
            <button
              onClick={() => {
                setUser({
                  ...user,
                  onboarded: false,
                  onboardingAnswers: {},
                });
                navigate("/onboarding");
              }}
              className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-xl flex items-center justify-center gap-2 text-[0.85rem] hover:bg-accent transition"
            >
              <RefreshCw className="w-4 h-4" /> Redo onboarding
            </button>
          </div>
        </div>
      )}
    </div>
  );
}