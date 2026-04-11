import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getMe, getSavedToken, clearAuth, type UserProfile } from "./services/auth";

export type UserType = "landlord" | "tenant" | null;

/** Weekly budget range (question `7_budget_range`). */
export type OnboardingBudgetRange = { min: number; max: number };

/** Move-in date + lease length on one step (question `9_move_in_date`). */
export type OnboardingMoveInLease = { moveInDate: string; leaseLengthMonths: number };

/** Values collected during tenant onboarding (keyed by question `id`). */
export type OnboardingAnswerValue =
  | string
  | number
  | boolean
  | OnboardingBudgetRange
  | OnboardingMoveInLease;

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo: string;
  bio: string;
  type: UserType;
  onboarded: boolean;
  onboardingAnswers: Record<string, OnboardingAnswerValue>;
  lastSuperInterestTime: number | null;
}

function profileToUser(profile: UserProfile): User {
  const hasQuizResults = profile.raw_quiz_results && Object.keys(profile.raw_quiz_results).length > 0;
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? "",
    photo: profile.profile_image_url ?? "",
    bio: profile.bio ?? "",
    type: (profile.role as UserType) ?? "tenant",
    onboarded: profile.role === "landlord" || !!hasQuizResults,
    onboardingAnswers: (profile.raw_quiz_results as Record<string, OnboardingAnswerValue>) ?? {},
    lastSuperInterestTime: null,
  };
}

export interface Property {
  id: string;
  landlordId: string;
  address: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  garages: number;
  weeklyPrice: number;
  maxTenants: number;
  expiryDate: string;
  tenantPreferences: string[];
  matchedTenants: string[];
  interestedTenants: string[];
  active: boolean;
}

export interface TenantProfile {
  id: string;
  name: string;
  photo: string;
  bio: string;
  phone: string;
  traits: string[];
  chorePrefs: string[];
}

interface SwipeRecord {
  propertyId: string;
  direction: "left" | "right";
  timestamp: number;
}

interface AppState {
  user: User | null;
  setUser: (u: User | null) => void;
  authLoading: boolean;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  properties: Property[];
  setProperties: (p: Property[]) => void;
  swipes: SwipeRecord[];
  addSwipe: (s: SwipeRecord) => void;
  superInterests: { propertyId: string; timestamp: number }[];
  addSuperInterest: (propertyId: string) => void;
  withdrawInterest: (propertyId: string) => void;
  unmatchFromProperty: (propertyId: string) => void;
  canSuperInterest: () => boolean;
  tenantProfiles: TenantProfile[];
}

const AppContext = createContext<AppState>({} as AppState);
export const useApp = () => useContext(AppContext);

const MOCK_TENANT_PROFILES: TenantProfile[] = [
  { id: "t1", name: "Alex Chen", photo: "https://images.unsplash.com/photo-1762753674498-73ec49feafc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0JTIwaGVhZHNob3R8ZW58MXx8fHwxNzc1ODE1MjIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", bio: "Software dev who loves cooking and hiking on weekends.", phone: "0412345678", traits: ["Tidy", "Early riser", "Introvert"], chorePrefs: ["Cooking", "Vacuuming"] },
  { id: "t2", name: "Sarah Miller", photo: "https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHBvcnRyYWl0JTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3NTgwNzAwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", bio: "Grad student, neat freak, loves board games.", phone: "0423456789", traits: ["Very tidy", "Night owl", "Social"], chorePrefs: ["Dishes", "Bins", "Mopping"] },
  { id: "t3", name: "James Wilson", photo: "https://images.unsplash.com/photo-1653146889633-f06eb8489789?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBjYXN1YWwlMjBwb3J0cmFpdCUyMHNtaWxlfGVufDF8fHx8MTc3NTc0NTgzMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", bio: "Musician working in hospitality. Chill and easy-going.", phone: "0434567890", traits: ["Relaxed", "Night owl", "Creative"], chorePrefs: ["Bins", "Yard work"] },
  { id: "t4", name: "Priya Patel", photo: "https://images.unsplash.com/photo-1705830337569-47a1a24b0ad2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBjYXN1YWx8ZW58MXx8fHwxNzc1NzIzMjkxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", bio: "Nurse, yoga enthusiast, plant mom. Love a clean space!", phone: "0445678901", traits: ["Tidy", "Early riser", "Quiet"], chorePrefs: ["Cooking", "Laundry", "Bathroom cleaning"] },
];

