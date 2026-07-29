import type { SelectedTag, TagDefinition } from "../../../shared/types";

export const TAGS: TagDefinition[] = [
  // subject
  { id: "portrait", label: "Portrait", value: "portrait subject", category: "subject" },
  { id: "car", label: "Car", value: "sports car", category: "subject" },
  { id: "city", label: "Cityscape", value: "futuristic cityscape", category: "subject" },
  { id: "landscape", label: "Landscape", value: "epic landscape", category: "subject" },
  { id: "product", label: "Product", value: "product photography subject", category: "subject" },
  { id: "character", label: "Character", value: "character design", category: "subject" },
  { id: "architecture", label: "Architecture", value: "modern architecture", category: "subject" },
  { id: "nature", label: "Nature", value: "wild nature scene", category: "subject" },
  // style
  { id: "cinematic", label: "Cinematic", value: "cinematic still", category: "style" },
  { id: "anime", label: "Anime", value: "anime style", category: "style" },
  { id: "photoreal", label: "Photoreal", value: "photorealistic", category: "style" },
  { id: "oil", label: "Oil paint", value: "oil painting", category: "style" },
  { id: "3d", label: "3D render", value: "octane 3d render", category: "style" },
  { id: "watercolor", label: "Watercolor", value: "watercolor illustration", category: "style" },
  { id: "noir", label: "Noir", value: "film noir style", category: "style" },
  { id: "vaporwave", label: "Vaporwave", value: "vaporwave aesthetic", category: "style" },
  { id: "editorial", label: "Editorial", value: "fashion editorial", category: "style" },
  // lighting
  { id: "golden", label: "Golden hour", value: "golden hour lighting", category: "lighting" },
  { id: "neon", label: "Neon", value: "neon lighting", category: "lighting" },
  { id: "softbox", label: "Softbox", value: "soft studio softbox lighting", category: "lighting" },
  { id: "rim", label: "Rim light", value: "dramatic rim lighting", category: "lighting" },
  { id: "volumetric", label: "Volumetric", value: "volumetric god rays", category: "lighting" },
  { id: "moonlight", label: "Moonlight", value: "moonlit night", category: "lighting" },
  // camera
  { id: "35mm", label: "35mm", value: "35mm lens", category: "camera" },
  { id: "85mm", label: "85mm", value: "85mm portrait lens", category: "camera" },
  { id: "wide", label: "Wide angle", value: "wide angle shot", category: "camera" },
  { id: "drone", label: "Drone", value: "aerial drone shot", category: "camera" },
  { id: "macro", label: "Macro", value: "macro photography", category: "camera" },
  { id: "lowangle", label: "Low angle", value: "low angle heroic shot", category: "camera" },
  { id: "shallow", label: "Shallow DoF", value: "shallow depth of field", category: "camera" },
  // quality
  { id: "8k", label: "8K", value: "8k detail", category: "quality" },
  { id: "sharp", label: "Sharp", value: "tack sharp focus", category: "quality" },
  { id: "detailed", label: "Detailed", value: "intricate detail", category: "quality" },
  { id: "award", label: "Award", value: "award winning photography", category: "quality" },
  // mood
  { id: "moody", label: "Moody", value: "moody atmosphere", category: "mood" },
  { id: "serene", label: "Serene", value: "serene calm mood", category: "mood" },
  { id: "epic", label: "Epic", value: "epic dramatic mood", category: "mood" },
  { id: "playful", label: "Playful", value: "playful cheerful mood", category: "mood" },
  { id: "mysterious", label: "Mysterious", value: "mysterious atmosphere", category: "mood" },
  // color
  { id: "tealorange", label: "Teal & orange", value: "teal and orange color grade", category: "color" },
  { id: "pastel", label: "Pastel", value: "soft pastel palette", category: "color" },
  { id: "mono", label: "Monochrome", value: "monochrome", category: "color" },
  { id: "vibrant", label: "Vibrant", value: "vibrant saturated colors", category: "color" },
  { id: "muted", label: "Muted", value: "muted earth tones", category: "color" },
];

export const CATEGORIES = ["subject", "style", "lighting", "camera", "quality", "mood", "color"] as const;

export function assemblePrompt(base: string, selected: SelectedTag[]): string {
  const parts: string[] = [];
  if (base.trim()) parts.push(base.trim());
  for (const s of selected) {
    const tag = TAGS.find((t) => t.id === s.id);
    if (!tag) continue;
    if (s.weight !== 1) parts.push(`(${tag.value}:${s.weight.toFixed(1)})`);
    else parts.push(tag.value);
  }
  return parts.join(", ");
}

export function randomTags(count = 5): SelectedTag[] {
  const pool = [...TAGS];
  const out: SelectedTag[] = [];
  while (out.length < count && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    const [t] = pool.splice(i, 1);
    out.push({ id: t.id, weight: 1 });
  }
  return out;
}
