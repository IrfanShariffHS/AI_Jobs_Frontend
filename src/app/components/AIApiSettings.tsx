import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Key, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw,
  Sparkles, Brain, Zap, Shield, ExternalLink, Copy, Check, Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { cn } from "./ui/utils";
import { toast } from "sonner";
import { apiService } from "../../services/api";

interface AIApiKey {
  provider: "groq" | "gemini";
  key: string;
  masked: boolean;
  status: "valid" | "invalid" | "not_set" | "checking";
  lastChecked?: string;
}

export function AIApiSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    groq: false,
    gemini: false
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusInfo, setStatusInfo] = useState<any>(null);
  
  const [apiKeys, setApiKeys] = useState<Record<string, AIApiKey>>({
    groq: {
      provider: "groq",
      key: "",
      masked: true,
      status: "not_set"
    },
    gemini: {
      provider: "gemini",
      key: "",
      masked: true,
      status: "not_set"
    }
  });
  
  const [hasExistingKey, setHasExistingKey] = useState<Record<string, boolean>>({
    groq: false,
    gemini: false
  });

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const [configRes, statusRes] = await Promise.all([
        apiService.get<any>("/api/ai-config"),
        apiService.get<any>("/api/ai-config/status")
      ]);
      
      if (configRes.success && configRes.data) {
        const data = configRes.data;
        const statusData = statusRes.success ? statusRes.data : null;
        setStatusInfo(statusData);
        
        // Check if the key is masked (contains dots) - if so, don't display it in the input
        const isMasked = (key: string | null) => key && key.includes('••••');
        
        setApiKeys({
          groq: {
            provider: "groq",
            key: isMasked(data.groqApiKey) ? "" : (data.groqApiKey || ""),
            masked: true,
            status: statusData ? (statusData.hasGroqKey ? "valid" : "not_set") : (data.groqApiKey ? "valid" : "not_set"),
            lastChecked: data.groqLastChecked
          },
          gemini: {
            provider: "gemini",
            key: isMasked(data.geminiApiKey) ? "" : (data.geminiApiKey || ""),
            masked: true,
            status: statusData ? (statusData.hasGeminiKey ? "valid" : "not_set") : (data.geminiApiKey ? "valid" : "not_set"),
            lastChecked: data.geminiLastChecked
          }
        });
        
        // Track if user has existing keys (for UI display purposes)
        setHasExistingKey({
          groq: !!(data.groqApiKey && isMasked(data.groqApiKey)),
          gemini: !!(data.geminiApiKey && isMasked(data.geminiApiKey))
        });
      }
    } catch (error) {
      console.error("Failed to load API keys:", error);
      toast.error("Failed to load API configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async (provider: "groq" | "gemini", key: string) => {
    try {
      setSaving(true);
      const endpoint = provider === "groq" 
        ? "/api/ai-config/groq" 
        : "/api/ai-config/gemini";
      
      const response = await apiService.post<any>(endpoint, { apiKey: key });
      
      if (response.success) {
        setApiKeys(prev => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            key: "", // Clear the input after saving
            status: "valid",
            lastChecked: new Date().toISOString()
          }
        }));
        setHasExistingKey(prev => ({
          ...prev,
          [provider]: true
        }));
        toast.success(`${provider === "groq" ? "Groq" : "Gemini"} API key saved successfully`);
        // Refresh status to clear system fallback indicators
        const statusRes = await apiService.get<any>("/api/ai-config/status");
        if (statusRes.success) setStatusInfo(statusRes.data);
      } else {
        toast.error(response.error || "Failed to save API key");
      }
    } catch (error) {
      console.error(`Failed to save ${provider} API key:`, error);
      toast.error(`Failed to save ${provider} API key`);
    } finally {
      setSaving(false);
    }
  };

  const deleteApiKey = async (provider: "groq" | "gemini") => {
    try {
      setSaving(true);
      const endpoint = provider === "groq" 
        ? "/api/ai-config/groq" 
        : "/api/ai-config/gemini";
      
      const response = await apiService.delete<any>(endpoint);
      
      if (response.success) {
        setApiKeys(prev => ({
          ...prev,
          [provider]: {
            provider,
            key: "",
            masked: true,
            status: "not_set",
            lastChecked: undefined
          }
        }));
        setHasExistingKey(prev => ({
          ...prev,
          [provider]: false
        }));
        toast.success(`${provider === "groq" ? "Groq" : "Gemini"} API key removed successfully`);
        // Refresh status to update fallback indicators
        const statusRes = await apiService.get<any>("/api/ai-config/status");
        if (statusRes.success) setStatusInfo(statusRes.data);
      } else {
        toast.error(response.error || "Failed to remove API key");
      }
    } catch (error) {
      console.error(`Failed to remove ${provider} API key:`, error);
      toast.error(`Failed to remove ${provider} API key`);
    } finally {
      setSaving(false);
    }
  };

  const testApiKey = async (provider: "groq" | "gemini") => {
    try {
      setTesting(provider);
      const endpoint = provider === "groq" 
        ? "/api/ai-config/groq/test" 
        : "/api/ai-config/gemini/test";
      
      const response = await apiService.post<any>(endpoint, {});
      
      if (response.success) {
        setApiKeys(prev => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            status: "valid",
            lastChecked: new Date().toISOString()
          }
        }));
        toast.success(`${provider === "groq" ? "Groq" : "Gemini"} API key is valid!`);
      } else {
        setApiKeys(prev => ({
          ...prev,
          [provider]: {
            ...prev[provider],
            status: "invalid"
          }
        }));
        toast.error(response.error || "API key validation failed");
      }
    } catch (error) {
      console.error(`Failed to test ${provider} API key:`, error);
      setApiKeys(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          status: "invalid"
        }
      }));
      toast.error(`Failed to test ${provider} API key`);
    } finally {
      setTesting(null);
    }
  };

  const maskKey = (key: string): string => {
    if (!key || key.length < 8) return "••••••••••••••••";
    return key.substring(0, 4) + "••••••••••••" + key.substring(key.length - 4);
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const copyToClipboard = async (text: string, provider: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(provider);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valid":
        return <Badge variant="outline" className="text-[10px] h-5 border-chart-3/30 text-chart-3">
          <CheckCircle size={10} className="mr-1" />
          Valid
        </Badge>;
      case "invalid":
        return <Badge variant="outline" className="text-[10px] h-5 border-destructive/30 text-destructive">
          <AlertCircle size={10} className="mr-1" />
          Invalid
        </Badge>;
      case "checking":
        return <Badge variant="outline" className="text-[10px] h-5 border-chart-4/30 text-chart-4">
          <RefreshCw size={10} className="mr-1 animate-spin" />
          Checking
        </Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] h-5">
          Not Set
        </Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <Alert className="border-chart-1/30 bg-chart-1/5">
        <Sparkles size={16} className="text-chart-1" />
        <AlertDescription className="text-xs text-foreground ml-2">
          <span className="font-medium">AI API Configuration:</span> Provide your own API keys for Groq and Gemini to enable AI-powered features like trending skills analysis, resume optimization, and job matching.
        </AlertDescription>
      </Alert>

      {/* Groq API Configuration */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-1/20 to-chart-3/20 flex items-center justify-center">
                <Zap size={16} className="text-chart-1" />
              </div>
              <div>
                <CardTitle className="text-sm">Groq API Key</CardTitle>
                <CardDescription className="text-xs">LLaMA 3.3 70B for AI personalization</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {apiKeys.groq.status === "not_set" && statusInfo?.systemFallbackAvailable && (
                <Badge variant="outline" className="text-[10px] h-5 border-amber-500/30 text-amber-500 bg-amber-500/5">
                  System Fallback Active
                </Badge>
              )}
              {getStatusBadge(apiKeys.groq.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] flex items-center gap-1">
              API Key
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-chart-1 hover:underline flex items-center gap-1"
              >
                Get API Key <ExternalLink size={10} />
              </a>
            </Label>
            <div className="relative">
              <Input
                type={showKeys.groq ? "text" : "password"}
                value={apiKeys.groq.key}
                onChange={(e) => setApiKeys(prev => ({
                  ...prev,
                  groq: { ...prev.groq, key: e.target.value }
                }))}
                placeholder={hasExistingKey.groq ? "•••••••••••••••• (Enter new key to update)" : "gsk_..."}
                className="h-9 text-xs bg-muted/50 pr-20 font-mono"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={() => toggleShowKey("groq")}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title={showKeys.groq ? "Hide" : "Show"}
                >
                  {showKeys.groq ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {apiKeys.groq.key && (
                  <button
                    onClick={() => copyToClipboard(apiKeys.groq.key, "groq")}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="Copy"
                  >
                    {copiedKey === "groq" ? <Check size={14} className="text-chart-3" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
            {apiKeys.groq.lastChecked && (
              <p className="text-[10px] text-muted-foreground">
                Last verified: {new Date(apiKeys.groq.lastChecked).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => saveApiKey("groq", apiKeys.groq.key)}
              disabled={!apiKeys.groq.key || saving}
              className="text-xs h-7"
            >
              {saving ? <RefreshCw size={12} className="mr-1 animate-spin" /> : null}
              Save Key
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testApiKey("groq")}
              disabled={!apiKeys.groq.key || testing === "groq"}
              className="text-xs h-7"
            >
              {testing === "groq" ? <RefreshCw size={12} className="mr-1 animate-spin" /> : null}
              Test Connection
            </Button>
            {apiKeys.groq.status !== "not_set" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteApiKey("groq")}
                disabled={saving}
                className="text-xs h-7 ml-auto text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <Trash2 size={12} className="mr-1" />
                Remove Key
              </Button>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[11px] font-medium text-foreground">Used For:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                "Trending Skills Analysis & Personalization",
                "Resume ATS Optimization",
                "Job Description Analysis",
                "Cover Letter Generation"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <div className="w-1 h-1 rounded-full bg-chart-1" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gemini API Configuration */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-chart-2/20 to-chart-4/20 flex items-center justify-center">
                <Brain size={16} className="text-chart-2" />
              </div>
              <div>
                <CardTitle className="text-sm">Gemini API Key</CardTitle>
                <CardDescription className="text-xs">Google Gemini for advanced AI features</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {apiKeys.gemini.status === "not_set" && statusInfo?.systemFallbackAvailable && (
                <Badge variant="outline" className="text-[10px] h-5 border-amber-500/30 text-amber-500 bg-amber-500/5">
                  System Fallback Active
                </Badge>
              )}
              {getStatusBadge(apiKeys.gemini.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] flex items-center gap-1">
              API Key
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-chart-2 hover:underline flex items-center gap-1"
              >
                Get API Key <ExternalLink size={10} />
              </a>
            </Label>
            <div className="relative">
              <Input
                type={showKeys.gemini ? "text" : "password"}
                value={apiKeys.gemini.key}
                onChange={(e) => setApiKeys(prev => ({
                  ...prev,
                  gemini: { ...prev.gemini, key: e.target.value }
                }))}
                placeholder={hasExistingKey.gemini ? "•••••••••••••••• (Enter new key to update)" : "AIza..."}
                className="h-9 text-xs bg-muted/50 pr-20 font-mono"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  onClick={() => toggleShowKey("gemini")}
                  className="p-1.5 rounded hover:bg-muted transition-colors"
                  title={showKeys.gemini ? "Hide" : "Show"}
                >
                  {showKeys.gemini ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {apiKeys.gemini.key && (
                  <button
                    onClick={() => copyToClipboard(apiKeys.gemini.key, "gemini")}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="Copy"
                  >
                    {copiedKey === "gemini" ? <Check size={14} className="text-chart-3" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
            {apiKeys.gemini.lastChecked && (
              <p className="text-[10px] text-muted-foreground">
                Last verified: {new Date(apiKeys.gemini.lastChecked).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => saveApiKey("gemini", apiKeys.gemini.key)}
              disabled={!apiKeys.gemini.key || saving}
              className="text-xs h-7"
            >
              {saving ? <RefreshCw size={12} className="mr-1 animate-spin" /> : null}
              Save Key
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => testApiKey("gemini")}
              disabled={!apiKeys.gemini.key || testing === "gemini"}
              className="text-xs h-7"
            >
              {testing === "gemini" ? <RefreshCw size={12} className="mr-1 animate-spin" /> : null}
              Test Connection
            </Button>
            {apiKeys.gemini.status !== "not_set" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => deleteApiKey("gemini")}
                disabled={saving}
                className="text-xs h-7 ml-auto text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <Trash2 size={12} className="mr-1" />
                Remove Key
              </Button>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-[11px] font-medium text-foreground">Used For:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                "Advanced Resume Analysis",
                "Interview Preparation",
                "Career Path Recommendations",
                "Skill Gap Analysis"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <div className="w-1 h-1 rounded-full bg-chart-2" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert className="border-chart-4/30 bg-chart-4/5">
        <Shield size={16} className="text-chart-4" />
        <AlertDescription className="text-xs text-foreground ml-2">
          <span className="font-medium">Security:</span> Your API keys are encrypted and stored securely. They are never logged or shared with third parties. You can revoke or update them at any time.
        </AlertDescription>
      </Alert>

      {/* API Usage Info */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">About API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Why are API keys required?</p>
            <p>
              This application uses AI models from Groq and Gemini to provide intelligent features. To use these services, you need to provide your own API keys. This ensures you have full control over API usage and costs.
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-medium text-foreground mb-1">How to get API keys:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li><span className="font-medium">Groq:</span> Visit <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-chart-1 hover:underline">console.groq.com/keys</a></li>
              <li><span className="font-medium">Gemini:</span> Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-chart-2 hover:underline">aistudio.google.com/app/apikey</a></li>
            </ul>
          </div>
          <Separator />
          <div>
            <p className="font-medium text-foreground mb-1">API Costs:</p>
            <p>
              Both Groq and Gemini offer free tiers with generous quotas. Check their respective pricing pages for current rates. Typical usage for job search automation is minimal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
