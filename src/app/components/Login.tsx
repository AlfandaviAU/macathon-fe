import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useApp } from "../store";
import { Home, Eye, EyeOff, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { login, saveAuth } from "../services/auth";
import { AxiosError } from "axios";
import { Button } from "./ui/button";

export function Login() {
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { refreshUser } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter your credentials.");
      return;
    }

    setSubmitting(true);
    try {
      const authResponse = await login({
        email: form.email.trim(),
        password: form.password,
      });

      saveAuth(authResponse);
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
      setError(axiosErr.response?.data?.detail || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#030303] text-white">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#e8553d]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#e8553d]/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Home</span>
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-[#e8553d] flex items-center justify-center shadow-lg shadow-[#e8553d]/20">
            <Home className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none">Welcome Back</h1>
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">Log in to your account</p>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] border border-white/10 p-10 shadow-2xl">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[13px] font-bold px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#e8553d]/50 transition-all font-medium"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-[#e8553d]/50 transition-all font-medium pr-12"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#e8553d] hover:bg-[#ff6b54] text-white py-8 rounded-2xl font-black text-lg shadow-xl shadow-[#e8553d]/20 transition-all flex items-center justify-center gap-3 border-none"
            >
              {submitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>LOG IN <ArrowRight className="w-5 h-5" /></>
              )}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-white/40 text-sm font-medium">
              Don't have an account? <br className="sm:hidden" />
              <Link to="/signup/tenant" className="text-[#e8553d] font-black uppercase tracking-widest text-xs ml-2 hover:underline underline-offset-4">
                Join the Tribe
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}