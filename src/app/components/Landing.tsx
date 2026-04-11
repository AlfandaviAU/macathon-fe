import { useNavigate } from "react-router";
import { useRef, useMemo } from "react";
import {
  Home, ArrowRight, Users, Sparkles,
  Zap, BrainCircuit, Heart,
  SearchCode, MapPin,
  Clock, Coffee, Music, Cat,
  Map as MapIcon, GraduationCap, Briefcase,
  CheckCircle2, Star
} from "lucide-react";
import { motion, useMotionValue, useTransform, useScroll, useSpring } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { cn } from "./ui/utils";
import { ThemeToggle } from "./Layout";
import { useTheme } from "next-themes";
import { useIsMobile } from "./ui/use-mobile";

// --- HELPERS ---

function MagneticButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || isMobile) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.3);
    y.set((clientY - centerY) * 0.3);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  if (isMobile) {
      return (
          <div onClick={onClick} className={cn("cursor-pointer w-full flex justify-center", className)}>
              {children}
          </div>
      );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
    >
      <div onClick={onClick} className="cursor-pointer w-full flex justify-center">{children}</div>
    </motion.div>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Performance: Disable scroll-based parallax on mobile
  const y1 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, isMobile ? 0 : 200]);
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Swipe Card Logic
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  const fadeIn = {
    hidden: { opacity: 0, y: isMobile ? 5 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.05 } }
  };

  const mapStyle = useMemo(() => isDark 
    ? "element:geometry%7Ccolor:0x242f3e&style=element:labels.text.stroke%7Ccolor:0x242f3e&style=element:labels.text.fill%7Ccolor:0x746855&style=feature:administrative.locality%7Celement:labels.text.fill%7Ccolor:0xd59563&style=feature:poi%7Celement:labels.text.fill%7Ccolor:0xd59563&style=feature:poi.park%7Celement:geometry%7Ccolor:0x263c3f&style=feature:poi.park%7Celement:labels.text.fill%7Ccolor:0x6b9a76&style=feature:road%7Celement:geometry%7Ccolor:0x38414e&style=feature:road%7Celement:geometry.stroke%7Ccolor:0x212a37&style=feature:road%7Celement:labels.text.fill%7Ccolor:0x9ca5b3&style=feature:road.highway%7Celement:geometry%7Ccolor:0x746855&style=feature:road.highway%7Celement:geometry.stroke%7Ccolor:0x1f2835&style=feature:road.highway%7Celement:labels.text.fill%7Ccolor:0xf3d19c&style=feature:transit%7Celement:geometry%7Ccolor:0x2f3948&style=feature:transit.station%7Celement:labels.text.fill%7Ccolor:0xd59563&style=feature:water%7Celement:geometry%7Ccolor:0x17263c&style=feature:water%7Celement:labels.text.fill%7Ccolor:0x515c6d&style=feature:water%7Celement:labels.text.stroke%7Ccolor:0x17263c"
    : "element:geometry%7Ccolor:0xebe3cd&style=element:labels.text.fill%7Ccolor:0x523735&style=element:labels.text.stroke%7Ccolor:0xf5f1e6&style=feature:administrative%7Celement:geometry.stroke%7Ccolor:0xc9b2a6&style=feature:administrative.land_parcel%7Celement:geometry.stroke%7Ccolor:0xdcd2be&style=feature:administrative.land_parcel%7Celement:labels.text.fill%7Ccolor:0xae9e90&style=feature:landscape.natural%7Celement:geometry%7Ccolor:0xdfd2ae&style=feature:poi%7Celement:geometry%7Ccolor:0xdfd2ae&style=feature:poi.labels.text.fill%7Ccolor:0x93817c&style=feature:poi.park%7Celement:geometry%7Ccolor:0xa5b076&style=feature:poi.park%7Celement:labels.text.fill%7Ccolor:0x447530&style=feature:road%7Celement:geometry%7Ccolor:0xf5f1e6&style=feature:road.arterial%7Celement:geometry%7Ccolor:0xfdfcf8&style=feature:road.highway%7Celement:geometry%7Ccolor:0xf8c967&style=feature:road.highway%7Celement:geometry.stroke%7Ccolor:0xe9bc62&style=feature:road.highway.controlled_access%7Celement:geometry%7Ccolor:0xe98d58&style=feature:road.highway.controlled_access%7Celement:geometry.stroke%7Ccolor:0xdb854f&style=feature:road.local%7Celement:labels.text.fill%7Ccolor:0x806b63&style=feature:transit.line%7Celement:geometry%7Ccolor:0xdfd2ae&style=feature:transit.line%7Celement:labels.text.fill%7Ccolor:0x8f7d77&style=feature:transit.line%7Celement:labels.text.stroke%7Ccolor:0xebe3cd&style=feature:transit.station%7Celement:geometry%7Ccolor:0xdfd2ae&style=feature:water%7Celement:geometry%7Ccolor:0xb9d3c2&style=feature:water%7Celement:labels.text.fill%7Ccolor:0x92998d", [isDark]);

  return (
      <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">

        {/* --- GLOBAL BACKGROUND ORCHESTRATION --- */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Noise texture is heavy on mobile, disable it */}
          {!isMobile && (
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-10" />
          )}
          
          {!isMobile ? (
            <>
              <motion.div
                animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ y: y1 }}
                className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary/10 dark:bg-primary/25 rounded-full blur-[140px]"
              />
              <motion.div
                animate={{ x: [0, -40, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ y: y2 }}
                className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 dark:bg-orange-900/10 rounded-full blur-[160px]"
              />
            </>
          ) : (
            <>
              <div className="absolute top-[-5%] right-[-5%] w-[60%] h-[60%] bg-primary/5 dark:bg-primary/10 rounded-full blur-[40px]" />
              <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] bg-blue-500/5 dark:bg-orange-900/5 rounded-full blur-[60px]" />
            </>
          )}
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:60px_60px] opacity-[0.01]" />
        </div>

        {/* --- NAVIGATION --- */}
        <nav className="fixed top-0 left-0 right-0 z-[100] px-4 py-3 md:px-6 md:py-6">
          <div className={cn(
              "max-w-7xl mx-auto flex justify-between items-center px-4 py-2 md:px-6 md:py-3 border border-border shadow-xl rounded-[1.2rem] md:rounded-[2rem] transition-all",
              "bg-card/95 md:bg-card/60",
              !isMobile && "backdrop-blur-xl"
            )}
          >
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg md:rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                <Home className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <span className="text-xl md:text-2xl font-black tracking-tight text-foreground">Dwllr<span className="text-primary">.ai</span></span>
            </div>

            <div className="hidden md:flex gap-10 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
              <a href="#vibe" className="hover:text-primary transition-colors text-foreground/60 dark:text-white/40">Vibe Sync</a>
              <a href="#maps" className="hover:text-primary transition-colors text-foreground/60 dark:text-white/40">Commute Match</a>
              <a href="#interest" className="hover:text-primary transition-colors text-foreground/60 dark:text-white/40">Interests</a>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
               <Button variant="ghost" className="hidden sm:flex font-bold rounded-xl text-foreground/60 hover:text-primary hover:bg-primary/5 transition-all" onClick={() => navigate("/login")}>Login</Button>
               <Button className="bg-primary text-white hover:bg-primary/90 rounded-xl font-bold px-4 md:px-6 h-10 md:h-11 shadow-lg shadow-primary/20 transition-all border-none text-[11px] md:text-sm uppercase tracking-wider" onClick={() => navigate("/signup/tenant")}>
                {isMobile ? "Start" : "Get Started"}
               </Button>
            </div>
          </div>
        </nav>

        {/* 1. HERO SECTION */}
        <section className="relative min-h-[100dvh] flex flex-col items-center justify-center pt-20 pb-12 md:pb-20 px-4 md:px-6 z-10 overflow-hidden">
          <div className="absolute inset-0 z-[-1] opacity-20 dark:opacity-40 transition-opacity duration-1000">
             <motion.div 
                style={isMobile ? {} : { scale: 1.1, y: y1 }} 
                className="h-full"
             >
                <img
                  src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=60&w=1200"
                  className="w-full h-full object-cover dark:grayscale-[50%] dark:contrast-125"
                  alt="Modern Shared Living Space"
                />
             </motion.div>
             <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
          </div>

          <motion.div
              style={isMobile ? {} : { opacity: heroOpacity, scale: heroScale }}
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="relative z-10 max-w-6xl mx-auto text-center"
          >
            <motion.div
                variants={fadeIn}
                className="inline-flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-primary/10 border border-primary/20 shadow-sm mb-6 md:mb-10"
            >
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              <span className="text-[9px] md:text-[11px] font-black tracking-[0.2em] uppercase text-primary">
                Personality-First Tenant Matching
              </span>
            </motion.div>

            <motion.h1
                variants={fadeIn}
                className="text-5xl sm:text-7xl md:text-8xl lg:text-[9rem] font-black tracking-tighter mb-6 md:mb-10 leading-[0.9] md:leading-[0.85] text-foreground"
            >
              Live where you <br />
              <span className="text-primary italic">
                actually fit.
              </span>
            </motion.h1>

            <motion.p
                variants={fadeIn}
                className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 md:mb-16 font-medium leading-relaxed px-4 md:px-0"
            >
              Find homes close to your <span className="text-foreground font-bold">workplace</span> and matched to your <span className="text-primary font-bold underline decoration-primary/30 underline-offset-8">personality traits</span>. Dynamic scoring for the modern renter.
            </motion.p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mb-12 md:mb-32 w-full max-w-xs mx-auto sm:max-w-none px-4 md:px-0">
              <MagneticButton className="w-full sm:w-auto">
                <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 md:px-12 py-7 md:py-8 text-lg md:text-xl font-black rounded-xl bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all border-none"
                    onClick={() => navigate("/signup/tenant")}
                >
                  START MATCHING <ArrowRight className="ml-3 w-5 h-5 md:w-6 md:h-6" />
                </Button>
              </MagneticButton>

              <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 md:px-12 py-7 md:py-8 text-lg md:text-xl font-bold rounded-xl bg-card border-primary/20 text-foreground hover:bg-primary/10 transition-all"
                  onClick={() => navigate("/signup/landlord")}
              >
                List a Property
              </Button>
            </div>
          </motion.div>
        </section>

        {/* 2. PERSONALITY SYNC SECTION */}
        <section id="vibe" className="relative py-16 md:py-40 px-4 md:px-6 z-10 bg-card/20 border-y border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-24 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary font-black text-[10px] md:text-xs uppercase tracking-widest mb-6 md:mb-8">
                  <BrainCircuit className="w-4 h-4" /> The Personality Engine
                </div>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 md:mb-10 leading-[0.95] md:leading-[0.9] text-foreground">
                   Dynamic <br /><span className="text-primary italic">Vibe-Scoring.</span>
                </h2>
                <p className="text-muted-foreground text-lg md:text-2xl mb-8 md:mb-12 font-medium leading-relaxed">
                  We match you based on more than just "hobbies." Our system calculates a <span className="text-foreground font-bold">Dynamic Personality Fit</span> across cleaning, social habits, and lifestyle values.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {[
                    { icon: Clock, title: "Lifestyle Sync", desc: "Coordinating cleaning & sleep cycles." },
                    { icon: Heart, title: "Values Match", desc: "Shared rules for a shared space." },
                    { icon: Users, title: "Social Energy", desc: "Dynamic introversion/extroversion scoring." },
                    { icon: Sparkles, title: "Cleanliness", desc: "Neuroticism-aligned chore expectations." }
                  ].map((item, i) => (
                    <div key={i} className="p-6 md:p-8 rounded-[1.2rem] md:rounded-[2.5rem] bg-card border border-border shadow-sm">
                      <item.icon className="w-6 h-6 md:w-8 md:h-8 text-primary mb-4" />
                      <h4 className="font-black text-base md:text-lg tracking-tight mb-2 uppercase text-foreground">{item.title}</h4>
                      <p className="text-muted-foreground text-xs md:text-sm font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div className="relative mt-8 lg:mt-0">
                 <div className="absolute -inset-6 md:-inset-10 bg-primary/10 blur-[30px] md:blur-[100px] rounded-full" />
                 <Card className="relative border border-border shadow-xl rounded-[1.5rem] md:rounded-[3rem] overflow-hidden bg-card transition-all">
                    <CardContent className="p-6 md:p-12">
                       <div className="flex justify-between items-center mb-6 md:mb-10">
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary">REAL-TIME SYNC SCORE</span>
                          <div className="flex -space-x-2">
                             <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-background bg-blue-500" />
                             <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-background bg-primary" />
                          </div>
                       </div>
                       <div className="space-y-6 md:space-y-10">
                          {[
                            { label: "Habit Compatibility", val: 96, color: "bg-primary" },
                            { label: "Personality Alignment", val: 89, color: "bg-primary/60" },
                            { label: "Lifestyle Overlap", val: 92, color: "bg-primary/40" }
                          ].map((bar, i) => (
                            <div key={i} className="space-y-2 md:space-y-3">
                               <div className="flex justify-between text-[10px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                                  <span>{bar.label}</span>
                                  <span>{bar.val}%</span>
                               </div>
                               <div className="h-2 md:h-3 bg-foreground/5 dark:bg-white/5 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${bar.val}%` }}
                                    transition={{ duration: 1.2, delay: i * 0.1 }}
                                    className={cn("h-full rounded-full", bar.color)}
                                  />
                               </div>
                            </div>
                          ))}
                       </div>
                       <div className="mt-8 md:mt-16 p-6 md:p-10 rounded-[1.2rem] md:rounded-[2.5rem] bg-primary/5 dark:bg-primary/10 border border-primary/20 text-foreground text-center">
                          <h4 className="text-5xl md:text-7xl font-black italic tracking-tighter text-primary">98%</h4>
                          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] mt-3 md:mt-4 text-primary opacity-60">PERFECT HOUSEMATE MATCH</p>
                       </div>
                    </CardContent>
                 </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 3. GOOGLE MAPS / PROXIMITY SECTION */}
        <section id="maps" className="relative py-16 md:py-40 px-4 md:px-6 z-10 overflow-hidden bg-card/10">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-24 items-center">
              <div className="relative order-2 lg:order-1 mt-8 lg:mt-0">
                 <div className="absolute -inset-6 md:-inset-10 bg-primary/10 blur-[40px] md:blur-[120px] rounded-full" />
                 <div className="relative aspect-square bg-card border border-border rounded-[1.5rem] md:rounded-[3rem] p-2 md:p-4 overflow-hidden shadow-2xl">
                    <div className="w-full h-full rounded-[1.2rem] md:rounded-[2.2rem] bg-muted relative overflow-hidden">
                       <img 
                         src={`https://maps.googleapis.com/maps/api/staticmap?center=-37.9111,145.1311&zoom=16&size=600x600&maptype=roadmap&style=${mapStyle}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                         className="absolute inset-0 w-full h-full object-cover"
                         alt="Monash University Clayton Map"
                       />
                       
                       <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none z-10" />

                       {!isMobile && (
                           <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100">
                               <motion.path
                                   d="M 25 25 L 63 25 L 63 75 L 75 75"
                                   stroke="#e8553d"
                                   strokeWidth="1.2"
                                   strokeDasharray="3,3"
                                   strokeLinecap="round"
                                   fill="transparent"
                                   initial={{ pathLength: 0, opacity: 0 }}
                                   whileInView={{ pathLength: 1, opacity: 1 }}
                                   transition={{ duration: 3, repeat: Infinity, repeatDelay: 0.5, ease: "linear" }}
                               />
                           </svg>
                       )}

                       <motion.div
                         animate={{ y: [0, -3, 0] }}
                         transition={{ duration: 2, repeat: Infinity }}
                         className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 text-white bg-primary p-2 md:p-3 rounded-full shadow-lg z-20"
                       >
                         <Home className="w-4 h-4 md:w-6 md:h-6" />
                       </motion.div>

                       <motion.div
                         animate={{ y: [0, -3, 0] }}
                         transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                         className="absolute top-[75%] left-[75%] -translate-x-1/2 -translate-y-1/2 text-white bg-blue-600 p-2 md:p-3 rounded-full shadow-lg z-20"
                       >
                         <GraduationCap className="w-4 h-4 md:w-6 md:h-6" />
                       </motion.div>

                       <div className="absolute bottom-4 left-4 right-4 bg-black/90 p-3 md:p-4 rounded-xl border border-white/10 shadow-2xl z-30">
                          <div className="flex justify-between items-center text-white">
                             <div className="flex flex-col">
                                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-primary">Real-Time Commute</span>
                                <span className="text-lg md:text-2xl font-black italic text-primary">5 mins walk</span>
                             </div>
                             <div className="hidden sm:flex flex-col items-end">
                                <div className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-[10px] font-black border border-primary/20 mb-1 uppercase">Matched</div>
                                <span className="text-[8px] text-white/40 font-bold uppercase italic">Campus Ready</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeIn} className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 text-primary font-black text-[10px] md:text-xs uppercase tracking-widest mb-6 md:mb-8">
                  <MapIcon className="w-4 h-4" /> Smart Proximity Search
                </div>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 md:mb-10 leading-[0.95] md:leading-[0.9] text-foreground">
                   Your Work. <br /><span className="text-primary italic">Within reach.</span>
                </h2>
                <p className="text-muted-foreground text-lg md:text-2xl mb-8 md:mb-12 font-medium leading-relaxed">
                  Powered by <span className="text-foreground font-bold">Google Maps API</span>. Enter your workplace or common campus areas to find listings with the shortest, most efficient commutes.
                </p>

                <div className="space-y-4 md:space-y-6">
                   {[
                     { icon: GraduationCap, text: "Sync with University Campus Locations", color: "text-primary" },
                     { icon: Briefcase, text: "Filter by Workplace Proximity", color: "text-primary" },
                     { icon: MapPin, text: "Visualise your daily commute instantly", color: "text-primary" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-3 md:gap-4 text-foreground">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-card border border-border flex items-center justify-center shadow-md">
                           <item.icon className={cn("w-5 h-5 md:w-6 md:h-6", item.color)} />
                        </div>
                        <span className="text-base md:text-lg font-bold tracking-tight opacity-70 leading-tight">{item.text}</span>
                     </div>
                   ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 4. SWIPE / EXPRESS INTEREST SECTION */}
        <section id="interest" className="relative py-16 md:py-40 px-4 md:px-6 z-10 bg-background transition-colors duration-500">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10 md:mb-24">
               <h2 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-4 md:mb-8 leading-[0.95] md:leading-none text-foreground">Express <span className="text-primary italic underline decoration-primary/10 underline-offset-[8px] md:underline-offset-[12px]">Interest.</span></h2>
               <p className="text-muted-foreground text-lg md:text-2xl font-medium max-w-2xl mx-auto px-4 md:px-0">Found a place that fits your vibe? Express interest instantly and let your personality do the talking.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-20 items-center">
              <div className="relative flex justify-center lg:justify-start">
                <motion.div
                    style={{ x, rotate, opacity: cardOpacity }}
                    drag="x"
                    dragConstraints={{ left: -200, right: 200 }}
                    dragSnapToOrigin
                    className="relative w-full max-w-[280px] md:max-w-[420px] aspect-[3/4.5] bg-card rounded-[1.5rem] md:rounded-[3rem] shadow-xl border border-border overflow-hidden cursor-grab active:cursor-grabbing group"
                >
                  <motion.div style={{ opacity: likeOpacity }} className="absolute top-6 md:top-12 right-6 md:right-10 z-[60] border-2 md:border-4 border-primary text-primary font-black text-xl md:text-4xl px-3 md:px-4 py-0.5 md:py-1 rotate-[15deg] rounded-lg md:rounded-xl bg-background/90 uppercase">Interested</motion.div>
                  <motion.div style={{ opacity: nopeOpacity }} className="absolute top-6 md:top-12 left-6 md:left-10 z-[60] border-2 md:border-4 border-foreground/40 text-foreground/40 font-black text-xl md:text-4xl px-3 md:px-4 py-0.5 md:py-1 rotate-[-15deg] rounded-lg md:rounded-xl bg-background/90 uppercase">Pass</motion.div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                  <img
                      src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=60&w=1000"
                      className="w-full h-full object-cover"
                      alt="Luxury Apartment"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 z-20">
                    <div className="bg-black/90 p-5 md:p-8 rounded-[1.2rem] md:rounded-[2.5rem] border border-white/10 shadow-2xl">
                        <div className="flex justify-between items-start mb-2 md:mb-4">
                            <h4 className="text-lg md:text-3xl font-black tracking-tighter text-white">Modern Loft</h4>
                            <div className="bg-primary text-white px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-wider">98% Fit</div>
                        </div>
                        <div className="flex items-center gap-2 text-white/40 text-[9px] md:text-xs font-bold uppercase tracking-widest border-t border-white/10 pt-2 md:pt-4">
                           <MapPin className="w-3 h-3 text-primary" /> Southbank, Melbourne
                        </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="space-y-6 md:space-y-12">
                 {[
                   { title: "No More Cold-Calling", desc: "Expressing interest sends your personality report directly to the property owner." },
                   { title: "Smart Queueing", desc: "Our system prioritizes interest based on Personality Fit scores." },
                   { title: "Status Tracking", desc: "See the status of your interests in your dashboard in real-time." }
                 ].map((item, i) => (
                   <div key={i} className="flex gap-4 md:gap-6">
                      <div className="w-10 h-10 md:w-16 md:h-16 shrink-0 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                         <Star className="w-5 h-5 md:w-8 md:h-8 text-primary" />
                      </div>
                      <div>
                         <h3 className="text-lg md:text-2xl font-black tracking-tight mb-1 md:mb-2 uppercase text-foreground">{item.title}</h3>
                         <p className="text-muted-foreground text-sm md:text-lg leading-relaxed font-medium">{item.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. FOOTER / FINAL CTA */}
        <footer className="relative py-20 md:py-60 text-center border-t border-border bg-card/10 z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(232,85,61,0.15),transparent_60%)]" />

          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10 max-w-5xl mx-auto px-4 md:px-6">
            <h2 className="text-5xl sm:text-7xl md:text-9xl lg:text-[11rem] font-black mb-8 md:mb-16 tracking-tighter text-foreground leading-[0.9] md:leading-[0.85]">
              Find your <br /><span className="text-primary italic">tribe.</span>
            </h2>

            <div className="inline-block w-full max-w-[260px] sm:max-w-none">
                <Button
                    size="lg"
                    className="w-full sm:w-auto px-10 md:px-16 py-7 md:py-12 text-xl md:text-3xl font-black rounded-[1.2rem] md:rounded-[2.5rem] bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all border-none"
                    onClick={() => navigate("/signup/tenant")}
                >
                    START MATCHING
                </Button>
            </div>

            <div className="mt-12 md:mt-48 text-muted-foreground/30 text-[8px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] px-4">
            © 2026 Dwllr.ai • MONASH HACKATHON • POWERED BY GOOGLE MAPS
            </div>
          </motion.div>
        </footer>
      </div>
  );
}
