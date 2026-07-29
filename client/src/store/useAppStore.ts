import { create } from "zustand";
import type {
  ChatMessage,
  GalleryItem,
  GrokStatus,
  ProviderId,
  ProviderInfo,
  PublicSettings,
  SelectedTag,
} from "../../../shared/types";
import { api } from "../lib/api";
import { assemblePrompt, randomTags } from "../lib/tags";

export type TabId = "build" | "imagine" | "gallery" | "edit" | "settings";

interface AppState {
  tab: TabId;
  providers: ProviderInfo[];
  provider: ProviderId;
  model: string;
  prompt: string;
  negativePrompt: string;
  selectedTags: SelectedTag[];
  aspectRatio: string;
  resolution: string;
  n: number;
  seed?: number;
  references: string[];
  latest: GalleryItem[];
  gallery: GalleryItem[];
  galleryQ: string;
  favoritesOnly: boolean;
  settings?: PublicSettings;
  grokStatus?: GrokStatus;
  chat: ChatMessage[];
  chatInput: string;
  sessionId?: string;
  buildCwd: string;
  loading: boolean;
  enhancing: boolean;
  error?: string;
  editImage?: string;
  editPrompt: string;
  setTab: (t: TabId) => void;
  setError: (e?: string) => void;
  bootstrap: () => Promise<void>;
  setPrompt: (p: string) => void;
  setProvider: (p: ProviderId) => void;
  setModel: (m: string) => void;
  toggleTag: (id: string) => void;
  adjustTagWeight: (id: string, delta: number) => void;
  randomize: () => void;
  clearPrompt: () => void;
  assembled: () => string;
  addReference: (dataUrl: string) => void;
  removeReference: (i: number) => void;
  generate: () => Promise<void>;
  enhance: () => Promise<void>;
  loadGallery: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  removeGallery: (id: string) => Promise<void>;
  reuseItem: (item: GalleryItem) => void;
  saveSettings: (patch: Record<string, unknown>) => Promise<void>;
  sendChat: () => Promise<void>;
  setChatInput: (v: string) => void;
  startAgent: () => Promise<void>;
  stopAgent: () => Promise<void>;
  refreshGrok: () => Promise<void>;
  setEditImage: (url?: string) => void;
  setEditPrompt: (p: string) => void;
  runEdit: () => Promise<void>;
  setBuildCwd: (c: string) => void;
  setAspect: (a: string) => void;
  setResolution: (r: string) => void;
  setN: (n: number) => void;
  setGalleryQ: (q: string) => void;
  setFavoritesOnly: (v: boolean) => void;
  setNegative: (v: string) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const useAppStore = create<AppState>((set, get) => ({
  tab: "build",
  providers: [],
  provider: "pollinations",
  model: "flux",
  prompt: "",
  negativePrompt: "",
  selectedTags: [],
  aspectRatio: "1:1",
  resolution: "1k",
  n: 1,
  references: [],
  latest: [],
  gallery: [],
  galleryQ: "",
  favoritesOnly: false,
  chat: [
    {
      id: uid(),
      role: "system",
      content:
        "Grok Build Wrapper ready. Chat runs headless `grok -p` against your local Grok Build CLI. Use Imagine for multi-provider image generation.",
      createdAt: new Date().toISOString(),
    },
  ],
  chatInput: "",
  buildCwd: "",
  loading: false,
  enhancing: false,
  editPrompt: "",

  setTab: (tab) => set({ tab }),
  setError: (error) => set({ error }),
  setPrompt: (prompt) => set({ prompt }),
  setNegative: (negativePrompt) => set({ negativePrompt }),
  setAspect: (aspectRatio) => set({ aspectRatio }),
  setResolution: (resolution) => set({ resolution }),
  setN: (n) => set({ n }),
  setGalleryQ: (galleryQ) => set({ galleryQ }),
  setFavoritesOnly: (favoritesOnly) => set({ favoritesOnly }),
  setChatInput: (chatInput) => set({ chatInput }),
  setBuildCwd: (buildCwd) => set({ buildCwd }),
  setEditImage: (editImage) => set({ editImage }),
  setEditPrompt: (editPrompt) => set({ editPrompt }),

  setProvider: (provider) => {
    const p = get().providers.find((x) => x.id === provider);
    set({
      provider,
      model: p?.models[0]?.id || get().model,
      aspectRatio: p?.capabilities.aspectRatios[0] || "1:1",
    });
  },
  setModel: (model) => set({ model }),

  assembled: () => assemblePrompt(get().prompt, get().selectedTags),

  toggleTag: (id) => {
    const cur = get().selectedTags;
    if (cur.some((t) => t.id === id)) {
      set({ selectedTags: cur.filter((t) => t.id !== id) });
    } else {
      set({ selectedTags: [...cur, { id, weight: 1 }] });
    }
  },

  adjustTagWeight: (id, delta) => {
    set({
      selectedTags: get().selectedTags.map((t) =>
        t.id === id
          ? { ...t, weight: Math.min(2, Math.max(0.5, Math.round((t.weight + delta) * 10) / 10)) }
          : t
      ),
    });
  },

  randomize: () => set({ selectedTags: randomTags(6) }),
  clearPrompt: () => set({ prompt: "", selectedTags: [], negativePrompt: "", references: [] }),

  addReference: (dataUrl) => {
    const refs = get().references;
    if (refs.length >= 3) return;
    set({ references: [...refs, dataUrl] });
  },
  removeReference: (i) => set({ references: get().references.filter((_, idx) => idx !== i) }),

  bootstrap: async () => {
    try {
      const [{ providers }, { settings }, { status }, { items }] = await Promise.all([
        api.providers(),
        api.settings(),
        api.grokStatus(),
        api.gallery(),
      ]);
      const ready = providers.find((p) => p.ready) || providers[0];
      const preferred =
        providers.find((p) => p.id === settings.defaultProvider && p.ready) || ready;
      set({
        providers,
        settings,
        grokStatus: status,
        gallery: items,
        provider: preferred?.id || "pollinations",
        model: settings.defaultModel || preferred?.models[0]?.id || "flux",
        buildCwd: settings.defaultCwd || "",
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    }
  },

  generate: async () => {
    const state = get();
    const prompt = state.assembled();
    if (!prompt.trim()) {
      set({ error: "Add a prompt or tags first" });
      return;
    }
    set({ loading: true, error: undefined });
    try {
      const { items } = await api.generate({
        provider: state.provider,
        model: state.model,
        prompt,
        negativePrompt: state.negativePrompt || undefined,
        aspectRatio: state.aspectRatio,
        resolution: state.resolution,
        n: state.n,
        seed: state.seed,
        references: state.references.length ? state.references : undefined,
      });
      set({
        latest: items,
        gallery: [...items, ...get().gallery],
        loading: false,
      });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  enhance: async () => {
    const prompt = get().assembled();
    if (!prompt.trim()) return;
    set({ enhancing: true, error: undefined });
    try {
      const res = await api.grokPrompt({ prompt, mode: "enhance", cwd: get().buildCwd || undefined });
      set({ prompt: res.text.trim(), selectedTags: [], enhancing: false });
    } catch (e) {
      set({ enhancing: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  loadGallery: async () => {
    try {
      const { items } = await api.gallery({
        q: get().galleryQ || undefined,
        favorite: get().favoritesOnly || undefined,
      });
      set({ gallery: items });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    }
  },

  toggleFavorite: async (id) => {
    const { item } = await api.favorite(id);
    set({
      gallery: get().gallery.map((g) => (g.id === id ? item : g)),
      latest: get().latest.map((g) => (g.id === id ? item : g)),
    });
  },

  removeGallery: async (id) => {
    await api.deleteGallery(id);
    set({
      gallery: get().gallery.filter((g) => g.id !== id),
      latest: get().latest.filter((g) => g.id !== id),
    });
  },

  reuseItem: (item) => {
    set({
      tab: "imagine",
      prompt: item.prompt,
      provider: item.provider,
      model: item.model,
      aspectRatio: item.aspectRatio || "1:1",
      resolution: item.resolution || "1k",
      selectedTags: [],
    });
  },

  saveSettings: async (patch) => {
    const { settings } = await api.saveSettings(patch);
    set({ settings });
    await get().bootstrap();
  },

  sendChat: async () => {
    const text = get().chatInput.trim();
    if (!text) return;
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    set({
      chat: [...get().chat, userMsg],
      chatInput: "",
      loading: true,
      error: undefined,
    });
    try {
      const res = await api.grokPrompt({
        prompt: text,
        mode: "build",
        cwd: get().buildCwd || undefined,
        model: get().settings?.grokModel,
        sessionId: get().sessionId,
      });
      const assistant: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: res.text || "(empty response)",
        createdAt: new Date().toISOString(),
        meta: { sessionId: res.sessionId, usage: res.usage },
      };
      set({
        chat: [...get().chat, assistant],
        sessionId: res.sessionId || get().sessionId,
        loading: false,
      });
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      set({
        loading: false,
        error: err,
        chat: [
          ...get().chat,
          {
            id: uid(),
            role: "system",
            content: `Error: ${err}`,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }
  },

  startAgent: async () => {
    set({ loading: true, error: undefined });
    try {
      const res = await api.agentStart({
        cwd: get().buildCwd || undefined,
        model: get().settings?.grokModel,
        alwaysApprove: get().settings?.grokTrustedLocal,
      });
      if (!res.ok) throw new Error(res.error || "Failed to start agent");
      await get().refreshGrok();
      set({
        loading: false,
        chat: [
          ...get().chat,
          {
            id: uid(),
            role: "system",
            content: `Managed Grok agent started${res.url ? ` at ${res.url}` : ""}. Headless prompts still work via Build chat.`,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },

  stopAgent: async () => {
    await api.agentStop();
    await get().refreshGrok();
  },

  refreshGrok: async () => {
    const { status } = await api.grokStatus();
    set({ grokStatus: status });
  },

  runEdit: async () => {
    const { editImage, editPrompt, provider, model, aspectRatio, resolution } = get();
    if (!editImage || !editPrompt.trim()) {
      set({ error: "Need an image and edit prompt" });
      return;
    }
    set({ loading: true, error: undefined });
    try {
      const { items } = await api.edit({
        provider,
        model,
        prompt: editPrompt,
        image: editImage,
        aspectRatio,
        resolution,
      });
      set({
        latest: items,
        gallery: [...items, ...get().gallery],
        loading: false,
        tab: "gallery",
      });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : String(e) });
    }
  },
}));
