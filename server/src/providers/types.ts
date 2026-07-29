import type {
  EditRequest,
  GenerateRequest,
  GenerateResult,
  ModelInfo,
  ProviderCapabilities,
  ProviderId,
} from "../../../shared/types.js";

export interface ProviderContext {
  xaiApiKey?: string;
  googleApiKey?: string;
}

export interface ImageProvider {
  id: ProviderId;
  label: string;
  description: string;
  capabilities: ProviderCapabilities;
  listModels(): ModelInfo[];
  isReady(ctx: ProviderContext): { ready: boolean; message?: string };
  generate(req: GenerateRequest, ctx: ProviderContext): Promise<GenerateResult>;
  edit?(req: EditRequest, ctx: ProviderContext): Promise<GenerateResult>;
}
