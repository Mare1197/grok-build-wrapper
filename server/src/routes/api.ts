import { Hono } from "hono";
import { z } from "zod";
import type { AppSettings, ProviderId } from "../../../shared/types.js";
import {
  bufferFromGenerated,
  deleteItem,
  getImagePath,
  getItem,
  listGallery,
  saveImage,
  setFavorite,
} from "../gallery/store.js";
import {
  getGrokStatus,
  runGrokPrompt,
  startManagedAgent,
  stopManagedAgent,
} from "../grok/bridge.js";
import { ctxFromSettings, getProvider, listProviderInfo } from "../providers/registry.js";
import { loadSettings, saveSettings, toPublicSettings } from "../settings/store.js";

const providerId = z.enum(["xai", "pollinations", "google"]);

const generateSchema = z.object({
  provider: providerId,
  model: z.string().min(1),
  prompt: z.string().min(1).max(8000),
  negativePrompt: z.string().max(2000).optional(),
  aspectRatio: z.string().optional(),
  resolution: z.string().optional(),
  n: z.number().int().min(1).max(4).optional(),
  seed: z.number().optional(),
  references: z.array(z.string()).max(3).optional(),
});

const editSchema = z.object({
  provider: providerId,
  model: z.string().min(1),
  prompt: z.string().min(1).max(8000),
  image: z.string().min(1),
  references: z.array(z.string()).max(3).optional(),
  aspectRatio: z.string().optional(),
  resolution: z.string().optional(),
  n: z.number().int().min(1).max(4).optional(),
});

const settingsPatchSchema = z.object({
  xaiApiKey: z.string().optional(),
  googleApiKey: z.string().optional(),
  defaultProvider: providerId.optional(),
  defaultModel: z.string().optional(),
  defaultCwd: z.string().optional(),
  grokModel: z.string().optional(),
  grokAgentUrl: z.string().optional(),
  grokAgentSecret: z.string().optional(),
  grokTrustedLocal: z.boolean().optional(),
  grokBin: z.string().optional(),
  agentPort: z.number().int().optional(),
});

export function createApi() {
  const api = new Hono();

  api.get("/health", async (c) => {
    const settings = await loadSettings();
    const providers = listProviderInfo(settings);
    const grok = await getGrokStatus(settings);
    return c.json({
      ok: true,
      version: "1.0.0",
      product: "grok-build-wrapper",
      providers: providers.map((p) => ({ id: p.id, ready: p.ready })),
      grok,
    });
  });

  api.get("/providers", async (c) => {
    const settings = await loadSettings();
    return c.json({ providers: listProviderInfo(settings) });
  });

  api.post("/generate", async (c) => {
    const body = generateSchema.parse(await c.req.json());
    const settings = await loadSettings();
    const provider = getProvider(body.provider as ProviderId);
    if (!provider) return c.json({ error: "Unknown provider" }, 400);

    const info = listProviderInfo(settings).find((p) => p.id === body.provider);
    if (!info?.ready) {
      return c.json({ error: info?.readyMessage || "Provider not ready" }, 400);
    }

    const result = await provider.generate(body, ctxFromSettings(settings));
    const items = [];
    for (const img of result.images) {
      const { buffer, mimeType } = await bufferFromGenerated(img);
      const item = await saveImage({
        buffer,
        mimeType,
        prompt: body.prompt,
        negativePrompt: body.negativePrompt,
        provider: body.provider,
        model: body.model,
        aspectRatio: body.aspectRatio,
        resolution: body.resolution,
        seed: body.seed,
        source: "generate",
      });
      items.push(item);
    }
    return c.json({ items, result: { provider: result.provider, model: result.model } });
  });

  api.post("/edit", async (c) => {
    const body = editSchema.parse(await c.req.json());
    const settings = await loadSettings();
    const provider = getProvider(body.provider as ProviderId);
    if (!provider?.edit) {
      return c.json({ error: "Provider does not support edit" }, 400);
    }
    const result = await provider.edit(body, ctxFromSettings(settings));
    const items = [];
    for (const img of result.images) {
      const { buffer, mimeType } = await bufferFromGenerated(img);
      const item = await saveImage({
        buffer,
        mimeType,
        prompt: body.prompt,
        provider: body.provider,
        model: body.model,
        aspectRatio: body.aspectRatio,
        resolution: body.resolution,
        source: "edit",
      });
      items.push(item);
    }
    return c.json({ items });
  });

  api.get("/gallery", async (c) => {
    const q = c.req.query("q") || undefined;
    const favorite = c.req.query("favorite") === "1" || c.req.query("favorite") === "true";
    const provider = c.req.query("provider") as ProviderId | undefined;
    const items = await listGallery({
      q,
      favorite: favorite || undefined,
      provider: provider || undefined,
    });
    return c.json({ items });
  });

  api.get("/gallery/:id", async (c) => {
    const item = await getItem(c.req.param("id"));
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json({ item });
  });

  api.get("/gallery/:id/image", async (c) => {
    const loc = await getImagePath(c.req.param("id"));
    if (!loc) return c.json({ error: "Not found" }, 404);
    const file = await import("node:fs/promises").then((fs) => fs.readFile(loc.filePath));
    return new Response(file, {
      headers: {
        "Content-Type": loc.mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  });

  api.post("/gallery/:id/favorite", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { favorite?: boolean };
    const item = await setFavorite(c.req.param("id"), body.favorite);
    if (!item) return c.json({ error: "Not found" }, 404);
    return c.json({ item });
  });

  api.delete("/gallery/:id", async (c) => {
    const ok = await deleteItem(c.req.param("id"));
    if (!ok) return c.json({ error: "Not found" }, 404);
    return c.json({ ok: true });
  });

  api.get("/settings", async (c) => {
    const s = await loadSettings();
    return c.json({ settings: toPublicSettings(s) });
  });

  api.put("/settings", async (c) => {
    const patch = settingsPatchSchema.parse(await c.req.json());
    const s = await saveSettings(patch as Partial<AppSettings>);
    return c.json({ settings: toPublicSettings(s) });
  });

  api.get("/grok/status", async (c) => {
    const s = await loadSettings();
    return c.json({ status: await getGrokStatus(s) });
  });

  api.post("/grok/prompt", async (c) => {
    const body = z
      .object({
        prompt: z.string().min(1),
        mode: z.enum(["chat", "enhance", "build"]).optional(),
        cwd: z.string().optional(),
        model: z.string().optional(),
        sessionId: z.string().optional(),
      })
      .parse(await c.req.json());
    const s = await loadSettings();
    const result = await runGrokPrompt(s, body);
    if (result.error) return c.json(result, 502);
    return c.json(result);
  });

  api.post("/grok/agent/start", async (c) => {
    const body = z
      .object({
        cwd: z.string().optional(),
        model: z.string().optional(),
        alwaysApprove: z.boolean().optional(),
        port: z.number().optional(),
      })
      .parse((await c.req.json().catch(() => ({}))) || {});
    const s = await loadSettings();
    const result = await startManagedAgent(s, body);
    if (!result.ok) return c.json(result, 500);
    // Do not return secret to browser in production hard mode — local wrapper OK but mask optional
    return c.json({
      ok: true,
      url: result.url,
      // secret returned once for local ACP clients; settings may store it
      secretConfigured: Boolean(result.secret),
    });
  });

  api.post("/grok/agent/stop", async (c) => {
    return c.json(stopManagedAgent());
  });

  return api;
}
