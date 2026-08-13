import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Shield, Eye, EyeOff, CheckCircle2, AlertCircle,
  Loader2, RefreshCw, Download, Trash2, ExternalLink,
  User, Building2, Briefcase, Phone, Clock, Search,
  ChevronDown, ChevronUp, Info, Lock, Wifi, XCircle,
  Copy, Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { cn } from "./ui/utils";
import { recruiterService } from "../../services/recruiterService";

interface RecruiterContact {
  id: string;
  name: string;
  email: string;
  company: string;
  jobTitle: string;
  designation: string;
  role: string;
  phone?: string;
  linkedIn?: string;
  location?: string;
  salary?: string;
  experience?: string;
  skills?: string;
  companyWebsite?: string;
  jobSummary?: string;
  extractedFrom: string;
  date: string;
  confidence: "high" | "medium" | "low";
}

function mapExtractedContacts(raw: Array<Record<string, unknown>>): RecruiterContact[] {
  return (raw || []).map((c, index) => {
    const email = String(c.email ?? "");
    const company = String(c.companyName ?? c.company ?? "");
    const name = String(c.hrName ?? c.name ?? email.split("@")[0] ?? "Unknown");
    const designation = String(c.designation ?? "");
    const replied = Boolean(c.alreadyReplied);
    return {
      id: String(c.id ?? `${email}-${index}`),
      name,
      email,
      company,
      jobTitle: String(c.jobTitle ?? ""),
      designation,
      role: replied ? "Recruiter (replied)" : "Recruiter / HR",
      phone: c.phoneNumber ? String(c.phoneNumber) : undefined,
      linkedIn: c.linkedInProfile ? String(c.linkedInProfile) : undefined,
      location: c.location ? String(c.location) : undefined,
      salary: c.salary ? String(c.salary) : undefined,
      experience: c.experienceRequired ? String(c.experienceRequired) : undefined,
      skills: c.skillsRequired ? String(c.skillsRequired) : undefined,
      companyWebsite: c.companyWebsite ? String(c.companyWebsite) : undefined,
      jobSummary: c.jobDescriptionSummary ? String(c.jobDescriptionSummary) : undefined,
      extractedFrom: String(c.subject ?? c.action ?? "Gmail inbox scan"),
      date: String(c.dateReceived ?? new Date().toLocaleDateString()),
      confidence: email && company ? "high" : email ? "medium" : "low",
    };
  });
}

