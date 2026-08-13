import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Lock, User, Phone, ArrowRight, Eye, EyeOff, Loader2,
  ShieldCheck, Brain, Zap, Search, Briefcase, CheckCircle2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "./ui/utils";
import { authService, LoginRequest, RegisterRequest } from "../../services/authService";
import { toast } from "sonner";

interface AuthProps {
  onAuthSuccess: (userId: string, onboardingCompleted: boolean, requiresApiKeySetup?: boolean) => void;
}

type AuthView = "login" | "register" | "verify";

const FEATURES = [
  {
    icon: Search,
    title: "Smart Job Discovery",
    description: "AI finds roles that match your skills and preferences",
  },
  {
    icon: Zap,
    title: "One-Click Apply",
    description: "Automate applications across Naukri and LinkedIn",
  },
  {
    icon: Briefcase,
    title: "Recruiter Outreach",
    description: "Reach hiring managers with personalized messages",
  },
];

export function Auth({ onAuthSuccess }: AuthProps) {
  const [view, setView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loginForm, setLoginForm] = useState<LoginRequest>({
    username: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState<RegisterRequest & {
    fullName: string;
    mobile: string;
    confirmPassword: string;
  }>({
    username: "",
    password: "",
    fullName: "",
    mobile: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setVerificationCode(otpDigits.join(""));
  }, [otpDigits]);

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};
    if (!loginForm.username) newErrors.username = "Email is required";
    else if (!loginForm.username.toLowerCase().endsWith("@gmail.com")) {
      newErrors.username = "Only @gmail.com addresses are supported";
    }
    if (!loginForm.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterForm = () => {
    const newErrors: Record<string, string> = {};
    if (!registerForm.fullName) newErrors.fullName = "Full name is required";
    if (!registerForm.username) newErrors.username = "Email is required";
    else if (!registerForm.username.toLowerCase().endsWith("@gmail.com")) {
      newErrors.username = "Only @gmail.com addresses are supported";
    }
    if (!registerForm.password) newErrors.password = "Password is required";
    if (registerForm.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (registerForm.password !== registerForm.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setLoading(true);
    try {
      const response = await authService.login(loginForm);
      if (response.success && response.data) {
        toast.success("Login successful!");
        onAuthSuccess(response.data.userId.toString(), response.data.onboardingCompleted, response.data.requiresApiKeySetup);
      } else if (response.data?.requiresEmailVerification) {
        setPendingEmail(response.data.email || loginForm.username);
        setView("verify");
        toast.message("Please verify your email to continue");
      } else {
        toast.error(response.error || "Login failed");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setLoading(true);
    try {
      const response = await authService.register({
        username: registerForm.username,
        password: registerForm.password,
      });
      if (response.success && response.data) {
        setPendingEmail(response.data.email || registerForm.username);
        setOtpDigits(["", "", "", "", "", ""]);
        setView("verify");
        toast.success(response.data.message || "Check your email for a verification code");
      } else {
        toast.error(response.error || "Registration failed");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("").trim() || verificationCode.trim();
    if (!code) {
      setErrors({ code: "Verification code is required" });
      return;
    }
    if (code.length < 6) {
      setErrors({ code: "Enter the full 6-digit code" });
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyEmail(pendingEmail, code);
      if (response.success && response.data) {
        toast.success("Email verified successfully!");
        onAuthSuccess(response.data.userId.toString(), response.data.onboardingCompleted, response.data.requiresApiKeySetup);
      } else {
        toast.error(response.error || "Verification failed");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setLoading(true);
    try {
      const response = await authService.resendVerification(pendingEmail);
      if (response.success) {
        toast.success(response.data?.message || "Verification code resent");
        setOtpDigits(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else {
        toast.error(response.error || "Failed to resend code");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setErrors((prev) => ({ ...prev, code: "" }));
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, i) => {
      next[i] = char;
    });
    setOtpDigits(next);
    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };

  const switchView = (next: AuthView) => {
    setView(next);
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const isLogin = view === "login";
  const isVerify = view === "verify";
  const isRegister = view === "register";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-accent/15 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 h-[360px] w-[360px] rounded-full bg-primary/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col lg:flex-row">
        {/* Brand panel */}
        <motion.aside
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:w-[48%] lg:px-12 lg:py-14"
        >
          <div>
            <div className="mb-8 flex items-center gap-3 lg:mb-14">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30"
              >
                <Brain size={22} className="text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  JobPilot <span className="text-primary">AI</span>
                </h1>
                <p className="text-xs text-muted-foreground sm:text-sm">Your AI career co-pilot</p>
              </div>
            </div>

            <div className="hidden lg:block">
              <motion.h2
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.45 }}
                className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-foreground xl:text-4xl"
              >
                Land your next role faster with intelligent automation
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
                className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground"
              >
                Upload once, sync your profiles, and let AI handle discovery, applications, and outreach.
              </motion.p>

              <ul className="mt-10 space-y-5">
                {FEATURES.map((feature, index) => (
                  <motion.li
                    key={feature.title}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.1, duration: 0.4 }}
                    className="flex items-start gap-3.5"
                  >
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-card/60 backdrop-blur-sm">
                      <feature.icon size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{feature.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 hidden items-center gap-2 text-xs text-muted-foreground lg:flex"
          >
            <CheckCircle2 size={14} className="text-success" />
            Secure Gmail verification · Encrypted credentials
          </motion.div>
        </motion.aside>

        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center px-4 pb-10 sm:px-8 lg:px-10 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="w-full max-w-[420px]"
          >
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-2xl shadow-black/20 backdrop-blur-xl">
              {!isVerify && (
                <div className="grid grid-cols-2 border-b border-border/50 bg-muted/30 p-1.5">
                  {(["login", "register"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => switchView(tab)}
                      className={cn(
                        "relative rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        view === tab
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground/80"
                      )}
                    >
                      {view === tab && (
                        <motion.span
                          layoutId="auth-tab"
                          className="absolute inset-0 rounded-lg bg-background shadow-sm"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">
                        {tab === "login" ? "Sign In" : "Create Account"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="p-6 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold tracking-tight text-foreground">
                        {isVerify
                          ? "Verify your email"
                          : isLogin
                            ? "Welcome back"
                            : "Get started"}
                      </h2>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {isVerify
                          ? `We sent a 6-digit code to ${pendingEmail}`
                          : isLogin
                            ? "Sign in with your Gmail to continue"
                            : "Create your JobPilot AI account in minutes"}
                      </p>
                    </div>

                    {isVerify ? (
                      <form onSubmit={handleVerify} className="space-y-5">
                        <div className="space-y-3">
                          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                            Verification code
                          </Label>
                          <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                            {otpDigits.map((digit, index) => (
                              <input
                                key={index}
                                ref={(el) => {
                                  otpRefs.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                className={cn(
                                  "h-12 w-11 rounded-xl border bg-input/50 text-center text-lg font-semibold tracking-widest text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/30 sm:h-14 sm:w-12",
                                  errors.code ? "border-destructive" : "border-border/70"
                                )}
                                aria-label={`Digit ${index + 1}`}
                              />
                            ))}
                          </div>
                          {errors.code && (
                            <p className="text-xs text-destructive">{errors.code}</p>
                          )}
                        </div>

                        <Button
                          type="submit"
                          size="lg"
                          className="h-11 w-full rounded-xl text-sm font-medium"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4" />
                              Verify & Continue
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>

                        <div className="flex flex-col items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading}
                            className="text-sm font-medium text-primary transition-opacity hover:opacity-80 disabled:opacity-50"
                          >
                            Resend code
                          </button>
                          <button
                            type="button"
                            onClick={() => switchView("login")}
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                          >
                            Back to Sign In
                          </button>
                        </div>
                      </form>
                    ) : (
                      <form
                        onSubmit={isLogin ? handleLogin : handleRegister}
                        className="space-y-4"
                      >
                        {isRegister && (
                          <FieldGroup
                            id="fullName"
                            label="Full Name"
                            error={errors.fullName}
                            icon={User}
                          >
                            <Input
                              id="fullName"
                              placeholder="John Doe"
                              value={registerForm.fullName}
                              onChange={(e) =>
                                setRegisterForm({ ...registerForm, fullName: e.target.value })
                              }
                              className={cn(
                                "h-11 rounded-xl border-border/70 bg-input/40 pl-10 transition-shadow focus-visible:ring-primary/30",
                                errors.fullName && "border-destructive"
                              )}
                            />
                          </FieldGroup>
                        )}

                        <FieldGroup
                          id="email"
                          label="Gmail Address"
                          error={errors.username}
                          icon={Mail}
                        >
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@gmail.com"
                            autoComplete="email"
                            value={isLogin ? loginForm.username : registerForm.username}
                            onChange={(e) =>
                              isLogin
                                ? setLoginForm({ ...loginForm, username: e.target.value })
                                : setRegisterForm({ ...registerForm, username: e.target.value })
                            }
                            className={cn(
                              "h-11 rounded-xl border-border/70 bg-input/40 pl-10 transition-shadow focus-visible:ring-primary/30",
                              errors.username && "border-destructive"
                            )}
                          />
                        </FieldGroup>

                        {isRegister && (
                          <FieldGroup id="mobile" label="Mobile Number" hint="Optional" icon={Phone}>
                            <Input
                              id="mobile"
                              type="tel"
                              placeholder="+91 98765 43210"
                              value={registerForm.mobile}
                              onChange={(e) =>
                                setRegisterForm({ ...registerForm, mobile: e.target.value })
                              }
                              className="h-11 rounded-xl border-border/70 bg-input/40 pl-10 transition-shadow focus-visible:ring-primary/30"
                            />
                          </FieldGroup>
                        )}

                        <FieldGroup
                          id="password"
                          label="Password"
                          error={errors.password}
                          icon={Lock}
                        >
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            value={isLogin ? loginForm.password : registerForm.password}
                            onChange={(e) =>
                              isLogin
                                ? setLoginForm({ ...loginForm, password: e.target.value })
                                : setRegisterForm({ ...registerForm, password: e.target.value })
                            }
                            className={cn(
                              "h-11 rounded-xl border-border/70 bg-input/40 pl-10 pr-10 transition-shadow focus-visible:ring-primary/30",
                              errors.password && "border-destructive"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </FieldGroup>

                        {isRegister && (
                          <FieldGroup
                            id="confirmPassword"
                            label="Confirm Password"
                            error={errors.confirmPassword}
                            icon={Lock}
                          >
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="••••••••"
                              autoComplete="new-password"
                              value={registerForm.confirmPassword}
                              onChange={(e) =>
                                setRegisterForm({
                                  ...registerForm,
                                  confirmPassword: e.target.value,
                                })
                              }
                              className={cn(
                                "h-11 rounded-xl border-border/70 bg-input/40 pl-10 pr-10 transition-shadow focus-visible:ring-primary/30",
                                errors.confirmPassword && "border-destructive"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                              aria-label={
                                showConfirmPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </FieldGroup>
                        )}

                        <Button
                          type="submit"
                          size="lg"
                          className="mt-2 h-11 w-full rounded-xl text-sm font-medium"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {isLogin ? "Signing in..." : "Creating account..."}
                            </>
                          ) : (
                            <>
                              {isLogin ? "Sign In" : "Create Account"}
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
              Secure Gmail verification · Encrypted credentials
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  id,
  label,
  error,
  hint,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
