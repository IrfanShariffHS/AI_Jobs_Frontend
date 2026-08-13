import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, Key, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { apiService } from "../../services/api";

interface AiKeyStatusBannerProps {
  onNavigateToSettings: (section?: string) => void;
}

export function AiKeyStatusBanner({ onNavigateToSettings }: AiKeyStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hasKeys, setHasKeys] = useState<boolean | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await apiService.get<{
        hasAnyKey: boolean;
        usingSystemFallback: boolean;
        requiresApiKeySetup: boolean;
      }>("/api/ai-config/status");
      if (res.success && res.data) {
        setHasKeys(res.data.hasAnyKey);
        setUsingFallback(res.data.usingSystemFallback ?? false);
      }
    } catch {
      // silently ignore — banner is non-critical
    }
  };

  // Only show when user has NO keys (not even system fallback covers everything)
  const shouldShow = hasKeys === false && !dismissed;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-4 py-2.5 text-xs"
            style={{
              background: "linear-gradient(90deg, hsl(var(--primary) / 0.12), hsl(var(--chart-1) / 0.08))",
              borderBottom: "1px solid hsl(var(--primary) / 0.2)",
            }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">AI features not configured.</span>{" "}
                {usingFallback
                  ? "Currently using limited system keys. Add your own keys for full AI functionality."
                  : "Add your Gemini and Groq API keys to enable trending skills, resume analysis, and job matching."}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                id="banner-add-keys-btn"
                size="sm"
                variant="outline"
                onClick={() => onNavigateToSettings("api")}
                className="h-6 text-[11px] px-2.5 gap-1 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Key size={10} /> Add Keys <ArrowRight size={10} />
              </Button>
              <button
                id="banner-dismiss-btn"
                onClick={() => setDismissed(true)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
