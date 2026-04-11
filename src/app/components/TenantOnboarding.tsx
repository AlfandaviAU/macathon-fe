import { useState } from "react";
import { useNavigate } from "react-router";
import { useApp } from "../store";
import { Camera, CheckCircle2, ChevronRight, Shield } from "lucide-react";

const PERSONALITY_QUESTIONS = [
  "Do you like to keep a place tidy?",
  "Are you an early riser or a night owl?",
  "Do you enjoy having friends over often?",
  "How do you feel about pets in the house?",
  "Do you prefer quiet evenings at home?",
  "Are you comfortable sharing groceries?",
  "Do you cook at home frequently?",
  "How sensitive are you to noise?",
  "Do you work from home regularly?",
  "Are you open to shared living spaces?",
  "How would you describe your social energy?",
  "Do you prefer a structured or flexible routine?",
];

const CHORE_QUESTIONS = [
  "Are you comfortable taking the bins out?",
  "Do you mind doing the dishes daily?",
  "Would you vacuum common areas weekly?",
  "Are you okay cleaning the bathroom?",
  "Would you help maintain the yard or balcony?",
  "Are you fine with doing communal laundry loads?",
];

const ANSWER_OPTIONS = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

type Stage = "liveliness" | "personality" | "chores" | "complete";

export function TenantOnboarding() {
  const { user, setUser } = useApp();
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("liveliness");
  const [personalityIdx, setPersonalityIdx] = useState(0);
  const [personalityAnswers, setPersonalityAnswers] = useState<number[]>([]);
  const [choreIdx, setChoreIdx] = useState(0);
  const [choreAnswers, setChoreAnswers] = useState<number[]>([]);
  const [selfieReady, setSelfieReady] = useState(false);

  const totalSteps = PERSONALITY_QUESTIONS.length + CHORE_QUESTIONS.length + 1;
  const currentStep =
    stage === "liveliness" ? 1 :
    stage === "personality" ? 2 + personalityIdx :
    stage === "chores" ? 2 + PERSONALITY_QUESTIONS.length + choreIdx :
    totalSteps;
  const progress = (currentStep / totalSteps) * 100;

  const answerPersonality = (val: number) => {
    const next = [...personalityAnswers, val];
    setPersonalityAnswers(next);
    if (personalityIdx < PERSONALITY_QUESTIONS.length - 1) {
      setPersonalityIdx(personalityIdx + 1);
    } else {
      setStage("chores");
    }
  };

  const answerChore = (val: number) => {
    const next = [...choreAnswers, val];
    setChoreAnswers(next);
    if (choreIdx < CHORE_QUESTIONS.length - 1) {
      setChoreIdx(choreIdx + 1);
    } else {
      setStage("complete");
    }
  };

  const finish = () => {
    if (user) {
      setUser({
        ...user,
        onboarded: true,
        livelinessVerified: true,
        personalityAnswers,
        choreAnswers,
      });
    }
    navigate("/swipe");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.8rem] text-muted-foreground">
            {stage === "liveliness" ? "Verification" : stage === "personality" ? "Personality" : stage === "chores" ? "Chores" : "Done!"}
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
                  onClick={() => setStage("personality")}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {stage === "personality" && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground text-[0.8rem] mb-1">Question {personalityIdx + 1} of {PERSONALITY_QUESTIONS.length}</p>
              <h2 className="text-[1.15rem]">{PERSONALITY_QUESTIONS[personalityIdx]}</h2>
            </div>
            <div className="space-y-2">
              {ANSWER_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => answerPersonality(i)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary transition text-[0.9rem]"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === "chores" && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground text-[0.8rem] mb-1">Chore {choreIdx + 1} of {CHORE_QUESTIONS.length}</p>
              <h2 className="text-[1.15rem]">{CHORE_QUESTIONS[choreIdx]}</h2>
            </div>
            <div className="space-y-2">
              {ANSWER_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => answerChore(i)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-secondary transition text-[0.9rem]"
                >
                  {opt}
                </button>
              ))}
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
