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
  aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"],
  batchMax: 4,
  requiresApiKey: false,
  supportsSeed: true,
};

const MODELS: ModelInfo[] = [
  { id: "flux", label: "Flux", description: "Default Pollinations Flux model" },
  { id: "turbo", label: "Turbo", description: "Faster Pollinations model" },
];

const SIZE: Record<string, { w: number; h: number }> = {
  "1:1": { w: 1024, h: 1024 },
  "16:9": { w: 1280, h: 720 },
  "9:16": { w: 720, h: 1280 },
  "4:3": { w: 1024, h: 768 },
  "3:4": { w: 768, h: 1024 },
  "3:2": { w: 1200, h: 800 },
  "2:3": { w: 800, h: 1200 },
};

function sizeFor(aspect?: string) {
  return SIZE[aspect || "1:1"] || SIZE["1:1"];
}

export const pollinationsProvider: ImageProvider = {
  id: "pollinations",
  label: "Pollinations",
  description: "Free image generation — no API key required",
  capabilities: CAPABILITIES,
  listModels: () => MODELS,
  isReady() {
    return { ready: true };
  },
  async generate(req: GenerateRequest, _ctx: ProviderContext): Promise<GenerateResult> {
    const n = Math.min(Math.max(req.n ?? 1, 1), CAPABILITIES.batchMax);
    const { w, h } = sizeFor(req.aspectRatio);
    const model = req.model || "flux";
    const images: GenerateResult["images"] = [];

    for (let i = 0; i < n; i++) {
      const seed = req.seed != null ? req.seed + i : Math.floor(Math.random() * 1e9);
      const prompt = encodeURIComponent(req.prompt.slice(0, 1500));
      const url =
        `https://image.pollinations.ai/prompt/${prompt}` +
        `?width=${w}&height=${h}&model=${encodeURIComponent(model)}&seed=${seed}&nologo=true&enhance=true`;

      const res = await fetch(url, {
        headers: { Accept: "image/*" },
      });
      if (!res.ok) {
        throw new Error(`Pollinations error ${res.status}`);
      }
      const ab = await res.arrayBuffer();
      const b64 = Buffer.from(ab).toString("base64");
      const ct = res.headers.get("content-type") || "image/jpeg";
      images.push({ b64, mimeType: ct.split(";")[0], url });
    }

    return {
      images,
      provider: "pollinations",
      model,
      prompt: req.prompt,
    };
  },
};
