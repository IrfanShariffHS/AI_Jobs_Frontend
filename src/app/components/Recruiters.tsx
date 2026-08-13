import React, { useState, useEffect } from "react";
import {
  Users, Mail, Send, ExternalLink, Search, Plus, Brain,
  RefreshCw, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp,
  Copy, Edit2, Trash2, MoreHorizontal, AlertCircle, Phone,
  MapPin, DollarSign, Briefcase, Globe, Linkedin, BadgeCheck,
  Star, Filter, Hash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "./ui/dropdown-menu";
import { Separator } from "./ui/separator";
import { type Recruiter, type EmailStatus } from "./data";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { recruiterService, type HrContact } from "../../services/recruiterService";
import { motion, AnimatePresence } from "motion/react";

const emailStatusConfig: Record<EmailStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  sent:      { label: "Sent",      color: "text-muted-foreground", bg: "bg-muted/50",        icon: Send },
  delivered: { label: "Delivered", color: "text-chart-2",          bg: "bg-chart-2/15",      icon: CheckCircle },
  opened:    { label: "Replied",   color: "text-chart-3",          bg: "bg-chart-3/15",      icon: CheckCircle },
  failed:    { label: "Failed",    color: "text-destructive",      bg: "bg-destructive/15",  icon: XCircle },
  pending:   { label: "Pending",   color: "text-chart-4",          bg: "bg-chart-4/15",      icon: Clock },
};

const emailTemplates = [
  {
    id: "t1",
    name: "Initial Outreach",
    subject: "Experienced {role} open to new opportunities at {company}",
    body: `Hi {recruiterName},\n\nI hope this message finds you well. My name is Alex Rivera, and I'm a Senior Software Engineer with 6+ years of experience specializing in React, TypeScript, and Node.js.\n\nI've been following {company}'s work in {industry} and am genuinely excited about the direction the team is taking. I believe my background in building scalable web applications would be a strong fit for your engineering team.\n\nWould you be open to a brief conversation to explore potential opportunities?\n\nBest regards,\nAlex Rivera`,
  },
  {
    id: "t2",
    name: "After Job Application",
    subject: "Following up on {jobTitle} application",
    body: `Hi {recruiterName},\n\nI recently applied for the {jobTitle} position at {company} and wanted to follow up to express my continued enthusiasm for the role.\n\nWith 6+ years in frontend/full-stack development, I'm confident I can contribute meaningfully to your team from day one. I'd love the opportunity to discuss how my experience aligns with what you're looking for.\n\nThank you for your consideration!\n\nBest,\nAlex Rivera`,
  },
];

