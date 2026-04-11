import { useState, useEffect } from "react";
import { useApp } from "../store";
import { useNavigate } from "react-router";
import { motion, useMotionValue, useTransform } from "motion/react";
import { Bed, Bath, Car, Users, X, Heart, SlidersHorizontal, MapPin, Loader2, DollarSign, Navigation, RotateCcw } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api } from "../../lib/api";

interface MatchedProperty {
  id: string;
  landlord_id?: string;
  address: string;
  price: number;
  description?: string;
  images: string[];
  status?: string;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  max_tenants: number;
  current_tenants: number;
  expiry_date?: string | null;
  tenant_preferences: string[];
  interested_user_ids?: string[];
  approved_user_ids?: string[];
  occupancy_rate?: number;
  super_liked_user_ids?: string[];
  super_liked_by_me?: boolean;
  match_score?: number;
  travel_score?: number;
  travel_details?: any;
  matching_tags?: string[];
  unmatching_tags?: string[];
}

interface AppliedFilters {
  maxPrice: number | null;
  radius: number | null;
}

export function SwipeInterface() {
  const { user, isOnboarded } = useApp();
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [draftMaxPrice, setDraftMaxPrice] = useState(1000);
  const [draftRadius, setDraftRadius] = useState(20);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({ maxPrice: null, radius: null });
  const [imgIdx, setImgIdx] = useState(0);
  const [matchedProperties, setMatchedProperties] = useState<MatchedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("dwllr_skipped");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    if (!user || !isOnboarded()) {
      navigate("/onboarding");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (appliedFilters.maxPrice !== null) params.set("max_price", String(appliedFilters.maxPrice));
    if (appliedFilters.radius !== null) params.set("max_range_km", String(appliedFilters.radius));

    const qs = params.toString();
    const url = `/matching/properties/${user.id}${qs ? `?${qs}` : ""}`;

    api.get<MatchedProperty[]>(url)
      .then(setMatchedProperties)
      .catch((err) => console.error("Match fetch error:", err))
      .finally(() => setLoading(false));
  }, [user, appliedFilters]);

  if (!user || !isOnboarded()) return null;

  const available = matchedProperties.filter((p) => !skippedIds.has(p.id));
  const current = available[currentIdx];
  const hasActiveFilters = appliedFilters.maxPrice !== null || appliedFilters.radius !== null;

  const handleApplyFilters = () => {
    setAppliedFilters({ maxPrice: draftMaxPrice, radius: draftRadius });
    setShowFilters(false);
    setCurrentIdx(0);
  };

  const handleClearFilters = () => {
    setAppliedFilters({ maxPrice: null, radius: null });
    setDraftMaxPrice(1000);
    setDraftRadius(20);
    setShowFilters(false);
    setCurrentIdx(0);
  };

  const handleSwipe = async (direction: "left" | "right") => {
    if (!current) return;

    if (direction === "right") {
      try {
        await api.post(`/properties/${current.id}/interest`);
      } catch (err) {
        console.error("Interest error:", err);
      }
    }

    const newSkipped = new Set(skippedIds);
    newSkipped.add(current.id);
    setSkippedIds(newSkipped);
    localStorage.setItem("dwllr_skipped", JSON.stringify([...newSkipped]));
    setImgIdx(0);
  };

  if (loading) {
    return (
      <div className="px-4 pt-4 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground text-sm">Finding matches...</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2>Discover</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg border relative ${showFilters ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-card rounded-2xl border border-border p-5 mb-4 space-y-5 shadow-lg animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-[0.95rem]" style={{ fontWeight: 600 }}>Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-[0.75rem] text-muted-foreground hover:text-destructive flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[0.8rem] text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Max price per person/week
              </label>
              <span className="text-[0.85rem] bg-muted px-2 py-0.5 rounded-md" style={{ fontWeight: 600 }}>${draftMaxPrice}</span>
            </div>
            <input
              type="range"
              min={100}
              max={2000}
              step={50}
              value={draftMaxPrice}
              onChange={(e) => setDraftMaxPrice(+e.target.value)}
              className="w-full accent-primary h-2"
            />
            <div className="flex justify-between text-[0.65rem] text-muted-foreground">
              <span>$100</span>
              <span>$2000</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[0.8rem] text-muted-foreground flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" /> Location radius
              </label>
              <span className="text-[0.85rem] bg-muted px-2 py-0.5 rounded-md" style={{ fontWeight: 600 }}>{draftRadius} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              value={draftRadius}
              onChange={(e) => setDraftRadius(+e.target.value)}
              className="w-full accent-primary h-2"
            />
            <div className="flex justify-between text-[0.65rem] text-muted-foreground">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>

          <button
            onClick={handleApplyFilters}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-[0.85rem] hover:opacity-90 transition"
            style={{ fontWeight: 600 }}
          >
            Apply Filters
          </button>
        </div>
      )}

      {current ? (
        <SwipeCard
          key={current.id}
          property={current}
          imgIdx={imgIdx}
          setImgIdx={setImgIdx}
          onSwipe={handleSwipe}
        />
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2">No more properties</h3>
          <p className="text-muted-foreground text-[0.85rem]">Check back later or adjust your filters.</p>
        </div>
      )}
    </div>
  );
}

