"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Lock, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateAiConfig } from "@/lib/account/actions";

export interface AiConfigData {
  scope: "school" | "personal";
  schoolName: string | null;
  canEdit: boolean;
  config: { provider: string | null; baseUrl: string | null; model: string | null; hasKey: boolean };
  effective: { provider: string; model: string; baseUrl: string };
  defaultModel: string;
}

const PRESETS: Record<string, { baseUrl: string; model: string }> = {
  glm: { baseUrl: "https://api.z.ai/api/paas/v4", model: "glm-5.2" },
  deepseek: { baseUrl: "https://api.deepseek.com", model: "deepseek-v4-pro" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  custom: { baseUrl: "", model: "" },
};

export function AiModelForm({ data }: { data: AiConfigData }) {
  const [provider, setProvider] = useState(data.config.provider ?? "glm");
  const [model, setModel] = useState(data.config.model ?? "");
  const [baseUrl, setBaseUrl] = useState(data.config.baseUrl ?? "");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(data.config.hasKey);
  const [pending, start] = useTransition();

  // Read-only for school members who aren't admins.
  if (!data.canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="size-4 text-muted-foreground" /> AI model</CardTitle>
          <CardDescription>
            Your AI model is managed by {data.schoolName ?? "your school"}. It applies to everyone at your school.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            Current model: <b>{data.effective.model}</b>
          </div>
        </CardContent>
      </Card>
    );
  }

  function onProvider(v: string) {
    setProvider(v);
    const p = PRESETS[v];
    if (p && v !== "custom") {
      setBaseUrl(p.baseUrl);
      if (!model) setModel(p.model);
    }
  }

  function save() {
    start(async () => {
      const r = await updateAiConfig({
        provider,
        baseUrl: baseUrl || undefined,
        model: model || undefined,
        apiKey: apiKey || undefined, // blank keeps the existing key
      });
      if (r.success) {
        if (apiKey) { setHasKey(true); setApiKey(""); }
        toast.success("AI model saved");
      } else {
        toast.error(r.error);
      }
    });
  }

  function resetToDefault() {
    start(async () => {
      const r = await updateAiConfig({ clearKey: true, provider: "", baseUrl: "", model: "" });
      if (r.success) {
        setProvider("glm"); setModel(""); setBaseUrl(""); setApiKey(""); setHasKey(false);
        toast.success("Reset to the platform default model");
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="size-4 text-primary" /> AI model</CardTitle>
        <CardDescription>
          {data.scope === "school"
            ? "Set the AI model and API key for your whole school. This applies to every member (Validate with AI, RoboVibe, descriptions)."
            : "Choose your own AI model and supply your API key. Leave blank to use the platform default."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={onProvider}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="glm">GLM</SelectItem>
              <SelectItem value="deepseek">DeepSeek</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="custom">Custom (OpenAI-compatible)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ai-model">Model</Label>
          <Input id="ai-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder={data.defaultModel} />
        </div>
        {provider === "custom" && (
          <div className="grid gap-2">
            <Label htmlFor="ai-baseurl">Base URL</Label>
            <Input id="ai-baseurl" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" />
            <p className="text-xs text-muted-foreground">An OpenAI-compatible /chat/completions endpoint.</p>
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="ai-key">API key</Label>
          <Input
            id="ai-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKey ? "•••••••• (saved — leave blank to keep)" : "Paste your API key"}
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">Stored securely on the server and never shown again.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={save} disabled={pending}><Save className="size-4" /> Save</Button>
          <Button variant="ghost" onClick={resetToDefault} disabled={pending}><RotateCcw className="size-4" /> Use platform default</Button>
        </div>
      </CardContent>
    </Card>
  );
}
