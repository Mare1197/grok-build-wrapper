import type { ProviderId, ProviderInfo } from "../../../shared/types.js";
import type { AppSettings } from "../../../shared/types.js";
import { googleProvider } from "./google.js";
import { pollinationsProvider } from "./pollinations.js";
import type { ImageProvider, ProviderContext } from "./types.js";
import { xaiProvider } from "./xai.js";

const ALL: ImageProvider[] = [xaiProvider, pollinationsProvider, googleProvider];

export function ctxFromSettings(s: AppSettings): ProviderContext {
  return {
    xaiApiKey: s.xaiApiKey,
    googleApiKey: s.googleApiKey,
  };
}

export function getProvider(id: ProviderId): ImageProvider | undefined {
  return ALL.find((p) => p.id === id);
}

export function listProviderInfo(s: AppSettings): ProviderInfo[] {
  const ctx = ctxFromSettings(s);
  return ALL.map((p) => {
    const ready = p.isReady(ctx);
    const enabled = p.id !== "google";
    return {
      id: p.id,
      label: p.label,
      description: p.description,
      enabled,
      ready: enabled && ready.ready,
      readyMessage: ready.message,
      capabilities: p.capabilities,
      models: p.listModels(),
    };
  });
}
