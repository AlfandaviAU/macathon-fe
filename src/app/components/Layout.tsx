import { Outlet, useNavigate, useLocation, Navigate } from "react-router";
import { useApp, AppProvider } from "../store";
import { Home, Search, Heart, User, Building2, LogOut, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

export function AppProviderLayout() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}

export function ProtectedLayout() {
  const { user, authLoading, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const tenantTabs = [
    { path: "/swipe", icon: Search, label: "Discover" },
    { path: "/matches", icon: Heart, label: "Matches" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const landlordTabs = [
    { path: "/landlord", icon: Building2, label: "Listings" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const tabs = user.type === "landlord" ? landlordTabs : tenantTabs;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300 relative overflow-hidden">
      
      {/* --- GLOBAL BACKGROUND ORCHESTRATION --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary/5 dark:bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-500/5 dark:bg-orange-900/10 rounded-full blur-[140px]" />
      </div>

      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border px-4 py-2 flex items-center justify-between shadow-sm relative">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-[1.1rem] font-bold tracking-tight">Dwllr.ai</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { logout(); navigate("/"); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 relative z-10">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border z-50">
        <div className="flex justify-around items-center py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path || location.pathname.startsWith(tab.path + "/");
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[0.68rem] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}