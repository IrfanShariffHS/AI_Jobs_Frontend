import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Mail, Phone, MapPin, Building, Briefcase, DollarSign, Calendar, Upload, FileText, GraduationCap, Check, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { profileService, ProfileCompletionData } from "../../services/profileService";

interface ProfileCompletionProps {
  onComplete: () => void;
}

export function ProfileCompletion({ onComplete }: ProfileCompletionProps) {
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const sections = [
    "Personal Information",
    "Professional Information",
    "Resume Upload",
  ];

  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    email: "",
    mobile: "",
    dateOfBirth: "",
    currentCity: "",
    preferredLocation: "",
    
    // Professional Information
    currentCompany: "",
    currentDesignation: "",
    yearsOfExperience: "",
    currentCTC: "",
    expectedCTC: "",
    noticePeriod: "",
    preferredJobRole: "",
    employmentType: "",
    highestQualification: "",
    summary: "",
  });

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setLoading(true);
      
      try {
        const response = await profileService.parseResume(file);
        if (response.success && response.data) {
          setParsedData(response.data.parsedData);
          toast.success("Resume parsed successfully!");
        } else {
          toast.error(response.error || "Failed to parse resume");
        }
      } catch (error) {
        toast.error("Network error occurred");
      } finally {
        setLoading(false);
      }
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const profileData: ProfileCompletionData = {
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        dateOfBirth: formData.dateOfBirth,
        currentCity: formData.currentCity,
        preferredLocation: formData.preferredLocation,
        currentCompany: formData.currentCompany,
        currentDesignation: formData.currentDesignation,
        yearsOfExperience: formData.yearsOfExperience,
        currentCTC: formData.currentCTC,
        expectedCTC: formData.expectedCTC,
        noticePeriod: formData.noticePeriod,
        preferredJobRole: formData.preferredJobRole,
        employmentType: formData.employmentType,
        highestQualification: formData.highestQualification,
        skills: skills,
        summary: formData.summary,
      };

      const response = await profileService.completeProfile(profileData);
      if (response.success) {
        toast.success("Profile completed successfully!");
        onComplete();
      } else {
        toast.error(response.error || "Failed to save profile");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <User className="text-primary" size={20} />
        Personal Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="John Doe"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="mobile"
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="+91 98765 43210"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentCity">Current City *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="currentCity"
              value={formData.currentCity}
              onChange={(e) => setFormData({ ...formData, currentCity: e.target.value })}
              placeholder="Mumbai"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredLocation">Preferred Job Location *</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="preferredLocation"
              value={formData.preferredLocation}
              onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
              placeholder="Bangalore, Pune, Remote"
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfessionalInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Briefcase className="text-primary" size={20} />
        Professional Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currentCompany">Current Company</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="currentCompany"
              value={formData.currentCompany}
              onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
              placeholder="Tech Corp"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentDesignation">Current Designation</Label>
          <Input
            id="currentDesignation"
            value={formData.currentDesignation}
            onChange={(e) => setFormData({ ...formData, currentDesignation: e.target.value })}
            placeholder="Software Engineer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
          <Select
            value={formData.yearsOfExperience}
            onValueChange={(value) => setFormData({ ...formData, yearsOfExperience: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select experience" />
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

        <div className="space-y-2">
          <Label htmlFor="currentCTC">Current CTC (LPA)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="currentCTC"
              type="number"
              value={formData.currentCTC}
              onChange={(e) => setFormData({ ...formData, currentCTC: e.target.value })}
              placeholder="15"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="expectedCTC">Expected CTC (LPA)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="expectedCTC"
              type="number"
              value={formData.expectedCTC}
              onChange={(e) => setFormData({ ...formData, expectedCTC: e.target.value })}
              placeholder="20"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="noticePeriod">Notice Period</Label>
          <Select
            value={formData.noticePeriod}
            onValueChange={(value) => setFormData({ ...formData, noticePeriod: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select notice period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="15 days">15 days</SelectItem>
              <SelectItem value="1 month">1 month</SelectItem>
              <SelectItem value="2 months">2 months</SelectItem>
              <SelectItem value="3 months">3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredJobRole">Preferred Job Role *</Label>
          <Input
            id="preferredJobRole"
            value={formData.preferredJobRole}
            onChange={(e) => setFormData({ ...formData, preferredJobRole: e.target.value })}
            placeholder="Full Stack Developer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employmentType">Employment Type</Label>
          <Select
            value={formData.employmentType}
            onValueChange={(value) => setFormData({ ...formData, employmentType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="highestQualification">Highest Qualification *</Label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="highestQualification"
              value={formData.highestQualification}
              onChange={(e) => setFormData({ ...formData, highestQualification: e.target.value })}
              placeholder="B.Tech Computer Science"
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="skills">Skills</Label>
          <div className="flex gap-2">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="Add a skill and press Enter"
            />
            <Button type="button" onClick={addSkill} variant="outline">
              <Check size={16} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="gap-1">
                {skill}
                <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive">
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="summary">Professional Summary</Label>
          <Textarea
            id="summary"
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Brief description about yourself..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );

  const renderResumeUpload = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="text-primary" size={20} />
        Resume Upload
      </h3>
      
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Upload your resume (PDF or DOCX)
        </p>
        <Input
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleResumeUpload}
          className="max-w-xs mx-auto"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={16} />
          <span>Parsing resume...</span>
        </div>
      )}

      {parsedData && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Check className="text-green-500" size={16} />
              Extracted Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span> {parsedData.fullName}
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span> {parsedData.email}
              </div>
              <div>
                <span className="text-muted-foreground">Mobile:</span> {parsedData.mobile}
              </div>
              <div>
                <span className="text-muted-foreground">Company:</span> {parsedData.currentCompany}
              </div>
              <div>
                <span className="text-muted-foreground">Designation:</span> {parsedData.currentDesignation}
              </div>
              <div>
                <span className="text-muted-foreground">Experience:</span> {parsedData.yearsOfExperience} years
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Skills:</span>{" "}
                {parsedData.skills.map((s: string) => s).join(", ")}
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Qualification:</span> {parsedData.highestQualification}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                setFormData({
                  ...formData,
                  fullName: parsedData.fullName,
                  email: parsedData.email,
                  mobile: parsedData.mobile,
                  currentCompany: parsedData.currentCompany,
                  currentDesignation: parsedData.currentDesignation,
                  yearsOfExperience: parsedData.yearsOfExperience,
                  highestQualification: parsedData.highestQualification,
                });
                setSkills(parsedData.skills);
                toast.success("Information applied to form!");
              }}
            >
              Apply to Form
            </Button>
          </CardContent>
        </Card>
      )}

      {resumeFile && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <FileText className="text-primary" size={20} />
          <span className="text-sm flex-1 truncate">{resumeFile.name}</span>
          <Button variant="ghost" size="sm" onClick={() => setResumeFile(null)}>
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-4xl border-border/50 shadow-2xl">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>
            Fill in your details to get personalized job recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Section {currentSection + 1} of {sections.length}
              </span>
              <span className="text-sm font-medium text-primary">
                {Math.round(((currentSection + 1) / sections.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>

          {/* Section content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentSection === 0 && renderPersonalInfo()}
              {currentSection === 1 && renderProfessionalInfo()}
              {currentSection === 2 && renderResumeUpload()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentSection === 0}
            >
              Previous
            </Button>

            <Button onClick={handleNext} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : currentSection === sections.length - 1 ? (
                "Complete Setup"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
