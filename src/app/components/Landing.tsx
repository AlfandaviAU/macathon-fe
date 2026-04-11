import { useNavigate } from "react-router";
import { Home, ArrowRight, Users, Building2, Sparkles } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1661820030641-35d02e9e9b37?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb29tbWF0ZXMlMjBmcmllbmRzJTIwYXBhcnRtZW50fGVufDF8fHx8MTc3NTgyNTAyOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Roommates"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background" />
        </div>

        <div className="relative z-10 px-6 pt-16 pb-24 max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
              <Home className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-white text-[2rem]" style={{ fontWeight: 800, letterSpacing: "-0.03em" }}>Dwllr</span>
          </div>
          <h1 className="text-white text-[1.75rem] mb-3" style={{ fontWeight: 700, lineHeight: 1.2 }}>
            Find your perfect<br />housemates & home
          </h1>
          <p className="text-white/70 mb-8 text-[0.95rem]">
            AI-matched roommates. Swipe on properties. Split the rent fairly.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => navigate("/auth?type=tenant")}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              I'm looking for a place <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/auth?type=landlord")}
              className="w-full bg-white/10 backdrop-blur text-white border border-white/20 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition"
            >
              I'm a landlord <Building2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-12 max-w-lg mx-auto space-y-6">
        {[
          { icon: Sparkles, title: "AI-Powered Matching", desc: "Our algorithm groups compatible tenants based on personality and chore preferences." },
          { icon: Users, title: "Split Rent Dynamically", desc: "Watch the price per person drop as more compatible tenants join your group." },
          { icon: Building2, title: "Verified Tenants", desc: "Every tenant passes a liveliness check so landlords know they're dealing with real people." },
        ].map((f, i) => (
          <div key={i} className="flex gap-4 items-start bg-card rounded-xl p-4 border border-border">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <f.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-[0.95rem] mb-0.5">{f.title}</h3>
              <p className="text-muted-foreground text-[0.85rem]">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
