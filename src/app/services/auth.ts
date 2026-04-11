import api from "./api";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  role: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "tenant" | "landlord";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  bio: string | null;
  profile_image_url: string | null;
  personality_label: string | null;
  tags: string[] | null;
  preferences: Record<string, unknown> | null;
  raw_quiz_results: Record<string, unknown> | null;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/users/me");
  return data;
}

export function saveAuth(auth: AuthResponse) {
  localStorage.setItem("access_token", auth.access_token);
  localStorage.setItem("user_id", auth.user_id);
  localStorage.setItem("user_role", auth.role);
}

export function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("user_role");
}

export function getSavedToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getSavedRole(): string | null {
  return localStorage.getItem("user_role");
}

export function getSavedUserId(): string | null {
  return localStorage.getItem("user_id");
}
