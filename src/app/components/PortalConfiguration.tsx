import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Linkedin, Briefcase, Lock, Mail, Check, Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { portalService, type PortalConfiguration as PortalConfig } from "../../services/portalService";

interface PortalConfigurationProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function PortalConfiguration({ onComplete, onSkip }: PortalConfigurationProps) {
  const [loading, setLoading] = useState(false);
  const [showLinkedInPassword, setShowLinkedInPassword] = useState(false);
  const [showNaukriPassword, setShowNaukriPassword] = useState(false);
  const [validatingLinkedIn, setValidatingLinkedIn] = useState(false);
  const [validatingNaukri, setValidatingNaukri] = useState(false);
  const [linkedInValid, setLinkedInValid] = useState(false);
  const [naukriValid, setNaukriValid] = useState(false);

  const [linkedInConfig, setLinkedInConfig] = useState({
    email: "",
    password: "",
    enabled: false,
  });

  const [naukriConfig, setNaukriConfig] = useState({
    email: "",
    password: "",
    enabled: false,
  });

  const validateLinkedIn = async () => {
    if (!linkedInConfig.email || !linkedInConfig.password) {
      toast.error("Please enter LinkedIn credentials");
      return;
    }

    setValidatingLinkedIn(true);
    try {
      const response = await portalService.validateLinkedInCredentials(
        linkedInConfig.email,
        linkedInConfig.password
      );
      if (response.success && response.data?.valid) {
        setLinkedInValid(true);
        toast.success("LinkedIn credentials validated successfully!");
      } else {
        toast.error(response.error || "Invalid LinkedIn credentials");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setValidatingLinkedIn(false);
    }
  };

  const validateNaukri = async () => {
    if (!naukriConfig.email || !naukriConfig.password) {
      toast.error("Please enter Naukri credentials");
      return;
    }

    setValidatingNaukri(true);
    try {
      const response = await portalService.validateNaukriCredentials(
        naukriConfig.email,
        naukriConfig.password
      );
      if (response.success && response.data?.valid) {
        setNaukriValid(true);
        toast.success("Naukri credentials validated successfully!");
      } else {
        toast.error(response.error || "Invalid Naukri credentials");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setValidatingNaukri(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const config: PortalConfig = {
        linkedIn: linkedInConfig,
        naukri: naukriConfig,
      };

      const response = await portalService.savePortalConfiguration(config);
      if (response.success) {
        toast.success("Portal configurations saved successfully!");
        onComplete();
      } else {
        toast.error(response.error || "Failed to save configurations");
      }
    } catch (error) {
      toast.error("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-3xl border-border/50 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="text-primary" size={24} />
            Configure Job Portals
          </CardTitle>
          <CardDescription>
            Connect your job portal accounts to enable automated job applications and profile updates
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Security Notice */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
            <Shield className="text-muted-foreground shrink-0 mt-0.5" size={20} />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Secure Credential Storage</p>
              <p className="text-muted-foreground">
                Your credentials are encrypted using AES-256 encryption and stored securely. 
                We never expose passwords in the UI and they are only used for authorized automation tasks.
              </p>
            </div>
          </div>

          {/* LinkedIn Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Linkedin className="text-blue-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">LinkedIn</h3>
                  <p className="text-sm text-muted-foreground">Connect your LinkedIn account</p>
                </div>
              </div>
              <Switch
                checked={linkedInConfig.enabled}
                onCheckedChange={(checked) => setLinkedInConfig({ ...linkedInConfig, enabled: checked })}
              />
            </div>

            {linkedInConfig.enabled && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pl-13 border-l-2 border-blue-500/20 ml-5 pl-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="linkedinEmail">LinkedIn Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="linkedinEmail"
                        type="email"
                        placeholder="your@email.com"
                        value={linkedInConfig.email}
                        onChange={(e) => setLinkedInConfig({ ...linkedInConfig, email: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedinPassword">LinkedIn Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="linkedinPassword"
                        type={showLinkedInPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={linkedInConfig.password}
                        onChange={(e) => setLinkedInConfig({ ...linkedInConfig, password: e.target.value })}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLinkedInPassword(!showLinkedInPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showLinkedInPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateLinkedIn}
                    disabled={validatingLinkedIn || linkedInValid}
                    className="w-full"
                  >
                    {validatingLinkedIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : linkedInValid ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Validated
                      </>
                    ) : (
                      "Validate Credentials"
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Naukri Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Briefcase className="text-orange-500" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold">Naukri</h3>
                  <p className="text-sm text-muted-foreground">Connect your Naukri account</p>
                </div>
              </div>
              <Switch
                checked={naukriConfig.enabled}
                onCheckedChange={(checked) => setNaukriConfig({ ...naukriConfig, enabled: checked })}
              />
            </div>

            {naukriConfig.enabled && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pl-13 border-l-2 border-orange-500/20 ml-5 pl-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="naukriEmail">Naukri Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="naukriEmail"
                        type="email"
                        placeholder="your@email.com"
                        value={naukriConfig.email}
                        onChange={(e) => setNaukriConfig({ ...naukriConfig, email: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="naukriPassword">Naukri Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="naukriPassword"
                        type={showNaukriPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={naukriConfig.password}
                        onChange={(e) => setNaukriConfig({ ...naukriConfig, password: e.target.value })}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNaukriPassword(!showNaukriPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showNaukriPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateNaukri}
                    disabled={validatingNaukri || naukriValid}
                    className="w-full"
                  >
                    {validatingNaukri ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : naukriValid ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        Validated
                      </>
                    ) : (
                      "Validate Credentials"
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="ghost" onClick={onSkip}>
              Skip for now
            </Button>

            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
