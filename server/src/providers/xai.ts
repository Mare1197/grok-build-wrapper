import type {
  EditRequest,
  GenerateRequest,
  GenerateResult,
  GeneratedImage,
  ModelInfo,
  ProviderCapabilities,
} from "../../../shared/types.js";
import type { ImageProvider, ProviderContext } from "./types.js";

const XAI_BASE = "https://api.x.ai/v1";

const ASPECT_RATIOS = [
  "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3",
  "2:1", "1:2", "19.5:9", "9:19.5", "20:9", "9:20", "auto",
];

const CAPABILITIES: ProviderCapabilities = {
  generate: true,
  edit: true,
  multiRef: true,
  maxRefs: 3,
  aspectRatios: ASPECT_RATIOS,
  resolutions: ["1k", "2k"],
  batchMax: 4,
  requiresApiKey: true,
  supportsSeed: false,
};

const MODELS: ModelInfo[] = [
  {
    id: "grok-imagine-image-quality",
    label: "Grok Imagine Quality",
    description: "High-fidelity Grok Imagine",
  },
  {
    id: "grok-imagine-image",
    label: "Grok Imagine",
    description: "Faster Grok Imagine",
  },
];

function requireKey(ctx: ProviderContext): string {
  const key = ctx.xaiApiKey?.trim();
  if (!key) {
    throw new Error("xAI API key is not configured. Set it in Settings or XAI_API_KEY.");
  }
  return key;
}

async function parseImages(res: Response): Promise<GeneratedImage[]> {
  const body = (await res.json()) as {
    data?: { b64_json?: string; url?: string }[];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(body.error?.message || `xAI image API error ${res.status}`);
  }
  const data = body.data ?? [];
  if (!data.length) throw new Error("xAI returned no images");
  return data.map((d) => ({
    b64: d.b64_json,
    url: d.url,
    mimeType: "image/jpeg",
  }));
}

export const xaiProvider: ImageProvider = {
  id: "xai",
  label: "xAI Grok Imagine",
  description: "Grok Imagine via api.x.ai — quality image gen & edit",
  capabilities: CAPABILITIES,
  listModels: () => MODELS,
  isReady(ctx) {
    if (!ctx.xaiApiKey?.trim()) {
      return { ready: false, message: "Set XAI_API_KEY or add key in Settings" };
    }
    return { ready: true };
  },
  async generate(req: GenerateRequest, ctx: ProviderContext): Promise<GenerateResult> {
    const key = requireKey(ctx);
    const n = Math.min(Math.max(req.n ?? 1, 1), CAPABILITIES.batchMax);
    const payload: Record<string, unknown> = {
      model: req.model || "grok-imagine-image-quality",
      prompt: req.prompt,
      n,
      response_format: "b64_json",
    };
    if (req.aspectRatio) payload.aspect_ratio = req.aspectRatio;
    if (req.resolution) payload.resolution = req.resolution;

    const res = await fetch(`${XAI_BASE}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });
    const images = await parseImages(res);
    return {
      images,
      provider: "xai",
      model: String(payload.model),
      prompt: req.prompt,
    };
  },
  async edit(req: EditRequest, ctx: ProviderContext): Promise<GenerateResult> {
    const key = requireKey(ctx);
    const n = Math.min(Math.max(req.n ?? 1, 1), CAPABILITIES.batchMax);
    const payload: Record<string, unknown> = {
      model: req.model || "grok-imagine-image-quality",
      prompt: req.prompt,
      n,
      response_format: "b64_json",
      image: { url: req.image, type: "image_url" },
    };
    if (req.aspectRatio) payload.aspect_ratio = req.aspectRatio;
    if (req.resolution) payload.resolution = req.resolution;
    if (req.references?.length) {
      payload.images = [req.image, ...req.references].slice(0, 3).map((url) => ({
        url,
        type: "image_url",
      }));
      delete payload.image;
    }

    const res = await fetch(`${XAI_BASE}/images/edits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });
    const images = await parseImages(res);
    return {
      images,
      provider: "xai",
      model: String(payload.model),
      prompt: req.prompt,
    };
  },
};
