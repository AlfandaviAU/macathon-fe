import { useState, useRef } from "react";
import { useApp } from "../store";
import { Camera, Save, Check, RefreshCw, Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router";
import { api } from "../../lib/api";

export function ProfileEdit() {
  const { user, setUser, refreshUser, isOnboarded } = useApp();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    work_location_name: (user as any)?.work_location_name || "",
    common_location_name: (user as any)?.common_location_name || "",
  });

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api.patch<any>(`/users/${user.id}`, {
        name: form.name,
        bio: form.bio,
        work_location_name: form.work_location_name || undefined,
        common_location_name: form.common_location_name || undefined,
      });
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.upload<{ profile_image_url: string }>(
        `/users/${user.id}/upload-profile-pic`,
        [file],
        "file"
      );
      setUser({ ...user, profile_image_url: result.profile_image_url });
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRedoOnboarding = async () => {
    navigate("/onboarding");
  };

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto pb-8">
      <h2 className="mb-6">Edit Profile</h2>

      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted overflow-hidden border-4 border-card shadow">
            {user.profile_image_url ? (
              <ImageWithFallback src={user.profile_image_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-[2rem]" style={{ fontWeight: 700 }}>
                {user.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
        <p className="text-muted-foreground text-[0.8rem] mt-2 capitalize">{user.role} account</p>
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
            className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border opacity-60"
            value={form.email}
            readOnly
          />
        </div>
        <div>
          <label className="text-[0.8rem] text-muted-foreground block mb-1">Phone</label>
          <input
            type="tel"
            className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border opacity-60"
            value={form.phone}
            readOnly
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

        {user.role === "tenant" && (
          <>
            <div>
              <label className="text-[0.8rem] text-muted-foreground block mb-1">Work / Study location</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border"
                value={form.work_location_name}
                onChange={(e) => setForm({ ...form, work_location_name: e.target.value })}
                placeholder="e.g. UNSW Kensington"
              />
            </div>
            <div>
              <label className="text-[0.8rem] text-muted-foreground block mb-1">Common hangout location</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border"
                value={form.common_location_name}
                onChange={(e) => setForm({ ...form, common_location_name: e.target.value })}
                placeholder="e.g. Sydney CBD"
              />
            </div>
          </>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <><Check className="w-4 h-4" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save changes</>
          )}
        </button>
      </div>

      {user.role === "tenant" && (
        <div className="mt-8 bg-card rounded-xl border border-border p-4">
          <h3 className="text-[0.9rem] mb-3">Your Profile</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-[1.25rem]" style={{ fontWeight: 700 }}>
                {isOnboarded() ? "Yes" : "No"}
              </div>
              <div className="text-[0.7rem] text-muted-foreground">Onboarded</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-[1.25rem]" style={{ fontWeight: 700 }}>
                {user.persona?.label || "—"}
              </div>
              <div className="text-[0.7rem] text-muted-foreground">Persona</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center col-span-2">
              <div className="text-[0.85rem]" style={{ fontWeight: 500 }}>
                {user.persona?.bio || "Complete onboarding to get your persona"}
              </div>
              <div className="text-[0.7rem] text-muted-foreground mt-1">AI Generated Bio</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-[0.85rem] mb-1">Recalibrate your profile</h4>
            <p className="text-[0.8rem] text-muted-foreground mb-3">
              Redo the personality questionnaire and chore assessment to refresh your matching algorithm profile.
            </p>
            <button
              onClick={handleRedoOnboarding}
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
