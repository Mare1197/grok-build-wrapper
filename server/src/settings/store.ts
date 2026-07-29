import fs from "node:fs/promises";
import path from "node:path";
import type { AppSettings, PublicSettings, ProviderId } from "../../../shared/types.js";
import { DATA_DIR, SETTINGS_PATH } from "../paths.js";

const DEFAULTS: AppSettings = {
  defaultProvider: "pollinations",
  grokTrustedLocal: false,
  agentPort: 2419,
  grokModel: "grok-build",
  defaultCwd: process.cwd(),
};

function maskKey(key?: string): string | undefined {
  if (!key || key.length < 8) return key ? "••••" : undefined;
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function loadSettings(): Promise<AppSettings> {
  await ensureDataDir();
  let file: Partial<AppSettings> = {};
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8");
    file = JSON.parse(raw) as Partial<AppSettings>;
  } catch {
    /* no file yet */
  }

  const envKey = process.env.XAI_API_KEY?.trim();
  const googleKey = process.env.GOOGLE_API_KEY?.trim();
  const grokBin = process.env.GROK_BIN?.trim();

  return {
    ...DEFAULTS,
    ...file,
    xaiApiKey: file.xaiApiKey || envKey || undefined,
    googleApiKey: file.googleApiKey || googleKey || undefined,
    grokAgentUrl: file.grokAgentUrl || process.env.GROK_AGENT_URL || undefined,
    grokAgentSecret: file.grokAgentSecret || process.env.GROK_AGENT_SECRET || undefined,
    grokBin: file.grokBin || grokBin || undefined,
    defaultProvider: (file.defaultProvider as ProviderId) || DEFAULTS.defaultProvider,
    grokTrustedLocal: file.grokTrustedLocal ?? DEFAULTS.grokTrustedLocal,
    agentPort: file.agentPort ?? DEFAULTS.agentPort,
  };
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await loadSettings();

  const toWrite: AppSettings = {
    defaultProvider: patch.defaultProvider ?? current.defaultProvider,
    defaultModel: patch.defaultModel ?? current.defaultModel,
    defaultCwd: patch.defaultCwd ?? current.defaultCwd,
    grokModel: patch.grokModel ?? current.grokModel,
    grokAgentUrl: patch.grokAgentUrl ?? current.grokAgentUrl,
    grokTrustedLocal: patch.grokTrustedLocal ?? current.grokTrustedLocal,
    grokBin: patch.grokBin ?? current.grokBin,
    agentPort: patch.agentPort ?? current.agentPort,
    xaiApiKey: current.xaiApiKey,
    googleApiKey: current.googleApiKey,
    grokAgentSecret: current.grokAgentSecret,
  };

  // Empty string means "keep existing"; non-empty updates secret fields
  if (typeof patch.xaiApiKey === "string" && patch.xaiApiKey.trim()) {
    toWrite.xaiApiKey = patch.xaiApiKey.trim();
  }
  if (typeof patch.googleApiKey === "string" && patch.googleApiKey.trim()) {
    toWrite.googleApiKey = patch.googleApiKey.trim();
  }
  if (typeof patch.grokAgentSecret === "string" && patch.grokAgentSecret.trim()) {
    toWrite.grokAgentSecret = patch.grokAgentSecret.trim();
  }

  await ensureDataDir();
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(toWrite, null, 2), "utf8");
  return loadSettings();
}

export function toPublicSettings(s: AppSettings): PublicSettings {
  return {
    defaultProvider: s.defaultProvider,
    defaultModel: s.defaultModel,
    defaultCwd: s.defaultCwd,
    grokModel: s.grokModel,
    grokAgentUrl: s.grokAgentUrl,
    grokTrustedLocal: s.grokTrustedLocal,
    grokBin: s.grokBin,
    agentPort: s.agentPort,
    hasXaiApiKey: Boolean(s.xaiApiKey),
    hasGoogleApiKey: Boolean(s.googleApiKey),
    hasGrokAgentSecret: Boolean(s.grokAgentSecret),
    xaiApiKeyMasked: maskKey(s.xaiApiKey),
    googleApiKeyMasked: maskKey(s.googleApiKey),
  };
}

export function settingsDir(): string {
  return path.dirname(SETTINGS_PATH);
}
