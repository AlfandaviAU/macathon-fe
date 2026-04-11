import { useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../store";
import { CheckCircle2, MapPin, Loader2, ChevronLeft } from "lucide-react";
import axios from "axios";
import { getSavedToken } from "../services/auth";

// --- Constants & Types ---
const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

type QuestionBase = { id: string; category: string; question: string };
type TextQ = QuestionBase & { type: "text" };
type NumberQ = QuestionBase & { type: "number" };
type ScaleQ = QuestionBase & { type: "scale"; min: number; max: number };
type RangeQ = QuestionBase & { type: "range"; min: number; max: number };
type BooleanQ = QuestionBase & { type: "boolean" };
type DateLeaseQ = QuestionBase & { type: "date_lease" };

export type OnboardingQuestion = TextQ | NumberQ | ScaleQ | RangeQ | BooleanQ | DateLeaseQ;

export const TENANT_ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  { id: "1_name", category: "Core Profile", question: "What's your full name?", type: "text" },
  { id: "2_age", category: "Core Profile", question: "How old are you?", type: "number" },
  { id: "3_occupation", category: "Core Profile", question: "What do you do for work?", type: "text" },
  { id: "4_common_locations", category: "Lifestyle", question: "Where do you usually hang out?", type: "text" },
  { id: "5_study_locations", category: "Lifestyle", question: "Work or Study location?", type: "text" },
  { id: "14_wfh_status", category: "Lifestyle", question: "Days per week you work from home?", type: "scale", min: 0, max: 7 },
  { id: "6_personality_traits", category: "Vibe", question: "How extroverted are you?", type: "scale", min: 1, max: 5 },
  { id: "7_budget_range", category: "Financials", question: "Weekly budget range ($)", type: "range", min: 0, max: 2000 },
  { id: "8_distance_preference", category: "Logistics", question: "Preferred distance to campus (km)?", type: "number" },
  { id: "9_move_in_date", category: "Financials", question: "Move-in date & Lease length", type: "date_lease" },
  { id: "10_parking_requirement", category: "Logistics", question: "Do you require parking?", type: "boolean" },
  { id: "11_cleanliness_level", category: "Living Habits", question: "How much do you prioritise cleanliness?", type: "scale", min: 1, max: 5 },
  { id: "12_social_battery", category: "Living Habits", question: "How social would you like the house to be?", type: "scale", min: 1, max: 5 },
  { id: "13_guest_policy", category: "Living Habits", question: "How often do you plan to have guests?", type: "scale", min: 1, max: 5 },
  { id: "15_bathroom_preference", category: "Preferences", question: "Do you require a private bathroom?", type: "boolean" },
  { id: "16_pet_question", category: "Preferences", question: "Are you okay with pets in the house?", type: "boolean" },
  { id: "17_utility_preferences", category: "Logistics", question: "Are shared utilities okay?", type: "boolean" },
  { id: "18_smoking_vaping", category: "Logistics", question: "Smoking/Vaping preference?", type: "boolean" },
  { id: "19_dietary_practices", category: "Logistics", question: "Dietary/Religious requirements?", type: "text" },
  { id: "20_allergies", category: "Logistics", question: "Allergies (Pets, dust, etc.)", type: "text" }
];

// --- Helpers ---
function isValidAnswer(q: OnboardingQuestion, v: any): boolean {
  if (v === undefined || v === null) return false;
  switch (q.type) {
    case "text": return typeof v === "string" && v.trim().length > 0;
    case "number": return typeof v === "number" && !Number.isNaN(v);
    case "scale": return typeof v === "number" && v >= q.min;
    case "range": return v && typeof v.min === 'number' && typeof v.max === 'number' && v.max >= v.min;
    case "boolean": return typeof v === "boolean";
    case "date_lease": return v && !!v.moveInDate && !!v.leaseLengthMonths;
    default: return false;
  }
}

