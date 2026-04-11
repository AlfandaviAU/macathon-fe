import { useState } from "react";
import { useApp, Property } from "../store";
import { useNavigate } from "react-router";
import { Plus, Bed, Bath, Car, Users, MapPin, Calendar, RotateCcw, X } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const BLANK: Omit<Property, "id" | "landlordId"> = {
  address: "",
  images: [],
  bedrooms: 1,
  bathrooms: 1,
  garages: 0,
  weeklyPrice: 500,
  maxTenants: 2,
  expiryDate: "2026-08-01",
  tenantPreferences: [],
  matchedTenants: [],
  interestedTenants: [],
  active: true,
};

const PREFERENCE_OPTIONS = [
  "Tidy", "Non-smoker", "Quiet after 10pm", "Pet-friendly",
  "Friendly", "Active lifestyle", "Social", "Early riser",
  "Night owl", "Work from home", "Student", "Professional",
];

const STOCK_IMAGES = [
  "https://images.unsplash.com/photo-1559329146-807aff9ff1fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDF8fHx8MTc3NTgyNTAyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1639059851892-95c80412298c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwbGl2aW5nJTIwcm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTc3NTgyNTAyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
  "https://images.unsplash.com/photo-1662454419736-de132ff75638?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWRyb29tJTIwbW9kZXJuJTIwYXBhcnRtZW50fGVufDF8fHx8MTc3NTgyNTAyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
];

export function LandlordDashboard() {
  const { user, properties, setProperties } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK });
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  const myProperties = properties.filter((p) => p.landlordId === user?.id);

  const handleCreate = () => {
    const newProp: Property = {
      ...form,
      id: `p${Date.now()}`,
      landlordId: user?.id || "l1",
      images: STOCK_IMAGES.slice(0, Math.max(1, form.bedrooms)),
      tenantPreferences: selectedPrefs,
    };
    setProperties([...properties, newProp]);
    setForm({ ...BLANK });
    setSelectedPrefs([]);
    setShowForm(false);
  };

  const togglePref = (pref: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const reactivate = (id: string) => {
    setProperties(
      properties.map((p) =>
        p.id === id
          ? { ...p, active: true, expiryDate: "2026-09-01", matchedTenants: [], interestedTenants: [] }
          : p
      )
    );
  };

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto pb-8">
      <div className="flex items-center justify-between mb-4">
        <h2>My Listings</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-[0.85rem] flex items-center gap-1.5"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "New listing"}
        </button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-4 mb-4 space-y-4">
          <h3 className="text-[0.95rem]">Create new listing</h3>

          <div>
            <label className="text-[0.8rem] text-muted-foreground block mb-1">Property address</label>
            <input
              className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St, Sydney NSW"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {([
              ["bedrooms", "Beds"],
              ["bathrooms", "Baths"],
              ["garages", "Garages"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="text-[0.75rem] text-muted-foreground block mb-1">{label}</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-3 py-2 rounded-lg bg-input-background border border-border"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: +e.target.value })}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.75rem] text-muted-foreground block mb-1">Weekly price ($)</label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-lg bg-input-background border border-border"
                value={form.weeklyPrice}
                onChange={(e) => setForm({ ...form, weeklyPrice: +e.target.value })}
              />
            </div>
            <div>
              <label className="text-[0.75rem] text-muted-foreground block mb-1">Max tenants</label>
              <input
                type="number"
                min={1}
                className="w-full px-3 py-2 rounded-lg bg-input-background border border-border"
                value={form.maxTenants}
                onChange={(e) => setForm({ ...form, maxTenants: +e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-[0.75rem] text-muted-foreground block mb-1">Listing expiry date</label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-lg bg-input-background border border-border"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[0.75rem] text-muted-foreground block mb-2">Tenant preferences</label>
            <div className="flex flex-wrap gap-1.5">
              {PREFERENCE_OPTIONS.map((pref) => (
                <button
                  key={pref}
                  onClick={() => togglePref(pref)}
                  className={`px-3 py-1 rounded-full text-[0.8rem] border transition ${
                    selectedPrefs.includes(pref)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:border-primary/40"
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
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl disabled:opacity-40"
          >
            Create listing
          </button>
        </div>
      )}

      {/* Listings */}
      {myProperties.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">No listings yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myProperties.map((p) => (
            <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex">
                <div className="w-28 h-28 shrink-0">
                  <ImageWithFallback src={p.images[0]} alt={p.address} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between">
                    <p className="text-[0.8rem] truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0 text-muted-foreground" /> {p.address}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-[0.6rem] shrink-0 ml-2 ${
                      p.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                    }`}>
                      {p.active ? "Active" : "Expired"}
                    </span>
                  </div>
                  <p className="text-[1.1rem] mt-0.5" style={{ fontWeight: 700 }}>${p.weeklyPrice}<span className="text-[0.75rem] text-muted-foreground">/wk</span></p>
                  <div className="flex gap-3 mt-1 text-[0.75rem] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" />{p.bedrooms}</span>
                    <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{p.bathrooms}</span>
                    <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{p.matchedTenants.length}/{p.maxTenants}</span>
                  </div>
                </div>
              </div>
              <div className="px-3 pb-3 flex gap-2">
                <button
                  onClick={() => navigate(`/property/${p.id}`)}
                  className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg text-[0.8rem]"
                >
                  View details
                </button>
                {!p.active && (
                  <button
                    onClick={() => reactivate(p.id)}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-[0.8rem] flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
