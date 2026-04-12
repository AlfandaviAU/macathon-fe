import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router";
import { useApp } from "../store";
import {
  ArrowLeft, X, Loader2, ImagePlus, Sparkles,
  Calendar, MapPin, Save, Trash2, AlertCircle,
  Users, CheckCircle2, XCircle, Star, Zap, Phone
} from "lucide-react";
import api, { approveTenant, removeTenant } from "../services/api";
import { getSavedToken, getUserById } from "../services/auth";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const PREFERENCE_OPTIONS = [
  "Tidy", "Non-smoker", "Quiet after 10pm", "Pet-friendly",
  "Friendly", "Active lifestyle", "Social", "Early riser",
  "Night owl", "Work from home", "Student", "Professional"
];

export function PropertyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshProperties } = useApp();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    address: "",
    bedrooms: 1,
    bathrooms: 1,
    garages: 0,
    price: 0,
    max_tenants: 1,
    expiry_date: "",
    description: "",
  });

  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [addressInput, setAddressInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tribeProfiles, setTribeProfiles] = useState<any[]>([]);
  const [loadingTribe, setLoadingTribe] = useState(false);
  const [tribeIds, setTribeIds] = useState<{
    interested: string[],
    approved: string[],
    superLiked: string[]
  }>({ interested: [], approved: [], superLiked: [] });

  useEffect(() => {
    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (tribeIds.interested.length > 0 || tribeIds.approved.length > 0 || tribeIds.superLiked.length > 0) {
      fetchTribeProfiles();
    }
  }, [tribeIds]);

  const fetchProperty = async () => {
    try {
      const res = await fetch(`${API_URL}/properties/${id}`, {
        headers: { 'Authorization': `Bearer ${getSavedToken()}` }
      });
      if (res.ok) {
        const data = await res.json();

        // Default to 1 month from now if expiry_date is null
        let dateOnly = "";
        if (data.expiry_date) {
          dateOnly = new Date(data.expiry_date).toISOString().split('T')[0];
        } else {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          dateOnly = nextMonth.toISOString().split('T')[0];
        }

        setForm({
          address: data.address,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          garages: data.garages,
          price: data.price,
          max_tenants: data.max_tenants,
          expiry_date: dateOnly,
          description: data.description || "",
        });
        setAddressInput(data.address);
        setSelectedPrefs(data.tenant_preferences || []);
        setPreviews(data.images || []);
        setTribeIds({
          interested: data.interested_user_ids || [],
          approved: data.approved_user_ids || [],
          superLiked: data.super_liked_user_ids || []
        });
      }
    } catch (err) {
      console.error("Failed to fetch property", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTribeProfiles = async () => {
    const allIds = Array.from(new Set([
      ...tribeIds.interested,
      ...tribeIds.approved,
      ...tribeIds.superLiked
    ]));

    setLoadingTribe(true);
    try {
      const results = await Promise.all(allIds.map(uid => getUserById(uid).catch(() => null)));
      const valid = results.filter(Boolean).map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        photo: p.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
        bio: p.bio || "Potential tenant",
        traits: [p.personality_label, ...(p.tags || [])].filter(Boolean)
      }));
      setTribeProfiles(valid);
    } catch (err) {
      console.error("Failed to fetch tribe profiles", err);
    } finally {
      setLoadingTribe(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      await approveTenant(id!, userId);
      // Refresh local state
      setTribeIds(prev => ({
        ...prev,
        approved: [...new Set([...prev.approved, userId])]
      }));
      await refreshProperties();
    } catch (err) {
      console.error("Failed to approve tenant", err);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeTenant(id!, userId);
      // Refresh local state
      setTribeIds(prev => ({
        ...prev,
        interested: prev.interested.filter(uid => uid !== userId),
        approved: prev.approved.filter(uid => uid !== userId),
        superLiked: prev.superLiked.filter(uid => uid !== userId)
      }));
      await refreshProperties();
    } catch (err) {
      console.error("Failed to remove tenant", err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/properties/${id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${getSavedToken()}` }
      });
      if (res.ok) {
        await refreshProperties();
        navigate('/landlord');
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async () => {
    const updatePromise = (async () => {
      let finalImageUrls = [...previews.filter(p => !p.startsWith('blob:'))];

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('files', file));
        const uploadRes = await fetch(`${API_URL}/storage/upload`, {
          method: "POST",
          headers: { 'Authorization': `Bearer ${getSavedToken()}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImageUrls = [...finalImageUrls, ...uploadData.urls];
        }
      }

      const res = await fetch(`${API_URL}/properties/${id}`, {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${getSavedToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          tenant_preferences: selectedPrefs,
          images: finalImageUrls,
          interested_user_ids: tribeIds.interested,
          approved_user_ids: tribeIds.approved,
          super_liked_user_ids: tribeIds.superLiked
        })
      });

      if (!res.ok) {
        throw new Error("Failed to update property listing.");
      }

      await refreshProperties();
      navigate(`/landlord`);
      return await res.json();
    })();

    setIsSaving(true);
    toast.promise(updatePromise, {
      loading: 'Saving changes...',
      success: 'Property updated successfully!',
      error: (err) => err.message || 'An error occurred while updating the property.'
    }).finally(() => setIsSaving(false));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      const urls = filesArray.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...urls]);
    }
  };

  const handleAIOptimize = async () => {
    setIsOptimizing(true);
    try {
      const raw = `${form.bedrooms} beds, ${form.address}, $${form.price}, ${form.description}`;
      const response = await api.post(`${API_URL}/properties/ai-optimize`,
          { raw_details: raw },
          { headers: { 'Authorization': `Bearer ${getSavedToken()}` }}
      );
      setForm(prev => ({ ...prev, description: response.data.description }));
      if (response.data.tags) setSelectedPrefs(response.data.tags);
    } catch (error) { console.error(error); } finally { setIsOptimizing(false); }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
      <div className="max-w-lg mx-auto pb-24 px-4 pt-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 bg-muted rounded-full">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-black">Edit Property</h2>
          </div>

          <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <Trash2 size={22} />
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-border p-6 space-y-6 shadow-sm">
          {/* Gallery */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Property Gallery</label>
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted relative group">
                    <img src={src} className="w-full h-full object-cover" />
                    <button
                        onClick={() => setPreviews(p => p.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12}/>
                    </button>
                  </div>
              ))}
              <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <ImagePlus size={20} />
                <span className="text-[8px] font-bold mt-1 uppercase">Add Photo</span>
              </button>
              <input type="file" ref={fileInputRef} hidden multiple onChange={handleImageChange} accept="image/*" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Address</label>
            <input
                className="w-full px-4 py-3.5 rounded-2xl bg-muted/40 border-none outline-none text-sm font-medium"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Property Address"
            />
          </div>

          {/* Layout Grid */}
          <div className="grid grid-cols-3 gap-3">
            {[{l: 'Beds', k: 'bedrooms'}, {l: 'Baths', k: 'bathrooms'}, {l: 'Garages', k: 'garages'}].map(i => (
                <div key={i.k}>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">{i.l}</label>
                  <input
                      type="number"
                      className="w-full px-4 py-3 rounded-xl bg-muted/40 border-none text-center font-bold"
                      value={(form as any)[i.k]}
                      onChange={e => setForm({...form, [i.k]: +e.target.value})}
                  />
                </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Weekly Rent ($)</label>
              <input type="number" className="w-full px-4 py-3 rounded-xl bg-muted/40 border-none font-bold" value={form.price} onChange={e => setForm({...form, price: +e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Max Tenants</label>
              <input type="number" className="w-full px-4 py-3 rounded-xl bg-muted/40 border-none text-center font-bold" value={form.max_tenants} onChange={e => setForm({...form, max_tenants: +e.target.value})} />
            </div>
          </div>

          {/* Expiry Date Calendar */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block flex items-center gap-1">
              <Calendar size={10} /> Listing Expiry Date
            </label>
            <input
                type="date"
                className="w-full px-4 py-3.5 rounded-2xl bg-muted/40 border-none outline-none text-sm font-bold"
                value={form.expiry_date}
                onChange={e => setForm({...form, expiry_date: e.target.value})}
            />
          </div>

          {/* Description & AI */}
          <div className="relative space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Description</label>
            <textarea
                className="w-full px-4 py-3 rounded-2xl bg-muted/40 border-none text-sm min-h-[120px] outline-none"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
            />
            <button
                onClick={handleAIOptimize}
                disabled={isOptimizing}
                className="absolute bottom-3 right-3 flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-full text-[10px] font-black"
            >
              {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              AI Optimize
            </button>
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 block">Desired Tenant Traits</label>
            <div className="flex flex-wrap gap-2">
              {PREFERENCE_OPTIONS.map(p => (
                  <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedPrefs.includes(p) ? "bg-primary text-white border-primary" : "bg-white border-border text-muted-foreground"}`}
                  >
                    {p}
                  </button>
              ))}
            </div>
          </div>

          {/* Tribe Management */}
          <div className="space-y-4 pt-4 border-t border-border">
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 flex items-center gap-2">
              <Users size={12} /> Manage Potential Tribe
            </label>
            
            {loadingTribe ? (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            ) : tribeProfiles.length > 0 ? (
              <div className="space-y-3">
                {tribeProfiles.map((t) => {
                  const isApproved = tribeIds.approved.includes(t.id);
                  const isSuper = tribeIds.superLiked.includes(t.id);
                  
                  return (
                    <div key={t.id} className={`p-4 rounded-2xl border ${isApproved ? 'bg-emerald-50/30 border-emerald-200' : 'bg-muted/20 border-border'} transition-all`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-border shrink-0">
                          <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black truncate">{t.name}</span>
                            {isSuper && <Zap size={12} className="text-amber-500 fill-current" />}
                            {isApproved && <CheckCircle2 size={12} className="text-emerald-500" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{t.bio}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {t.traits.map((trait: string) => (
                          <span key={trait} className="px-1.5 py-0.5 bg-white border border-border text-[8px] font-bold rounded-md uppercase tracking-wider text-muted-foreground">
                            {trait}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                           <Phone size={10} /> {t.phone || 'No phone'}
                        </div>
                        <div className="flex gap-2">
                          {!isApproved ? (
                            <button
                              type="button"
                              onClick={() => handleApprove(t.id)}
                              className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-colors shadow-sm"
                            >
                              <CheckCircle2 size={12} /> Approve
                            </button>
                          ) : (
                            <div className="px-3 py-1.5 rounded-xl text-[10px] font-black text-emerald-600 bg-emerald-100 flex items-center gap-1">
                               <CheckCircle2 size={12} /> Approved
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemove(t.id)}
                            className="flex items-center gap-1 bg-red-50 text-red-500 border border-red-100 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          >
                            <XCircle size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-muted/10 rounded-2xl border border-dashed border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">No tribe activity yet</p>
              </div>
            )}
          </div>

          <button
              onClick={handleUpdate}
              disabled={isSaving}
              className="w-full bg-primary text-white py-4 rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
            Save Changes
          </button>
        </div>

        {/* Delete Modal */}
        {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-black">Delete Property?</h3>
                  <p className="text-muted-foreground text-sm mt-1">This will permanently remove the listing and all its photos.</p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full bg-red-500 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center"
                  >
                    {isDeleting ? <Loader2 className="animate-spin" size={18}/> : "Yes, Delete Listing"}
                  </button>
                  <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full bg-muted py-3.5 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}