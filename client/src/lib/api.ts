import type {
  GalleryItem,
  GrokPromptResponse,
  GrokStatus,
  HealthResponse,
  ProviderInfo,
  PublicSettings,
  ProviderId,
} from "../../../shared/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || "Request failed");
  }
  return data as T;
}

export const api = {
  health: () => request<HealthResponse>("/api/health"),
  providers: () => request<{ providers: ProviderInfo[] }>("/api/providers"),
  generate: (body: {
    provider: ProviderId;
    model: string;
    prompt: string;
    negativePrompt?: string;
    aspectRatio?: string;
    resolution?: string;
    n?: number;
    seed?: number;
    references?: string[];
  }) => request<{ items: GalleryItem[] }>("/api/generate", { method: "POST", body: JSON.stringify(body) }),
  edit: (body: {
    provider: ProviderId;
    model: string;
    prompt: string;
    image: string;
    references?: string[];
    aspectRatio?: string;
    resolution?: string;
    n?: number;
  }) => request<{ items: GalleryItem[] }>("/api/edit", { method: "POST", body: JSON.stringify(body) }),
  gallery: (params?: { q?: string; favorite?: boolean; provider?: string }) => {
    const sp = new URLSearchParams();
    if (params?.q) sp.set("q", params.q);
    if (params?.favorite) sp.set("favorite", "1");
    if (params?.provider) sp.set("provider", params.provider);
    const q = sp.toString();
    return request<{ items: GalleryItem[] }>(`/api/gallery${q ? `?${q}` : ""}`);
  },
  favorite: (id: string, favorite?: boolean) =>
    request<{ item: GalleryItem }>(`/api/gallery/${id}/favorite`, {
      method: "POST",
      body: JSON.stringify({ favorite }),
    }),
  deleteGallery: (id: string) =>
    request<{ ok: boolean }>(`/api/gallery/${id}`, { method: "DELETE" }),
  imageUrl: (id: string) => `/api/gallery/${id}/image`,
  settings: () => request<{ settings: PublicSettings }>("/api/settings"),
  saveSettings: (patch: Record<string, unknown>) =>
    request<{ settings: PublicSettings }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(patch),
    }),
  grokStatus: () => request<{ status: GrokStatus }>("/api/grok/status"),
  grokPrompt: (body: {
    prompt: string;
    mode?: "chat" | "enhance" | "build";
    cwd?: string;
    model?: string;
    sessionId?: string;
  }) =>
    request<GrokPromptResponse>("/api/grok/prompt", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  agentStart: (body?: { cwd?: string; model?: string; alwaysApprove?: boolean }) =>
    request<{ ok: boolean; url?: string; error?: string }>("/api/grok/agent/start", {
      method: "POST",
      body: JSON.stringify(body || {}),
    }),
  agentStop: () =>
    request<{ ok: boolean }>("/api/grok/agent/stop", { method: "POST", body: "{}" }),
};
