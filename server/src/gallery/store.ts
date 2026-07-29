import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { GalleryItem, ProviderId } from "../../../shared/types.js";
import { GALLERY_DIR, INDEX_PATH } from "../paths.js";

const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

async function ensureGallery() {
  await fs.mkdir(GALLERY_DIR, { recursive: true });
}

async function readIndex(): Promise<GalleryItem[]> {
  await ensureGallery();
  try {
    const raw = await fs.readFile(INDEX_PATH, "utf8");
    const data = JSON.parse(raw) as GalleryItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeIndex(items: GalleryItem[]) {
  await ensureGallery();
  await fs.writeFile(INDEX_PATH, JSON.stringify(items, null, 2), "utf8");
}

export function assertSafeId(id: string): string {
  if (!ID_RE.test(id)) throw new Error("Invalid gallery item id");
  return id;
}

export async function listGallery(opts?: {
  q?: string;
  favorite?: boolean;
  provider?: ProviderId;
}): Promise<GalleryItem[]> {
  let items = await readIndex();
  items = items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (opts?.favorite) items = items.filter((i) => i.favorite);
  if (opts?.provider) items = items.filter((i) => i.provider === opts.provider);
  if (opts?.q) {
    const q = opts.q.toLowerCase();
    items = items.filter(
      (i) =>
        i.prompt.toLowerCase().includes(q) ||
        i.model.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return items;
}

export async function getItem(id: string): Promise<GalleryItem | null> {
  assertSafeId(id);
  const items = await readIndex();
  return items.find((i) => i.id === id) ?? null;
}

export async function getImagePath(id: string): Promise<{ filePath: string; mimeType: string } | null> {
  const item = await getItem(id);
  if (!item) return null;
  const base = path.resolve(GALLERY_DIR);
  const filePath = path.resolve(GALLERY_DIR, item.filename);
  if (!filePath.startsWith(base + path.sep) && filePath !== base) {
    throw new Error("Path traversal blocked");
  }
  return { filePath, mimeType: item.mimeType };
}

export async function saveImage(params: {
  buffer: Buffer;
  mimeType: string;
  prompt: string;
  negativePrompt?: string;
  provider: ProviderId;
  model: string;
  aspectRatio?: string;
  resolution?: string;
  seed?: number;
  source: "generate" | "edit";
  tags?: string[];
}): Promise<GalleryItem> {
  await ensureGallery();
  const id = crypto.randomBytes(12).toString("hex");
  const ext =
    params.mimeType.includes("png")
      ? "png"
      : params.mimeType.includes("webp")
        ? "webp"
        : "jpg";
  const filename = `${id}.${ext}`;
  const filePath = path.join(GALLERY_DIR, filename);
  await fs.writeFile(filePath, params.buffer);

  const item: GalleryItem = {
    id,
    createdAt: new Date().toISOString(),
    prompt: params.prompt,
    negativePrompt: params.negativePrompt,
    provider: params.provider,
    model: params.model,
    aspectRatio: params.aspectRatio,
    resolution: params.resolution,
    seed: params.seed,
    favorite: false,
    tags: params.tags ?? [],
    filename,
    mimeType: params.mimeType,
    source: params.source,
  };

  const items = await readIndex();
  items.unshift(item);
  await writeIndex(items);
  return item;
}

export async function setFavorite(id: string, favorite?: boolean): Promise<GalleryItem | null> {
  assertSafeId(id);
  const items = await readIndex();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  items[idx] = {
    ...items[idx],
    favorite: favorite === undefined ? !items[idx].favorite : favorite,
  };
  await writeIndex(items);
  return items[idx];
}

export async function deleteItem(id: string): Promise<boolean> {
  assertSafeId(id);
  const items = await readIndex();
  const item = items.find((i) => i.id === id);
  if (!item) return false;
  const next = items.filter((i) => i.id !== id);
  await writeIndex(next);
  try {
    await fs.unlink(path.join(GALLERY_DIR, item.filename));
  } catch {
    /* file may be missing */
  }
  return true;
}

export async function bufferFromGenerated(img: {
  b64?: string;
  url?: string;
  mimeType?: string;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  if (img.b64) {
    const buffer = Buffer.from(img.b64, "base64");
    return { buffer, mimeType: img.mimeType || "image/jpeg" };
  }
  if (img.url) {
    const res = await fetch(img.url);
    if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
    const ab = await res.arrayBuffer();
    const ct = res.headers.get("content-type") || img.mimeType || "image/jpeg";
    return { buffer: Buffer.from(ab), mimeType: ct.split(";")[0] };
  }
  throw new Error("Generated image has no b64 or url");
}
