import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useApp } from "../store";
import { Home, Eye, EyeOff, Loader2 } from "lucide-react";
import { login, register, saveAuth, saveLastLoginEmail, getLastLoginEmail } from "../services/auth";
import { AxiosError } from "axios";

export function Auth() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type") as "tenant" | "landlord" | null;
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [form, setForm] = useState(() => ({
    name: "",
    email: getLastLoginEmail(),
    phone: "",
    password: "",
    confirmPassword: "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { refreshUser } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp && !form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (isSignUp && !form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (isSignUp && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const role = typeParam || "tenant";

      let authResponse;
      if (isSignUp) {
        authResponse = await register({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role,
        });
      } else {
        authResponse = await login({
          email: form.email.trim(),
          password: form.password,
        });
      }

      saveAuth(authResponse);
      saveLastLoginEmail(form.email);
      const currentUser = await refreshUser();

      if (authResponse.role === "landlord") {
        navigate("/landlord");
      } else if (currentUser && currentUser.onboarded) {
        navigate("/swipe");
      } else {
        navigate("/onboarding");
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      const detail = axiosErr.response?.data?.detail;
      if (detail) {
        setError(detail);
      } else if (axiosErr.request && !axiosErr.response) {
        setError("Cannot reach server. Please try again later.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-[1.5rem]" style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Dwllr</span>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-center mb-1">{isSignUp ? "Create account" : "Welcome back"}</h2>
          <p className="text-center text-muted-foreground text-[0.85rem] mb-6">
            {typeParam === "landlord" ? "Landlord account" : "Tenant account"}
          </p>

          {error && (
            <div className="bg-destructive/10 text-destructive text-[0.85rem] px-4 py-2.5 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-[0.8rem] text-muted-foreground mb-1 block">Full name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
            )}
            <div>
              <label className="text-[0.8rem] text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
              />
            </div>
            {isSignUp && (
              <div>
                <label className="text-[0.8rem] text-muted-foreground mb-1 block">Phone number</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="04XX XXX XXX"
                />
              </div>
            )}
            <div>
              <label className="text-[0.8rem] text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {isSignUp && (
              <div>
                <label className="text-[0.8rem] text-muted-foreground mb-1 block">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    className="w-full px-3 py-2.5 rounded-lg bg-input-background border border-border pr-10"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignUp ? "Sign up" : "Log in"}
            </button>
          </form>

          <p className="text-center text-[0.8rem] text-muted-foreground mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => {
                if (isSignUp) setForm((f) => ({ ...f, confirmPassword: "" }));
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-primary hover:underline"
            >
              {isSignUp ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}