function SwipeCard({
  property,
  imgIdx,
  setImgIdx,
  onSwipe,
}: {
  property: MatchedProperty;
  imgIdx: number;
  setImgIdx: (i: number) => void;
  onSwipe: (dir: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const leftOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, 100], [0, 1]);

  const maxTenants = property.max_tenants || 1;
  const currentTenants = property.current_tenants || 0;
  const minPrice = Math.round(property.price / maxTenants);
  const currentPrice = currentTenants > 0 ? Math.round(property.price / currentTenants) : null;
  const hasImages = property.images && property.images.length > 0;

  return (
    <motion.div
      className="relative"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) onSwipe("right");
        else if (info.offset.x < -100) onSwipe("left");
      }}
    >
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted">
        {hasImages ? (
          <ImageWithFallback
            src={property.images[imgIdx]}
            alt={property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-muted to-primary/10 flex flex-col items-center justify-center gap-3 px-8">
            <MapPin className="w-12 h-12 text-primary/40" />
            <p className="text-center text-muted-foreground text-[0.85rem]">{property.address}</p>
          </div>
        )}

        {hasImages && property.images.length > 1 && (
          <>
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-10">
              {property.images.map((_: any, i: number) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${i === imgIdx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex z-5">
              <div className="w-1/2 h-full" onClick={() => setImgIdx(Math.max(0, imgIdx - 1))} />
              <div className="w-1/2 h-full" onClick={() => setImgIdx(Math.min(property.images.length - 1, imgIdx + 1))} />
            </div>
          </>
        )}

        <motion.div
          className="absolute top-8 left-6 border-4 border-red-500 rounded-lg px-4 py-2 -rotate-12"
          style={{ opacity: leftOpacity }}
        >
          <span className="text-red-500 text-[1.5rem]" style={{ fontWeight: 800 }}>NOPE</span>
        </motion.div>
        <motion.div
          className="absolute top-8 right-6 border-4 border-green-500 rounded-lg px-4 py-2 rotate-12"
          style={{ opacity: rightOpacity }}
        >
          <span className="text-green-500 text-[1.5rem]" style={{ fontWeight: 800 }}>LIKE</span>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white/70 text-[0.75rem] flex items-center gap-1 mb-1">
                <MapPin className="w-3 h-3" /> {property.address}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-white text-[2rem]" style={{ fontWeight: 800 }}>${minPrice}</span>
                <span className="text-white/60 text-[0.8rem]">/wk min</span>
              </div>
              {currentPrice !== null && currentPrice !== minPrice && (
                <p className="text-white/80 text-[0.85rem]">
                  Current: <span style={{ fontWeight: 600 }}>${currentPrice}/wk</span>
                </p>
              )}
              <p className="text-white/50 text-[0.7rem] mt-0.5">
                Total: ${property.price}/wk
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-white/80 text-[0.8rem] mb-1">
                <Users className="w-3.5 h-3.5" />
                {currentTenants}/{maxTenants}
              </div>
              <div className="flex gap-2">
                {[
                  { icon: Bed, val: property.bedrooms },
                  { icon: Bath, val: property.bathrooms },
                  ...(property.garages > 0 ? [{ icon: Car, val: property.garages }] : []),
                ].map(({ icon: Icon, val }, i) => (
                  <div key={i} className="flex items-center gap-0.5 text-white/70 text-[0.75rem]">
                    <Icon className="w-3.5 h-3.5" /> {val}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {property.description && (
            <p className="text-white/60 text-[0.75rem] mt-1.5 line-clamp-2">{property.description}</p>
          )}

          {property.match_score != null && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <div className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur text-white text-[0.7rem]">
                {Math.round(property.match_score * 100)}% match
              </div>
              {property.matching_tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-green-500/30 text-green-200 text-[0.65rem]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-4">
        <button
          onClick={() => onSwipe("left")}
          className="w-14 h-14 rounded-full border-2 border-red-300 flex items-center justify-center hover:bg-red-50 transition"
        >
          <X className="w-7 h-7 text-red-400" />
        </button>
        <button
          onClick={() => onSwipe("right")}
          className="w-14 h-14 rounded-full border-2 border-green-300 flex items-center justify-center hover:bg-green-50 transition"
        >
          <Heart className="w-7 h-7 text-green-400" />
        </button>
      </div>

      {property.tenant_preferences?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {property.tenant_preferences.map((pref: string) => (
            <span key={pref} className="px-2.5 py-1 rounded-full bg-secondary text-primary text-[0.75rem]">
              {pref}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
