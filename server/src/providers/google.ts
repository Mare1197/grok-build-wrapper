import type {
  GenerateRequest,
  GenerateResult,
  ModelInfo,
  ProviderCapabilities,
} from "../../../shared/types.js";
import type { ImageProvider, ProviderContext } from "./types.js";

const CAPABILITIES: ProviderCapabilities = {
  generate: true,
  edit: false,
  multiRef: false,
  maxRefs: 0,
  aspectRatios: ["1:1", "16:9", "9:16"],
  batchMax: 1,
  requiresApiKey: true,
  supportsSeed: false,
};

export const googleProvider: ImageProvider = {
  id: "google",
  label: "Google (coming soon)",
  description: "Placeholder for Google Imagen / Gemini image — plug in later",
  capabilities: CAPABILITIES,
  listModels(): ModelInfo[] {
    return [
      {
        id: "imagen-3",
        label: "Imagen 3 (planned)",
        description: "Not wired yet — multi-provider hook only",
      },
    ];
  },
  isReady(ctx: ProviderContext) {
    if (!ctx.googleApiKey?.trim()) {
      return { ready: false, message: "Google provider not implemented yet (stub)" };
    }
    return { ready: false, message: "Google provider stub — not implemented in v1" };
  },
  async generate(_req: GenerateRequest, _ctx: ProviderContext): Promise<GenerateResult> {
    throw new Error(
      "Google image provider is a stub. Add implementation in server/src/providers/google.ts later."
    );
  },
};
