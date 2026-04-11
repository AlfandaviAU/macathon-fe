import { useState } from "react";
import { useNavigate } from "react-router";
import { useApp, type OnboardingAnswerValue } from "../store";
import { Camera, CheckCircle2, ChevronRight, Shield } from "lucide-react";

type QuestionBase = { id: string; category: string; question: string };

type TextQ = QuestionBase & { type: "text" };
type NumberQ = QuestionBase & { type: "number" };
type ScaleQ = QuestionBase & { type: "scale"; min: number; max: number };
type RangeQ = QuestionBase & { type: "range"; min: number; max: number };
type BooleanQ = QuestionBase & { type: "boolean" };

export type OnboardingQuestion = TextQ | NumberQ | ScaleQ | RangeQ | BooleanQ;

export const TENANT_ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  { id: "1_name", category: "Core Profile", question: "What is your full name?", type: "text" },
  { id: "2_age", category: "Core Profile", question: "What is your age?", type: "number" },
  { id: "3_occupation", category: "Core Profile", question: "What is your occupation?", type: "text" },
  { id: "4_common_locations", category: "Core Profile", question: "Common locations (Where you hang out)", type: "text" },
  { id: "5_study_locations", category: "Core Profile", question: "Work/Study locations (For commute calculation)", type: "text" },
  { id: "6_personality_traits", category: "Core Profile", question: "Personality Traits (Introvert vs. Extrovert)", type: "scale", min: 1, max: 5 },

  { id: "7_budget_range", category: "Financial & Location", question: "Budget range per week ($)", type: "range", min: 50, max: 2000 },
  { id: "8_distance_preference", category: "Financial & Location", question: "Distance preference (Max radius in km)", type: "number" },
  { id: "9_move_in_date", category: "Financial & Location", question: "Move-in Date & Lease Length", type: "text" },
  { id: "10_parking_requirement", category: "Financial & Location", question: "Parking requirement?", type: "boolean" },

  { id: "11_cleanliness_level", category: "Lifestyle Big Three", question: "Cleanliness Level (1-5)", type: "scale", min: 1, max: 5 },
  { id: "12_social_battery", category: "Lifestyle Big Three", question: "Social Battery (Quiet sanctuary vs. Social hub)", type: "scale", min: 1, max: 5 },
  { id: "13_guest_policy", category: "Lifestyle Big Three", question: "Guest Policy (How often is too often for friends?)", type: "scale", min: 1, max: 5 },

  { id: "14_wfh_status", category: "Physical & Routine", question: "Work from Home (Days per week)", type: "number" },
  { id: "15_bathroom_preference", category: "Physical & Routine", question: "Bathroom Preference (Private vs. Shared)", type: "boolean" },
  { id: "16_pet_question", category: "Physical & Routine", question: "Are you okay with pets?", type: "boolean" },

  { id: "17_utility_preferences", category: "Logistics", question: "Utility Preferences (Shared bills vs. Separate?)", type: "boolean" },
  { id: "18_smoking_vaping", category: "Logistics", question: "Smoking/Vaping preference?", type: "boolean" },
  { id: "19_dietary_practices", category: "Logistics", question: "Dietary/Religious requirements for kitchen?", type: "text" },
  { id: "20_allergies", category: "Logistics", question: "Allergies (Pets, dust, etc.)", type: "text" },
];

type Stage = "liveliness" | "questionnaire" | "complete";

function isValidAnswer(q: OnboardingQuestion, v: OnboardingAnswerValue | undefined): boolean {
  if (v === undefined) return false;
  switch (q.type) {
    case "text":
      return typeof v === "string" && v.trim().length > 0;
    case "number": {
      if (typeof v !== "number" || Number.isNaN(v)) return false;
      if (q.id === "2_age") return v > 0 && v < 130;
      if (q.id === "14_wfh_status") return v >= 0 && v <= 7;
      return Number.isFinite(v);
    }
    case "scale":
      return typeof v === "number" && v >= q.min && v <= q.max;
    case "range":
      return (
        typeof v === "object" &&
        v !== null &&
        "min" in v &&
        "max" in v &&
        typeof v.min === "number" &&
        typeof v.max === "number" &&
        !Number.isNaN(v.min) &&
        !Number.isNaN(v.max) &&
        v.min >= q.min &&
        v.max <= q.max &&
        v.min <= v.max
      );
    case "boolean":
      return typeof v === "boolean";
    default:
      return false;
  }
}

