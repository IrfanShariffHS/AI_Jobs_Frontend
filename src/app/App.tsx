/* MARKER-MAKE-KIT-INVOKED */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster } from "sonner";
import { useLocation, useNavigate } from "react-router";
import { Sidebar, type NavSection } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { Dashboard } from "./components/Dashboard";
import { JobSearch } from "./components/JobSearch";
import { Applications } from "./components/Applications";
import { Automation } from "./components/Automation";
import { Scheduler } from "./components/Scheduler";
import { Recruiters } from "./components/Recruiters";
import { Analytics } from "./components/Analytics";
import { Profile } from "./components/Profile";
import { Notifications } from "./components/Notifications";
import { Settings } from "./components/Settings";
import { RecruiterExtraction } from "./components/RecruiterExtraction";
import { TrendingSkills } from "./components/TrendingSkills";
import { Auth } from "./components/Auth";
import { Onboarding } from "./components/Onboarding";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { DataRefresher } from "../components/DataRefresher";
import { useIsMobile } from "./components/ui/use-mobile";
import { cn } from "./components/ui/utils";
import { ApiKeySetupModal } from "./components/ApiKeySetupModal";
import { authService } from "../services/authService";
import { onboardingService } from "../services/onboardingService";

type AuthFlowState = "auth" | "api-key-setup" | "onboarding" | "app";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authFlowState, setAuthFlowState] = useState<AuthFlowState>("auth");
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  // Convert URL path to activeSection
  const getActiveSectionFromPath = (): NavSection => {
    const path = location.pathname;
    if (path === "/jobs") return "jobs";
    if (path === "/applications") return "applications";
    if (path === "/automation") return "automation";
    if (path === "/scheduler") return "scheduler";
    if (path === "/recruiters") return "recruiters";
    if (path === "/analytics") return "analytics";
    if (path === "/profile") return "profile";
    if (path === "/notifications") return "notifications";
    if (path === "/settings") return "settings";
    if (path === "/recruiter-extraction") return "recruiter_extraction";
    if (path === "/trending-skills") return "trending_skills";
    return "dashboard";
  };

  const activeSection = getActiveSectionFromPath();

  const handleNavigate = (section: NavSection, settingsSection?: string) => {
    const pathMap: Record<NavSection, string> = {
      dashboard: "/",
      jobs: "/jobs",
      applications: "/applications",
      automation: "/automation",
      scheduler: "/scheduler",
      recruiters: "/recruiters",
      analytics: "/analytics",
      profile: "/profile",
      notifications: "/notifications",
      settings: "/settings",
      recruiter_extraction: "/recruiter-extraction",
      trending_skills: "/trending-skills",
    };
    
    if (section === "settings" && settingsSection) {
      navigate(`/settings?section=${settingsSection}`);
    } else {
      navigate(pathMap[section]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const safetyTimer = window.setTimeout(() => {
      if (!cancelled) {
        console.warn("Auth check timed out; showing login screen");
        setLoading(false);
      }
    }, 8000);

    async function checkAuth() {
      try {
        if (authService.isAuthenticated()) {
          const statusResponse = await onboardingService.getStatus();
          if (cancelled) return;
          if (statusResponse.success && statusResponse.data) {
            if (statusResponse.data.onboardingCompleted) {
              setAuthFlowState("app");
            } else {
              setAuthFlowState("onboarding");
            }
          } else {
            const userId = authService.getCurrentUserId();
            if (userId) {
              const response = await authService.getProfileStatus(parseInt(userId));
              if (!cancelled && response.success && response.data) {
                if (response.data.requiresApiKeySetup) {
                  setAuthFlowState("api-key-setup");
                } else if (response.data.onboardingCompleted) {
                  setAuthFlowState("app");
                } else {
                  setAuthFlowState("onboarding");
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkAuth();
    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
    };
  }, []);

  const handleAuthSuccess = (_userId: string, onboardingCompleted: boolean, requiresApiKeySetup?: boolean) => {
    if (requiresApiKeySetup) {
      setAuthFlowState("api-key-setup");
    } else if (onboardingCompleted) {
      setAuthFlowState("app");
      navigate("/");
    } else {
      setAuthFlowState("onboarding");
    }
  };

  const handleOnboardingComplete = () => {
    setAuthFlowState("app");
    navigate("/");
  };

  const handleLogout = async () => {
    await authService.logout();
    setAuthFlowState("auth");
    navigate("/");
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":    return <Dashboard onNavigate={handleNavigate} />;
      case "jobs":         return <JobSearch onNavigate={handleNavigate} />;
      case "applications": return <Applications />;
      case "automation":   return <Automation />;
      case "scheduler":    return <Scheduler />;
      case "recruiters":   return <Recruiters />;
      case "analytics":    return <Analytics />;
      case "profile":      return <Profile />;
      case "notifications":return <Notifications />;
      case "settings":              return <Settings />;
      case "recruiter_extraction":  return <RecruiterExtraction />;
      case "trending_skills":       return <TrendingSkills onNavigate={(section) => handleNavigate(section as NavSection)} />;
      default:                      return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading JobPilot AI...</p>
      </div>
    );
  }

  if (authFlowState === "auth") {
    return (
      <>
        <Auth onAuthSuccess={handleAuthSuccess} />
        <Toaster position="top-center" theme="dark" />
      </>
    );
  }

  if (authFlowState === "api-key-setup") {
    return (
      <>
        <ApiKeySetupModal
          onComplete={() => setAuthFlowState("onboarding")}
          onSkip={() => setAuthFlowState("onboarding")}
        />
        <Toaster position="top-center" theme="dark" />
      </>
    );
  }

  if (authFlowState === "onboarding") {
    return (
      <>
        <Onboarding onComplete={handleOnboardingComplete} />
        <Toaster position="top-center" theme="dark" />
      </>
    );
  }

  return (
    <ErrorBoundary>
      <DataRefresher>
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {!isMobile && (
          <Sidebar
            activeSection={activeSection}
            onNavigate={handleNavigate}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          />
        )}

        {isMobile && (
          <Sidebar
            activeSection={activeSection}
            onNavigate={handleNavigate}
            collapsed={false}
            onToggleCollapse={() => {}}
          />
        )}

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {!isMobile && (
            <TopBar
              activeSection={activeSection}
              onNavigate={handleNavigate}
              notificationCount={3}
              onLogout={handleLogout}
            />
          )}

          <main className={cn("flex-1 overflow-hidden relative", isMobile && "pb-16")}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute inset-0"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <Toaster
          position={isMobile ? "top-center" : "bottom-right"}
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              color: "var(--color-foreground)",
              fontSize: isMobile ? "12px" : "13px",
              maxWidth: isMobile ? "90vw" : "400px",
            },
          }}
        />
      </div>
      </DataRefresher>
    </ErrorBoundary>
  );
}
