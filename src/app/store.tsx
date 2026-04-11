import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { api, getStoredToken, setToken } from "../lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "landlord" | "tenant";
  bio: string;
  profile_image_url: string;
  preferences: Record<string, any> | null;
  raw_quiz_results: Record<string, any> | null;
  persona: any;
  work_location_name: string;
  common_location_name: string;
  approved_property_ids: string[];
}

export interface Property {
  id: string;
  landlord_id: string;
  address: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  garages: number;
  price: number;
  max_tenants: number;
  current_tenants: number;
  expiry_date: string;
  tenant_preferences: string[];
  status: string;
  description: string;
  interested_user_ids: string[];
  approved_user_ids: string[];
  super_liked_user_ids: string[];
  super_liked_by_me: boolean;
  occupancy_rate: number;
}

export interface TenantProfile {
  id: string;
  name: string;
  profile_image_url: string;
  bio: string;
  phone: string;
  preferences: Record<string, any> | null;
  persona: any;
}

interface AppState {
  user: User | null;
  setUser: (u: User | null) => void;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  properties: Property[];
  setProperties: (p: Property[]) => void;
  refreshUser: () => Promise<void>;
  isOnboarded: (u?: User | null) => boolean;
}

const AppContext = createContext<AppState>({} as AppState);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getStoredToken());
  const [properties, setProperties] = useState<Property[]>([]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setTokenState(null);
    setUser(null);
    setProperties([]);
  };

  const refreshUser = async () => {
    try {
      const me = await api.get<User>("/users/me");
      setUser(me);
    } catch {
      logout();
    }
  };

  const isOnboarded = (u?: User | null) => {
    const target = u ?? user;
    if (!target) return false;
    if (target.role === "landlord") return true;
    return !!(target.raw_quiz_results && Object.keys(target.raw_quiz_results).length > 0);
  };

  useEffect(() => {
    if (token && !user) {
      refreshUser();
    }
  }, [token]);

  return (
    <AppContext.Provider
      value={{
        user, setUser,
        token,
        login, logout,
        properties, setProperties,
        refreshUser,
        isOnboarded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
