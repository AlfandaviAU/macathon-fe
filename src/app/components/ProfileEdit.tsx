import { useState, useEffect, useRef } from "react";
import { useApp } from "../store";
import { TENANT_ONBOARDING_QUESTIONS } from "./TenantOnboarding";
import { Camera, Save, Check, RefreshCw, Loader2, User as UserIcon, Mail, Phone, FileText, ChevronLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { updateUser, uploadProfilePic } from "../services/auth";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { motion } from "framer-motion";

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
      toast.success("Profile updated successfully");
      setTimeout(() => setSaved(false), 3000);
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
      setUser({ ...user, photo: res.profile_image_url });
      toast.success("Photo updated");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
      
      {/* --- BACKGROUND ORCHESTRATION --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-500/5 dark:bg-orange-900/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-10 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h1 className="text-xl font-black tracking-tighter uppercase italic">Account Settings</h1>
          </div>
          <div className="w-10" />
        </div>

        {/* Profile Identity */}
        <section className="flex flex-col items-center mb-12">
          <div className="relative group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-32 h-32 rounded-[2.5rem] bg-card overflow-hidden border-4 border-background shadow-2xl relative"
            >
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              {form.profile_image_url ? (
                <img src={form.profile_image_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-[3rem] font-black italic">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-20"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
          <div className="text-center mt-6">
            <h2 className="text-2xl font-black tracking-tight text-foreground">{user.name}</h2>
            <p className="text-primary text-[10px] font-black uppercase tracking-[0.25em] mt-2 bg-primary/10 px-4 py-1.5 rounded-full inline-block">
              {user.type} Protocol Verified
            </p>
          </div>
        </section>

        {/* Form Fields */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 md:p-10 space-y-8">
              <div className="grid grid-cols-1 gap-8">
                {/* Full Name */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-primary" /> Full Name
                  </label>
                  <input
                    className="w-full px-6 py-4 rounded-2xl bg-muted/50 border border-transparent focus:bg-background focus:border-primary/30 text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-all font-bold"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>

                {/* Email & Phone Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-primary" /> Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-6 py-4 rounded-2xl bg-muted/50 border border-transparent focus:bg-background focus:border-primary/30 text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-all font-bold"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="name@example.com"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-primary" /> Phone Number
                    </label>
                    <input
                      type="tel"
                      className="w-full px-6 py-4 rounded-2xl bg-muted/50 border border-transparent focus:bg-background focus:border-primary/30 text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-all font-bold"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="04XX XXX XXX"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-primary" /> Profile Bio
                  </label>
                  <textarea
                    className="w-full px-6 py-4 rounded-2xl bg-muted/50 border border-transparent focus:bg-background focus:border-primary/30 text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-all font-bold min-h-[140px] resize-none"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Tell your future housemates about your lifestyle..."
                  />
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-8 rounded-2xl flex items-center justify-center gap-3 transition-all font-black text-lg shadow-2xl shadow-primary/20 border-none"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : saved ? (
                  <><Check className="w-6 h-6" /> PROFILE UPDATED</>
                ) : (
                  <><Save className="w-6 h-6" /> SAVE ALL CHANGES</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Stats Section */}
          {user.type === "tenant" && user.onboarded && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/30 border border-border/50 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
              
              <h3 className="text-lg font-black tracking-tight mb-8 uppercase italic flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" /> Dynamic Persona
              </h3>
              
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-background/50 rounded-[2rem] p-6 border border-border/50">
                  <div className="text-4xl font-black text-primary italic leading-none">{Object.keys(user.onboardingAnswers).length}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Data Points</div>
                </div>
                <div className="bg-background/50 rounded-[2rem] p-6 border border-border/50">
                  <div className="text-4xl font-black text-foreground italic leading-none">98%</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Fit Accuracy</div>
                </div>
              </div>

              <div className="pt-8 border-t border-border/50">
                <p className="text-muted-foreground text-sm font-medium mb-8 leading-relaxed">
                  Want to refresh your matching pool? Restart the personality protocol to update your vibes.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUser({ ...user, onboarded: false, onboardingAnswers: {} });
                    navigate("/onboarding");
                  }}
                  className="w-full border-primary/20 text-foreground font-black uppercase tracking-[0.2em] py-7 rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all text-[10px]"
                >
                  RE-CALIBRATE VIBE-CHECK
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}