const confidenceConfig = {
  high:   { label: "High",   color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  medium: { label: "Medium", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  low:    { label: "Low",    color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

type ExtractionState = "idle" | "connecting" | "connected" | "extracting" | "done";

function ConsentBanner() {
  return (
    <div
      className="rounded-xl p-4 flex gap-3"
      style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
    >
      <Shield size={16} className="text-primary shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-[13px] font-semibold text-foreground">Authorized Access Only</p>
        <p className="text-[12px] text-muted-foreground leading-relaxed">
          This feature connects exclusively to a Gmail account whose owner has explicitly granted
          permission. Credentials are used solely to read email headers — no emails are stored,
          forwarded, or shared. All extracted data is used only for your authorized job search purposes.
          You may revoke access at any time by revoking your Gmail App Password.
        </p>
      </div>
    </div>
  );
}

function ConnectForm({
  onExtracted,
}: {
  onExtracted: (email: string, contacts: RecruiterContact[]) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [consented, setConsented] = useState(false);
  const [state, setState] = useState<"idle" | "connecting">("idle");
  const [showGuide, setShowGuide] = useState(false);

  const handleConnect = async () => {
    if (!email || !password || !consented) return;
    setState("connecting");
    try {
      const response = await recruiterService.extractFromGmail(email.trim(), password.trim());
      const payload = (response.data || {}) as {
        success?: boolean;
        extractedCount?: number;
        results?: Array<Record<string, unknown>>;
        message?: string;
        error?: string;
      };
      if (!response.success && payload.success !== true) {
        toast.error(response.error || payload.error || payload.message || "Gmail extraction failed");
        setState("idle");
        return;
      }
      const mapped = mapExtractedContacts(payload.results || []);
      onExtracted(email.trim(), mapped);
      toast.success(`Extracted ${mapped.length} recruiter contacts`, {
        description: "Contacts loaded from your authorized Gmail inbox scan",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gmail extraction failed");
      setState("idle");
    }
  };

  return (
    <div className="space-y-5">
      <ConsentBanner />

      {/* Form */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Mail size={15} className="text-primary" /> Connect Gmail Account
          </CardTitle>
          <CardDescription className="text-xs">
            Use a Gmail App Password — not your main account password.
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="ml-1 text-primary underline underline-offset-2"
            >
              How to create one
            </button>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pb-5">
          <AnimatePresence>
            {showGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-lg p-3.5 space-y-2 text-[12px] text-muted-foreground"
                  style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)" }}
                >
                  <p className="font-semibold text-foreground">Steps to generate a Gmail App Password:</p>
                  {[
                    "Go to myaccount.google.com → Security",
                    "Enable 2-Step Verification if not already on",
                    "Under 'How you sign in to Google', click App Passwords",
                    "Select app: Mail, device: Other → name it 'JobPilot'",
                    "Copy the 16-character password and paste it below",
                  ].map((step, i) => (
                    <div key={i} className="flex gap-2">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                        style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-primary)" }}
                      >
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Gmail Address</label>
            <Input
              type="email"
              placeholder="owner@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-9 text-sm bg-muted/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-foreground">Gmail App Password</label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="xxxx xxxx xxxx xxxx"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-9 text-sm bg-muted/40 pr-9 font-mono"
              />
              <button
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock size={11} />
              App Password is never stored — used only during this session
            </div>
          </div>

          {/* Consent checkbox */}
          <button
            onClick={() => setConsented(!consented)}
            className="flex items-start gap-2.5 w-full text-left group"
          >
            <div
              className={cn(
                "w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                consented
                  ? "bg-primary border-primary"
                  : "border-border group-hover:border-primary/50"
              )}
            >
              {consented && <Check size={10} className="text-primary-foreground" />}
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              I am the authorized owner of this Gmail account and I grant JobPilot AI permission
              to read email headers for the sole purpose of extracting recruiter contact information
              for my job search.
            </p>
          </button>

          <Button
            onClick={handleConnect}
            disabled={!email || !password || !consented || state === "connecting"}
            className="w-full h-9 text-sm gap-2"
          >
            {state === "connecting" ? (
              <><Loader2 size={14} className="animate-spin" /> Connecting securely…</>
            ) : (
              <><Mail size={14} /> Connect & Extract Contacts</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Security info */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Lock,   label: "End-to-End", desc: "Credentials never stored" },
          { icon: Shield, label: "Read-only",   desc: "No emails modified" },
          { icon: Wifi,   label: "Session only", desc: "Access auto-revoked" },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-xl p-3 flex flex-col items-center gap-1.5 text-center"
            style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
          >
            <item.icon size={15} className="text-primary" />
            <p className="text-[11px] font-semibold text-foreground">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check size={13} className="text-chart-3" /> : <Copy size={13} />}
    </button>
  );
}

function ContactCard({ contact }: { contact: RecruiterContact }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = confidenceConfig[contact.confidence];
  return (
    <Card className="border-border overflow-hidden">
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between px-4 py-3.5 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0"
              style={{ background: "rgba(99,102,241,0.12)", color: "var(--color-primary)" }}
            >
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">{contact.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{contact.company} · {contact.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              {cfg.label}
            </span>
            {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-4 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Mail,      label: "Email",       value: contact.email },
                  { icon: Building2, label: "Company",     value: contact.company },
                  ...(contact.designation ? [{ icon: User, label: "Designation", value: contact.designation }] : []),
                  { icon: Briefcase, label: "Job Title",   value: contact.jobTitle },
                  { icon: User,      label: "Role",        value: contact.role },
                  ...(contact.phone ? [{ icon: Phone, label: "Phone", value: contact.phone }] : []),
                  ...(contact.location ? [{ icon: User, label: "Location", value: contact.location }] : []),
                  ...(contact.salary ? [{ icon: User, label: "Salary", value: contact.salary }] : []),
                  ...(contact.experience ? [{ icon: User, label: "Experience", value: contact.experience }] : []),
                  ...(contact.companyWebsite ? [{ icon: ExternalLink, label: "Website", value: contact.companyWebsite }] : []),
                  ...(contact.linkedIn ? [{ icon: ExternalLink, label: "LinkedIn", value: contact.linkedIn }] : []),
                ].map(field => (
                  <div key={field.label} className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <field.icon size={10} />
                      {field.label}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[12px] font-medium text-foreground truncate">{field.value}</p>
                      <CopyButton text={field.value} />
                    </div>
                  </div>
                ))}
              </div>
              {contact.skills && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">Skills Required</p>
                  <p className="text-[11px] text-foreground font-medium">{contact.skills}</p>
                </div>
              )}
              {contact.jobSummary && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">Job Summary</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{contact.jobSummary}</p>
                </div>
              )}
              <div
                className="flex items-start gap-2 rounded-lg px-3 py-2"
                style={{ background: "var(--color-muted)" }}
              >
                <Mail size={11} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Extracted from</p>
                  <p className="text-[11px] text-foreground italic">&ldquo;{contact.extractedFrom}&rdquo;</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{contact.date}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function ExtractionProgress({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Authenticating with Gmail servers…",
    "Scanning inbox for recruiter patterns…",
    "Analyzing email headers and signatures…",
    "Extracting contact fields using AI…",
    "Deduplicating and validating results…",
    "Finalizing extracted contacts…",
  ];

  React.useEffect(() => {
    const timers = steps.map((_, i) =>
      setTimeout(() => {
        setStep(i + 1);
        if (i === steps.length - 1) setTimeout(onDone, 500);
      }, (i + 1) * 700)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <Card className="border-border">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Loader2 size={18} className="text-primary animate-spin" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">Extracting Recruiter Contacts</p>
            <p className="text-[12px] text-muted-foreground">Processing authorized Gmail account…</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">
                {i < step ? (
                  <CheckCircle2 size={16} className="text-chart-3" />
                ) : i === step ? (
                  <Loader2 size={14} className="text-primary animate-spin" />
                ) : (
                  <div className="w-3 h-3 rounded-full border border-border" />
                )}
              </div>
              <p className={cn("text-[12px]", i < step ? "text-muted-foreground" : i === step ? "text-foreground font-medium" : "text-muted-foreground/50")}>
                {s}
              </p>
            </div>
          ))}
        </div>

        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${(step / steps.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[11px] text-center text-muted-foreground">{step} / {steps.length} steps complete</p>
      </CardContent>
    </Card>
  );
}

export function RecruiterExtraction() {
  const [stage, setStage] = useState<ExtractionState>("idle");
  const [contacts, setContacts] = useState<RecruiterContact[]>([]);
  const [connectedEmail, setConnectedEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterConfidence, setFilterConfidence] = useState<"all" | "high" | "medium" | "low">("all");

  const filteredContacts = contacts.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q);
    const matchF = filterConfidence === "all" || c.confidence === filterConfidence;
    return matchQ && matchF;
  });

  const handleExtracted = (email: string, extracted: RecruiterContact[]) => {
    setConnectedEmail(email);
    setContacts(extracted);
    setStage("done");
  };

  const handleDisconnect = () => {
    setStage("idle");
    setContacts([]);
    setConnectedEmail("");
    toast.info("Gmail account disconnected. App Password has been cleared.");
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Email", "Company", "Job Title", "Role", "Phone", "Date", "Confidence"],
      ...contacts.map(c => [c.name, c.email, c.company, c.jobTitle, c.role, c.phone ?? "", c.date, c.confidence]),
    ].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "recruiter_contacts.csv"; a.click();
    toast.success("Contacts exported as CSV");
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-[900px] mx-auto space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
              Recruiter Extraction
            </h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Extract recruiter &amp; HR contacts from your authorized Gmail account
            </p>
          </div>
          {stage === "done" && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExport}>
                <Download size={12} /> Export CSV
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={handleDisconnect}>
                <XCircle size={12} /> Disconnect
              </Button>
            </div>
          )}
        </div>

        {/* Connected status bar */}
        {stage === "done" && (
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-xl"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={14} className="text-chart-3" />
              <span className="text-[12px] font-medium text-foreground">
                Connected &amp; authorized by account owner
              </span>
              <span className="text-[11px] text-muted-foreground">
                · {contacts.length} contacts extracted
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock size={11} />
              Just now
            </div>
          </div>
        )}

        {/* Main content */}
        {stage === "idle" && (
          <ConnectForm onExtracted={handleExtracted} />
        )}

        {stage === "done" && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Contacts", value: contacts.length, color: "#6366f1" },
                { label: "High Confidence", value: contacts.filter(c => c.confidence === "high").length, color: "#10b981" },
                { label: "With Phone",      value: contacts.filter(c => c.phone).length, color: "#06b6d4" },
                { label: "With LinkedIn",   value: contacts.filter(c => c.linkedIn).length, color: "#f59e0b" },
              ].map(s => (
                <Card key={s.label} className="border-border">
                  <CardContent className="p-3.5">
                    <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Search + filter */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, company…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm bg-muted/40"
                />
              </div>
              <div className="flex gap-1">
                {(["all", "high", "medium", "low"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterConfidence(f)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all"
                    style={{
                      background: filterConfidence === f ? "var(--color-primary)" : "var(--color-card)",
                      color: filterConfidence === f ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                      border: `1px solid ${filterConfidence === f ? "transparent" : "var(--color-border)"}`,
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact list */}
            <div className="space-y-2.5">
              <p className="text-[12px] text-muted-foreground">{filteredContacts.length} contacts</p>
              <AnimatePresence mode="popLayout">
                {filteredContacts.map(contact => (
                  <motion.div
                    key={contact.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                  >
                    <ContactCard contact={contact} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredContacts.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Search size={28} className="text-muted-foreground/40" />
                  <p className="text-[13px] text-muted-foreground">No contacts match your search</p>
                </div>
              )}
            </div>

            {/* Re-extract */}
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => { setStage("extracting"); setContacts([]); }}
              >
                <RefreshCw size={12} /> Re-run Extraction
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
