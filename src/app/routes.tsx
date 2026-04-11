import { createBrowserRouter } from "react-router";
import { AppProviderLayout } from "./components/Layout";
import { Landing } from "./components/Landing";
import { Auth } from "./components/Auth";
import { TenantOnboarding } from "./components/TenantOnboarding";
import { SwipeInterface } from "./components/SwipeInterface";
import { MatchesDashboard } from "./components/MatchesDashboard";
import { PropertyDetail } from "./components/PropertyDetail";
import { LandlordDashboard } from "./components/LandlordDashboard";
import { ProfileEdit } from "./components/ProfileEdit";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppProviderLayout,
    children: [
      { index: true, Component: Landing },
      { path: "auth", Component: Auth },
      { path: "onboarding", Component: TenantOnboarding },
      { path: "swipe", Component: SwipeInterface },
      { path: "matches", Component: MatchesDashboard },
      { path: "property/:id", Component: PropertyDetail },
      { path: "landlord", Component: LandlordDashboard },
      { path: "profile", Component: ProfileEdit },
      { path: "*", Component: Landing },
    ],
  },
]);