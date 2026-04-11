import { useParams, useNavigate } from "react-router";
import { useApp } from "../store";
import { 
  ArrowLeft, Bed, Bath, Car, Users, MapPin, Calendar, 
  MessageCircle, Undo2, XCircle, Star, Sparkles, 
  Home as HomeIcon, CheckCircle2, ShieldCheck, Info,
  Zap, Clock, Target, Coffee, Utensils, Dumbbell, Loader2
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { getMatchExplanation } from "../services/api";

export function PropertyDetail() {
  const { id } = useParams();
  const { properties, tenantProfiles, user, superInterests, canSuperInterest, addSuperInterest, withdrawInterest, unmatchFromProperty } = useApp();
  const navigate = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);
  const [confirmUnmatch, setConfirmUnmatch] = useState(false);
  const [matchExplanation, setMatchExplanation] = useState<{
    overall_match_score: number;
    reasons: string[];
    commute_time?: number;
    match_breakdown?: { label: string; val: number; desc: string }[];
  } | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const property = properties.find((p) => p.id === id);

  useEffect(() => {
    if (user?.id && id && user?.type === "tenant") {
      setLoadingExplanation(true);
      getMatchExplanation(user.id, id)
        .then((data) => {
          setMatchExplanation(data);
        })
        .catch((err) => {
          console.error("Failed to fetch match explanation:", err);
        })
        .finally(() => {
          setLoadingExplanation(false);
        });
    }
  }, [user?.id, id, user?.type]);

  if (!property) {
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

  const matchedProfiles = tenantProfiles.filter((t) => property.matchedTenants.includes(t.id));
  const interestedProfiles = tenantProfiles.filter((t) => property.interestedTenants.includes(t.id));
  const minPrice = (property.weeklyPrice / property.maxTenants).toFixed(0);
  const currentPrice = (property.weeklyPrice / Math.max(property.matchedTenants.length, 1)).toFixed(0);

  // Super Interest Logic - Only for tenants
  const isTenant = user?.type === "tenant";
  const superInterestIds = isTenant ? superInterests.map((s) => s.propertyId) : [];
  const isSuperInterested = isTenant ? superInterestIds.includes(property.id) : false;
  const canUseSuperInterest = isTenant ? (canSuperInterest() && !isSuperInterested) : false;

  const smsLink = `sms:${interestedProfiles.map((t) => t.phone).join(",")}?body=Hey! We're all matched on ${property.address} via Dwllr. Let's chat!`;

  // --- Tag Styling Helper ---
  const getTagStyle = (tag: string) => {
    const t = tag.toLowerCase();
    if (t.includes("tidy") || t.includes("clean") || t.includes("neat")) 
      return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    if (t.includes("smoke") || t.includes("quiet") || t.includes("early") || t.includes("study")) 
      return "bg-blue-50 text-blue-700 border-blue-200/50";
    if (t.includes("social") || t.includes("night") || t.includes("active") || t.includes("friendly") || t.includes("vibe")) 
      return "bg-orange-50 text-orange-700 border-orange-200/50";
    if (t.includes("pet") || t.includes("cat") || t.includes("dog")) 
      return "bg-purple-50 text-purple-700 border-purple-200/50";
    return "bg-muted/50 text-muted-foreground border-border/50";
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-40">
      
      {/* 1. SEAMLESS IMAGE GALLERY */}
      <section className="relative w-full aspect-[16/10] md:aspect-[21/9] overflow-hidden bg-muted/20">
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
               src={property.images[imgIdx]} 
               alt={property.address} 
               className="w-full h-full object-cover" 
            />
          </motion.div>
        </AnimatePresence>

        {/* Floating Nav Controls */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white transition-all shadow-xl active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
        </div>

        {/* Counter */}
        <div className="absolute bottom-6 right-6 z-10 px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-white/10 text-foreground text-[12px] font-black tracking-widest shadow-xl">
          {imgIdx + 1} / {property.images.length}
        </div>

        {/* Progress Track */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 px-10 pointer-events-none">
          {property.images.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === imgIdx ? "w-10 bg-primary shadow-[0_0_10px_rgba(232,85,61,0.5)]" : "w-3 bg-white/60"
              )}
            />
          ))}
        </div>
      </section>

      {/* 2. THE CONTENT */}
      <main className="max-w-4xl mx-auto px-6 pt-10 relative">
        
        {/* Title & Core Meta */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-6">
                 <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                      {matchExplanation?.overall_match_score ?? 98}% Perfect Fit
                    </span>
                 </div>
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
              <div className="text-[10px] font-bold text-primary/40 mt-1 uppercase">Total: ${property.weeklyPrice}pw</div>
            </div>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
           {[
             { icon: Bed, label: "Bedrooms", val: property.bedrooms, color: "text-blue-500", bg: "bg-blue-50", sub: "Spacious" },
             { icon: Bath, label: "Bathrooms", val: property.bathrooms, color: "text-purple-500", bg: "bg-purple-50", sub: "Modern" },
             { icon: Car, label: "Parking", val: property.garages, color: "text-emerald-500", bg: "bg-emerald-50", sub: "Secure" },
             { icon: Users, label: "Max Tribe", val: property.maxTenants, color: "text-orange-500", bg: "bg-orange-50", sub: "Shared" },
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

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Intelligence */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* AI MATCH ANALYSIS (Only for Tenants) */}
            {isTenant && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-[2.5rem] p-8 relative overflow-hidden"
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
                  <div className="space-y-10">
                    {/* Reasons list */}
                    <div className="space-y-4">
                      {matchExplanation.reasons?.map((reason, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                           <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                           <p className="text-sm font-medium leading-relaxed">{reason}</p>
                        </div>
                      ))}
                    </div>

                    {/* Match Breakdown (if available) */}
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

            {/* LANDLORD PREFERENCES */}
            <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h3 className="text-2xl font-black tracking-tight mb-6">Ideal Tribe Values</h3>
              <div className="flex flex-wrap gap-3">
                {property.tenantPreferences.map((pref) => (
                  <div key={pref} className={cn("flex items-center gap-2 px-5 py-3 rounded-2xl border shadow-sm transition-all hover:scale-105", getTagStyle(pref))}>
                    <CheckCircle2 className="w-4 h-4 opacity-70" />
                    <span className="text-sm font-bold">{pref}</span>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* TRIBE MEMBERS */}
            <section>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" /> Your Potential Tribe
                </h3>
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">{matchedProfiles.length} Members</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchedProfiles.map((t) => (
                  <div key={t.id} className="flex items-center gap-4 p-5 rounded-[2rem] bg-card border border-border group hover:border-primary/40 transition-all hover:shadow-xl">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-background shadow-lg">
                      <ImageWithFallback src={t.photo} alt={t.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-black mb-1">{t.name}</div>
                      <p className="text-xs text-muted-foreground font-medium line-clamp-1 mb-3">{t.bio}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {t.traits.slice(0, 3).map(trait => (
                          <span key={trait} className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border", getTagStyle(trait))}>
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Listing Meta */}
          <div className="space-y-8">
            
            {/* Tribe Values */}
            <div className="p-8 rounded-[2.5rem] bg-foreground text-background shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8">Required Vibe</h4>
               <div className="space-y-4">
                 {property.tenantPreferences.map((pref) => (
                   <div key={pref} className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full", getTagStyle(pref).split(' ')[1].replace('bg-', 'bg-').replace('text-', 'bg-'))} />
                      <span className="text-sm font-bold tracking-tight">{pref}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* Commute Widget */}
            {isTenant && (
              <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-8">Commute Analysis</h4>
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                      <Clock className="w-6 h-6 text-primary mb-0.5" />
                      <span className="text-[10px] font-black">{matchExplanation?.commute_time ?? "??"}m</span>
                    </div>
                    <div>
                      <div className="text-sm font-black">To Your Location</div>
                      <div className="text-[11px] text-muted-foreground font-medium">via Public Transport</div>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-border">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <span>Last Active</span>
                      <span className="text-emerald-500">Just Now</span>
                    </div>
                </div>
              </div>
            )}

            {/* Timeline Info */}
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/40 border border-border/50">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div className="text-xs font-bold text-muted-foreground">Expires {new Date(property.expiryDate).toLocaleDateString()}</div>
               </div>
               <div className="flex items-center gap-4 p-4 rounded-3xl bg-muted/40 border border-border/50">
                  <Info className="w-5 h-5 text-muted-foreground" />
                  <div className="text-xs font-bold text-muted-foreground">Listing ID: {id?.slice(0, 8)}</div>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. THE ACTION (PRO BAR) */}
      {isTenant && (
         <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 pointer-events-auto bg-white/90 backdrop-blur-3xl p-4 rounded-[2.5rem] border border-border shadow-[0_40px_100px_rgba(0,0,0,0.15)]">
               
               {/* Primary Match Action */}
               {!isSuperInterested && canUseSuperInterest ? (
                 <Button
                   onClick={() => addSuperInterest(property.id)}
                   className="flex-[1.5] bg-primary hover:bg-primary/90 text-white h-20 rounded-3xl font-black text-base tracking-widest shadow-2xl shadow-primary/30 border-none transition-all active:scale-[0.97]"
                 >
                   <Star className="w-6 h-6 mr-3 fill-white" /> EXPRESS SUPER INTEREST
                 </Button>
               ) : isSuperInterested ? (
                 <Button
                   onClick={() => withdrawInterest(property.id)}
                   variant="outline"
                   className="flex-[1.5] border-primary/20 text-primary h-20 rounded-3xl font-black text-base transition-all"
                 >
                   <Undo2 className="w-6 h-6 mr-3" /> WITHDRAW INTEREST
                 </Button>
               ) : null}

               {/* Communication Action */}
               {interestedProfiles.length > 0 && (
                 <Button
                   onClick={() => window.location.href = smsLink}
                   className="flex-1 bg-foreground text-background h-20 rounded-3xl font-black text-base tracking-widest hover:bg-foreground/90 transition-all active:scale-[0.97]"
                 >
                   <MessageCircle className="w-6 h-6 mr-3" /> TRIBE CHAT ({interestedProfiles.length})
                 </Button>
               )}

               {/* Secondary Action */}
               {(!isSuperInterested || !canUseSuperInterest) && interestedProfiles.length === 0 && (
                  <Button
                     onClick={() => setConfirmUnmatch(true)}
                     variant="ghost"
                     className="flex-1 text-muted-foreground hover:text-destructive h-20 rounded-3xl font-bold"
                  >
                     <XCircle className="w-4 h-4 mr-2" /> Unmatch Property
                  </Button>
               )}
            </div>

            {/* Confirm Unmatch Popover */}
            <AnimatePresence>
               {confirmUnmatch && (
                  <motion.div 
                     initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                     className="absolute bottom-full left-6 right-6 mb-4 max-w-lg mx-auto bg-white border border-border rounded-[2.5rem] p-10 shadow-2xl pointer-events-auto"
                  >
                     <h4 className="text-2xl font-black mb-2">Wait! Removing Match?</h4>
                     <p className="text-sm text-muted-foreground mb-8">This tribe seems like a 98% match for your personality. Are you sure you want to unmatch?</p>
                     <div className="flex gap-4">
                        <Button
                           onClick={() => { unmatchFromProperty(property.id); navigate("/matches"); }}
                           className="flex-1 bg-destructive hover:bg-destructive/90 text-white h-14 rounded-2xl font-black"
                        >
                           Yes, Unmatch
                        </Button>
                        <Button
                           onClick={() => setConfirmUnmatch(false)}
                           variant="outline"
                           className="flex-1 h-14 rounded-2xl font-black"
                        >
                           Go Back
                        </Button>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      )}
    </div>
  );
}