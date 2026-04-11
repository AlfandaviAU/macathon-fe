import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useApp } from "../store";
import { Home, Eye, EyeOff, Loader2 } from "lucide-react";
import { api, setToken } from "../../lib/api";

interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  role: string;
}

export function Auth() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type") as "tenant" | "landlord" | null;
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let auth: AuthResponse;

      if (isSignUp) {
        auth = await api.post<AuthResponse>("/auth/register", {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: typeParam || "tenant",
        });
      } else {
        auth = await api.post<AuthResponse>("/auth/login", {
          email: form.email,
          password: form.password,
        });
      }

      setToken(auth.access_token);
      const me = await api.get<any>("/users/me");
      login(auth.access_token, me);

      if (me.role === "tenant") {
        const hasQuiz = me.raw_quiz_results && Object.keys(me.raw_quiz_results).length > 0;
        navigate(hasQuiz ? "/swipe" : "/onboarding");
      } else {
        navigate("/landlord");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[0.8rem] rounded-lg px-3 py-2 mb-4">
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
                  required
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
                required
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
                  required
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
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignUp ? "Sign up" : "Log in"}
            </button>
          </form>

          <p className="text-center text-[0.8rem] text-muted-foreground mt-4">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }} className="text-primary hover:underline">
              {isSignUp ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
