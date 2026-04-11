import { useState, useEffect } from "react";
import { useApp, Property } from "../store";
import { useNavigate } from "react-router";
import { Plus, Bed, Bath, Users, MapPin, X, Heart, Car, Calendar, Landmark, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const API_URL = "http://127.0.0.1:8000";
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NTAxNjJkYy05YzJiLTQ3YjktYmFhNC04NDFhYzU4NjcxZTgiLCJyb2xlIjoibGFuZGxvcmQiLCJleHAiOjE3NzU5NTk0Mjd9.DDbfeIwmcSXLwg-Lw0FNvZjnFziAi3Bns8BbJs8EzDk";

const PREFERENCE_OPTIONS = [
  "Tidy", "Non-smoker", "Quiet after 10pm", "Pet-friendly",
  "Friendly", "Active lifestyle", "Professional", "Student",
];

const BLANK_FORM = {
  address: "",
  bedrooms: 1,
  bathrooms: 1,
  garages: 0,
  price: 500,
  max_tenants: 2,
  expiry_date: "2026-08-01",
};

export function LandlordDashboard() {
  const { user, properties, setProperties } = useApp();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

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
    superLiked: apiData.super_liked_user_ids?.length > 0
  });

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${API_URL}/properties/`, {
        headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data.map(mapApiToProperty));
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [setProperties]);

  const handleCreate = async () => {
    try {
      const response = await fetch(`${API_URL}/properties/`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          tenant_preferences: selectedPrefs,
          status: "available",
          images: ["https://images.unsplash.com/photo-1559329146-807aff9ff1fb?q=80&w=1080"]
        })
      });

      if (response.ok) {
        setShowForm(false);
        setForm({ ...BLANK_FORM });
        setSelectedPrefs([]);
        fetchProperties();
      }
    } catch (error) {
      console.error("Create error:", error);
    }
  };

  const togglePref = (pref: string) => {
    setSelectedPrefs(prev =>
        prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const myProperties = properties.filter((p) => p.landlord_id === user?.id);

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Loading Portfolio...</p>
        </div>
      </div>
  );

  return (
      <div className="px-4 pt-6 max-w-lg mx-auto pb-20 bg-background min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col gap-1 mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-primary/60">Manage Assets</p>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">My Listings</h2>
            <button
                onClick={() => setShowForm(!showForm)}
                className={`transition-all duration-300 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm shadow-lg ${
                    showForm
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : "bg-primary text-primary-foreground hover:shadow-primary/25 active:scale-95"
                }`}
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? "Cancel" : "New Listing"}
            </button>
          </div>
        </div>

        {/* Modern Create Form */}
        {showForm && (
            <div className="bg-card rounded-3xl border border-border p-5 mb-8 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-300">
              <div className="space-y-1">
                <h3 className="font-bold text-lg">List New Property</h3>
                <p className="text-xs text-muted-foreground">Fill in the details to start finding tenants.</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Full Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-muted-foreground" size={16} />
                    <input
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-muted/30 border border-transparent focus:border-primary/50 focus:bg-background transition-all outline-none text-sm"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Enter property address..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Beds", key: "bedrooms", icon: Bed },
                    { label: "Baths", key: "bathrooms", icon: Bath },
                    { label: "Car", key: "garages", icon: Car },
                  ].map((item) => (
                      <div key={item.key}>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">{item.label}</label>
                        <input
                            type="number"
                            className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-transparent focus:border-primary/50 focus:bg-background transition-all outline-none text-sm"
                            value={form[item.key as keyof typeof form]}
                            onChange={(e) => setForm({ ...form, [item.key]: +e.target.value })}
                        />
                      </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Weekly Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
                      <input
                          type="number"
                          className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-muted/30 border border-transparent focus:border-primary/50 focus:bg-background transition-all outline-none text-sm font-bold"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: +e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-1 block">Max Capacity</label>
                    <input
                        type="number"
                        className="w-full px-3 py-2.5 rounded-xl bg-muted/30 border border-transparent focus:border-primary/50 focus:bg-background transition-all outline-none text-sm"
                        value={form.max_tenants}
                        onChange={(e) => setForm({ ...form, max_tenants: +e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-2 block">Ideal Tenant Preferences</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PREFERENCE_OPTIONS.map(pref => (
                        <button
                            key={pref}
                            onClick={() => togglePref(pref)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all ${
                                selectedPrefs.includes(pref)
                                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                                    : "bg-muted/40 border-transparent text-muted-foreground hover:border-border"
                            }`}
                        >
                          {pref}
                        </button>
                    ))}
                  </div>
                </div>

                <button
                    onClick={handleCreate}
                    disabled={!form.address}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2 mt-2"
                >
                  Publish Listing
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
        )}

        {/* Property List Section */}
        <div className="space-y-4">
          {myProperties.map((p) => (
              <div
                  key={p.id}
                  className="group bg-card rounded-[2rem] border border-border p-3 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 active:scale-[0.98]"
              >
                <div className="flex gap-4">
                  <div className="w-28 h-28 shrink-0 relative overflow-hidden rounded-[1.5rem]">
                    <ImageWithFallback
                        src={p.images[0]}
                        alt={p.address}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {p.superLiked && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white p-1.5 rounded-full shadow-lg">
                          <Heart size={12} className="fill-current" />
                        </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-[10px] text-white font-bold text-center">Managed</p>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 min-w-0">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                          <p className="text-[0.85rem] font-bold leading-tight break-words text-card-foreground">
                            {p.address}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-tighter shrink-0 ${
                            p.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                        }`}>
                      {p.active ? "Live" : "Draft"}
                    </span>
                      </div>

                      <div className="flex items-baseline gap-0.5">
                        <span className="text-lg font-black tracking-tight">${p.weeklyPrice}</span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">/ week</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[0.75rem] font-bold text-muted-foreground/80">
                      <span className="flex items-center gap-1"><Bed size={14} className="text-primary/70"/> {p.bedrooms}</span>
                      <span className="flex items-center gap-1"><Bath size={14} className="text-primary/70"/> {p.bathrooms}</span>
                      <span className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded-md">
                    <Users size={14} /> {p.currentTenants}/{p.maxTenants}
                  </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                      onClick={() => navigate(`/property/${p.id}`)}
                      className="w-full bg-secondary/50 hover:bg-primary hover:text-primary-foreground text-secondary-foreground py-3 rounded-2xl text-[0.8rem] font-bold transition-all flex items-center justify-center gap-2"
                  >
                    Manage Listing
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
          ))}

          {myProperties.length === 0 && !showForm && (
              <div className="bg-muted/20 border-2 border-dashed border-border rounded-[2.5rem] py-16 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Landmark className="text-muted-foreground/50" size={32} />
                </div>
                <h3 className="font-bold text-lg">No active listings</h3>
                <p className="text-sm text-muted-foreground max-w-[200px] mt-1">
                  Your real estate portfolio is currently empty.
                </p>
                <button
                    onClick={() => setShowForm(true)}
                    className="mt-6 text-primary font-bold text-sm hover:underline"
                >
                  + Create your first listing
                </button>
              </div>
          )}
        </div>
      </div>
  );
}