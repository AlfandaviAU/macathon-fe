import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../store";
import { api } from "../../lib/api";
import { Camera, CheckCircle2, ChevronRight, Shield, Loader2 } from "lucide-react";

interface Question {
  id: string;
  category: string;
  question: string;
  type: string;
  min?: number;
  max?: number;
}

const ANSWER_OPTIONS = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

type Stage = "liveliness" | "questions" | "complete";

export function TenantOnboarding() {
  const { user, refreshUser, isOnboarded } = useApp();
  const navigate = useNavigate();
  const isRedo = isOnboarded();
  const [stage, setStage] = useState<Stage>(isRedo ? "questions" : "liveliness");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [selfieReady, setSelfieReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<{ questions: Question[] }>("/questions/")
      .then((data) => setQuestions(data.questions))
      .catch((err) => console.error("Failed to load questions:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalSteps = questions.length + (isRedo ? 0 : 1);
  const currentStep = stage === "liveliness" ? 1 : stage === "questions" ? (isRedo ? 1 : 2) + currentIdx : totalSteps;
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  const current = questions[currentIdx];

  const answerQuestion = (val: number) => {
    const updated = { ...responses, [current.id]: val };
    setResponses(updated);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setStage("complete");
    }
  };

  const finish = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await api.post("/onboarding/quiz", {
        user_id: user.id,
        responses,
      });
      await refreshUser();
      navigate("/swipe");
    } catch (err) {
      console.error("Quiz submit error:", err);
      navigate("/swipe");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.8rem] text-muted-foreground">
            {stage === "liveliness" ? "Verification" : stage === "questions" ? (current?.category || "Questions") : "Done!"}
          </span>
          <span className="text-[0.8rem] text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
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
                  onClick={() => setStage("questions")}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {stage === "questions" && current && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground text-[0.8rem] mb-1">
                Question {currentIdx + 1} of {questions.length}
              </p>
              <h2 className="text-[1.15rem]">{current.question}</h2>
            </div>
            <div className="space-y-2">
              {current.type === "scale" ? (
                ANSWER_OPTIONS.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => answerQuestion(i + (current.min ?? 1))}
                    className="w-full text-left px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary transition text-[0.9rem]"
                  >
                    {opt}
                  </button>
                ))
              ) : (
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl bg-card border border-border text-[0.9rem]"
                  placeholder="Type your answer..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.target as HTMLInputElement).value) {
                      answerQuestion((e.target as HTMLInputElement).value as any);
                    }
                  }}
                />
              )}
            </div>
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
              onClick={finish}
              disabled={submitting}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Start swiping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