export function TenantOnboarding() {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("liveliness");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OnboardingAnswerValue>>({});
  const [selfieReady, setSelfieReady] = useState(false);

  const n = TENANT_ONBOARDING_QUESTIONS.length;
  const totalSteps = 1 + n;
  const currentStep =
    stage === "liveliness" ? 1 : stage === "questionnaire" ? 2 + qIdx : totalSteps;
  const progress = (currentStep / totalSteps) * 100;

  const q = TENANT_ONBOARDING_QUESTIONS[qIdx];
  const currentVal = answers[q.id];

  const patchAnswer = (val: OnboardingAnswerValue) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const goNextAfterAnswer = (val: OnboardingAnswerValue) => {
    const next = { ...answers, [q.id]: val };
    setAnswers(next);
    if (qIdx < n - 1) {
      setQIdx(qIdx + 1);
    } else {
      setStage("complete");
    }
  };

  const handleContinue = () => {
    if (!isValidAnswer(q, currentVal)) return;
    if (qIdx < n - 1) {
      setQIdx(qIdx + 1);
    } else {
      setStage("complete");
    }
  };

  const finish = () => {
    if (user) {
      const nameFromOnboarding =
        typeof answers["1_name"] === "string" && answers["1_name"].trim()
          ? answers["1_name"].trim()
          : user.name;
      setUser({
        ...user,
        name: nameFromOnboarding,
        onboarded: true,
        livelinessVerified: true,
        onboardingAnswers: answers,
      });
    }
    navigate("/swipe");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-card border border-border text-[0.9rem] focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.8rem] text-muted-foreground">
            {stage === "liveliness"
              ? "Verification"
              : stage === "questionnaire"
                ? q.category
                : "Done!"}
          </span>
          <span className="text-[0.8rem] text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto w-full">
        {stage === "liveliness" && (
          <div className="text-center space-y-6 w-full">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="mb-2">Liveliness Verification</h2>
              <p className="text-muted-foreground text-[0.9rem]">
                We need to verify you're a real person. Please take a quick selfie to continue.
              </p>
            </div>

            {!selfieReady ? (
              <button
                type="button"
                onClick={() => setSelfieReady(true)}
                className="w-full bg-card border-2 border-dashed border-border rounded-2xl py-12 flex flex-col items-center gap-3 hover:border-primary/40 transition"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-muted-foreground text-[0.85rem]">Tap to take selfie</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                </div>
                <p className="text-green-600 text-[0.9rem]">Verification successful!</p>
                <button
                  type="button"
                  onClick={() => setStage("questionnaire")}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {stage === "questionnaire" && q && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground text-[0.8rem] mb-1">
                Question {qIdx + 1} of {n}
              </p>
              <h2 className="text-[1.15rem]">{q.question}</h2>
            </div>

            {q.type === "text" && (
              <div className="space-y-4">
                <input
                  type="text"
                  className={inputClass}
                  value={typeof currentVal === "string" ? currentVal : ""}
                  onChange={(e) => patchAnswer(e.target.value)}
                  placeholder="Your answer"
                />
                <button
                  type="button"
                  disabled={!isValidAnswer(q, currentVal)}
                  onClick={handleContinue}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            )}

            {q.type === "number" && (
              <div className="space-y-4">
                <input
                  type="number"
                  className={inputClass}
                  value={typeof currentVal === "number" && Number.isFinite(currentVal) ? currentVal : ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      patchAnswer(Number.NaN);
                      return;
                    }
                    patchAnswer(Number(raw));
                  }}
                  placeholder={q.id === "14_wfh_status" ? "0–7" : undefined}
                  min={q.id === "14_wfh_status" ? 0 : undefined}
                  max={q.id === "14_wfh_status" ? 7 : undefined}
                />
                <button
                  type="button"
                  disabled={!isValidAnswer(q, currentVal)}
                  onClick={handleContinue}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            )}

            {q.type === "scale" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => goNextAfterAnswer(num)}
                      className={`min-w-[2.75rem] px-3 py-2.5 rounded-xl border text-[0.9rem] transition ${
                        currentVal === num
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:border-primary/50"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {q.type === "range" && (
              <div className="space-y-4">
                <p className="text-[0.8rem] text-muted-foreground text-center">
                  Min ${q.min} – max ${q.max} per week
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[0.75rem] text-muted-foreground block mb-1">Min ($)</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={
                        typeof currentVal === "object" && currentVal && "min" in currentVal
                          ? currentVal.min
                          : ""
                      }
                      onChange={(e) => {
                        const min = Number(e.target.value);
                        const prev =
                          typeof currentVal === "object" && currentVal && "max" in currentVal
                            ? currentVal
                            : { min: q.min, max: q.max };
                        patchAnswer({ ...prev, min });
                      }}
                      min={q.min}
                      max={q.max}
                    />
                  </div>
                  <div>
                    <label className="text-[0.75rem] text-muted-foreground block mb-1">Max ($)</label>
                    <input
                      type="number"
                      className={inputClass}
                      value={
                        typeof currentVal === "object" && currentVal && "max" in currentVal
                          ? currentVal.max
                          : ""
                      }
                      onChange={(e) => {
                        const max = Number(e.target.value);
                        const prev =
                          typeof currentVal === "object" && currentVal && "min" in currentVal
                            ? currentVal
                            : { min: q.min, max: q.max };
                        patchAnswer({ ...prev, max });
                      }}
                      min={q.min}
                      max={q.max}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!isValidAnswer(q, currentVal)}
                  onClick={handleContinue}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            )}

            {q.type === "boolean" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => goNextAfterAnswer(true)}
                  className="py-3.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary transition text-[0.9rem]"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => goNextAfterAnswer(false)}
                  className="py-3.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary transition text-[0.9rem]"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}

        {stage === "complete" && (
          <div className="text-center space-y-6 w-full">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h2 className="mb-2">You're all set!</h2>
              <p className="text-muted-foreground text-[0.9rem]">
                Your profile is ready. Start discovering properties and finding your perfect housemates.
              </p>
            </div>
            <button
              type="button"
              onClick={finish}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl"
            >
              Start swiping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
