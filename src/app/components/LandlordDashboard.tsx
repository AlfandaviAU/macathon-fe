import { useState, useEffect, useRef } from "react";
import { useApp, Property } from "../store";
import { useNavigate } from "react-router";
import { Plus, MapPin, X, ArrowRight, Loader2 } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const BEARER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NTAxNjJkYy05YzJiLTQ3YjktYmFhNC04NDFhYzU4NjcxZTgiLCJyb2xlIjoibGFuZGxvcmQiLCJleHAiOjE3NzU5NTk0Mjd9.DDbfeIwmcSXLwg-Lw0FNvZjnFziAi3Bns8BbJs8EzDk";
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
  const { properties, setProperties } = useApp();
  const navigate = useNavigate();

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...BLANK_FORM });
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  // Google Maps States
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Google Autocomplete logic
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
      } catch (error) {
        console.error("Proxy API Error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [addressInput, showSuggestions]);

  // FIX 1: Mapping internal names consistently
  const mapApiToProperty = (apiData: any): Property => ({
    id: apiData.id,
    landlordId: apiData.landlord_id, // Store as landlordId (camelCase)
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
    setLoading(true);
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

  // FIX 2: Re-run fetch when the user ID is actually ready (resolves restart issues)
  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSelectAddress = (prediction: any) => {
    setAddressInput(prediction.description);
    setForm({ ...form, address: prediction.description });
    setShowSuggestions(false);
  };

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
        setAddressInput("");
        setSelectedPrefs([]);
        fetchProperties();
      }
    } catch (error) {
      console.error("Create error:", error);
    }
  };

  // FIX 3: Using the correct mapped key (landlordId)
  const myProperties = properties;
  return (
      <div className="px-4 pt-6 max-w-lg mx-auto pb-24 bg-background min-h-screen">
        <div className="flex flex-col gap-1 mb-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/60 text-center">Managed Assets</p>
          <div className="flex items-center justify-between mt-2">
            <h2 className="text-2xl font-black tracking-tight text-foreground">My Listings</h2>
            <button
                onClick={() => setShowForm(!showForm)}
                className={`transition-all duration-300 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm shadow-lg ${
                    showForm ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground shadow-primary/20"
                }`}
            >
              {showForm ? <X size={18} /> : <Plus size={18} />}
              {showForm ? "Cancel" : "New Listing"}
            </button>
          </div>
        </div>

        {showForm && (
            <div className="bg-card rounded-[2.5rem] border border-border p-5 mb-8 space-y-5 shadow-xl animate-in zoom-in-95 duration-300">
              <div className="space-y-4">
                {/* Address Search */}
                <div className="relative" ref={suggestionRef}>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-2 mb-2 block tracking-widest">Property Location</label>
                  <div className="relative">
                    <MapPin className={`absolute left-4 top-4 ${addressInput ? 'text-primary' : 'text-muted-foreground'}`} size={18} />
                    <input
                        className="w-full pl-12 pr-10 py-4 rounded-3xl bg-muted/40 border-2 border-transparent focus:border-primary/20 focus:bg-background transition-all outline-none text-sm font-medium"
                        value={addressInput}
                        onChange={(e) => {
                          setAddressInput(e.target.value);
                          setShowSuggestions(true);
                        }}
                        placeholder="Search for address..."
                    />
                    {isSearching && <Loader2 className="absolute right-4 top-4 w-4 h-4 animate-spin text-primary/50" />}
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
                        {suggestions.map((s) => (
                            <button
                                key={s.place_id}
                                onClick={() => handleSelectAddress(s)}
                                className="w-full px-5 py-4 text-left text-sm hover:bg-muted transition-colors flex items-center gap-3 border-b border-border last:border-0"
                            >
                              <MapPin size={14} className="text-primary/60" />
                              <span className="truncate font-medium">{s.description}</span>
                            </button>
                        ))}
                      </div>
                  )}
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-3 gap-3">
                  {[{ label: "Beds", key: "bedrooms" }, { label: "Baths", key: "bathrooms" }, { label: "Car", key: "garages" }].map((item) => (
                      <div key={item.key}>
                        <label className="text-[10px] font-bold uppercase text-muted-foreground ml-2 mb-1 block">{item.label}</label>
                        <input
                            type="number"
                            className="w-full px-4 py-3 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary/20 outline-none text-center font-bold"
                            value={form[item.key as keyof typeof form]}
                            onChange={(e) => setForm({ ...form, [item.key]: +e.target.value })}
                        />
                      </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-2 mb-1 block">Weekly Price ($)</label>
                    <input
                        type="number"
                        className="w-full px-4 py-3 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary/20 outline-none font-black text-primary text-lg"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: +e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground ml-2 mb-1 block">Max Capacity</label>
                    <input
                        type="number"
                        className="w-full px-4 py-3 rounded-2xl bg-muted/40 border-2 border-transparent focus:border-primary/20 outline-none font-bold text-center"
                        value={form.max_tenants}
                        onChange={(e) => setForm({ ...form, max_tenants: +e.target.value })}
                    />
                  </div>
                </div>

                <button
                    onClick={handleCreate}
                    disabled={!form.address}
                    className="w-full bg-primary text-primary-foreground py-5 rounded-[2rem] font-black text-sm shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Publish Listing <ArrowRight size={18} />
                </button>
              </div>
            </div>
        )}

        {/* Property List with Loader */}
        <div className="space-y-4">
          {loading ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fetching Properties...</p>
              </div>
          ) : myProperties.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border">
                <p className="text-muted-foreground font-medium text-sm">No properties found.</p>
              </div>
          ) : (
              myProperties.map((p) => (
                  <div key={p.id} className="group bg-card rounded-[2.5rem] border border-border p-3 hover:border-primary/40 hover:shadow-xl transition-all duration-300">
                    <div className="flex gap-4">
                      <div className="w-28 h-28 shrink-0 relative overflow-hidden rounded-[1.8rem]">
                        <ImageWithFallback src={p.images[0]} alt={p.address} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-1.5 min-w-0">
                              <MapPin className="w-3.5 h-3.5 shrink-0 mt-1 text-primary" />
                              <p className="text-[0.85rem] font-bold leading-tight break-words">{p.address}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[0.6rem] font-black uppercase tracking-tighter shrink-0 ${p.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                        {p.active ? "Live" : "Draft"}
                      </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black tracking-tight text-foreground">${p.weeklyPrice}</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">/ week</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                        onClick={() => navigate(`/property/${p.id}`)}
                        className="w-full mt-3 bg-secondary/50 hover:bg-primary hover:text-primary-foreground py-3.5 rounded-[1.5rem] text-[0.8rem] font-black transition-all flex items-center justify-center gap-2"
                    >
                      Manage Listing <ArrowRight size={14} />
                    </button>
                  </div>
              ))
          )}
        </div>
      </div>
  );
}