function EmailGeneratorModal({ recruiter, onClose }: { recruiter: HrContact | null; onClose: () => void }) {
  const [selectedTemplate, setSelectedTemplate] = useState(emailTemplates[0]);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateEmail = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    const email = selectedTemplate.body
      .replace(/{recruiterName}/g, recruiter?.hrName?.split(" ")[0] || "there")
      .replace(/{company}/g, recruiter?.companyName || "your company")
      .replace(/{industry}/g, "tech")
      .replace(/{role}/g, "Software Engineer")
      .replace(/{jobTitle}/g, recruiter?.jobTitle || "Senior Frontend Engineer");
    setGeneratedEmail(email);
    setGenerating(false);
  };

  return (
    <DialogContent className="max-w-2xl bg-card border-border">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Brain size={15} className="text-primary" />
          </div>
          <DialogTitle className="text-base">AI Email Generator</DialogTitle>
        </div>
        <DialogDescription className="text-xs">
          Generate a personalized outreach email for {recruiter?.hrName} at {recruiter?.companyName}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 mt-2">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wide">Email Template</p>
          <div className="grid grid-cols-2 gap-2">
            {emailTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={cn(
                  "p-3 text-left rounded-lg border text-[12px] transition-all",
                  selectedTemplate.id === t.id
                    ? "border-primary/50 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/30"
                )}
              >
                <p className="font-medium">{t.name}</p>
                <p className="text-[10px] mt-0.5 truncate opacity-70">{t.subject}</p>
              </button>
            ))}
          </div>
        </div>

        <Button onClick={generateEmail} disabled={generating} className="w-full gap-2">
          {generating ? (
            <><RefreshCw size={13} className="animate-spin" /> Generating personalized email...</>
          ) : (
            <><Brain size={13} /> Generate with AI</>
          )}
        </Button>

        {generatedEmail && (
          <div className="space-y-2">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Generated Email</p>
            <div className="rounded-lg bg-muted/50 border border-border p-4">
              <div className="mb-2 pb-2 border-b border-border">
                <p className="text-[11px] text-muted-foreground">Subject:</p>
                <p className="text-[12px] font-medium text-foreground mt-0.5">
                  {selectedTemplate.subject
                    .replace(/{company}/g, recruiter?.companyName || "")
                    .replace(/{jobTitle}/g, recruiter?.jobTitle || "Senior Frontend Engineer")
                    .replace(/{role}/g, "Software Engineer")}
                </p>
              </div>
              <pre className="text-[12px] text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {generatedEmail}
              </pre>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm" className="flex-1 gap-1.5 text-xs"
                onClick={() => { navigator.clipboard?.writeText(generatedEmail); toast.success("Copied to clipboard"); }}
              >
                <Copy size={12} /> Copy
              </Button>
              <Button
                size="sm" className="flex-1 gap-1.5 text-xs"
                onClick={() => { toast.success(`Email sent to ${recruiter?.hrName}`); onClose(); }}
              >
                <Send size={12} /> Send Email
              </Button>
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

function SkillTag({ skill }: { skill: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/8 text-primary border border-primary/15">
      {skill.trim()}
    </span>
  );
}

function RecruiterCard({ contact, onEmail, onDelete }: {
  contact: HrContact;
  onEmail: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const replied = contact.alreadyReplied;
  const emailCfg = replied ? emailStatusConfig["opened"] : emailStatusConfig["sent"];
  const EmailIcon = emailCfg.icon;

  const initials = (contact.hrName || contact.email || "?")
    .split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const skills = contact.skillsRequired
    ? contact.skillsRequired.split(",").map(s => s.trim()).filter(Boolean).slice(0, 6)
    : [];

  const hasExtra = !!(
    contact.phoneNumber || contact.location || contact.salary ||
    contact.experienceRequired || skills.length > 0 ||
    contact.linkedInProfile || contact.companyWebsite ||
    contact.jobDescriptionSummary
  );

  return (
    <Card className="border-border hover:border-primary/30 transition-all duration-200 group">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
              <span className="text-[13px] font-bold text-primary">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground truncate">
                {contact.hrName || "Hiring Manager"}
              </p>
              {contact.designation && (
                <p className="text-[11px] text-primary/80 font-medium truncate">{contact.designation}</p>
              )}
              <p className="text-[11px] text-muted-foreground truncate">
                {contact.companyName || "Unknown Company"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {replied && (
              <Badge className="text-[9px] px-1.5 py-0 h-4 gap-0.5 bg-chart-3/15 text-chart-3 border-chart-3/30 border">
                <BadgeCheck size={9} /> Replied
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal size={13} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {contact.linkedInProfile && (
                  <DropdownMenuItem
                    className="text-xs gap-2"
                    onClick={() => window.open(contact.linkedInProfile!, "_blank")}
                  >
                    <ExternalLink size={11} /> View LinkedIn
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-xs gap-2"
                  onClick={() => { navigator.clipboard?.writeText(contact.email); toast.success("Email copied"); }}
                >
                  <Copy size={11} /> Copy Email
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs gap-2 text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 size={11} /> Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator className="my-3" />

        {/* Core Info */}
        <div className="space-y-1.5">
          {contact.jobTitle && (
            <div className="flex items-start gap-2">
              <Briefcase size={11} className="text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-[11px] text-foreground leading-tight">{contact.jobTitle}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Mail size={11} className="text-muted-foreground shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{contact.email}</span>
          </div>
          {contact.dateReceived && (
            <div className="flex items-center gap-2">
              <Clock size={11} className="text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground">{contact.dateReceived.split(" ")[0]}</span>
            </div>
          )}
          {/* Reply status badge */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Status</span>
            <span className={cn(
              "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border",
              emailCfg.color, emailCfg.bg, "border-current/20"
            )}>
              <EmailIcon size={9} /> {emailCfg.label}
            </span>
          </div>
        </div>

        {/* Expandable Details */}
        {hasExtra && (
          <>
            <button
              onClick={() => setExpanded(p => !p)}
              className="w-full mt-3 flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {expanded ? "Less details" : "More details"}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-2 border-t border-border mt-2">
                    {contact.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone size={11} className="text-muted-foreground shrink-0" />
                        <a href={`tel:${contact.phoneNumber}`} className="text-[11px] text-primary hover:underline">
                          {contact.phoneNumber}
                        </a>
                      </div>
                    )}
                    {contact.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={11} className="text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-foreground">{contact.location}</span>
                      </div>
                    )}
                    {contact.salary && (
                      <div className="flex items-center gap-2">
                        <DollarSign size={11} className="text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-foreground">{contact.salary}</span>
                      </div>
                    )}
                    {contact.experienceRequired && (
                      <div className="flex items-center gap-2">
                        <Star size={11} className="text-muted-foreground shrink-0" />
                        <span className="text-[11px] text-foreground">{contact.experienceRequired}</span>
                      </div>
                    )}
                    {contact.companyWebsite && (
                      <div className="flex items-center gap-2">
                        <Globe size={11} className="text-muted-foreground shrink-0" />
                        <a
                          href={contact.companyWebsite.startsWith("http") ? contact.companyWebsite : `https://${contact.companyWebsite}`}
                          target="_blank" rel="noreferrer"
                          className="text-[11px] text-primary hover:underline truncate"
                        >
                          {contact.companyWebsite}
                        </a>
                      </div>
                    )}
                    {contact.linkedInProfile && (
                      <div className="flex items-center gap-2">
                        <Linkedin size={11} className="text-muted-foreground shrink-0" />
                        <a
                          href={contact.linkedInProfile}
                          target="_blank" rel="noreferrer"
                          className="text-[11px] text-primary hover:underline truncate"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    {contact.naukriUrl && (
                      <div className="flex items-center gap-2">
                        <ExternalLink size={11} className="text-chart-2 shrink-0" />
                        <a
                          href={contact.naukriUrl}
                          target="_blank" rel="noreferrer"
                          className="text-[11px] text-chart-2 hover:underline truncate"
                        >
                          Naukri Job Link
                        </a>
                      </div>
                    )}
                    {contact.sourceAccount && (
                      <div className="flex items-center gap-2">
                        <Mail size={11} className="text-muted-foreground shrink-0" />
                        <span className="text-[10px] text-muted-foreground truncate">
                          Source: {contact.sourceAccount}
                        </span>
                      </div>
                    )}

                    {skills.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Skills Required</p>
                        <div className="flex flex-wrap gap-1">
                          {skills.map((skill, i) => (
                            <SkillTag key={i} skill={skill} />
                          ))}
                          {contact.skillsRequired && contact.skillsRequired.split(",").length > 6 && (
                            <span className="text-[10px] text-muted-foreground self-center">
                              +{contact.skillsRequired.split(",").length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {contact.jobDescriptionSummary && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Summary</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                          {contact.jobDescriptionSummary}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        <Button onClick={onEmail} size="sm" className="w-full mt-3 gap-1.5 h-7 text-xs">
          <Brain size={11} /> Generate Outreach Email
        </Button>
      </CardContent>
    </Card>
  );
}

export function Recruiters() {
  const [search, setSearch] = useState("");
  const [filterReplied, setFilterReplied] = useState<"all" | "replied" | "unreplied">("all");
  const [contacts, setContacts] = useState<HrContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<HrContact | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const loadRecruiters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await recruiterService.getRecruiters();
      if (response.success && response.data) {
        setContacts(response.data.recruiters || []);
      } else {
        setError(response.error || "Failed to load recruiters");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecruiters(); }, []);

  const handleDelete = async (id: number) => {
    try {
      const res = await recruiterService.deleteRecruiter(id);
      if (res.success) {
        setContacts(prev => prev.filter(c => c.id !== id));
        toast.success("Recruiter removed");
      } else {
        toast.error("Failed to remove recruiter");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const filtered = contacts.filter(c => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      (c.hrName?.toLowerCase().includes(searchLower)) ||
      (c.companyName?.toLowerCase().includes(searchLower)) ||
      (c.jobTitle?.toLowerCase().includes(searchLower)) ||
      (c.designation?.toLowerCase().includes(searchLower)) ||
      (c.email.toLowerCase().includes(searchLower)) ||
      (c.location?.toLowerCase().includes(searchLower));
    const matchesFilter =
      filterReplied === "all" ||
      (filterReplied === "replied" && c.alreadyReplied) ||
      (filterReplied === "unreplied" && !c.alreadyReplied);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: contacts.length,
    replied: contacts.filter(c => c.alreadyReplied).length,
    withPhone: contacts.filter(c => c.phoneNumber).length,
    withLinkedIn: contacts.filter(c => c.linkedInProfile).length,
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin text-muted-foreground mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">Loading recruiters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-destructive mx-auto mb-3" size={32} />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={loadRecruiters}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-[1200px] mx-auto space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Recruiters", value: stats.total, icon: Users },
            { label: "Replied Back",     value: stats.replied,     icon: CheckCircle },
            { label: "With Phone",       value: stats.withPhone,   icon: Phone },
            { label: "With LinkedIn",    value: stats.withLinkedIn, icon: ExternalLink },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon size={15} className="text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, company, role, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-muted/50"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border">
            {(["all", "replied", "unreplied"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterReplied(f)}
                className={cn(
                  "px-3 py-1 rounded-md text-[11px] font-medium capitalize transition-all",
                  filterReplied === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Button
            size="sm" variant="outline" className="h-9 gap-1.5 shrink-0"
            onClick={loadRecruiters}
          >
            <RefreshCw size={13} /> Refresh
          </Button>
        </div>

        {/* Count */}
        <p className="text-[12px] text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {contacts.length} recruiters
        </p>

        {/* Recruiter grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((contact) => (
            <RecruiterCard
              key={contact.id}
              contact={contact}
              onEmail={() => { setSelectedContact(contact); setEmailModalOpen(true); }}
              onDelete={() => handleDelete(contact.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Users size={40} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-foreground">No recruiters found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {contacts.length === 0
                ? "Use the Recruiter Extraction page to scan your emails"
                : "Try a different search or filter"}
            </p>
          </div>
        )}
      </div>

      {/* Email Modal */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <EmailGeneratorModal recruiter={selectedContact} onClose={() => setEmailModalOpen(false)} />
      </Dialog>
    </div>
  );
}
