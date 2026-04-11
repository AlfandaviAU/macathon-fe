import { useState } from "react";
import { useApp } from "../store";
import { Camera, Save, Check, RefreshCw } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useNavigate } from "react-router";

export function ProfileEdit() {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
  });

  if (!user) return null;

  const handleSave = () => {
    setUser({ ...user, ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto pb-8">
      <h2 className="mb-6">Edit Profile</h2>

      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted overflow-hidden border-4 border-card shadow">
            {user.photo ? (
              <ImageWithFallback src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-[2rem]" style={{ fontWeight: 700 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
            <Camera className="w-4 h-4" />
          </button>
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
          className="w-full bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2"
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save changes</>}
        </button>
      </div>

      {/* Stats */}
      {user.type === "tenant" && user.onboarded && (
        <div className="mt-8 bg-card rounded-xl border border-border p-4">
          <h3 className="text-[0.9rem] mb-3">Your Profile Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-[1.25rem]" style={{ fontWeight: 700 }}>{user.personalityAnswers.length}</div>
              <div className="text-[0.7rem] text-muted-foreground">Personality answers</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-[1.25rem]" style={{ fontWeight: 700 }}>{user.choreAnswers.length}</div>
              <div className="text-[0.7rem] text-muted-foreground">Chore answers</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-[1.25rem]" style={{ fontWeight: 700 }}>
                {user.livelinessVerified ? "Yes" : "No"}
              </div>
              <div className="text-[0.7rem] text-muted-foreground">Verified</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-[1.25rem]" style={{ fontWeight: 700 }}>Active</div>
              <div className="text-[0.7rem] text-muted-foreground">Account status</div>
            </div>
          </div>

          {/* Recalibrate onboarding */}
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-[0.85rem] mb-1">Recalibrate your profile</h4>
            <p className="text-[0.8rem] text-muted-foreground mb-3">
              Redo the liveliness test, personality questionnaire, and chore assessment to refresh your matching algorithm profile.
            </p>
            <button
              onClick={() => {
                setUser({
                  ...user,
                  onboarded: false,
                  livelinessVerified: false,
                  personalityAnswers: [],
                  choreAnswers: [],
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