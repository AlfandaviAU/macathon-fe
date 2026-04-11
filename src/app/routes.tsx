import { createBrowserRouter } from "react-router";
import { AppProviderLayout, ProtectedLayout } from "./components/Layout";
import { Landing } from "./components/Landing";
import { Auth } from "./components/Auth";
import { TenantOnboarding } from "./components/TenantOnboarding";
import { SwipeInterface } from "./components/SwipeInterface";
import { MatchesDashboard } from "./components/MatchesDashboard";
import { PropertyDetail } from "./components/PropertyDetail";
import { LandlordDashboard } from "./components/LandlordDashboard";
import { ProfileEdit } from "./components/ProfileEdit";
import { PropertyEdit } from "./components/PropertyEdit";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppProviderLayout,
    children: [
      // Public routes - No Layout UI
      { index: true, Component: Landing },
      { path: "auth", Component: Auth },

      // Protected routes - Require authentication AND show Layout UI
      {
        Component: ProtectedLayout,
        children: [
          { path: "onboarding", Component: TenantOnboarding },
          { path: "swipe", Component: SwipeInterface },
          { path: "matches", Component: MatchesDashboard },
          { path: "property/:id", Component: PropertyDetail },
          { path: "edit-property/:id", Component: PropertyEdit },
          { path: "landlord", Component: LandlordDashboard },
          { path: "profile", Component: ProfileEdit },
        ],
      },

      // Fallback route
      { path: "*", Component: Landing },
    ],
  },
]);