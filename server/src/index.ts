import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import fs from "node:fs";
import path from "node:path";
import { CLIENT_DIST } from "./paths.js";
import { createApi } from "./routes/api.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: [
      "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:8787",
      "http://localhost:8787",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

app.onError((err, c) => {
  console.error("[api]", err.message);
  const status =
    err.name === "ZodError" ? 400 : err.message.includes("not configured") ? 400 : 500;
  return c.json(
    {
      error: err.message || "Internal error",
      details: err.name === "ZodError" ? String(err) : undefined,
    },
    status
  );
});

app.route("/api", createApi());

if (fs.existsSync(CLIENT_DIST)) {
  app.use(
    "/*",
    serveStatic({
      root: path.relative(process.cwd(), CLIENT_DIST) || CLIENT_DIST,
    })
  );
  app.get("*", async (c) => {
    const index = path.join(CLIENT_DIST, "index.html");
    if (fs.existsSync(index)) {
      return c.html(fs.readFileSync(index, "utf8"));
    }
    return c.text("Client not built", 404);
  });
} else {
  app.get("/", (c) =>
    c.json({
      product: "grok-build-wrapper",
      message: "API running. Start the Vite client with npm run dev -w client",
      health: "/api/health",
    })
  );
}

const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 8787);

console.log(`Grok Build Wrapper API  http://${host}:${port}`);
console.log(`  health  GET /api/health`);
console.log(`  imagine POST /api/generate`);
console.log(`  build   POST /api/grok/prompt`);

serve({ fetch: app.fetch, hostname: host, port });