export function TenantOnboarding() {
  const { user, setUser } = useApp();
  const navigate = useNavigate();

  const [stage, setStage] = useState<"questionnaire" | "complete">("questionnaire");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const q = TENANT_ONBOARDING_QUESTIONS[qIdx];
  const currentVal = answers[q?.id];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const isLoc = q?.id.includes("locations");
    const val = typeof currentVal === "string" ? currentVal : "";
    if (!isLoc || val.length < 3 || !showSuggestions) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`/google-api/maps/api/place/autocomplete/json`, {
          params: { input: val, types: "geocode", key: GOOGLE_KEY },
        });
        if (res.data.predictions) setSuggestions(res.data.predictions);
      } catch (err) { console.error(err); } finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [currentVal, q?.id, showSuggestions]);

  const patchAnswer = (val: any) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const handleContinue = useCallback(() => {
    if (!isValidAnswer(q, currentVal)) return;
    if (qIdx < TENANT_ONBOARDING_QUESTIONS.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      setStage("complete");
    }
  }, [q, currentVal, qIdx]);

  const selectAndContinue = useCallback((val: any) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
    setTimeout(() => {
      if (qIdx < TENANT_ONBOARDING_QUESTIONS.length - 1) {
        setQIdx(qIdx + 1);
      } else {
        setStage("complete");
      }
    }, 200);
  }, [q, qIdx]);

  const handleBack = () => {
    if (qIdx > 0) setQIdx(qIdx - 1);
    else navigate(-1);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleContinue();
    }
  };

  const finish = async () => {
    setIsSubmitting(true);
    try {
      const formattedResponses: Record<string, any> = {};

      TENANT_ONBOARDING_QUESTIONS.forEach(question => {
        const val = answers[question.id];
        if (question.type === "range") {
          formattedResponses[question.id] = `${val.min}-${val.max}`;
        } else if (question.type === "date_lease") {
          formattedResponses[question.id] = `${val.moveInDate}, ${val.leaseLengthMonths} month lease`;
        } else {
          formattedResponses[question.id] = val;
        }
      });

      const payload = {
        user_id: user?.id,
        responses: formattedResponses
      };

      await axios.post(`${API_BASE_URL}/onboarding/quiz`, payload, {
        headers: { Authorization: `Bearer ${getSavedToken()}` }
      });

      if (user) {
        setUser({ ...user, onboardingAnswers: formattedResponses, onboarded: true });
      }
      navigate("/swipe");
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to save your profile. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 rounded-2xl bg-muted/40 border border-transparent focus:border-primary/20 focus:bg-card outline-none transition-all text-[0.9rem] font-medium";

  return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <button onClick={handleBack} className="p-1 -ml-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft size={20} />
            </button>
            <span className="text-[0.75rem] font-bold uppercase tracking-widest text-primary">
            {stage === "questionnaire" ? q.category : "Onboarding"}
          </span>
            <span className="text-[0.8rem] font-medium text-muted-foreground">
            {qIdx + 1}/{TENANT_ONBOARDING_QUESTIONS.length}
          </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${((qIdx + 1) / TENANT_ONBOARDING_QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto w-full">
          {stage === "questionnaire" && q && (
              <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">{q.question}</h2>
                </div>

                <div className="space-y-4">
                  {q.type === "text" && (
                      <div className="relative" ref={q.id.includes("locations") ? suggestionRef : null}>
                        <div className="relative">
                          <input
                              type="text"
                              className={inputClass}
                              value={typeof currentVal === "string" ? currentVal : ""}
                              onChange={(e) => { patchAnswer(e.target.value); setShowSuggestions(true); }}
                              onKeyDown={handleKeyDown}
                              placeholder="Type your answer..."
                          />
                          {isSearching && <Loader2 className="absolute right-4 top-4 w-4 h-4 animate-spin text-primary" />}
                        </div>
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                              {suggestions.map((s) => (
                                  <button key={s.place_id} onClick={() => { patchAnswer(s.description); setShowSuggestions(false); }} className="w-full px-4 py-3.5 text-left text-sm hover:bg-muted flex items-center gap-3 border-b border-border/50 last:border-0 transition-colors">
                                    <MapPin size={16} className="text-primary shrink-0" />
                                    <span className="truncate font-medium">{s.description}</span>
                                  </button>
                              ))}
                            </div>
                        )}
                      </div>
                  )}

                  {q.type === "number" && (
                      <input type="number" className={inputClass} value={typeof currentVal === "number" ? currentVal : ""} onChange={(e) => patchAnswer(Number(e.target.value))} onKeyDown={handleKeyDown} />
                  )}

                  {q.type === "scale" && (
                      <div className="flex justify-between gap-2">
                        {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map((num) => (
                            <button key={num} onClick={() => selectAndContinue(num)} className={`flex-1 aspect-square rounded-2xl font-black text-lg transition-all border-2 ${currentVal === num ? "bg-primary text-white border-primary shadow-lg shadow-primary/30" : "bg-card border-transparent text-muted-foreground hover:border-primary/20"}`}>
                              {num}
                            </button>
                        ))}
                      </div>
                  )}

                  {q.type === "range" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-muted-foreground ml-2">Min Price</span>
                          <input type="number" className={inputClass} value={currentVal?.min || ""} onChange={(e) => patchAnswer({ ...(currentVal || {}), min: +e.target.value })} onKeyDown={handleKeyDown} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-muted-foreground ml-2">Max Price</span>
                          <input type="number" className={inputClass} value={currentVal?.max || ""} onChange={(e) => patchAnswer({ ...(currentVal || {}), max: +e.target.value })} onKeyDown={handleKeyDown} />
                        </div>
                      </div>
                  )}

                  {q.type === "boolean" && (
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => selectAndContinue(true)} className={`py-5 rounded-3xl font-black transition-all border-2 ${currentVal === true ? "bg-primary text-white border-primary" : "bg-card border-transparent"}`}>Yes</button>
                        <button onClick={() => selectAndContinue(false)} className={`py-5 rounded-3xl font-black transition-all border-2 ${currentVal === false ? "bg-primary text-white border-primary" : "bg-card border-transparent"}`}>No</button>
                      </div>
                  )}

                  {q.type === "date_lease" && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-muted-foreground ml-2">Move-in Date</span>
                          <input type="date" className={inputClass} value={currentVal?.moveInDate || ""} onChange={(e) => patchAnswer({ ...(currentVal || {}), moveInDate: e.target.value })} onKeyDown={handleKeyDown} />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-muted-foreground ml-2">Lease Length (Months)</span>
                          <input type="number" placeholder="e.g. 12" className={inputClass} value={currentVal?.leaseLengthMonths || ""} onChange={(e) => patchAnswer({ ...(currentVal || {}), leaseLengthMonths: +e.target.value })} onKeyDown={handleKeyDown} />
                        </div>
                      </div>
                  )}

                  {q.type !== "boolean" && q.type !== "scale" && (
                      <button
                          disabled={!isValidAnswer(q, currentVal)}
                          onClick={handleContinue}
                          className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 disabled:opacity-30 transition-all mt-4"
                      >
                        Continue
                      </button>
                  )}
                </div>
              </div>
          )}

          {stage === "complete" && (
              <div className="text-center space-y-8 w-full animate-in zoom-in-95">
                <div className="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center mx-auto shadow-xl shadow-green-500/10">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black tracking-tight">You're verified!</h2>
                  <p className="text-muted-foreground">Your profile is live. Let's find your next home.</p>
                </div>
                <button
                    onClick={finish}
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-5 rounded-[2rem] font-black text-lg shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : "Start Swiping"}
                </button>
              </div>
          )}
        </div>
      </div>
  );
}