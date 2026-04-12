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

const PROPERTY_PLACEHOLDER = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1000";

export function SwipeInterface() {
  const { user } = useApp();
  const navigate = useNavigate();
  const cardRef = useRef<FrontCardHandle>(null);

  const [properties, setProperties] = useState<MatchedProperty[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swiping, setSwiping] = useState(false);

  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!user || !user.onboarded) navigate("/onboarding");
  }, [user, navigate]);

  const fetchProperties = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data: rawMatches } = await api.get<MatchedProperty[]>(`/matching/properties/${user.id}`);
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
  }, [user]);

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
    <div className="px-4 pt-6 max-w-lg mx-auto pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Discover</h2>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">Personalized Matches</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-[0.7rem]">Finding your best matches...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-destructive mb-4 font-bold">{error}</p>
          <button onClick={fetchProperties} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-[0.85rem] font-black uppercase">Retry</button>
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
                  className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
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
          <div className="flex justify-center gap-8 mt-8">
            <button
              onClick={() => triggerSwipe("left")}
              disabled={swiping}
              className="w-20 h-20 rounded-full border-2 border-border bg-card flex items-center justify-center hover:border-red-500 hover:shadow-xl hover:shadow-red-500/10 active:scale-90 transition-all shadow-lg disabled:opacity-50 group"
            >
              <X className="w-8 h-8 text-muted-foreground group-hover:text-red-500 transition-colors" />
            </button>
            <button
              onClick={() => triggerSwipe("right")}
              disabled={swiping}
              className="w-20 h-20 rounded-full border-2 border-border bg-card flex items-center justify-center hover:border-primary hover:shadow-xl hover:shadow-primary/10 active:scale-90 transition-all shadow-lg disabled:opacity-50 group"
            >
              <Heart className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors fill-transparent group-hover:fill-primary/10" />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-black mb-2">No more properties</h3>
          <p className="text-muted-foreground text-[0.85rem] mb-6 font-medium">Check back later for new listings in your area.</p>
          <button onClick={fetchProperties} className="bg-secondary text-secondary-foreground px-8 py-3 rounded-2xl text-[0.85rem] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all">Refresh</button>
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
      <ImageWithFallback 
        src={images.length > 0 ? images[0] : PROPERTY_PLACEHOLDER} 
        alt={property.address} 
        className="w-full h-full object-cover" 
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20">
        <p className="text-white font-black text-[0.85rem] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" /> {property.address.split(',')[0]}
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
  const currentPrice = (property.price - (property.price * (currentTenants / maxTenants))).toFixed(0);
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
      <div className="relative rounded-[2.5rem] overflow-hidden w-full h-full bg-muted shadow-2xl ring-1 ring-black/5">
        <ImageWithFallback 
          src={images.length > 0 ? (images[imgIdx] || images[0]) : PROPERTY_PLACEHOLDER} 
          alt={property.address} 
          className="w-full h-full object-cover select-none" 
        />

        {/* Image dots */}
        {images.length > 1 && (
          <div className="absolute top-5 left-0 right-0 flex justify-center gap-1.5 z-10">
            {images.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all shadow-sm ${i === imgIdx ? "w-8 bg-white" : "w-2 bg-white/40"}`} />
            ))}
          </div>
        )}

        {/* Tap zones for image browsing */}
        <div className="absolute inset-0 flex z-[5]">
          <div className="w-1/2 h-full" onClick={() => setImgIdx(Math.max(0, imgIdx - 1))} />
          <div className="w-1/2 h-full" onClick={() => setImgIdx(Math.min(images.length - 1, imgIdx + 1))} />
        </div>

        {/* Swipe labels */}
        <motion.div className="absolute top-12 left-8 border-4 border-red-500 rounded-2xl px-6 py-2 -rotate-12 z-20 bg-red-500/10 backdrop-blur-md" style={{ opacity: leftOpacity }}>
          <span className="text-red-500 text-[2rem] font-black tracking-tighter">NOPE</span>
        </motion.div>
        <motion.div className="absolute top-12 right-8 border-4 border-primary rounded-2xl px-6 py-2 rotate-12 z-20 bg-primary/10 backdrop-blur-md" style={{ opacity: rightOpacity }}>
          <span className="text-primary text-[2rem] font-black tracking-tighter">LIKE</span>
        </motion.div>

        {/* Match score badge */}
        <div className="absolute top-5 right-5 z-10 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-2xl">
          <Sparkles className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-white text-[0.9rem] font-black">{matchPct}% Match</span>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/100 via-black/60 to-transparent p-8 pt-32">
          {/* Tags */}
          {(property.matching_tags?.length > 0 || property.unmatching_tags?.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {property.matching_tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-xl bg-primary/20 border border-primary/30 text-white text-[0.7rem] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md">
                  <ThumbsUp className="w-3 h-3 text-primary fill-current" /> {tag}
                </span>
              ))}
              {property.unmatching_tags?.slice(0, 2).map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white text-[0.7rem] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md">
                  <ThumbsDown className="w-3 h-3 text-white/60" /> {tag}
                </span>
              ))}
            </div>
          )}

          {/* Distance */}
          {shortestTravel && (
            <div className="flex items-center gap-2 text-white/80 text-[0.8rem] mb-3 font-bold uppercase tracking-wider">
              <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                <Navigation className="w-3.5 h-3.5 text-primary" />
              </div>
              <span>{shortestTravel.dist} · {shortestTravel.time} commute</span>
            </div>
          )}

          {/* Address & pricing */}
          <div className="flex items-end justify-between border-t border-white/10 pt-6">
            <div className="min-w-0 flex-1">
              <p className="text-white/60 text-[0.8rem] font-bold flex items-center gap-1.5 mb-2 truncate">
                <MapPin className="w-4 h-4 text-primary shrink-0" /> {property.address}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-white text-[2.5rem] font-black tracking-tighter leading-none">${minPrice}</span>
                <span className="text-white/40 text-sm font-bold uppercase tracking-widest">/wk min</span>
              </div>
              {currentTenants > 0 && (
                <p className="text-primary text-[0.85rem] font-black mt-1 uppercase tracking-widest">
                  To move in now: ${currentPrice}pw
                </p>
              )}
            </div>
            <div className="text-right shrink-0 ml-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 text-white text-[0.8rem] font-black mb-3 border border-white/10">
                <Users className="w-4 h-4 text-primary" />
                {property.occupancy}
              </div>
              <div className="flex gap-3 justify-end">
                {[
                  { icon: Bed, val: property.bedrooms },
                  { icon: Bath, val: property.bathrooms },
                  { icon: Car, val: property.garages },
                ].map(({ icon: Icon, val }, i) => (
                  <div key={i} className="flex items-center gap-1 text-white/60 text-[0.85rem] font-bold">
                    <Icon className="w-4 h-4" /> {val}
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
