import { useState, useRef, useEffect } from "react";
import { useApp } from "../store";
import { useNavigate } from "react-router";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { Bed, Bath, Car, Users, X, Heart, SlidersHorizontal, MapPin } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function SwipeInterface() {
  const { properties, swipes, addSwipe, user } = useApp();
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ minPrice: 0, maxPrice: 2000, radius: 20 });
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!user || !user.onboarded) {
      navigate("/onboarding");
    }
  }, [user, navigate]);

  if (!user || !user.onboarded) {
    return null;
  }

  const swipedIds = swipes.map((s) => s.propertyId);
  const available = properties.filter((p) => p.active && !swipedIds.includes(p.id));
  const filtered = available.filter((p) => {
    const minPerPerson = p.weeklyPrice / p.maxTenants;
    return minPerPerson >= filters.minPrice && minPerPerson <= filters.maxPrice;
  });

  const current = filtered[currentIdx];

  const handleSwipe = (direction: "left" | "right") => {
    if (!current) return;
    addSwipe({ propertyId: current.id, direction, timestamp: Date.now() });
    setCurrentIdx((i) => i);
    setImgIdx(0);
  };

  return (
    <div className="px-4 pt-4 max-w-lg mx-auto">
      {/* Filters toggle */}
      <div className="flex items-center justify-between mb-4">
        <h2>Discover</h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg border ${showFilters ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {showFilters && (
        <div className="bg-card rounded-xl border border-border p-4 mb-4 space-y-4">
          <div>
            <label className="text-[0.8rem] text-muted-foreground block mb-2">
              Price range (per person/week): ${filters.minPrice} - ${filters.maxPrice}
            </label>
            <input
              type="range"
              min={0}
              max={2000}
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: +e.target.value })}
              className="w-full accent-primary"
            />
          </div>
          <div>
            <label className="text-[0.8rem] text-muted-foreground block mb-2">
              Location radius: {filters.radius}km
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={filters.radius}
              onChange={(e) => setFilters({ ...filters, radius: +e.target.value })}
              className="w-full accent-primary"
            />
          </div>
        </div>
      )}

      {/* Card */}
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
  property: any;
  imgIdx: number;
  setImgIdx: (i: number) => void;
  onSwipe: (dir: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const leftOpacity = useTransform(x, [-100, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, 100], [0, 1]);

  const minPrice = (property.weeklyPrice / property.maxTenants).toFixed(0);
  const currentPrice = (property.weeklyPrice / Math.max(property.matchedTenants.length, 1)).toFixed(0);

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
      {/* Image */}
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted">
        <ImageWithFallback
          src={property.images[imgIdx]}
          alt={property.address}
          className="w-full h-full object-cover"
        />

        {/* Image dots */}
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 z-10">
          {property.images.map((_: any, i: number) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${i === imgIdx ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
            />
          ))}
        </div>

        {/* Tap zones for images */}
        <div className="absolute inset-0 flex z-5">
          <div className="w-1/2 h-full" onClick={() => setImgIdx(Math.max(0, imgIdx - 1))} />
          <div className="w-1/2 h-full" onClick={() => setImgIdx(Math.min(property.images.length - 1, imgIdx + 1))} />
        </div>

        {/* Swipe indicators */}
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

        {/* Info overlay */}
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
              {property.matchedTenants.length > 0 && (
                <p className="text-white/80 text-[0.85rem]">
                  Current: <span style={{ fontWeight: 600 }}>${currentPrice}/wk</span>
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-white/80 text-[0.8rem] mb-1">
                <Users className="w-3.5 h-3.5" />
                {property.matchedTenants.length}/{property.maxTenants}
              </div>
              <div className="flex gap-2">
                {[
                  { icon: Bed, val: property.bedrooms },
                  { icon: Bath, val: property.bathrooms },
                  { icon: Car, val: property.garages },
                ].map(({ icon: Icon, val }, i) => (
                  <div key={i} className="flex items-center gap-0.5 text-white/70 text-[0.75rem]">
                    <Icon className="w-3.5 h-3.5" /> {val}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
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

      {/* Tenant preferences */}
      {property.tenantPreferences.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {property.tenantPreferences.map((pref: string) => (
            <span key={pref} className="px-2.5 py-1 rounded-full bg-secondary text-primary text-[0.75rem]">
              {pref}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}