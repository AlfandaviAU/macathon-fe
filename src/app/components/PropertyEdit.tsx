import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router";
import { useApp } from "../store";
import {
  ArrowLeft, X, Loader2, ImagePlus, Sparkles,
  Calendar, MapPin, Save, Trash2
} from "lucide-react";
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

export function PropertyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setProperties } = useApp();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Form States
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

  // Google Maps States
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProperty();
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id]);

  const fetchProperty = async () => {
    try {
      const res = await fetch(`${API_URL}/properties/${id}`, {
        headers: { 'Authorization': `Bearer ${getSavedToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setForm({
          address: data.address,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          garages: data.garages,
          price: data.price,
          max_tenants: data.max_tenants,
          expiry_date: data.expiry_date || "",
          description: data.description || "",
        });
        setAddressInput(data.address);
        setSelectedPrefs(data.tenant_preferences || []);
        setPreviews(data.images || []);
      }
    } catch (err) {
      console.error("Failed to fetch property", err);
    } finally {
      setLoading(false);
    }
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

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
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

      const response = await fetch(`${API_URL}/properties/${id}`, {
        method: "PATCH",
        headers: {
          'Authorization': `Bearer ${getSavedToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          tenant_preferences: selectedPrefs,
          images: finalImageUrls
        })
      });

      if (response.ok) {
        navigate('/landlord');
      }
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
      <div className="max-w-lg mx-auto pb-24 px-4 pt-6">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2 bg-muted rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-black">Edit Property</h2>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-border p-6 space-y-6 shadow-sm">
          {/* Photos */}
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
          <div className="relative" ref={suggestionRef}>
            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Address</label>
            <input
                className="w-full px-4 py-3.5 rounded-2xl bg-muted/40 border-none outline-none text-sm font-medium"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Property Address"
            />
          </div>

          {/* Numbers */}
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
                      onClick={() => setSelectedPrefs(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedPrefs.includes(p) ? "bg-primary text-white border-primary" : "bg-white border-border text-muted-foreground"}`}
                  >
                    {p}
                  </button>
              ))}
            </div>
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
      </div>
  );
}