import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Upload, Linkedin, Briefcase, Lock, Mail, Eye, EyeOff,
  Loader2, Check, CheckCircle2, Sparkles, RefreshCw, Shield, AlertCircle,
  Brain, ArrowRight, ArrowLeft, CloudUpload,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { authService } from "../../services/authService";
import {
  onboardingService,
  OnboardingStatus,
  ProfileSnapshot,
} from "../../services/onboardingService";
import { MissingFieldsForm } from "./MissingFieldsForm";

type OnboardingStep = 1 | 2 | 3 | 4;

const STEPS = [
  { label: "Resume", description: "Upload & extract" },
  { label: "Portals", description: "Connect accounts" },
  { label: "Sync", description: "Merge profiles" },
  { label: "Finish", description: "Complete setup" },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1 state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<Record<string, unknown> | null>(null);

  // Step 2 state
  const [naukriEmail, setNaukriEmail] = useState("");
  const [naukriPassword, setNaukriPassword] = useState("");
  const [linkedInEmail, setLinkedInEmail] = useState("");
  const [linkedInPassword, setLinkedInPassword] = useState("");
  const [showNaukriPassword, setShowNaukriPassword] = useState(false);
  const [showLinkedInPassword, setShowLinkedInPassword] = useState(false);
  const [naukriConnected, setNaukriConnected] = useState(false);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [autoConnecting, setAutoConnecting] = useState(false);

  // Step 3 state
  const [syncComplete, setSyncComplete] = useState(false);
  const [syncSources, setSyncSources] = useState<Record<string, boolean>>({});

  // Step 4 state
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>({});

  const refreshStatus = useCallback(async () => {
    const response = await onboardingService.getStatus();
    if (response.success && response.data) {
      const s = response.data;
      setStatus(s);
      setUserEmail(s.email || "");
      setResumeUploaded(s.step1_resumeUploaded);
      setNaukriConnected(s.step2_naukriConnected);
      setLinkedInConnected(s.step3_linkedInConnected);
      setMissingFields(s.missingFields || []);

      if (s.onboardingCompleted) {
        onComplete();
        return;
      }

      if (!s.step1_resumeUploaded) {
        setCurrentStep(1);
      } else if (!s.step2_portalsConnected) {
        setCurrentStep(2);
      } else if (!s.step3_profileSynced) {
        setCurrentStep(3);
      } else if (s.missingFields?.length > 0) {
        setCurrentStep(4);
      } else {
        setCurrentStep(4);
      }
    }
  }, [onComplete]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await refreshStatus();
      const email = authService.getCurrentUserId()
        ? (await onboardingService.getStatus()).data?.email
        : "";
      if (email) {
        setNaukriEmail(email);
        setLinkedInEmail(email);
      }
      setLoading(false);
    }
    init();
  }, [refreshStatus]);

  const handleResumeUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF resume");
      return;
    }
    setResumeFile(file);
    setProcessing(true);
    try {
      const response = await onboardingService.uploadResume(file);
      if (response.success) {
        setResumeUploaded(true);
        toast.success("Resume uploaded and profile extracted!");
        if (response.data?.extractionResult) {
          setExtractedPreview(response.data.extractionResult as Record<string, unknown>);
        }
        await refreshStatus();
      } else {
        toast.error(response.error || "Failed to upload resume");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleResumeUpload(file);
  };

  const handleAutoConnect = async () => {
    setAutoConnecting(true);
    try {
      const response = await onboardingService.autoConnectPortals();
      if (response.success && response.data) {
        const { naukri, linkedIn } = response.data;
        if (naukri.connected) {
          setNaukriConnected(true);
          toast.success("Naukri connected automatically!");
        }
        if (linkedIn.connected) {
          setLinkedInConnected(true);
          toast.success("LinkedIn connected automatically!");
        }
        if (!naukri.connected && !linkedIn.connected) {
          toast.info("No stored credentials found. Please log in manually.");
        }
        await refreshStatus();
      }
    } catch {
      toast.error("Failed to auto-connect portals");
    } finally {
      setAutoConnecting(false);
    }
  };

  const handleConnectNaukri = async () => {
    if (!naukriEmail || !naukriPassword) {
      toast.error("Please enter Naukri credentials");
      return;
    }
    setProcessing(true);
    try {
      const response = await onboardingService.saveNaukriCredentials(naukriEmail, naukriPassword);
      if (response.success) {
        setNaukriConnected(true);
        toast.success("Naukri connected successfully!");
        await refreshStatus();
      } else {
        toast.error(response.error || "Failed to connect Naukri");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleConnectLinkedIn = async () => {
    if (!linkedInEmail || !linkedInPassword) {
      toast.error("Please enter LinkedIn credentials");
      return;
    }
    setProcessing(true);
    try {
      const response = await onboardingService.saveLinkedInCredentials(linkedInEmail, linkedInPassword);
      if (response.success) {
        setLinkedInConnected(true);
        if (response.validated) {
          toast.success("LinkedIn connected successfully!");
        } else if (response.proceedAllowed) {
          toast.info(`LinkedIn credentials saved (proceeding after ${response.attemptCount} failed attempts)`);
        }
        await refreshStatus();
      } else {
        if (response.proceedAllowed) {
          toast.info(`LinkedIn login failed ${response.attemptCount} times. You can now proceed to the next step.`);
          setLinkedInConnected(true);
          await refreshStatus();
        } else {
          toast.error(`${response.message || "Failed to connect LinkedIn"} (Attempt ${response.attemptCount}/3)`);
        }
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleSyncProfile = async () => {
    setProcessing(true);
    try {
      const response = await onboardingService.syncProfile();
      if (response.success && response.data) {
        setSyncComplete(true);
        setSyncSources((response.data.mergedProfile?.dataSources as Record<string, boolean>) || {});
        setMissingFields(response.data.missingFields || []);
        if (response.data.profileComplete) {
          toast.success("Profile fully populated from all sources!");
        } else {
          toast.info(`${response.data.missingFields?.length || 0} field(s) need your input`);
        }
        await refreshStatus();
      } else {
        toast.error(response.error || "Failed to sync profile");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (
      currentStep === 3 &&
      !syncComplete &&
      !processing &&
      (naukriConnected || linkedInConnected)
    ) {
      handleSyncProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, naukriConnected, linkedInConnected]);

  useEffect(() => {
    if (currentStep === 4 && missingFields.length > 0 && !profile.fullName && !profile.currentCity) {
      onboardingService.getMissingFields().then((response) => {
        if (response.success && response.data) {
          setProfile(response.data.profile);
        }
      });
    }
  }, [currentStep, missingFields.length, profile.fullName, profile.currentCity]);

  const handleMissingFieldsSubmit = async (data: Partial<ProfileSnapshot>) => {
    setProcessing(true);
    try {
      const updateResponse = await onboardingService.updateProfile(data);
      if (!updateResponse.success) {
        toast.error(updateResponse.error || "Failed to save profile");
        return;
      }

      const completeResponse = await onboardingService.completeOnboarding();
      if (completeResponse.success && completeResponse.data?.success) {
        toast.success("Onboarding completed!");
        onComplete();
      } else if (completeResponse.data?.missingFields?.length) {
        setMissingFields(completeResponse.data.missingFields);
        toast.error("Please fill in all required fields");
      } else {
        toast.error(completeResponse.error || "Failed to complete onboarding");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setProcessing(true);
    try {
      const completeResponse = await onboardingService.completeOnboarding();
      if (completeResponse.success && completeResponse.data?.success) {
        toast.success("Onboarding completed!");
        onComplete();
      } else if (completeResponse.data?.missingFields?.length) {
        setMissingFields(completeResponse.data.missingFields);
        const missingResponse = await onboardingService.getMissingFields();
        if (missingResponse.success && missingResponse.data) {
          setProfile(missingResponse.data.profile);
        }
        toast.error("Please fill in the remaining required fields");
      } else {
        toast.error(completeResponse.error || "Failed to complete onboarding");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const goToNextStep = async () => {
    if (currentStep === 1 && resumeUploaded) {
      setCurrentStep(2);
      if (status?.hasStoredNaukriCredentials || status?.hasStoredLinkedInCredentials) {
        await handleAutoConnect();
      }
    } else if (currentStep === 2 && (naukriConnected || linkedInConnected)) {
      setCurrentStep(3);
      await handleSyncProfile();
    } else if (currentStep === 3) {
      if (missingFields.length > 0) {
        const missingResponse = await onboardingService.getMissingFields();
        if (missingResponse.success && missingResponse.data) {
          setProfile(missingResponse.data.profile);
          setMissingFields(missingResponse.data.missingFields);
        }
        setCurrentStep(4);
      } else {
        await handleFinishOnboarding();
      }
    }
  };

  const stepTitles: Record<OnboardingStep, { title: string; subtitle: string }> = {
    1: {
      title: "Upload your resume",
      subtitle: "We'll extract your experience, skills, and education with AI",
    },
    2: {
      title: "Connect your portals",
      subtitle: "Link at least one portal (Naukri or LinkedIn) to fill profile gaps automatically",
    },
    3: {
      title: "Syncing your profile",
      subtitle: "Merging data from your resume and connected accounts",
    },
    4: {
      title: missingFields.length > 0 ? "Complete a few details" : "You're all set!",
      subtitle:
        missingFields.length > 0
          ? "Just the fields we couldn't find automatically"
          : "Your profile is ready — start automating your job search",
    },
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-background">
        <Atmosphere />
        <Loader2 className="relative z-10 h-8 w-8 animate-spin text-primary" />
        <p className="relative z-10 text-sm text-muted-foreground">Preparing your setup...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Atmosphere />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/25">
              <Brain size={18} className="text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">
                JobPilot <span className="text-primary">AI</span>
              </p>
              <p className="text-[11px] text-muted-foreground">Account setup</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-normal">
            <Sparkles size={12} className="text-primary" />
            Step {currentStep} of 4
          </Badge>
        </motion.header>

        {/* Stepper */}
        <motion.nav
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-8"
          aria-label="Onboarding progress"
        >
          <ol className="flex items-center">
            {STEPS.map((step, index) => {
              const stepNum = (index + 1) as OnboardingStep;
              const done = stepNum < currentStep;
              const active = stepNum === currentStep;
              return (
                <li key={step.label} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      animate={{
                        scale: active ? 1.05 : 1,
                        boxShadow: active
                          ? "0 0 0 4px color-mix(in oklch, var(--primary) 20%, transparent)"
                          : "0 0 0 0px transparent",
                      }}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                        done && "border-primary bg-primary text-primary-foreground",
                        active && "border-primary bg-primary/15 text-primary",
                        !done && !active && "border-border bg-card/60 text-muted-foreground"
                      )}
                    >
                      {done ? <Check size={16} strokeWidth={2.5} /> : stepNum}
                    </motion.div>
                    <div className="hidden text-center sm:block">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          active || done ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {step.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className="mx-2 mb-6 hidden h-px flex-1 bg-border sm:mb-8 sm:block sm:mx-3">
                      <motion.div
                        className="h-full bg-primary origin-left"
                        initial={false}
                        animate={{ scaleX: done ? 1 : 0 }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  )}
                  {index < STEPS.length - 1 && (
                    <div className="mx-1 mb-0 h-px flex-1 bg-border sm:hidden">
                      <motion.div
                        className="h-full bg-primary origin-left"
                        initial={false}
                        animate={{ scaleX: done ? 1 : 0 }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </motion.nav>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          <div className="border-b border-border/40 px-5 py-5 sm:px-8 sm:py-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {stepTitles[currentStep].title}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {stepTitles[currentStep].subtitle}
            </p>
          </div>

          <div className="flex-1 px-5 py-6 sm:px-8 sm:py-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                {/* Step 1: Resume Upload */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                      }}
                      onDrop={handleDrop}
                      onClick={() => !resumeUploaded && !processing && fileInputRef.current?.click()}
                      className={cn(
                        "relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-10",
                        resumeUploaded
                          ? "cursor-default border-success/40 bg-success/5"
                          : dragActive
                            ? "border-primary bg-primary/10"
                            : "border-border/70 bg-muted/20 hover:border-primary/50 hover:bg-primary/5"
                      )}
                    >
                      {resumeUploaded ? (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="space-y-3"
                        >
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15">
                            <CheckCircle2 className="h-7 w-7 text-success" />
                          </div>
                          <p className="text-base font-medium text-foreground">
                            Resume uploaded and analyzed
                          </p>
                          {resumeFile && (
                            <p className="text-sm text-muted-foreground">{resumeFile.name}</p>
                          )}
                          <Badge
                            variant="secondary"
                            className="gap-1.5 rounded-full border-success/20 bg-success/10 text-success"
                          >
                            <Sparkles size={12} />
                            AI extraction complete
                          </Badge>
                        </motion.div>
                      ) : (
                        <>
                          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                            {processing ? (
                              <Loader2 className="h-7 w-7 animate-spin text-primary" />
                            ) : (
                              <CloudUpload className="h-7 w-7 text-primary" />
                            )}
                          </div>
                          <p className="text-base font-medium text-foreground">
                            {processing ? "Analyzing your resume..." : "Drop your PDF here"}
                          </p>
                          <p className="mt-1.5 text-sm text-muted-foreground">
                            {processing
                              ? "Extracting profile data with AI — this may take a moment"
                              : "or click to browse · PDF only"}
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            disabled={processing}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleResumeUpload(file);
                            }}
                          />
                          {!processing && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-5 rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                            >
                              <Upload size={14} />
                              Choose file
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    {extractedPreview && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-border/50 bg-muted/30 p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <FileText size={16} className="text-primary" />
                          <h4 className="text-sm font-semibold">Profile pre-filled</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Your profile has been populated from your resume. Connect portals next to fill any gaps.
                        </p>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 2: Portal Connection */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/25 p-4">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                        <Shield className="text-accent" size={16} />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-foreground">Secure & encrypted</p>
                        <p className="mt-0.5 text-muted-foreground">
                          Credentials are used only to sync your profile. Prefer the same email as your Gmail
                          {userEmail ? ` (${userEmail})` : ""}.
                        </p>
                      </div>
                    </div>

                    {(status?.hasStoredNaukriCredentials || status?.hasStoredLinkedInCredentials) && (
                      <Button
                        variant="outline"
                        className="h-11 w-full gap-2 rounded-xl"
                        onClick={handleAutoConnect}
                        disabled={autoConnecting}
                      >
                        {autoConnecting ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <RefreshCw size={16} />
                        )}
                        Auto-connect using saved credentials
                      </Button>
                    )}

                    <PortalCard
                      title="Naukri"
                      description="Sync job preferences & profile"
                      icon={Briefcase}
                      accentClass="bg-orange-500/15 text-orange-400"
                      connected={naukriConnected}
                      borderAccent="border-orange-500/25"
                    >
                      {!naukriConnected && (
                        <div className="space-y-3 pt-1">
                          <CredentialField
                            id="naukri-email"
                            label="Email"
                            type="email"
                            icon={Mail}
                            value={naukriEmail}
                            placeholder={userEmail}
                            onChange={setNaukriEmail}
                          />
                          <CredentialField
                            id="naukri-password"
                            label="Password"
                            type={showNaukriPassword ? "text" : "password"}
                            icon={Lock}
                            value={naukriPassword}
                            onChange={setNaukriPassword}
                            showToggle
                            showPassword={showNaukriPassword}
                            onTogglePassword={() => setShowNaukriPassword(!showNaukriPassword)}
                          />
                          <Button
                            variant="outline"
                            className="h-10 w-full rounded-xl"
                            onClick={handleConnectNaukri}
                            disabled={processing}
                          >
                            {processing ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              "Connect Naukri"
                            )}
                          </Button>
                        </div>
                      )}
                    </PortalCard>

                    <PortalCard
                      title="LinkedIn"
                      description="Sync experience & skills"
                      icon={Linkedin}
                      accentClass="bg-blue-500/15 text-blue-400"
                      connected={linkedInConnected}
                      borderAccent="border-blue-500/25"
                    >
                      {!linkedInConnected && (
                        <div className="space-y-3 pt-1">
                          <CredentialField
                            id="linkedin-email"
                            label="Email"
                            type="email"
                            icon={Mail}
                            value={linkedInEmail}
                            placeholder={userEmail}
                            onChange={setLinkedInEmail}
                          />
                          <CredentialField
                            id="linkedin-password"
                            label="Password"
                            type={showLinkedInPassword ? "text" : "password"}
                            icon={Lock}
                            value={linkedInPassword}
                            onChange={setLinkedInPassword}
                            showToggle
                            showPassword={showLinkedInPassword}
                            onTogglePassword={() => setShowLinkedInPassword(!showLinkedInPassword)}
                          />
                          <Button
                            variant="outline"
                            className="h-10 w-full rounded-xl"
                            onClick={handleConnectLinkedIn}
                            disabled={processing}
                          >
                            {processing ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              "Connect LinkedIn"
                            )}
                          </Button>
                        </div>
                      )}
                    </PortalCard>
                  </div>
                )}

                {/* Step 3: Profile Sync */}
                {currentStep === 3 && (
                  <div className="space-y-6 py-2 text-center sm:py-4">
                    {processing ? (
                      <div className="space-y-5">
                        <div className="relative mx-auto h-20 w-20">
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary/20"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          />
                          <motion.div
                            className="absolute inset-2 rounded-full border-2 border-transparent border-t-primary"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-7 w-7 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Syncing your profile</h3>
                          <p className="mt-1.5 text-sm text-muted-foreground">
                            Merging data from your resume and connected portals...
                          </p>
                        </div>
                        <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
                          {[
                            { label: "Resume", icon: FileText },
                            { label: "Naukri", icon: Briefcase },
                            { label: "LinkedIn", icon: Linkedin },
                          ].map((source, i) => (
                            <motion.div
                              key={source.label}
                              initial={{ opacity: 0.4 }}
                              animate={{ opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.35 }}
                              className="rounded-xl border border-border/50 bg-muted/30 px-2 py-3"
                            >
                              <source.icon className="mx-auto mb-1.5 h-4 w-4 text-primary" />
                              <p className="text-[11px] text-muted-foreground">{source.label}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : syncComplete ? (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-5"
                      >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15">
                          <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Profile synchronized</h3>
                          <p className="mt-1.5 text-sm text-muted-foreground">
                            Data merged from all connected sources
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {syncSources.resume && (
                            <Badge variant="secondary" className="gap-1.5 rounded-full">
                              <FileText size={12} /> Resume
                            </Badge>
                          )}
                          {syncSources.naukri && (
                            <Badge variant="secondary" className="gap-1.5 rounded-full">
                              <Briefcase size={12} /> Naukri
                            </Badge>
                          )}
                          {syncSources.linkedin && (
                            <Badge variant="secondary" className="gap-1.5 rounded-full">
                              <Linkedin size={12} /> LinkedIn
                            </Badge>
                          )}
                        </div>
                        {missingFields.length > 0 ? (
                          <div className="mx-auto flex max-w-sm items-center justify-center gap-2 rounded-xl border border-warning/20 bg-warning/10 px-4 py-3 text-warning">
                            <AlertCircle size={16} />
                            <span className="text-sm">
                              {missingFields.length} field{missingFields.length === 1 ? "" : "s"} need your input
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            All required fields populated automatically!
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <div className="space-y-5">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                          <RefreshCw className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Ready to sync</h3>
                          <p className="mt-1.5 text-sm text-muted-foreground">
                            We'll merge your profile data from all connected sources
                          </p>
                        </div>
                        <Button onClick={handleSyncProfile} disabled={processing} className="rounded-xl">
                          Start Sync
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Missing Fields or Complete */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    {missingFields.length > 0 ? (
                      <MissingFieldsForm
                        missingFields={missingFields}
                        profile={profile}
                        onSubmit={handleMissingFieldsSubmit}
                        loading={processing}
                      />
                    ) : (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-5 py-4 text-center"
                      >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15">
                          <CheckCircle2 className="h-8 w-8 text-success" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">You're all set!</h3>
                          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                            Your profile is fully populated from your resume and connected accounts.
                          </p>
                        </div>
                        <Button
                          onClick={handleFinishOnboarding}
                          disabled={processing}
                          size="lg"
                          className="h-11 w-full rounded-xl sm:w-auto sm:min-w-[200px]"
                        >
                          {processing ? (
                            <Loader2 className="animate-spin" size={16} />
                          ) : (
                            <>
                              Get Started
                              <ArrowRight size={16} />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          {currentStep < 4 && (
            <div className="flex items-center justify-between gap-3 border-t border-border/40 px-5 py-4 sm:px-8">
              <Button
                variant="ghost"
                className="rounded-xl"
                onClick={() => setCurrentStep((s) => Math.max(1, s - 1) as OnboardingStep)}
                disabled={currentStep === 1 || processing}
              >
                <ArrowLeft size={16} />
                Previous
              </Button>

              <Button
                className="rounded-xl"
                onClick={goToNextStep}
                disabled={
                  processing ||
                  (currentStep === 1 && !resumeUploaded) ||
                  (currentStep === 2 && (!naukriConnected && !linkedInConnected)) ||
                  (currentStep === 3 && processing)
                }
              >
                {processing ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : currentStep === 3 && syncComplete && missingFields.length === 0 ? (
                  <>
                    Complete Setup
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-28 -right-28 h-[400px] w-[400px] rounded-full bg-primary/18 blur-[120px]" />
      <div className="absolute bottom-0 -left-32 h-[360px] w-[360px] rounded-full bg-accent/12 blur-[110px]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}

function PortalCard({
  title,
  description,
  icon: Icon,
  accentClass,
  connected,
  borderAccent,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  accentClass: string;
  connected: boolean;
  borderAccent: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-muted/15 p-4 transition-colors sm:p-5",
        connected ? "border-success/30 bg-success/5" : borderAccent
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", accentClass)}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {connected && (
          <Badge className="gap-1 rounded-full border-success/20 bg-success/10 text-success hover:bg-success/10">
            <Check size={12} /> Connected
          </Badge>
        )}
      </div>
      {children}
    </div>
  );
}

function CredentialField({
  id,
  label,
  type,
  icon: Icon,
  value,
  placeholder,
  onChange,
  showToggle,
  showPassword,
  onTogglePassword,
}: {
  id: string;
  label: string;
  type: string;
  icon: React.ElementType;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  showToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-10 rounded-xl border-border/70 bg-input/40 pl-10 transition-shadow focus-visible:ring-primary/30",
            showToggle && "pr-10"
          )}
        />
        {showToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
