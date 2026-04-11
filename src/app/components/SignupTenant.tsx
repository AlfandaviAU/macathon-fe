import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useApp } from "../store";
import { Home, Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, Sparkles, User, Mail, Phone, Lock } from "lucide-react";
import { register, saveAuth } from "../services/auth";
import { AxiosError } from "axios";
import { Button } from "./ui/button";

export function SignupTenant() {
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { refreshUser } = useApp();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || form.password.length < 8) {
      setError("Please fill out all fields correctly.");
      return;
    }

    setSubmitting(true);
    try {
      const authResponse = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: "tenant",
      });

      saveAuth(authResponse);
      await refreshUser();
      navigate("/onboarding");
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || "Something went wrong. Try a different email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#faf9f7] text-[#1a1a2e] overflow-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#e8553d]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-xl relative z-10 flex flex-col items-center">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition-colors mb-8 group self-start"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Back to Home</span>
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e8553d]/10 border border-[#e8553d]/20 mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#e8553d]" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase text-[#1a1a2e]/60">Find your tribe today</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none mb-4 italic">
            Create <span className="text-[#e8553d]">Tenant</span> Account.
          </h1>
          <p className="text-[#1a1a2e]/40 text-lg font-medium max-w-md mx-auto">Build your profile and start matching based on your personality.</p>
        </div>

        <div className="w-full bg-white rounded-[3rem] border border-black/[0.05] p-10 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.04)] relative">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[13px] font-bold px-4 py-3 rounded-2xl mb-8 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-1">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1a1a2e]/40 ml-1 flex items-center gap-2">
                <User className="w-3 h-3 text-[#e8553d]" /> Full Name
              </label>
              <input
                type="text"
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#f5f4f2] border border-transparent focus:bg-white focus:border-[#e8553d]/30 text-[#1a1a2e] placeholder:text-[#1a1a2e]/20 focus:outline-none transition-all font-medium"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2 md:col-span-1">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1a1a2e]/40 ml-1 flex items-center gap-2">
                <Phone className="w-3 h-3 text-[#e8553d]" /> Phone Number
              </label>
              <input
                type="tel"
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#f5f4f2] border border-transparent focus:bg-white focus:border-[#e8553d]/30 text-[#1a1a2e] placeholder:text-[#1a1a2e]/20 focus:outline-none transition-all font-medium"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="04XX XXX XXX"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1a1a2e]/40 ml-1 flex items-center gap-2">
                <Mail className="w-3 h-3 text-[#e8553d]" /> Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-5 py-4 rounded-2xl bg-[#f5f4f2] border border-transparent focus:bg-white focus:border-[#e8553d]/30 text-[#1a1a2e] placeholder:text-[#1a1a2e]/20 focus:outline-none transition-all font-medium"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@email.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1a1a2e]/40 ml-1 flex items-center gap-2">
                <Lock className="w-3 h-3 text-[#e8553d]" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-[#f5f4f2] border border-transparent focus:bg-white focus:border-[#e8553d]/30 text-[#1a1a2e] placeholder:text-[#1a1a2e]/20 focus:outline-none transition-all font-medium pr-12"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1a1a2e]/20 hover:text-[#1a1a2e] transition-colors"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full md:col-span-2 bg-[#e8553d] hover:bg-[#ff6b54] text-white py-8 rounded-2xl font-black text-lg shadow-xl shadow-[#e8553d]/20 transition-all flex items-center justify-center gap-3 border-none mt-4"
            >
              {submitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>SIGN UP NOW <ArrowRight className="w-5 h-5" /></>
              )}
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t border-black/[0.05] text-center flex flex-col sm:flex-row justify-center items-center gap-4">
             <p className="text-[#1a1a2e]/40 text-[13px] font-medium">Already have an account?</p>
             <Link to="/login" className="px-6 py-2.5 bg-black/[0.03] border border-black/[0.05] rounded-full text-[#1a1a2e] font-black uppercase tracking-widest text-[10px] hover:bg-black/[0.05] transition-all">
                Log In Instead
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}