const MOCK_PROPERTIES: Property[] = [
  { id: "p1", landlordId: "l1", address: "42 Harbour St, Sydney NSW 2000", images: ["https://images.unsplash.com/photo-1559329146-807aff9ff1fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDF8fHx8MTc3NTgyNTAyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", "https://images.unsplash.com/photo-1639059851892-95c80412298c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwbGl2aW5nJTIwcm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTc3NTgyNTAyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", "https://images.unsplash.com/photo-1597497522150-2f50bffea452?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBraXRjaGVuJTIwYXBhcnRtZW50fGVufDF8fHx8MTc3NTgxMTkyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"], bedrooms: 4, bathrooms: 2, garages: 1, weeklyPrice: 1200, maxTenants: 4, expiryDate: "2026-06-01", tenantPreferences: ["Tidy", "Non-smoker", "Quiet after 10pm"], matchedTenants: ["t1", "t2"], interestedTenants: ["t1"], active: true },
  { id: "p2", landlordId: "l1", address: "15 Chapel Rd, Bankstown NSW 2200", images: ["https://images.unsplash.com/photo-1712832866094-898b5c1b882b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdWJ1cmJhbiUyMGhvdXNlJTIwcmVudGFsfGVufDF8fHx8MTc3NTgyNTAyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", "https://images.unsplash.com/photo-1662454419736-de132ff75638?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWRyb29tJTIwbW9kZXJuJTIwYXBhcnRtZW50fGVufDF8fHx8MTc3NTgyNTAyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"], bedrooms: 3, bathrooms: 1, garages: 2, weeklyPrice: 900, maxTenants: 3, expiryDate: "2026-05-15", tenantPreferences: ["Friendly", "Pet-friendly"], matchedTenants: ["t3", "t4", "t1"], interestedTenants: ["t3", "t4"], active: true },
  { id: "p3", landlordId: "l1", address: "8 Ocean Ave, Bondi Beach NSW 2026", images: ["https://images.unsplash.com/photo-1639059851892-95c80412298c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwbGl2aW5nJTIwcm9vbSUyMGludGVyaW9yfGVufDF8fHx8MTc3NTgyNTAyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral", "https://images.unsplash.com/photo-1559329146-807aff9ff1fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDF8fHx8MTc3NTgyNTAyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"], bedrooms: 5, bathrooms: 3, garages: 2, weeklyPrice: 2000, maxTenants: 5, expiryDate: "2026-07-01", tenantPreferences: ["Active lifestyle", "Social"], matchedTenants: ["t2"], interestedTenants: [], active: true },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(!!getSavedToken());
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [swipes, setSwipes] = useState<SwipeRecord[]>([]);
  const [superInterests, setSuperInterests] = useState<{ propertyId: string; timestamp: number }[]>([]);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const profile = await getMe();
      const u = profileToUser(profile);
      setUser(u);
      return u;
    } catch {
      clearAuth();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!getSavedToken()) return;
    refreshUser().finally(() => setAuthLoading(false));
  }, [refreshUser]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const addSwipe = (s: SwipeRecord) => setSwipes((prev) => [...prev, s]);

  const canSuperInterest = () => {
    if (superInterests.length === 0) return true;
    const last = superInterests[superInterests.length - 1];
    return Date.now() - last.timestamp > 72 * 60 * 60 * 1000;
  };

  const addSuperInterest = (propertyId: string) => {
    if (!canSuperInterest()) return;
    setSuperInterests((prev) => [...prev, { propertyId, timestamp: Date.now() }]);
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId && user
          ? { ...p, interestedTenants: [...new Set([...p.interestedTenants, user.id])] }
          : p
      )
    );
  };

  const withdrawInterest = (propertyId: string) => {
    setSuperInterests((prev) => prev.filter((s) => s.propertyId !== propertyId));
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId && user
          ? { ...p, interestedTenants: p.interestedTenants.filter((id) => id !== user.id) }
          : p
      )
    );
  };

  const unmatchFromProperty = (propertyId: string) => {
    // Remove from super interests as well
    setSuperInterests((prev) => prev.filter((s) => s.propertyId !== propertyId));
    // Remove from swipes so it disappears from matches
    setSwipes((prev) => prev.filter((s) => s.propertyId !== propertyId));
    // Remove tenant from property's matched and interested lists
    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId && user
          ? {
              ...p,
              matchedTenants: p.matchedTenants.filter((id) => id !== user.id),
              interestedTenants: p.interestedTenants.filter((id) => id !== user.id),
            }
          : p
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        user, setUser, authLoading, logout, refreshUser,
        properties, setProperties,
        swipes, addSwipe,
        superInterests, addSuperInterest, withdrawInterest, unmatchFromProperty, canSuperInterest,
        tenantProfiles: MOCK_TENANT_PROFILES,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}