import { useNavigate } from "react-router";
import { useRef } from "react";
import {
  Home, ArrowRight, Users, Sparkles,
  Zap, BrainCircuit, Heart, Fingerprint,
  SearchCode, MapPin,
  Clock, Coffee, Music, Cat,
  Map as MapIcon, GraduationCap, Briefcase,
  CheckCircle2, Star
} from "lucide-react";
import { motion, useMotionValue, useTransform, useScroll, useSpring } from "framer-motion";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { cn } from "./ui/utils";

// --- HELPERS ---

// Magnetic Button Wrapper for that "premium" feel
function MagneticButton({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
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

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={className}
    >
      <div onClick={onClick} className="cursor-pointer">{children}</div>
    </motion.div>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();

  // Parallax & Scroll Effects
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Swipe Card Logic
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const cardOpacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  const stagger = {
    visible: { transition: { staggerChildren: 0.1 } }
  };

  return (
      <div className="min-h-screen bg-[#faf9f7] text-[#1a1a2e] selection:bg-[#e8553d]/20 selection:text-[#e8553d] font-sans overflow-x-hidden">

        {/* --- GLOBAL BACKGROUND ORCHESTRATION --- */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-10" />
          <motion.div
            animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ y: y1 }}
            className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-[#e8553d]/10 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ x: [0, -40, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            style={{ y: y2 }}
            className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[140px]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        {/* --- NAVIGATION --- */}
        <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3 bg-white/80 backdrop-blur-2xl border border-black/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.04)] rounded-[2rem]"
          >
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-10 h-10 bg-[#e8553d] rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-[#e8553d]/20">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-[#1a1a2e]">Dwllr<span className="text-[#e8553d]">.ai</span></span>
            </div>

            <div className="hidden md:flex gap-10 text-[13px] font-bold uppercase tracking-widest text-muted-foreground">
              <a href="#vibe" className="hover:text-[#e8553d] transition-colors">Vibe Sync</a>
              <a href="#maps" className="hover:text-[#e8553d] transition-colors">Commute Match</a>
              <a href="#interest" className="hover:text-[#e8553d] transition-colors">Interests</a>
            </div>

            <div className="flex items-center gap-4">
               <Button variant="ghost" className="hidden sm:flex font-bold rounded-xl" onClick={() => navigate("/auth")}>Login</Button>
               <Button className="bg-[#1a1a2e] text-white hover:bg-black rounded-xl font-bold px-6 shadow-xl shadow-black/10" onClick={() => navigate("/auth?type=tenant")}>
                Get Started
               </Button>
            </div>
          </motion.div>
        </nav>

        {/* 1. HERO SECTION */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 z-10 overflow-hidden">
          <div className="absolute inset-0 z-[-1] opacity-25">
             <motion.div style={{ scale: 1.1, y: y1 }}>
                <img
                  src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&q=80&w=2000"
                  className="w-full h-full object-cover blur-[1px]"
                  alt="Modern Shared Living Space"
                />
             </motion.div>
             <div className="absolute inset-0 bg-gradient-to-b from-[#faf9f7] via-transparent to-[#faf9f7]" />
          </div>

          <motion.div
              style={{ opacity: heroOpacity, scale: heroScale }}
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="relative z-10 max-w-6xl mx-auto text-center"
          >
            <motion.div
                variants={fadeIn}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-black/[0.05] shadow-sm mb-10 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-[#e8553d]" />
              <span className="text-[11px] font-black tracking-[0.2em] uppercase text-[#1a1a2e]/60">
                Personality-First Tenant Matching
              </span>
            </motion.div>

            <motion.h1
                variants={fadeIn}
                className="text-7xl md:text-[9rem] font-black tracking-tighter mb-10 leading-[0.85] text-[#1a1a2e]"
            >
              Live where you <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#e8553d] via-[#f97316] to-[#e8553d] bg-[size:200%] animate-gradient italic">
                actually fit.
              </span>
            </motion.h1>

            <motion.p
                variants={fadeIn}
                className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-16 font-medium leading-relaxed"
            >
              Find homes close to your <span className="text-[#1a1a2e] font-bold">workplace</span> and matched to your <span className="text-[#e8553d] font-bold">personality traits</span>. Dynamic scoring for the modern renter.
            </motion.p>

            <motion.div
                variants={fadeIn}
                className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-32"
            >
              <MagneticButton>
                <Button
                    size="lg"
                    className="w-full sm:w-auto px-12 py-8 text-xl font-black rounded-2xl bg-[#e8553d] text-white shadow-2xl shadow-[#e8553d]/30 hover:scale-105 transition-all group"
                    onClick={() => navigate("/auth?type=tenant")}
                >
                  START MATCHING <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </Button>
              </MagneticButton>

              <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-12 py-8 text-xl font-bold rounded-2xl bg-white border-black/10 hover:bg-[#1a1a2e] hover:text-white transition-all shadow-lg"
                  onClick={() => navigate("/auth?type=landlord")}
              >
                List a Property
              </Button>
            </motion.div>

            {/* FLOATING PERSONA TAGS */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {[
                    { x: "-18%", y: "5%", icon: Coffee, label: "Early Bird", color: "bg-orange-100 text-orange-600" },
                    { x: "22%", y: "-8%", icon: Music, label: "Quiet Hours", color: "bg-purple-100 text-purple-600" },
                    { x: "-28%", y: "45%", icon: Cat, label: "Cat Friendly", color: "bg-blue-100 text-blue-600" },
                    { x: "28%", y: "38%", icon: Zap, label: "98% Fit", color: "bg-emerald-100 text-emerald-600" },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1, y: [0, -20, 0] }}
                        transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                        className={cn("absolute hidden lg:flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border border-white/50 backdrop-blur-xl z-20", item.color)}
                        style={{ left: `calc(50% + ${item.x})`, top: `calc(50% + ${item.y})` }}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">{item.label}</span>
                    </motion.div>
                ))}
            </div>
          </motion.div>
        </section>

        {/* 2. PERSONALITY SYNC SECTION */}
        <section id="vibe" className="relative py-40 px-6 z-10 bg-white/50 backdrop-blur-sm border-y border-black/[0.02]">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#e8553d]/10 text-[#e8553d] font-black text-xs uppercase tracking-widest mb-8">
                  <BrainCircuit className="w-4 h-4" /> The Personality Engine
                </div>
                <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-10 leading-[0.9]">
                   Dynamic <br /><span className="text-[#e8553d] italic">Vibe-Scoring.</span>
                </h2>
                <p className="text-[#1a1a2e]/60 text-xl md:text-2xl mb-12 font-medium leading-relaxed">
                  We match you based on more than just "hobbies." Our system calculates a <span className="text-[#1a1a2e] font-bold">Dynamic Personality Fit</span> across cleaning, social habits, and lifestyle values.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { icon: Clock, title: "Lifestyle Sync", desc: "Coordinating cleaning & sleep cycles." },
                    { icon: Heart, title: "Values Match", desc: "Shared rules for a shared space." },
                    { icon: Users, title: "Social Energy", desc: "Dynamic introversion/extroversion scoring." },
                    { icon: Sparkles, title: "Cleanliness", desc: "Neuroticism-aligned chore expectations." }
                  ].map((item, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }} className="p-8 rounded-[2.5rem] bg-white border border-black/[0.03] shadow-sm hover:shadow-xl transition-all">
                      <item.icon className="w-8 h-8 text-[#e8553d] mb-4" />
                      <h4 className="font-black text-lg tracking-tight mb-2 uppercase">{item.title}</h4>
                      <p className="text-muted-foreground text-sm font-medium leading-relaxed">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <div className="relative">
                 <div className="absolute -inset-10 bg-[#e8553d]/10 blur-[100px] rounded-full" />
                 <Card className="relative border-none shadow-[0_40px_100px_rgba(0,0,0,0.08)] rounded-[3rem] overflow-hidden bg-white/60 backdrop-blur-xl">
                    <CardContent className="p-12">
                       <div className="flex justify-between items-center mb-10">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#e8553d]">REAL-TIME SYNC SCORE</span>
                          <div className="flex -space-x-2">
                             <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-400" />
                             <div className="w-8 h-8 rounded-full border-2 border-white bg-[#e8553d]" />
                          </div>
                       </div>
                       <div className="space-y-10">
                          {[
                            { label: "Habit Compatibility", val: 96, color: "bg-[#e8553d]" },
                            { label: "Personality Alignment", val: 89, color: "bg-blue-500" },
                            { label: "Lifestyle Overlap", val: 92, color: "bg-emerald-500" }
                          ].map((bar, i) => (
                            <div key={i} className="space-y-3">
                               <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                  <span>{bar.label}</span>
                                  <span>{bar.val}%</span>
                               </div>
                               <div className="h-3 bg-black/5 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${bar.val}%` }}
                                    transition={{ duration: 1.5, delay: i * 0.2 }}
                                    className={cn("h-full rounded-full", bar.color)}
                                  />
                               </div>
                            </div>
                          ))}
                       </div>
                       <div className="mt-16 p-10 rounded-[2.5rem] bg-[#1a1a2e] text-white text-center">
                          <h4 className="text-7xl font-black italic tracking-tighter">98%</h4>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-4 text-[#e8553d]">PERFECT HOUSEMATE MATCH</p>
                       </div>
                    </CardContent>
                 </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 3. GOOGLE MAPS / PROXIMITY SECTION */}
        <section id="maps" className="relative py-40 px-6 z-10 overflow-hidden bg-[#1a1a2e]">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="relative order-2 lg:order-1">
                 <div className="absolute -inset-10 bg-blue-500/20 blur-[100px] rounded-full" />
                 <div className="relative aspect-square bg-white/5 border border-white/10 rounded-[3rem] p-4 backdrop-blur-md overflow-hidden">
                    {/* Simulated Google Maps Interface */}
                    <div className="w-full h-full rounded-[2rem] bg-[#0c0c1a] relative overflow-hidden">
                       <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000')] bg-cover" />
                       {/* Map Markers */}
                       <motion.div
                         animate={{ y: [0, -10, 0] }}
                         transition={{ duration: 2, repeat: Infinity }}
                         className="absolute top-1/4 left-1/3 text-white bg-blue-500 p-2 rounded-full shadow-lg"
                       >
                         <Briefcase className="w-5 h-5" />
                       </motion.div>
                       <motion.div
                         animate={{ y: [0, -10, 0] }}
                         transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                         className="absolute bottom-1/3 right-1/4 text-white bg-[#e8553d] p-2 rounded-full shadow-lg"
                       >
                         <Home className="w-5 h-5" />
                       </motion.div>
                       {/* Connection Line */}
                       <svg className="absolute inset-0 w-full h-full pointer-events-none">
                          <motion.path
                            d="M 133 125 Q 200 150 250 230"
                            stroke="#e8553d"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            fill="transparent"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            transition={{ duration: 2 }}
                          />
                       </svg>
                       <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl">
                          <div className="flex justify-between items-center text-white">
                             <span className="text-xs font-black uppercase tracking-widest">Commute Time</span>
                             <span className="text-blue-400 font-bold">12 mins</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 font-black text-xs uppercase tracking-widest mb-8">
                  <MapIcon className="w-4 h-4" /> Smart Proximity Search
                </div>
                <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-10 leading-[0.9] text-white">
                   Your Work. <br /><span className="text-blue-400 italic">Within reach.</span>
                </h2>
                <p className="text-white/60 text-xl md:text-2xl mb-12 font-medium leading-relaxed">
                  Powered by <span className="text-white font-bold">Google Maps API</span>. Enter your workplace or common campus areas to find listings with the shortest, most efficient commutes.
                </p>

                <div className="space-y-6">
                   {[
                     { icon: GraduationCap, text: "Sync with University Campus Locations" },
                     { icon: Briefcase, text: "Filter by Workplace Proximity" },
                     { icon: MapPin, text: "Visualise your daily commute instantly" }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 text-white">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                           <item.icon className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-lg font-bold tracking-tight opacity-80">{item.text}</span>
                     </div>
                   ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 4. SWIPE / EXPRESS INTEREST SECTION */}
        <section id="interest" className="relative py-40 px-6 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
               <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-none">Express <span className="text-[#e8553d] italic underline decoration-black/[0.05] underline-offset-[12px]">Interest.</span></h2>
               <p className="text-muted-foreground text-xl md:text-2xl font-medium max-w-2xl mx-auto">Found a place that fits your vibe? Express interest instantly and let your personality do the talking.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="relative flex justify-center lg:justify-start">
                <motion.div
                    style={{ x, rotate, opacity: cardOpacity }}
                    drag="x"
                    dragConstraints={{ left: -200, right: 200 }}
                    dragSnapToOrigin
                    className="relative w-full max-w-[420px] aspect-[3/4.5] bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-black/[0.05] overflow-hidden cursor-grab active:cursor-grabbing group"
                >
                  <motion.div style={{ opacity: likeOpacity }} className="absolute top-12 right-10 z-[60] border-4 border-[#e8553d] text-[#e8553d] font-black text-4xl px-4 py-1 rotate-[15deg] rounded-xl bg-white/90">INTERESTED</motion.div>
                  <motion.div style={{ opacity: nopeOpacity }} className="absolute top-12 left-10 z-[60] border-4 border-gray-400 text-gray-400 font-black text-4xl px-4 py-1 rotate-[-15deg] rounded-xl bg-white/90">PASS</motion.div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                  <img
                      src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1000"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]"
                      alt="Luxury Apartment"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-10 z-20">
                    <div className="bg-white/10 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl">
                        <div className="flex justify-between items-start mb-4">
                            <h4 className="text-3xl font-black tracking-tighter text-white">Modern Loft</h4>
                            <div className="bg-[#e8553d] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">98% Fit</div>
                        </div>
                        <div className="flex items-center gap-2 text-white/60 text-xs font-bold uppercase tracking-widest border-t border-white/10 pt-4">
                           <MapPin className="w-3 h-3" /> Southbank, Melbourne
                        </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="space-y-12">
                 {[
                   { title: "No More Cold-Calling", desc: "Expressing interest sends your personality report directly to the property owner." },
                   { title: "Smart Queueing", desc: "Our system prioritizes interest based on Personality Fit scores." },
                   { title: "Status Tracking", desc: "See the status of your interests in your dashboard in real-time." }
                 ].map((item, i) => (
                   <motion.div key={i} whileHover={{ x: 10 }} className="flex gap-6">
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-[#e8553d]/10 flex items-center justify-center border border-[#e8553d]/20">
                         <Star className="w-6 h-6 text-[#e8553d]" />
                      </div>
                      <div>
                         <h3 className="text-2xl font-black tracking-tight mb-2 uppercase">{item.title}</h3>
                         <p className="text-muted-foreground text-lg leading-relaxed font-medium">{item.desc}</p>
                      </div>
                   </motion.div>
                 ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. FOOTER / FINAL CTA */}
        <footer className="relative py-60 text-center border-t border-black/[0.05] bg-white z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(232,85,61,0.12),transparent_60%)]" />

          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10 max-w-5xl mx-auto px-6">
            <h2 className="text-7xl md:text-[11rem] font-black mb-16 tracking-tighter text-[#1a1a2e] leading-[0.85]">
              Find your <br /><span className="text-[#e8553d] italic">tribe.</span>
            </h2>

            <MagneticButton className="inline-block">
                <Button
                    size="lg"
                    className="px-16 py-12 text-3xl font-black rounded-[2.5rem] bg-[#1a1a2e] text-white shadow-[0_30px_100px_rgba(0,0,0,0.2)] hover:scale-110 transition-all hover:bg-black"
                    onClick={() => navigate("/auth")}
                >
                    START MATCHING
                </Button>
            </MagneticButton>

            <div className="mt-48 text-muted-foreground/30 text-[12px] font-black uppercase tracking-[0.6em]">
            © 2026 Dwllr.ai • MONASH HACKATHON • POWERED BY GOOGLE MAPS
            </div>
          </motion.div>
        </footer>
      </div>
  );
}