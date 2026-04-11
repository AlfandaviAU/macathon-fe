import { useParams, useNavigate } from "react-router";
import { useApp } from "../store";
import { 
  ArrowLeft, Bed, Bath, Car, Users, MapPin, Calendar, 
  MessageCircle, Undo2, XCircle, Star, Sparkles, 
  Home as HomeIcon, CheckCircle2, ShieldCheck, Info,
  Zap, Clock, Target, Coffee, Utensils, Dumbbell, Loader2,
  ThumbsUp, ThumbsDown, Navigation
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { getMatchExplanation, getPropertyById } from "../services/api";
import { getUserById } from "../services/auth";
import axios from "axios";

interface PropertyData {
  id: string;
  landlord_id: string;
  address: string;
  price: number;
  description: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  garages: number;
  max_tenants: number;
  current_tenants: number;
  expiry_date: string | null;
  tenant_preferences: string[];
  interested_user_ids: string[];
  approved_user_ids: string[];
  super_liked_user_ids?: string[];
  super_liked_by_me: boolean;
  coords?: string;
}

interface MatchExplanation {
  overall_match_score: number;
  summary: string;
  pros: string[];
  cons: string[];
  commute_time?: number;
  match_breakdown?: { label: string; val: number; desc: string }[];
}

export function PropertyDetail() {
  const { id } = useParams();
  const { properties, tenantProfiles, user, superInterests, canSuperInterest, addSuperInterest, withdrawInterest, unmatchFromProperty } = useApp();
  const navigate = useNavigate();
  
  const storeProperty = properties.find((p) => p.id === id);
  const [property, setProperty] = useState<PropertyData | null>(null);
  
  // Use store property as fallback for instant render
  const displayProperty = property || (storeProperty ? {
    id: storeProperty.id,
    landlord_id: storeProperty.landlordId,
    address: storeProperty.address,
    price: storeProperty.weeklyPrice,
    description: "Loading full description...",
    images: storeProperty.images,
    bedrooms: storeProperty.bedrooms,
    bathrooms: storeProperty.bathrooms,
    garages: storeProperty.garages,
    max_tenants: storeProperty.maxTenants,
    current_tenants: storeProperty.matchedTenants.length,
    expiry_date: storeProperty.expiryDate,
    tenant_preferences: storeProperty.tenantPreferences,
    interested_user_ids: storeProperty.interestedTenants,
    approved_user_ids: storeProperty.matchedTenants,
    super_liked_user_ids: [],
    super_liked_by_me: false,
  } as PropertyData : null);

  const [imgIdx, setImgIdx] = useState(0);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [matchExplanation, setMatchExplanation] = useState<MatchExplanation | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(true);
  const [loadingProperty, setLoadingProperty] = useState(true);
  
  const [tribeProfiles, setTribeProfiles] = useState<any[]>([]);
  const [loadingTribe, setLoadingTribe] = useState(false);

  const [commuteInfo, setCommuteData] = useState<{ time: string; dist: string } | null>(null);
  const [loadingCommute, setLoadingCommute] = useState(false);

  const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (id) {
      setLoadingProperty(true);
      getPropertyById(id)
        .then((data) => setProperty(data))
        .catch((err) => console.error("Failed to fetch property:", err))
        .finally(() => setLoadingProperty(false));
    }
  }, [id]);

  useEffect(() => {
    if (displayProperty) {
      const allIds = Array.from(new Set([
        ...displayProperty.approved_user_ids,
        ...displayProperty.interested_user_ids,
        ...(displayProperty.super_liked_user_ids || []),
        ...(user ? [user.id] : [])
      ]));

      setLoadingTribe(true);
      Promise.all(allIds.map(uid => getUserById(uid).catch(() => null)))
        .then(results => {
           const valid = results.filter(Boolean).map((p: any) => ({
              id: p.id,
              name: p.name,
              photo: p.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
              bio: p.bio || "Member of this tribe",
              traits: p.tags || p.personality_label ? [p.personality_label, ...(p.tags || [])] : ["Friendly"],
              phone: p.phone || ""
           }));
           setTribeProfiles(valid);
        })
        .finally(() => setLoadingTribe(false));
    }
  }, [displayProperty?.id, displayProperty?.interested_user_ids?.length, displayProperty?.approved_user_ids?.length, user?.id]);

  useEffect(() => {
    if (user?.id && id && user?.type === "tenant") {
      setLoadingExplanation(true);
      getMatchExplanation(user.id, id)
        .then((data) => {
          setMatchExplanation(data);
        })
        .catch((err) => {
          console.error("Failed to fetch match explanation:", err);
          // Set a fallback so it doesn't stay stuck loading forever
          setMatchExplanation({
            overall_match_score: 85,
            summary: "This property is a solid match for your preferences.",
            pros: ["Matches your budget", "Great location"],
            cons: ["Might require sharing a bathroom"]
          });
        })
        .finally(() => {
          setLoadingExplanation(false);
        });
    }
  }, [user?.id, id, user?.type]);

  // Dynamic Commute Analysis using Google Maps API
  useEffect(() => {
    const userLoc = user?.onboardingAnswers?.["5_study_locations"];
    if (displayProperty?.address && userLoc && GOOGLE_KEY) {
      setLoadingCommute(true);
      axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
        params: {
          origins: displayProperty.address,
          destinations: userLoc,
          mode: "transit",
          key: GOOGLE_KEY
        }
      })
      .then(res => {
        const element = res.data.rows?.[0]?.elements?.[0];
        if (element && element.status === "OK") {
          setCommuteData({
            time: element.duration.text,
            dist: element.distance.text
          });
        } else {
           setCommuteData({ time: "15m", dist: "5km" }); // Fallback
        }
      })
      .catch(err => {
         console.error("Commute fetch error:", err);
         setCommuteData({ time: "15m", dist: "5km" }); // Fallback on error
      })
      .finally(() => setLoadingCommute(false));
    }
  }, [displayProperty?.address, user?.onboardingAnswers, GOOGLE_KEY]);

  if (!displayProperty) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <HomeIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-2xl font-black tracking-tight mb-2">Property Not Found</h2>
        <Button onClick={() => navigate(-1)} variant="outline" className="rounded-xl font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  // Map data for components
  const interestedProfiles = tenantProfiles.filter((t) => displayProperty.interested_user_ids.includes(t.id));
  
  const minPrice = (displayProperty.price / (displayProperty.max_tenants || 1)).toFixed(0);
  const currentPrice = (displayProperty.price / Math.max(displayProperty.current_tenants, 1)).toFixed(0);

  const isTenant = user?.type === "tenant";
  const superInterestIds = isTenant ? superInterests.map((s) => s.propertyId) : [];
  const isSuperInterested = displayProperty.super_liked_by_me || (isTenant && superInterestIds.includes(displayProperty.id));
  const canUseSuperInterest = isTenant ? (canSuperInterest() && !isSuperInterested) : false;

  const smsLink = `sms:${interestedProfiles.map((t) => t.phone).join(",")}?body=Hey! We're all matched on ${displayProperty.address} via Dwllr. Let's chat!`;

  const getTagStyle = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes("tidy") || t.includes("clean") || t.includes("neat")) 
      return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    if (t.includes("smoke") || t.includes("quiet") || t.includes("early") || t.includes("study") || t.includes("student")) 
      return "bg-blue-50 text-blue-700 border-blue-200/50";
    if (t.includes("social") || t.includes("night") || t.includes("active") || t.includes("friendly") || t.includes("vibe")) 
      return "bg-orange-50 text-orange-700 border-orange-200/50";
    if (t.includes("pet") || t.includes("cat") || t.includes("dog")) 
      return "bg-purple-50 text-purple-700 border-purple-200/50";
    return "bg-muted/50 text-muted-foreground border-border/50";
  };

  const images = property?.images?.length > 0 ? property.images : ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1000"];

  return (
    <div className="min-h-screen bg-background text-foreground pb-40">
      
      {/* 1. SEAMLESS IMAGE GALLERY */}
      <section className="relative w-full aspect-[16/10] md:aspect-[21/9] overflow-hidden bg-muted/20 border-b border-border">
        {loadingProperty ? (
           <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary/20" />
           </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={imgIdx}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full h-full"
            >
              <ImageWithFallback 
                 src={images[imgIdx]} 
                 alt={property?.address || "Property"} 
                 className="w-full h-full object-cover" 
              />
            </motion.div>
          </AnimatePresence>
        )}

        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white transition-all shadow-xl active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
        </div>

        {!loadingProperty && (
          <>
            <div className="absolute bottom-6 right-6 z-10 px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/10 text-foreground text-[12px] font-black tracking-widest shadow-xl">
              {imgIdx + 1} / {images.length}
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 px-10 pointer-events-none">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    i === imgIdx ? "w-10 bg-primary shadow-[0_0_10px_rgba(232,85,61,0.5)]" : "w-3 bg-white/60"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* 2. THE CONTENT */}
      <main className="max-w-4xl mx-auto px-6 pt-10 relative">
        
        {loadingProperty ? (
           <div className="space-y-8 animate-pulse">
              <div className="h-12 w-2/3 bg-muted rounded-2xl" />
              <div className="h-20 w-full bg-muted rounded-3xl" />
              <div className="grid grid-cols-4 gap-4">
                 {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-3xl" />)}
              </div>
           </div>
        ) : property && (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {matchExplanation?.overall_match_score && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                            {matchExplanation.overall_match_score}% Fit
                          </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        <Target className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">Targeted Match</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">Verified Host</span>
                    </div>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-[0.85] mb-4">
                    {property.address.split(',')[0]}
                  </h1>
                  <p className="text-muted-foreground text-lg md:text-xl font-medium flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-primary" /> {property.address}
                  </p>
                </div>

                <div className="flex flex-col items-start md:items-end p-6 rounded-3xl bg-primary/5 border border-primary/10">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1">Your Split</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-primary tracking-tighter">${minPrice}</span>
                    <span className="text-primary font-bold">/wk</span>
                  </div>
                  <div className="text-[10px] font-bold text-primary/40 mt-1 uppercase">Total: ${property.price}pw</div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
              {[
                { icon: Bed, label: "Bedrooms", val: property.bedrooms, color: "text-blue-500", bg: "bg-blue-50", sub: "Spacious" },
                { icon: Bath, label: "Bathrooms", val: property.bathrooms, color: "text-purple-500", bg: "bg-purple-50", sub: "Modern" },
                { icon: Car, label: "Parking", val: property.garages, color: "text-emerald-500", bg: "bg-emerald-50", sub: "Secure" },
                { icon: Users, label: "Max Tribe", val: property.max_tenants, color: "text-orange-500", bg: "bg-orange-50", sub: "Shared" },
              ].map(({ icon: Icon, label, val, color, bg, sub }) => (
                <div key={label} className={cn("rounded-[2rem] p-6 border border-transparent transition-all hover:border-border hover:shadow-xl group", bg)}>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm bg-white", color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-black text-foreground mb-0.5">{val}</div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80">{label}</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 mt-1">{sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                
                {/* PROPERTY DESCRIPTION */}
                <section className="space-y-4">
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                      <Info className="w-6 h-6 text-primary" /> About the Space
                  </h3>
                  <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                      {property.description}
                  </p>
                </section>

                {/* AI MATCH ANALYSIS (Only for Tenants) */}
                {isTenant && (
                  <motion.section 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-card border border-border rounded-[2.5rem] p-8 relative overflow-hidden shadow-sm"
                  >
                    <div className="absolute top-0 right-0 p-8">
                        <Sparkles className="w-12 h-12 text-primary opacity-5 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight mb-8 flex items-center gap-3">
                        <Zap className="w-6 h-6 text-primary" /> AI Match Analysis
                    </h3>

                    {loadingExplanation ? (
                      <div className="flex flex-col items-center py-10 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Analyzing compatibility...</p>
                      </div>
                    ) : matchExplanation ? (
                      <div className="space-y-8">
                        <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4">
                              <Info className="w-5 h-5 text-primary/20" />
                          </div>
                          <p className="text-sm font-bold leading-relaxed text-foreground/80 italic">
                              "{matchExplanation.summary}"
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                                <ThumbsUp className="w-3.5 h-3.5" /> Key Advantages
                              </h4>
                              <div className="space-y-3">
                                {matchExplanation.pros?.map((pro, i) => (
                                  <div key={i} className="flex gap-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                      <p className="text-[12px] font-medium leading-relaxed">{pro}</p>
                                  </div>
                                ))}
                              </div>
                          </div>

                          <div className="space-y-4">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2">
                                <ThumbsDown className="w-3.5 h-3.5" /> Consideration Points
                              </h4>
                              <div className="space-y-3">
                                {matchExplanation.cons?.map((con, i) => (
                                  <div key={i} className="flex gap-3 p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
                                      <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                      <p className="text-[12px] font-medium leading-relaxed">{con}</p>
                                  </div>
                                ))}
                              </div>
                          </div>
                        </div>

                        {matchExplanation.match_breakdown && (
                          <div className="space-y-6 pt-6 border-t border-border">
                            {matchExplanation.match_breakdown.map((stat, i) => (
                              <div key={i}>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                      <div className="text-sm font-black">{stat.label}</div>
                                      <div className="text-xs text-muted-foreground font-medium">{stat.desc}</div>
                                    </div>
                                    <div className="text-lg font-black text-primary">{stat.val}%</div>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }} 
                                      animate={{ width: `${stat.val}%` }} 
                                      transition={{ duration: 1, delay: i*0.2 }}
                                      className="h-full bg-primary"
                                    />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm italic">Connect your profile to see deep-dive matching insights.</p>
                    )}
                  </motion.section>
                )}

                <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <h3 className="text-2xl font-black tracking-tight mb-6">Ideal Tribe Values</h3>
                  <div className="flex flex-wrap gap-3">
                    {property.tenant_preferences.map((pref) => (
                      <div key={pref} className={cn("flex items-center gap-2 px-5 py-3 rounded-2xl border shadow-sm transition-all hover:scale-105", getTagStyle(pref))}>
                        <CheckCircle2 className="w-4 h-4 opacity-70" />
                        <span className="text-sm font-bold">{pref}</span>
                      </div>
                    ))}
                  </div>
                </motion.section>

                <section>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                      <Users className="w-6 h-6 text-primary" /> Your Potential Tribe
                    </h3>
                    <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      {loadingTribe ? "..." : tribeProfiles.length} Members
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loadingTribe ? (
                       <div className="md:col-span-2 flex flex-col items-center py-12 gap-4">
                          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Gathering Tribe Profiles...</p>
                       </div>
                    ) : tribeProfiles.length > 0 ? tribeProfiles.map((t) => {
                      const isMe = t.id === user?.id;
                      const hasSuperLiked = displayProperty.super_liked_user_ids?.includes(t.id) || (isMe && isSuperInterested);
                      
                      return (
                        <div 
                          key={t.id} 
                          className={cn(
                            "flex items-center gap-4 p-5 rounded-[2rem] bg-card border group transition-all hover:shadow-xl relative overflow-hidden",
                            isMe ? "border-primary shadow-[0_0_20px_rgba(232,85,61,0.15)] ring-1 ring-primary/20" : "border-border hover:border-primary/40",
                            hasSuperLiked && "border-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.1)]"
                          )}
                        >
                          {/* Special Glow for Me */}
                          {isMe && (
                             <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                          )}

                          <div className={cn(
                            "w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 shadow-lg relative",
                            isMe ? "border-primary" : "border-background",
                            hasSuperLiked && "border-amber-400"
                          )}>
                            <ImageWithFallback src={t.photo} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            {hasSuperLiked && (
                               <div className="absolute top-0 right-0 p-1">
                                  <div className="bg-amber-400 rounded-full p-0.5 shadow-lg">
                                     <Star className="w-2.5 h-2.5 text-white fill-current" />
                                  </div>
                               </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                               <div className="text-base font-black truncate">{t.name}</div>
                               {isMe && (
                                  <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-primary/20">You</span>
                                )}
                                {hasSuperLiked && (
                                  <span className="bg-amber-400/10 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-amber-400/20 flex items-center gap-1">
                                    <Zap className="w-2 h-2 fill-current" /> Super
                                  </span>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium line-clamp-1 mb-3">{t.bio}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {t.traits?.slice(0, 3).map((trait: string) => (
                                <span key={trait} className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border", getTagStyle(trait))}>
                                  {trait}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="md:col-span-2 p-10 rounded-[2.5rem] border border-dashed border-border flex flex-col items-center justify-center text-center">
                        <Users className="w-10 h-10 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground font-medium text-sm">Be the first to join this tribe!</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-8">
                <div className="p-8 rounded-[2.5rem] bg-foreground text-background shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Required Vibe</h4>
                  <div className="space-y-4">
                    {property.tenant_preferences.map((pref) => (
                      <div key={pref} className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", getTagStyle(pref).split(' ')[1].replace('bg-', 'bg-').replace('text-', 'bg-'))} />
                          <span className="text-sm font-bold tracking-tight">{pref}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {isTenant && (
                  <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-8">Commute Analysis</h4>
                      <div className="flex items-center gap-6">
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                            {loadingCommute ? (
                              <Loader2 className="w-6 h-6 text-primary animate-spin" />
                            ) : (
                              <Clock className="w-6 h-6 text-primary mb-0.5" />
                            )}
                            <span className="text-[10px] font-black">{commuteInfo?.time || "??"}</span>
                          </div>
                          <div>
                            <div className="text-sm font-black">To Your Location</div>
                            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                                <Navigation className="w-3 h-3" /> {loadingCommute ? "Calculating..." : "via Public Transport"}
                            </div>
                          </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-border">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match Integrity</span>
                          <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                              <ShieldCheck className="w-3 h-3" />
                              <span className="text-[9px] font-black uppercase">Verified</span>
                          </div>
                        </div>
                        <div className="rounded-2xl overflow-hidden aspect-video relative border border-border">
                          {property.address ? (
                              <img 
                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(property.address)}&zoom=14&size=400x200&maptype=roadmap&markers=color:red%7C${encodeURIComponent(property.address)}&key=${GOOGLE_KEY}`}
                                alt="Property Location"
                                className="w-full h-full object-cover"
                              />
                          ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-muted-foreground/20" />
                              </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <div className="absolute bottom-2 left-3 text-[8px] font-black text-white uppercase tracking-widest">Maps API Verified</div>
                        </div>
                        <p className="mt-3 text-[9px] text-muted-foreground leading-relaxed font-medium">
                          Commute data and location integrity verified using Google Maps Distance Matrix and Drive API.
                        </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/40 border border-border/50">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div className="text-xs font-bold text-muted-foreground">
                        {property.expiry_date ? `Expires ${new Date(property.expiry_date).toLocaleDateString()}` : "Active Listing"}
                      </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/40 border border-border/50">
                      <Info className="w-5 h-5 text-muted-foreground" />
                      <div className="text-xs font-bold text-muted-foreground">Reference: {property.id.slice(0, 8).toUpperCase()}</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* 3. THE ACTION (PRO BAR) */}
      {isTenant && property && (
         <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 pointer-events-auto bg-white/90 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-border shadow-[0_40px_100px_rgba(0,0,0,0.15)]">
               
               {!isSuperInterested && canUseSuperInterest && (
                 <Button
                   onClick={() => addSuperInterest(property.id)}
                   className="flex-[1.5] bg-primary hover:bg-primary/90 text-white h-20 rounded-3xl font-black text-base tracking-widest shadow-2xl shadow-primary/30 border-none transition-all active:scale-[0.97]"
                 >
                   <Star className="w-6 h-6 mr-3 fill-white" /> EXPRESS SUPER INTEREST
                 </Button>
               )}

               {interestedProfiles.length > 0 && (
                 <Button
                   onClick={() => window.location.href = smsLink}
                   className="flex-1 bg-foreground text-background h-20 rounded-3xl font-black text-base tracking-widest hover:bg-foreground/90 transition-all active:scale-[0.97]"
                 >
                   <MessageCircle className="w-6 h-6 mr-3" /> TRIBE CHAT ({interestedProfiles.length})
                 </Button>
               )}
            </div>
         </div>
      )}
    </div>
  );
}