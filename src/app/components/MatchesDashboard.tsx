import { useState, useEffect, useCallback } from "react";
import { useApp } from "../store";
import { useNavigate } from "react-router";
import { 
  Heart, Star, Users, MapPin, ChevronRight, XCircle, Undo2, 
  Loader2, Trash2, Zap, Clock, RefreshCcw, Sparkles, 
  Navigation, ShieldCheck, Target, TrendingUp
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getMe } from "../services/auth";
import { getPropertyById, removeInterest, removeDislike, addDislike, superLike, refreshSuperLike, addInterest, getMatchExplanation } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

interface MatchProperty {
  id: string;
  address: string;
  price: number;
  description: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  garages: number;
  max_tenants: number;
  current_tenants: number;
  super_liked_by_me?: boolean;
  occupancy_rate?: number;
  tenant_preferences: string[];
}

export function MatchesDashboard() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"interested" | "disliked">("interested");
  const [interested, setInterested] = useState<MatchProperty[]>([]);
  const [disliked, setDisliked] = useState<MatchProperty[]>([]);

  const hasActiveSuperLike = interested.some(p => p.super_liked_by_me);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMe();
      const intIds = me.interested_property_ids || [];
      const disIds = me.disliked_property_ids || [];

      const [intData, disData] = await Promise.all([
        Promise.all(intIds.map(id => getPropertyById(id).catch(() => null))),
        Promise.all(disIds.map(id => getPropertyById(id).catch(() => null)))
      ]);

      setInterested(intData.filter(Boolean) as MatchProperty[]);
      setDisliked(disData.filter(Boolean) as MatchProperty[]);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRemoveInterest = async (id: string) => {
    try {
      await removeInterest(id);
      setInterested(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveDislike = async (id: string) => {
    try {
      await removeDislike(id);
      setDisliked(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToDislike = async (id: string) => {
    try {
      await addDislike(id);
      const item = interested.find(p => p.id === id);
      setInterested(prev => prev.filter(p => p.id !== id));
      if (item) setDisliked(prev => [...prev, item]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToInterested = async (id: string) => {
    try {
      await addInterest(id);
      const item = disliked.find(p => p.id === id);
      setDisliked(prev => prev.filter(p => p.id !== id));
      if (item) setInterested(prev => [...prev, item]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter">My Tribe</h1>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-1">AI-Ranked Properties</p>
          </div>
          <div className="w-14 h-14 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
             <Target className="w-7 h-7 text-primary animate-pulse" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 bg-muted/50 backdrop-blur-xl border border-border/50 rounded-[1.5rem] mb-10">
          <button
            onClick={() => setTab("interested")}
            className={cn(
              "flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
              tab === "interested" ? "bg-background text-foreground shadow-lg border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", tab === "interested" && "fill-current text-primary")} /> 
            Live Matches ({interested.length})
          </button>
          <button
            onClick={() => setTab("disliked")}
            className={cn(
              "flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
              tab === "disliked" ? "bg-background text-foreground shadow-lg border border-border" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" /> 
            Passed ({disliked.length})
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
               <Loader2 className="w-12 h-12 animate-spin text-primary" />
               <Sparkles className="w-6 h-6 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Syncing Match Neural Network...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {(tab === "interested" ? interested : disliked).map((p, i) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  key={p.id}
                >
                  <MatchCard 
                    property={p} 
                    type={tab}
                    onRemove={tab === "interested" ? handleRemoveInterest : handleRemoveDislike}
                    onToggle={tab === "interested" ? handleMoveToDislike : handleMoveToInterested}
                    onView={() => navigate(`/property/${p.id}`)}
                    onRefresh={fetchAll}
                    hasActiveSuperLike={hasActiveSuperLike}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {(tab === "interested" ? interested : disliked).length === 0 && (
              <div className="text-center py-24 bg-muted/10 rounded-[3rem] border border-dashed border-border/50">
                <div className="w-20 h-20 rounded-full bg-background border border-border flex items-center justify-center mx-auto mb-6 shadow-sm">
                  {tab === "interested" ? <Heart className="w-10 h-10 text-muted-foreground/20" /> : <Trash2 className="w-10 h-10 text-muted-foreground/20" />}
                </div>
                <h3 className="font-black text-xl tracking-tight">Your Tribe List is Empty</h3>
                <p className="text-muted-foreground text-[13px] font-medium mt-2 max-w-xs mx-auto">Start exploring more properties to find people who match your energy.</p>
                <Button onClick={() => navigate("/swipe")} className="mt-8 rounded-2xl font-black uppercase tracking-widest px-8 h-14 text-xs shadow-xl shadow-primary/20 border-none">
                   Find New Matches
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ 
  property, 
  type, 
  onRemove, 
  onToggle, 
  onView,
  onRefresh,
  hasActiveSuperLike
}: { 
  property: MatchProperty; 
  type: "interested" | "disliked";
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onView: () => void;
  onRefresh: () => void;
  hasActiveSuperLike: boolean;
}) {
  const { user } = useApp();
  const [isSuperLiking, setIsSuperLiking] = useState(false);
  
  const minPrice = (property.price / property.max_tenants).toFixed(0);

  const handleSuperLike = async (e: React.MouseEvent) => {
    if (hasActiveSuperLike) return;
    e.stopPropagation();
    setIsSuperLiking(true);
    try {
      await superLike(property.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuperLiking(false);
    }
  };

  const handleRefreshSuper = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await refreshSuperLike(property.id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="group bg-card border border-border/60 rounded-[2.5rem] overflow-hidden hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] hover:border-primary/20 transition-all duration-500">
      <div className="flex flex-col md:flex-row">
        {/* Image & Score Stage */}
        <div className="relative w-full md:w-64 h-56 md:h-auto overflow-hidden bg-muted cursor-pointer" onClick={onView}>
          <ImageWithFallback 
            src={property.images?.[0] || "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1000"} 
            alt={property.address} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
          />
          
          {/* AI Match Overlay */}
          <div className="absolute top-4 left-4 z-10">
             <div className="flex flex-col gap-2">
                {property.super_liked_by_me && (
                  <div className="bg-primary text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-1.5 backdrop-blur-md">
                    <Zap className="w-3 h-3 fill-current" /> Super Interest
                  </div>
                )}
             </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
             <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/20">
                <span className="text-[14px] font-black text-foreground">${minPrice}<span className="text-[10px] text-muted-foreground/60">/wk</span></span>
             </div>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 p-8 flex flex-col justify-between relative">
          <div className="cursor-pointer" onClick={onView}>
            <div className="flex justify-between items-start mb-3">
               <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                    <Users className="w-3 h-3" /> {property.current_tenants}/{property.max_tenants} TRIBE
                  </div>
               </div>
               {property.occupancy_rate && property.occupancy_rate > 70 && (
                 <div className="flex items-center gap-1 text-[9px] font-black text-rose-600 bg-rose-500/5 px-2 py-1 rounded-md animate-pulse">
                    <TrendingUp className="w-3 h-3" /> FILLING FAST
                 </div>
               )}
            </div>

            <h3 className="text-2xl font-black tracking-tight mb-2 line-clamp-1 group-hover:text-primary transition-colors">{property.address.split(',')[0]}</h3>
            <p className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5 mb-6 truncate opacity-60">
               <MapPin className="w-3.5 h-3.5" /> {property.address}
            </p>

            {/* Feature Tags */}
            <div className="flex flex-wrap gap-1.5 mb-8">
               {property.tenant_preferences.slice(0, 3).map(tag => (
                 <span key={tag} className="px-2.5 py-1 bg-muted/50 border border-border/50 text-muted-foreground text-[8px] font-black uppercase tracking-widest rounded-lg">
                    {tag}
                 </span>
               ))}
               {property.bedrooms > 0 && (
                 <span className="px-2.5 py-1 bg-muted/50 border border-border/50 text-muted-foreground text-[8px] font-black uppercase tracking-widest rounded-lg">
                    {property.bedrooms} Bed
                 </span>
               )}
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-3">
            <Button onClick={onView} className="flex-1 h-14 rounded-2xl font-black text-[11px] tracking-widest uppercase shadow-lg shadow-primary/10">View Analysis</Button>
            
            {type === "interested" ? (
              <div className="flex gap-2">
                {!property.super_liked_by_me ? (
                  <button 
                    onClick={handleSuperLike}
                    disabled={isSuperLiking || hasActiveSuperLike}
                    title={hasActiveSuperLike ? "One super-like allowed per 24h" : "Boost this match"}
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg border",
                      (isSuperLiking || hasActiveSuperLike) 
                        ? "bg-muted text-muted-foreground border-transparent cursor-not-allowed grayscale" 
                        : "bg-primary/5 text-primary border-primary/20 hover:bg-primary hover:text-white"
                    )}
                  >
                    {isSuperLiking ? <Loader2 className="w-6 h-6 animate-spin" /> : <Star className={cn("w-6 h-6", !hasActiveSuperLike && "animate-pulse")} />}
                  </button>
                ) : (
                  <button 
                    onClick={handleRefreshSuper}
                    title="Renew Super Match"
                    className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg border border-emerald-500/20"
                  >
                    <RefreshCcw className="w-6 h-6" />
                  </button>
                )}
                <button 
                  onClick={() => onToggle(property.id)}
                  title="Move to Passed"
                  className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-white transition-all border border-transparent shadow-sm"
                >
                  <Undo2 className="w-6 h-6" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => onToggle(property.id)}
                  title="Re-match with this Property"
                  className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-primary/20 shadow-lg"
                >
                  <Heart className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => onRemove(property.id)}
                  title="Remove Forever"
                  className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive hover:text-white transition-all border border-transparent shadow-sm"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}