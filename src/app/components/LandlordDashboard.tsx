import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useApp, Property } from "../store";
import { useNavigate } from "react-router";
import { Plus, MapPin, X, ArrowRight, Loader2, ImagePlus, Sparkles, Calendar } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import axios from "axios";
import api from "../services/api";
import { getSavedToken } from "../services/auth";

const API_URL = import.meta.env.VITE_API_URL;
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const PREFERENCE_OPTIONS = [
  "Tidy", "Non-smoker", "Quiet after 10pm", "Pet-friendly",
  "Friendly", "Active lifestyle", "Social", "Early riser",
  "Night owl", "Work from home", "Student", "Professional"
];

const BLANK_FORM = {
  address: "",
  bedrooms: 1,
  bathrooms: 1,
  garages: 0,
  price: 500,
  max_tenants: 2,
  expiry_date: "2026-08-01",
  description: "",
};

export function LandlordDashboard() {
  const { properties, setProperties } = useApp();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Google Maps & AI States
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Image States
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProperties();
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (addressInput.length < 3 || !showSuggestions) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await axios.get(`/google-api/maps/api/place/autocomplete/json`, {
          params: { input: addressInput, types: "address", key: GOOGLE_KEY },
        });
        if (response.data.predictions) setSuggestions(response.data.predictions);
      } catch (error) { console.error(error); } finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [addressInput, showSuggestions]);

  const mapApiToProperty = (apiData: any): Property => ({
    id: apiData.id,
    landlordId: apiData.landlord_id,
    address: apiData.address,
    images: apiData.images?.length > 0 ? apiData.images : ["https://images.unsplash.com/photo-1559329146-807aff9ff1fb?q=80&w=1080"],
    bedrooms: apiData.bedrooms,
    bathrooms: apiData.bathrooms,
    garages: apiData.garages,
    weeklyPrice: apiData.price,
    currentTenants: apiData.current_tenants || 0,
    maxTenants: apiData.max_tenants,
    expiryDate: apiData.expiry_date || "N/A",
    tenantPreferences: apiData.tenant_preferences || [],
    matchedTenants: apiData.approved_user_ids || [],
    interestedTenants: apiData.interested_user_ids || [],
    active: apiData.status === "available",
  });

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/properties/`, {
        headers: { 'Authorization': `Bearer ${getSavedToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data.map(mapApiToProperty));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      // Store the files for the later S3 upload
      setSelectedFiles(prev => [...prev, ...filesArray]);

      // Store the URLs just for the UI previews
      const urls = filesArray.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...urls]);
    }
  };

  const handleAIOptimize = async () => {
    if (!form.description && !form.address) return;
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

  const handleCreate = async () => {
    try {
      let finalImageUrls = [...previews];
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
          // Assuming your backend returns { urls: ["https://s3...", ...] }
          finalImageUrls = uploadData.urls;
        }
      }

      const response = await fetch(`${API_URL}/properties/`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${getSavedToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tenant_preferences: selectedPrefs,
          status: "available",
          images: finalImageUrls.length > 0 ? finalImageUrls : ["https://images.unsplash.com/photo-1559329146-807aff9ff1fb?q=80&w=1080"]
        })
      });
      if (response.ok) {
        setShowForm(false);
        setForm({ ...BLANK_FORM });
        setPreviews([]);
        setSelectedPrefs([]);
        setAddressInput("");
        fetchProperties();
      }
    } catch (error) { console.error(error); }
  };

  return (
      <div className="px-4 pt-6 max-w-lg mx-auto pb-24 bg-background min-h-screen">
        <div className="flex flex-col gap-1 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60 text-center">Managed Assets</p>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-2xl font-black tracking-tight text-foreground">My Listings</h2>
            <button onClick={() => setShowForm(!showForm)} className={`transition-all flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm shadow-lg ${showForm ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground shadow-primary/20"}`}>
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? "Cancel" : "New Listing"}
            </button>
          </div>
        </div>

        {showForm && (
            <div className="bg-white rounded-[2.5rem] border border-border p-6 mb-8 space-y-5 shadow-xl animate-in zoom-in-95 duration-300">
              <h3 className="text-xl font-bold text-foreground">Create new listing</h3>

              <div className="space-y-4">
                {/* Images */}
                <div className="grid grid-cols-4 gap-2">
                  {previews.map((src, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted relative">
                        <img src={src} className="w-full h-full object-cover" />
                        <button onClick={() => setPreviews(p => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"><X size={12}/></button>
                      </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors">
                    <ImagePlus size={20} />
                    <span className="text-[8px] font-bold mt-1 uppercase">Add Photo</span>
                  </button>
                  <input type="file" ref={fileInputRef} hidden multiple onChange={handleImageChange} accept="image/*" />
                </div>

                {/* Address */}
                <div className="relative" ref={suggestionRef}>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Property address</label>
                  <div className="relative">
                    <input className="w-full px-4 py-3.5 rounded-2xl bg-muted/40 border-none outline-none text-sm font-medium" value={addressInput} onChange={(e) => { setAddressInput(e.target.value); setShowSuggestions(true); }} placeholder="123 Main St, Sydney NSW" />
                    {isSearching && <Loader2 className="absolute right-4 top-3.5 w-4 h-4 animate-spin text-primary/50" />}
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-2xl shadow-2xl overflow-hidden">
                        {suggestions.map((s) => (
                            <button key={s.place_id} onClick={() => { setAddressInput(s.description); setForm({...form, address: s.description}); setShowSuggestions(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center gap-2 border-b last:border-0">
                              <MapPin size={14} className="text-primary/60" /> <span className="truncate">{s.description}</span>
                            </button>
                        ))}
                      </div>
                  )}
                </div>

                {/* Specs */}
                <div className="grid grid-cols-3 gap-3">
                  {[{l: 'Beds', k: 'bedrooms'}, {l: 'Baths', k: 'bathrooms'}, {l: 'Garages', k: 'garages'}].map(i => (
                      <div key={i.k}>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">{i.l}</label>
                        <input type="number" className="w-full px-4 py-3 rounded-xl bg-muted/40 border-none text-center font-bold" value={(form as any)[i.k]} onChange={e => setForm({...form, [i.k]: +e.target.value})} />
                      </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Weekly price ($)</label>
                    <input type="number" className="w-full px-4 py-3 rounded-xl bg-muted/40 border-none font-bold" value={form.price} onChange={e => setForm({...form, price: +e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Max tenants</label>
                    <input type="number" className="w-full px-4 py-3 rounded-xl bg-muted/40 border-none text-center font-bold" value={form.max_tenants} onChange={e => setForm({...form, max_tenants: +e.target.value})} />
                  </div>
                </div>

                {/* Expiry */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Listing expiry date</label>
                  <div className="relative">
                    <input type="date" className="w-full px-4 py-3 rounded-xl bg-muted/40 border-none font-medium outline-none" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} />
                    <Calendar className="absolute right-4 top-3 text-muted-foreground pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Description & AI */}
                <div className="relative space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Description</label>
                  <textarea className="w-full px-4 py-3 rounded-2xl bg-muted/40 border-none text-sm min-h-[100px] outline-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe the property..." />
                  <button
                      onClick={handleAIOptimize}
                      disabled={isOptimizing}
                      className="absolute bottom-3 mb-1 right-3 flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-full text-[10px] font-black hover:bg-primary/90 transition-all"
                  >
                    {isOptimizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    AI Listing Optimizer
                  </button>
                </div>

                {/* Prefs */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 block">Tenant preferences</label>
                  <div className="flex flex-wrap gap-2">
                    {PREFERENCE_OPTIONS.map(p => (
                        <button key={p} onClick={() => setSelectedPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedPrefs.includes(p) ? "bg-primary/10 border-primary text-primary" : "bg-white border-border text-muted-foreground"}`}>
                          {p}
                        </button>
                    ))}
                  </div>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={!form.address}
                    className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-red-100 transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 hover:bg-primary/90 hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-200"
                >
                  Create listing
                </button>
              </div>
            </div>
        )}

        {/* Property List */}
        <div className="space-y-4">
          {loading ? (
              <div className="flex flex-col items-center py-20 opacity-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : properties.map((p) => (
              <div key={p.id} className="group bg-card rounded-[2.5rem] border border-border p-3 hover:border-primary/40 transition-all">
                <div className="flex gap-4">
                  <div className="w-28 h-28 shrink-0 relative overflow-hidden rounded-[1.8rem]">
                    <ImageWithFallback src={p.images[0]} alt={p.address} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 py-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-[0.85rem] font-bold leading-tight line-clamp-2"><MapPin size={12} className="inline mr-1 text-primary" />{p.address}</p>
                        <span className={`px-2 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-tighter ${p.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{p.active ? "Live" : "Draft"}</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-xl font-black text-foreground">${p.weeklyPrice}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">/ week</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => navigate(`/property/${p.id}`)} className="w-full mt-3 bg-secondary/50 hover:bg-primary hover:text-primary-foreground py-3 rounded-[1.5rem] text-[0.8rem] font-black transition-all flex items-center justify-center gap-2">
                  Manage Listing <ArrowRight size={14} />
                </button>
              </div>
          ))}
        </div>
      </div>
  );
}