import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import {
  User, Shield, Bell, Link2, Key, LogOut, Moon, Sun,
  Smartphone, Eye, EyeOff, CheckCircle, AlertCircle,
  ChevronRight, Globe, Zap, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { PlatformConnectionsPanel } from "./PlatformConnectionsPanel";
import { AIApiSettings } from "./AIApiSettings";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
}

const sections: SettingsSection[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "connections", label: "Connected Accounts", icon: Link2 },
  { id: "api", label: "API & Integrations", icon: Key },
  { id: "privacy", label: "Privacy", icon: Eye },
];

function SettingsRow({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Check for section parameter from URL
  useEffect(() => {
    const sectionParam = searchParams.get("section");
    if (sectionParam) {
      setActiveSection(sectionParam);
    }
  }, [searchParams]);
  
  const [notifSettings, setNotifSettings] = useState({
    jobAlerts: true,
    aiAlerts: true,
    resumeAlerts: false,
    schedulerAlerts: true,
    emailAlerts: true,
    systemAlerts: false,
    emailDigest: true,
    pushNotif: true,
  });

  const toggleNotif = (key: keyof typeof notifSettings) => {
    setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-[1000px] mx-auto">
        <div className="flex gap-6">

          {/* Left nav */}
          <div className="w-48 shrink-0 hidden md:block">
            <nav className="space-y-0.5">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-[13px]",
                    activeSection === sec.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <sec.icon size={14} />
                  {sec.label}
                </button>
              ))}
              <Separator className="my-2" />
              <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[13px] text-destructive hover:bg-destructive/10 transition-all">
                <LogOut size={14} />
                Sign Out
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Profile section */}
            {activeSection === "profile" && (
              <>
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Personal Information</CardTitle>
                    <CardDescription className="text-xs">Update your profile details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px]">First Name</Label>
                        <Input defaultValue="Alex" className="h-8 text-sm bg-muted/50" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[11px]">Last Name</Label>
                        <Input defaultValue="Rivera" className="h-8 text-sm bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Email</Label>
                      <Input defaultValue="alex.rivera@email.com" className="h-8 text-sm bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Phone</Label>
                      <Input defaultValue="+1 (415) 555-0192" className="h-8 text-sm bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Location</Label>
                      <Input defaultValue="San Francisco, CA" className="h-8 text-sm bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Professional Headline</Label>
                      <Input defaultValue="Senior Software Engineer | React · TypeScript · Node.js" className="h-8 text-sm bg-muted/50" />
                    </div>
                    <Button size="sm" className="gap-1.5 text-xs" onClick={() => toast.success("Profile saved")}>
                      Save Changes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Job Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3">
                    <SettingsRow label="Job Type" description="Preferred employment type">
                      <Select defaultValue="full-time">
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time" className="text-xs">Full-time</SelectItem>
                          <SelectItem value="contract" className="text-xs">Contract</SelectItem>
                          <SelectItem value="remote" className="text-xs">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingsRow>
                    <Separator />
                    <SettingsRow label="Salary Expectation" description="Minimum acceptable base salary">
                      <Select defaultValue="150k">
                        <SelectTrigger className="h-8 w-36 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100k" className="text-xs">$100K+</SelectItem>
                          <SelectItem value="130k" className="text-xs">$130K+</SelectItem>
                          <SelectItem value="150k" className="text-xs">$150K+</SelectItem>
                          <SelectItem value="180k" className="text-xs">$180K+</SelectItem>
                        </SelectContent>
                      </Select>
                    </SettingsRow>
                    <Separator />
                    <SettingsRow label="Open to Relocation" description="Willing to relocate for the right role">
                      <Switch defaultChecked={false} />
                    </SettingsRow>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Security section */}
            {activeSection === "security" && (
              <>
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Current Password</Label>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-8 text-sm bg-muted/50 pr-9" />
                        <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">New Password</Label>
                      <Input type="password" placeholder="••••••••" className="h-8 text-sm bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px]">Confirm New Password</Label>
                      <Input type="password" placeholder="••••••••" className="h-8 text-sm bg-muted/50" />
                    </div>
                    <Button size="sm" variant="outline" className="text-xs gap-1.5">Update Password</Button>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Two-Factor Authentication</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-3">
                    <SettingsRow label="Authenticator App" description="TOTP-based 2FA via Google Authenticator or similar">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] h-5 border-chart-3/30 text-chart-3">Enabled</Badge>
                        <Button variant="outline" size="sm" className="h-7 text-xs">Manage</Button>
                      </div>
                    </SettingsRow>
                    <Separator />
                    <SettingsRow label="Biometric Login" description="Use fingerprint or face ID on supported devices">
                      <div className="flex items-center gap-2">
                        <Smartphone size={14} className="text-muted-foreground" />
                        <Switch defaultChecked />
                      </div>
                    </SettingsRow>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4 space-y-2">
                    {[
                      { device: "Chrome on macOS", location: "San Francisco, CA", time: "Current session", current: true },
                      { device: "Safari on iPhone 15", location: "San Francisco, CA", time: "2 hours ago", current: false },
                    ].map((session, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                        <div>
                          <p className="text-[12px] font-medium text-foreground">{session.device}</p>
                          <p className="text-[11px] text-muted-foreground">{session.location} • {session.time}</p>
                        </div>
                        {session.current
                          ? <Badge variant="secondary" className="text-[10px] h-5">Current</Badge>
                          : <Button variant="ghost" size="sm" className="h-6 text-[11px] text-destructive hover:text-destructive">Revoke</Button>
                        }
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Notifications section */}
            {activeSection === "notifications" && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Notification Preferences</CardTitle>
                  <CardDescription className="text-xs">Choose which alerts you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="pb-4 space-y-0">
                  {[
                    { key: "jobAlerts" as const, label: "Job Alerts", desc: "New high-match job opportunities" },
                    { key: "aiAlerts" as const, label: "AI Insights", desc: "Personalized AI recommendations" },
                    { key: "resumeAlerts" as const, label: "Resume Alerts", desc: "Resume score and ATS updates" },
                    { key: "schedulerAlerts" as const, label: "Automation Alerts", desc: "Job automation status updates" },
                    { key: "emailAlerts" as const, label: "Email Alerts", desc: "Recruiter email open/response notifications" },
                    { key: "systemAlerts" as const, label: "System Alerts", desc: "Platform updates and maintenance" },
                  ].map((setting, i) => (
                    <React.Fragment key={setting.key}>
                      <SettingsRow label={setting.label} description={setting.desc}>
                        <Switch
                          checked={notifSettings[setting.key]}
                          onCheckedChange={() => toggleNotif(setting.key)}
                        />
                      </SettingsRow>
                      {i < 5 && <Separator />}
                    </React.Fragment>
                  ))}
                  <Separator className="my-2" />
                  <SettingsRow label="Email Digest" description="Weekly summary of your job search activity">
                    <Switch checked={notifSettings.emailDigest} onCheckedChange={() => toggleNotif("emailDigest")} />
                  </SettingsRow>
                  <Separator />
                  <SettingsRow label="Push Notifications" description="Browser push notifications">
                    <Switch checked={notifSettings.pushNotif} onCheckedChange={() => toggleNotif("pushNotif")} />
                  </SettingsRow>
                </CardContent>
              </Card>
            )}

            {/* Connected Accounts */}
            {activeSection === "connections" && (
              <PlatformConnectionsPanel />
            )}

            {/* API section */}
            {activeSection === "api" && (
              <AIApiSettings />
            )}

            {/* Privacy */}
            {activeSection === "privacy" && (
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Privacy Settings</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 space-y-0">
                  {[
                    { label: "Profile Visibility", desc: "Make your profile visible to recruiters", defaultChecked: true },
                    { label: "Anonymous Browsing", desc: "Hide your identity when viewing companies", defaultChecked: false },
                    { label: "Data Analytics", desc: "Allow anonymized usage data to improve AI recommendations", defaultChecked: true },
                    { label: "Email Tracking", desc: "Track when recruiters open your emails", defaultChecked: true },
                  ].map((setting, i, arr) => (
                    <React.Fragment key={setting.label}>
                      <SettingsRow label={setting.label} description={setting.desc}>
                        <Switch defaultChecked={setting.defaultChecked} />
                      </SettingsRow>
                      {i < arr.length - 1 && <Separator />}
                    </React.Fragment>
                  ))}
                  <Separator className="my-3" />
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="text-xs h-7">Download My Data</Button>
                    <Button variant="destructive" size="sm" className="text-xs h-7">Delete Account</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
