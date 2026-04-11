import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import { useApp } from "../store";
import { useNavigate } from "react-router";
import { motion, useMotionValue, useTransform, useAnimate, type PanInfo } from "motion/react";
import { Bed, Bath, Car, Users, X, Heart, SlidersHorizontal, MapPin, Loader2, Sparkles, ThumbsUp, ThumbsDown, Navigation } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import api from "../services/api";
import { getMe } from "../services/auth";

interface MatchedProperty {
  id: string;
  address: string;
  price: number;
  match_score: number;
  travel_score: number;
  travel_details: { to: string; time: string; dist: string }[];
  occupancy: string;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  matching_tags: string[];
  unmatching_tags: string[];
  images: string[];
}

interface FrontCardHandle {
  flyOut: (dir: "left" | "right") => void;
}

export function SwipeInterface() {
  const { user } = useApp();
  const navigate = useNavigate();
  const cardRef = useRef<FrontCardHandle>(null);

  const [properties, setProperties] = useState<MatchedProperty[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swiping, setSwiping] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ maxPrice: number | null; radius: number | null }>({ maxPrice: null, radius: null });
  const [pendingFilters, setPendingFilters] = useState({ maxPrice: 2000, radius: 20 });
  const [imgIdx, setImgIdx] = useState(0);
  const hasActiveFilters = filters.maxPrice !== null || filters.radius !== null;

  useEffect(() => {
    if (!user || !user.onboarded) navigate("/onboarding");
  }, [user, navigate]);

  const fetchProperties = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, number> = {};
      if (filters.maxPrice !== null) params.max_price = filters.maxPrice;
      if (filters.radius !== null) params.max_range_km = filters.radius;
      const { data: rawMatches } = await api.get<MatchedProperty[]>(`/matching/properties/${user.id}`, { params });
      let data = rawMatches;
      try {
        const profile = await getMe();
        const swiped = new Set([
          ...(profile.interested_property_ids ?? []),
          ...(profile.disliked_property_ids ?? []),
        ]);
        data = rawMatches.filter((p) => !swiped.has(p.id));
      } catch {
        /* backend matching already filters; keep list if profile fetch fails */
      }
      setProperties(data);
      setCurrentIdx(0);
      setImgIdx(0);
    } catch {
      setError("Failed to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    if (user?.onboarded) fetchProperties();
  }, [fetchProperties, user?.onboarded]);

  if (!user || !user.onboarded) return null;

  const remaining = properties.slice(currentIdx);
  const visibleStack = remaining.slice(0, 3);

  const advance = () => {
    setImgIdx(0);
    setCurrentIdx((i) => i + 1);
    setSwiping(false);
  };

  const triggerSwipe = async (direction: "left" | "right") => {
    if (swiping || !remaining.length) return;
    setSwiping(true);
    const propertyId = remaining[0].id;
    try {
      if (direction === "right") {
        await api.post(`/properties/${propertyId}/interest`);
      } else {
        await api.post(`/properties/${propertyId}/dislike`);
      }
    } catch (err) {
      console.error(direction === "right" ? "Failed to record interest:" : "Failed to record dislike:", err);
    }
    cardRef.current?.flyOut(direction);
  };

  const applyFilters = () => {
    setFilters({ maxPrice: pendingFilters.maxPrice, radius: pendingFilters.radius });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ maxPrice: null, radius: null });
    setPendingFilters({ maxPrice: 2000, radius: 20 });
    setShowFilters(false);
  };

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2>Discover</h2>
        <button
          onClick={() => { if (!showFilters && hasActiveFilters) setPendingFilters({ maxPrice: filters.maxPrice ?? 2000, radius: filters.radius ?? 20 }); setShowFilters(!showFilters); }}
          className={`p-2 rounded-lg border relative ${showFilters ? "bg-primary text-primary-foreground border-primary" : hasActiveFilters ? "border-primary text-primary" : "border-border"}`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          {hasActiveFilters && !showFilters && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-card rounded-xl border border-border p-4 mb-4 space-y-4">
          <div>
            <label className="text-[0.8rem] text-muted-foreground block mb-2">Max price (per week): ${pendingFilters.maxPrice}</label>
            <input type="range" min={50} max={2000} step={50} value={pendingFilters.maxPrice}
              onChange={(e) => setPendingFilters({ ...pendingFilters, maxPrice: +e.target.value })} className="w-full accent-primary" />
          </div>
          <div>
            <label className="text-[0.8rem] text-muted-foreground block mb-2">Max distance: {pendingFilters.radius}km</label>
            <input type="range" min={1} max={50} value={pendingFilters.radius}
              onChange={(e) => setPendingFilters({ ...pendingFilters, radius: +e.target.value })} className="w-full accent-primary" />
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex-1 bg-secondary text-secondary-foreground py-2.5 rounded-xl text-[0.85rem] font-medium">Clear</button>
            )}
            <button onClick={applyFilters} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-[0.85rem] font-medium">Apply filters</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-[0.85rem]">Finding your best matches...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-destructive mb-4">{error}</p>
          <button onClick={fetchProperties} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-[0.85rem]">Retry</button>
        </div>
      ) : visibleStack.length > 0 ? (
        <div>
          {/* Card stack container */}
          <div className="relative" style={{ aspectRatio: "3/4" }}>
            {/* Render back-to-front: last in array = rendered first (lowest z) */}
            {[...visibleStack].reverse().map((prop, renderIdx) => {
              const stackIdx = visibleStack.length - 1 - renderIdx;
              const isFront = stackIdx === 0;

              if (isFront) {
                return (
                  <FrontCard
                    ref={cardRef}
                    key={prop.id}
                    property={prop}
                    imgIdx={imgIdx}
                    setImgIdx={setImgIdx}
                    onDragSwipe={triggerSwipe}
                    swiping={swiping}
                    onExitDone={advance}
                  />
                );
              }

              return (
                <motion.div
                  key={prop.id}
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  style={{ zIndex: 3 - stackIdx, transformOrigin: "center bottom" }}
                  animate={{
                    scale: swiping && stackIdx === 1 ? 1 : 1 - stackIdx * 0.045,
                    y: swiping && stackIdx === 1 ? 0 : -(stackIdx * 16),
                    rotate: swiping && stackIdx === 1 ? 0 : -(stackIdx * 1.5),
                    opacity: swiping && stackIdx === 1 ? 1 : 1 - stackIdx * 0.12,
                  }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                >
                  <StackCard property={prop} />
                </motion.div>
              );
            })}
          </div>

          {/* Action buttons — stationary, outside the stack */}
          <div className="flex justify-center gap-8 mt-5">
            <button
              onClick={() => triggerSwipe("left")}
              disabled={swiping}
              className="w-16 h-16 rounded-full border-2 border-red-200 bg-card flex items-center justify-center hover:border-red-400 hover:shadow-lg active:scale-90 transition-all shadow-sm disabled:opacity-50"
            >
              <X className="w-7 h-7 text-red-400" />
            </button>
            <button
              onClick={() => triggerSwipe("right")}
              disabled={swiping}
              className="w-16 h-16 rounded-full border-2 border-green-200 bg-card flex items-center justify-center hover:border-green-400 hover:shadow-lg active:scale-90 transition-all shadow-sm disabled:opacity-50"
            >
              <Heart className="w-7 h-7 text-green-400" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2">No more properties</h3>
          <p className="text-muted-foreground text-[0.85rem] mb-4">Check back later or adjust your filters.</p>
          <button onClick={fetchProperties} className="bg-secondary text-secondary-foreground px-6 py-2.5 rounded-xl text-[0.85rem]">Refresh</button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StackCard({ property }: { property: MatchedProperty }) {
  const images = property.images?.length ? property.images : [];
  return (
    <div className="relative w-full h-full bg-muted shadow-lg">
      {images.length > 0 ? (
        <ImageWithFallback src={images[0]} alt={property.address} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No images</div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
        <p className="text-white/60 text-[0.75rem] flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {property.address}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const FrontCard = forwardRef<FrontCardHandle, {
  property: MatchedProperty;
  imgIdx: number;
  setImgIdx: (i: number) => void;
  onDragSwipe: (dir: "left" | "right") => void;
  swiping: boolean;
  onExitDone: () => void;
}>(({ property, imgIdx, setImgIdx, onDragSwipe, swiping, onExitDone }, ref) => {
  const [scope, animate] = useAnimate();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-18, 18]);
  const leftOpacity = useTransform(x, [-120, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, 120], [0, 1]);

  const [currentTenants, maxTenants] = property.occupancy.split("/").map(Number);
  const minPrice = (property.price / (maxTenants || 1)).toFixed(0);
  const currentPrice = (property.price / Math.max(currentTenants, 1)).toFixed(0);
  const matchPct = Math.round(property.match_score);
  const images = property.images?.length ? property.images : [];

  const shortestTravel = property.travel_details?.length
    ? property.travel_details.reduce((a, b) => (a.dist < b.dist ? a : b))
    : null;

  const flyOut = useCallback(async (dir: "left" | "right") => {
    const xEnd = dir === "right" ? 500 : -500;
    const rotEnd = dir === "right" ? 25 : -25;
    await animate(scope.current, { x: xEnd, rotate: rotEnd, opacity: 0 }, { duration: 0.38, ease: [0.4, 0, 0.2, 1] });
    onExitDone();
  }, [animate, scope, onExitDone]);

  useImperativeHandle(ref, () => ({ flyOut }), [flyOut]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      const dir = info.offset.x > 0 ? "right" : "left";
      onDragSwipe(dir);
    }
  };

  return (
    <motion.div
      ref={scope}
      className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
      style={{ x, rotate }}
      drag={swiping ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
    >
      <div className="relative rounded-2xl overflow-hidden w-full h-full bg-muted shadow-2xl ring-1 ring-black/5">
        {images.length > 0 ? (
          <ImageWithFallback src={images[imgIdx] || images[0]} alt={property.address} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">No images</div>
        )}

        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-10">
            {images.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === imgIdx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        )}

        {/* Tap zones for image browsing */}
        <div className="absolute inset-0 flex z-[5]">
          <div className="w-1/2 h-full" onClick={() => setImgIdx(Math.max(0, imgIdx - 1))} />
          <div className="w-1/2 h-full" onClick={() => setImgIdx(Math.min(images.length - 1, imgIdx + 1))} />
        </div>

        {/* Swipe labels */}
        <motion.div className="absolute top-10 left-6 border-4 border-red-500 rounded-xl px-5 py-2 -rotate-12 z-20 bg-red-500/10 backdrop-blur-sm" style={{ opacity: leftOpacity }}>
          <span className="text-red-500 text-[1.5rem]" style={{ fontWeight: 800 }}>NOPE</span>
        </motion.div>
        <motion.div className="absolute top-10 right-6 border-4 border-green-500 rounded-xl px-5 py-2 rotate-12 z-20 bg-green-500/10 backdrop-blur-sm" style={{ opacity: rightOpacity }}>
          <span className="text-green-500 text-[1.5rem]" style={{ fontWeight: 800 }}>LIKE</span>
        </motion.div>

        {/* Match score badge */}
        <div className="absolute top-3 right-3 z-10 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-white text-[0.8rem]" style={{ fontWeight: 700 }}>{matchPct}%</span>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-5 pt-24">
          {/* Tags */}
          {(property.matching_tags?.length > 0 || property.unmatching_tags?.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {property.matching_tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-[0.7rem] flex items-center gap-1">
                  <ThumbsUp className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
              {property.unmatching_tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-[0.7rem] flex items-center gap-1">
                  <ThumbsDown className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Distance */}
          {shortestTravel && (
            <div className="flex items-center gap-1.5 text-white/70 text-[0.75rem] mb-2">
              <Navigation className="w-3 h-3" />
              <span>{shortestTravel.dist} · {shortestTravel.time}</span>
            </div>
          )}

          {/* Address & pricing */}
          <div className="flex items-end justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-white/60 text-[0.75rem] flex items-center gap-1 mb-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" /> {property.address}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-white text-[1.75rem]" style={{ fontWeight: 800 }}>${minPrice}</span>
                <span className="text-white/50 text-[0.8rem]">/wk min</span>
              </div>
              {currentTenants > 0 && (
                <p className="text-white/70 text-[0.8rem]">
                  Now <span style={{ fontWeight: 600 }} className="text-white/90">${currentPrice}/wk</span>
                </p>
              )}
            </div>
            <div className="text-right shrink-0 ml-3">
              <div className="flex items-center gap-1 text-white/80 text-[0.8rem] mb-1">
                <Users className="w-3.5 h-3.5" />
                {property.occupancy}
              </div>
              <div className="flex gap-2">
                {[
                  { icon: Bed, val: property.bedrooms },
                  { icon: Bath, val: property.bathrooms },
                  { icon: Car, val: property.garages },
                ].map(({ icon: Icon, val }, i) => (
                  <div key={i} className="flex items-center gap-0.5 text-white/60 text-[0.75rem]">
                    <Icon className="w-3.5 h-3.5" /> {val}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

FrontCard.displayName = "FrontCard";
