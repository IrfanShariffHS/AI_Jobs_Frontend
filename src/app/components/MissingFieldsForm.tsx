import React, { useState } from "react";
import { User, MapPin, Briefcase, GraduationCap, Loader2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "./ui/utils";
import { ProfileSnapshot } from "../../services/onboardingService";

const FIELD_CONFIG: Record<string, { label: string; placeholder: string; icon?: React.ElementType; type?: string }> = {
  fullName: { label: "Full Name", placeholder: "John Doe", icon: User },
  currentCity: { label: "Current City", placeholder: "Mumbai", icon: MapPin },
  preferredLocation: { label: "Preferred Job Location", placeholder: "Bangalore, Pune, Remote", icon: MapPin },
  yearsOfExperience: { label: "Years of Experience", placeholder: "Select experience", icon: Briefcase },
  preferredJobRole: { label: "Preferred Job Role", placeholder: "Full Stack Developer", icon: Briefcase },
  highestQualification: { label: "Highest Qualification", placeholder: "B.Tech Computer Science", icon: GraduationCap },
};

interface MissingFieldsFormProps {
  missingFields: string[];
  profile: ProfileSnapshot;
  onSubmit: (data: Partial<ProfileSnapshot>) => Promise<void>;
  loading?: boolean;
}

export function MissingFieldsForm({ missingFields, profile, onSubmit, loading }: MissingFieldsFormProps) {
  const [formData, setFormData] = useState<Partial<ProfileSnapshot>>(() => {
    const initial: Partial<ProfileSnapshot> = {};
    for (const field of missingFields) {
      const key = field as keyof ProfileSnapshot;
      initial[key] = (profile[key] as string) || "";
    }
    return initial;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const renderField = (field: string) => {
    const config = FIELD_CONFIG[field];
    if (!config) return null;
    const Icon = config.icon;

    if (field === "yearsOfExperience") {
      return (
        <div key={field} className="space-y-1.5">
          <Label htmlFor={field} className="text-sm">
            {config.label} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.yearsOfExperience || ""}
            onValueChange={(value) => setFormData({ ...formData, yearsOfExperience: value })}
          >
            <SelectTrigger className="h-11 rounded-xl border-border/70 bg-input/40">
              <SelectValue placeholder={config.placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0-1">0-1 years</SelectItem>
              <SelectItem value="1-3">1-3 years</SelectItem>
              <SelectItem value="3-5">3-5 years</SelectItem>
              <SelectItem value="5-10">5-10 years</SelectItem>
              <SelectItem value="10+">10+ years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    return (
      <div key={field} className="space-y-1.5">
        <Label htmlFor={field} className="text-sm">
          {config.label} <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          )}
          <Input
            id={field}
            value={(formData[field as keyof ProfileSnapshot] as string) || ""}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            placeholder={config.placeholder}
            className={cn(
              "h-11 rounded-xl border-border/70 bg-input/40 transition-shadow focus-visible:ring-primary/30",
              Icon && "pl-10"
            )}
          />
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-border/40 bg-muted/25 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          We couldn't find the following from your resume or connected profiles. Fill in only what's missing.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {missingFields.map(renderField)}
      </div>
      <Button
        type="submit"
        size="lg"
        className="h-11 w-full rounded-xl"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            Complete Setup
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
