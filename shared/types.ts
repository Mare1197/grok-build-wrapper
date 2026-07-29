/** Shared DTOs — Grok Build wrapper + Imagine studio */

export type ProviderId = "xai" | "pollinations" | "google";

export interface ModelInfo {
  id: string;
  label: string;
  description?: string;
}

export interface ProviderCapabilities {
  generate: boolean;
  edit: boolean;
  multiRef: boolean;
  maxRefs: number;
  aspectRatios: string[];
  resolutions?: string[];
  batchMax: number;
  requiresApiKey: boolean;
  supportsSeed: boolean;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  description: string;
  enabled: boolean;
  ready: boolean;
  readyMessage?: string;
  capabilities: ProviderCapabilities;
  models: ModelInfo[];
}

export interface GenerateRequest {
  provider: ProviderId;
  model: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  resolution?: string;
  n?: number;
  seed?: number;
  references?: string[];
}

export interface EditRequest {
  provider: ProviderId;
  model: string;
  prompt: string;
  image: string;
  references?: string[];
  aspectRatio?: string;
  resolution?: string;
  n?: number;
}

export interface GeneratedImage {
  b64?: string;
  mimeType?: string;
  url?: string;
}

export interface GenerateResult {
  images: GeneratedImage[];
  provider: ProviderId;
  model: string;
  prompt: string;
}

export interface GalleryItem {
  id: string;
  createdAt: string;
  prompt: string;
  negativePrompt?: string;
  provider: ProviderId;
  model: string;
  aspectRatio?: string;
  resolution?: string;
  seed?: number;
  favorite: boolean;
  tags: string[];
  filename: string;
  mimeType: string;
  source: "generate" | "edit";
}

export interface AppSettings {
  xaiApiKey?: string;
  googleApiKey?: string;
  defaultProvider: ProviderId;
  defaultModel?: string;
  /** Working directory passed to Grok Build sessions */
  defaultCwd?: string;
  grokModel?: string;
  grokAgentUrl?: string;
  grokAgentSecret?: string;
  /** Start agent with --always-approve when managed by wrapper */
  grokTrustedLocal: boolean;
  grokBin?: string;
  agentPort: number;
}

export interface PublicSettings {
  defaultProvider: ProviderId;
  defaultModel?: string;
  defaultCwd?: string;
  grokModel?: string;
  grokAgentUrl?: string;
  grokTrustedLocal: boolean;
  grokBin?: string;
  agentPort: number;
  hasXaiApiKey: boolean;
  hasGoogleApiKey: boolean;
  hasGrokAgentSecret: boolean;
  xaiApiKeyMasked?: string;
  googleApiKeyMasked?: string;
}

export interface GrokStatus {
  cliInstalled: boolean;
  cliPath?: string;
  cliVersion?: string;
  /** Managed child process or external agent */
  agentRunning: boolean;
  agentManaged: boolean;
  agentUrl?: string;
  message: string;
}

export interface GrokPromptRequest {
  prompt: string;
  mode?: "chat" | "enhance" | "build";
  cwd?: string;
  model?: string;
  sessionId?: string;
}

export interface GrokPromptResponse {
  text: string;
  sessionId?: string;
  error?: string;
  stopReason?: string;
  usage?: Record<string, unknown>;
}

export interface AgentStartRequest {
  cwd?: string;
  model?: string;
  alwaysApprove?: boolean;
  port?: number;
}

export interface HealthResponse {
  ok: boolean;
  version: string;
  product: string;
  providers: { id: ProviderId; ready: boolean }[];
  grok: GrokStatus;
}

export interface TagDefinition {
  id: string;
  label: string;
  value: string;
  category: "subject" | "style" | "lighting" | "camera" | "quality" | "mood" | "color";
}

export interface SelectedTag {
  id: string;
  weight: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}
