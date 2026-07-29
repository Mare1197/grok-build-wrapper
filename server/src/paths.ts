import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** server/ package root */
export const SERVER_ROOT = path.resolve(__dirname, "..");
export const DATA_DIR = path.join(SERVER_ROOT, "data");
export const GALLERY_DIR = path.join(DATA_DIR, "gallery");
export const SETTINGS_PATH = path.join(DATA_DIR, "settings.json");
export const INDEX_PATH = path.join(GALLERY_DIR, "index.json");
export const CLIENT_DIST = path.resolve(SERVER_ROOT, "../client/dist");
