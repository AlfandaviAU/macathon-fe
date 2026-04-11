import { Outlet, useNavigate, useLocation, Navigate } from "react-router";
import { useApp, AppProvider } from "../store";
import { Home, Search, Heart, User, Building2, LogOut, Loader2 } from "lucide-react";

export function AppProviderLayout() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}

const PUBLIC_PATHS = ["/", "/auth"];

export function ProtectedRoute() {
  const { user, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export function Layout() {
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

  const isPublic = PUBLIC_PATHS.includes(location.pathname);
  if (!user && isPublic) {
    return <Outlet />;
  }
  if (!user) {
    return <Navigate to="/auth" replace />;
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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Home className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-[1.25rem]" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Dwllr</span>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="text-muted-foreground hover:text-foreground p-2"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[0.68rem]">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}