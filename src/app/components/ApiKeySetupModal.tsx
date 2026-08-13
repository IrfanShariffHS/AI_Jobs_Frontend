import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Key, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2,
  Sparkles, Brain, Zap, Shield, ExternalLink, ArrowRight,
  Info
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { apiService } from "../../services/api";

interface ApiKeySetupModalProps {
  onComplete: () => void;
  onSkip: () => void;
}

type KeyStatus = "idle" | "saving" | "testing" | "valid" | "invalid";

interface ProviderState {
  key: string;
  showKey: boolean;
  status: KeyStatus;
  errorMsg: string;
}

const initialState: ProviderState = {
  key: "",
  showKey: false,
  status: "idle",
  errorMsg: "",
};

export function ApiKeySetupModal({ onComplete, onSkip }: ApiKeySetupModalProps) {
  const [gemini, setGemini] = useState<ProviderState>({ ...initialState });
  const [groq, setGroq]     = useState<ProviderState>({ ...initialState });
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  const configuredCount = [gemini, groq].filter(p => p.status === "valid").length;

  const update = (
    setter: React.Dispatch<React.SetStateAction<ProviderState>>,
    patch: Partial<ProviderState>
  ) => setter(prev => ({ ...prev, ...patch }));

  const saveAndTest = useCallback(
    async (
      provider: "gemini" | "groq",
      state: ProviderState,
      setter: React.Dispatch<React.SetStateAction<ProviderState>>
    ) => {
      if (!state.key.trim()) {
        toast.error("Please enter an API key first");
        return;
      }
      update(setter, { status: "saving", errorMsg: "" });
      try {
        const saveRes = await apiService.post<{ success: boolean; error?: string }>(
          `/api/ai-config/${provider}`,
          { apiKey: state.key.trim() }
        );
        if (!saveRes.success) {
          update(setter, { status: "invalid", errorMsg: saveRes.error ?? "Failed to save key" });
          toast.error(`Failed to save ${provider === "gemini" ? "Gemini" : "Groq"} key`);
          return;
        }
        update(setter, { status: "testing" });
        const testRes = await apiService.post<{ success: boolean; error?: string }>(
          `/api/ai-config/${provider}/test`,
          {}
        );
        if (testRes.success) {
          update(setter, { status: "valid", errorMsg: "" });
          toast.success(`${provider === "gemini" ? "Gemini" : "Groq"} API key verified ✓`);
        } else {
          update(setter, {
            status: "invalid",
            errorMsg: testRes.error ?? "Key saved but validation failed — check the key and try again",
          });
          toast.error(`${provider === "gemini" ? "Gemini" : "Groq"} key validation failed`);
        }
      } catch {
        update(setter, { status: "invalid", errorMsg: "Network error — please try again" });
        toast.error("Connection error while saving key");
      }
    },
    []
  );

  const handleSkip = () => {
    if (!showSkipWarning) { setShowSkipWarning(true); return; }
    onSkip();
  };

  const handleContinue = () => {
    if (configuredCount === 0) { setShowSkipWarning(true); return; }
    onComplete();
  };

  const statusIcon = (status: KeyStatus) => {
    if (status === "saving" || status === "testing")
      return <Loader2 size={14} className="animate-spin text-primary" />;
    if (status === "valid") return <CheckCircle2 size={14} className="text-emerald-400" />;
    if (status === "invalid") return <AlertCircle size={14} className="text-destructive" />;
    return null;
  };

  const ProviderCard = ({
    provider, state, setter, icon: Icon,
    accentClass, accentDot, title, subtitle,
    placeholder, docsUrl, features,
  }: {
    provider: "gemini" | "groq";
    state: ProviderState;
    setter: React.Dispatch<React.SetStateAction<ProviderState>>;
    icon: React.ElementType;
    accentClass: string;
    accentDot: string;
    title: string;
    subtitle: string;
    placeholder: string;
    docsUrl: string;
    features: string[];
  }) => {
    const busy = state.status === "saving" || state.status === "testing";
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: provider === "gemini" ? 0.1 : 0.2 }}
        className={cn(
          "relative rounded-2xl border p-5 flex flex-col gap-4 transition-all duration-300 bg-card/70 backdrop-blur-sm",
          state.status === "valid"
            ? "border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.08)]"
            : "border-border/60 hover:border-border"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentClass}`}>
              <Icon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {statusIcon(state.status)}
            <Badge variant="outline" className={cn(
              "text-[10px] h-5",
              state.status === "valid" && "border-emerald-500/40 text-emerald-400",
              state.status === "invalid" && "border-destructive/40 text-destructive",
              (busy) && "border-primary/40 text-primary"
            )}>
              {state.status === "valid" ? "Connected" : state.status === "invalid" ? "Invalid"
                : busy ? "Checking…" : "Not Set"}
            </Badge>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] flex items-center justify-between">
            API Key
            <a href={docsUrl} target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 text-[10px]">
              Get free key <ExternalLink size={9} />
            </a>
          </Label>
          <div className="relative">
            <Input
              id={`${provider}-api-key-input`}
              type={state.showKey ? "text" : "password"}
              value={state.key}
              onChange={e => update(setter, { key: e.target.value, status: "idle", errorMsg: "" })}
              placeholder={placeholder}
              className={cn(
                "h-10 text-xs bg-muted/40 pr-10 font-mono",
                state.status === "valid" && "border-emerald-500/40",
                state.status === "invalid" && "border-destructive/40"
              )}
              disabled={busy}
              onKeyDown={e => e.key === "Enter" && saveAndTest(provider, state, setter)}
            />
            <button onClick={() => update(setter, { showKey: !state.showKey })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1} type="button">
              {state.showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {state.errorMsg && (
            <p className="text-[10px] text-destructive flex items-center gap-1 mt-1">
              <AlertCircle size={10} className="flex-shrink-0" /> {state.errorMsg}
            </p>
          )}
        </div>

        <Button
          id={`${provider}-save-test-btn`}
          onClick={() => saveAndTest(provider, state, setter)}
          disabled={!state.key.trim() || busy || state.status === "valid"}
          size="sm"
          className={cn(
            "w-full text-xs h-9 font-medium",
            state.status === "valid" && "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          {busy ? (
            <><Loader2 size={13} className="mr-1.5 animate-spin" />
              {state.status === "saving" ? "Saving…" : "Testing…"}</>
          ) : state.status === "valid" ? (
            <><CheckCircle2 size={13} className="mr-1.5" /> Connected</>
          ) : (
            <><Key size={13} className="mr-1.5" /> Save & Test Key</>
          )}
        </Button>

        <div className="space-y-1 pt-1 border-t border-border/40">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Powers</p>
          <div className="space-y-1">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <div className={`w-1 h-1 rounded-full flex-shrink-0 ${accentDot}`} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.06) 0%, hsl(var(--background)) 70%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 bg-primary" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15 bg-chart-2" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl"
      >
        <div className="rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-5 border-b border-border/40">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles size={16} className="text-primary" />
              </div>
              <span className="text-xs text-primary font-semibold tracking-widest uppercase">One-Time Setup</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Connect Your AI Keys</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              JobPilot AI uses your own keys for trending skills, resume analysis, and job matching.
              Both services offer{" "}
              <span className="text-foreground font-medium">generous free tiers</span> — no credit card needed.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2"
                  animate={{ width: `${(configuredCount / 2) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground shrink-0">
                {configuredCount} / 2 connected
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProviderCard
              provider="gemini" state={gemini} setter={setGemini}
              icon={Brain} accentClass="bg-chart-2/10 text-chart-2" accentDot="bg-chart-2"
              title="Google Gemini" subtitle="Gemini 2.0 Flash · Free tier"
              placeholder="AIza..." docsUrl="https://aistudio.google.com/app/apikey"
              features={["Resume & profile analysis", "Career path recommendations", "Interview prep", "Skill gap analysis"]}
            />
            <ProviderCard
              provider="groq" state={groq} setter={setGroq}
              icon={Zap} accentClass="bg-chart-1/10 text-chart-1" accentDot="bg-chart-1"
              title="Groq (LLaMA 3.3)" subtitle="LLaMA 3.3 70B · Ultra-fast"
              placeholder="gsk_..." docsUrl="https://console.groq.com/keys"
              features={["Trending skills analysis", "Job matching & scoring", "Cover letter generation", "ATS optimization"]}
            />
          </div>

          {/* Security notice */}
          <div className="mx-6 mb-4 flex items-start gap-2.5 rounded-xl bg-muted/30 px-4 py-3 border border-border/40">
            <Shield size={13} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Encrypted &amp; private.</span>{" "}
              Keys are AES-256 encrypted at rest, never logged or shared. Manage them anytime from{" "}
              <span className="text-foreground font-medium">Settings → API &amp; Integrations</span>.
            </p>
          </div>

          {/* Skip warning */}
          <AnimatePresence>
            {showSkipWarning && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }} className="mx-6 mb-4">
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
                  <Info size={13} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-amber-300 leading-relaxed">
                    <span className="font-semibold text-amber-200">AI features won't work without keys.</span>{" "}
                    Trending skills, resume optimization, and job matching will be unavailable.
                    Add them later from <span className="font-medium text-amber-200">Settings → API &amp; Integrations</span>.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="px-8 pb-8 flex items-center justify-between gap-4">
            <button id="api-setup-skip-btn" onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hover:underline underline-offset-4">
              {showSkipWarning ? "Skip anyway" : "Skip for now"}
            </button>
            <Button id="api-setup-continue-btn" onClick={handleContinue} size="sm"
              className="gap-2 text-xs h-9 px-6 font-medium">
              {configuredCount > 0 ? "Continue to Setup" : "Continue"}
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
