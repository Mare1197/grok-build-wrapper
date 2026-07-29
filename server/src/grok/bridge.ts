import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type {
  AgentStartRequest,
  AppSettings,
  GrokPromptRequest,
  GrokPromptResponse,
  GrokStatus,
} from "../../../shared/types.js";

let managedAgent: ChildProcessWithoutNullStreams | null = null;
let managedSecret: string | null = null;
let managedPort = 2419;
let managedUrl: string | null = null;

function resolveGrokBin(settings: AppSettings): string | null {
  if (settings.grokBin && fs.existsSync(settings.grokBin)) {
    return settings.grokBin;
  }
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const candidates = [
    path.join(home, ".grok", "bin", "grok.exe"),
    path.join(home, ".grok", "bin", "grok"),
    "grok",
  ];
  for (const c of candidates) {
    if (c === "grok") return "grok";
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function runCommand(
  bin: string,
  args: string[],
  opts: { cwd?: string; timeoutMs?: number; env?: NodeJS.ProcessEnv } = {}
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      shell: false,
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
    }, opts.timeoutMs ?? 180_000);

    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: 1, stdout, stderr: stderr + "\n" + err.message });
    });
  });
}

export async function getGrokStatus(settings: AppSettings): Promise<GrokStatus> {
  const bin = resolveGrokBin(settings);
  let cliInstalled = false;
  let cliPath: string | undefined;
  let cliVersion: string | undefined;

  if (bin) {
    const which = await runCommand(
      process.platform === "win32" ? "where" : "which",
      bin === "grok" ? ["grok"] : [bin],
      { timeoutMs: 5000 }
    );
    if (bin !== "grok" && fs.existsSync(bin)) {
      cliInstalled = true;
      cliPath = bin;
    } else if (which.code === 0 && which.stdout.trim()) {
      cliInstalled = true;
      cliPath = which.stdout.trim().split(/\r?\n/)[0];
    } else if (bin !== "grok") {
      cliInstalled = fs.existsSync(bin);
      cliPath = bin;
    }

    if (cliInstalled || bin === "grok") {
      const ver = await runCommand(bin, ["--version"], { timeoutMs: 8000 });
      if (ver.code === 0) {
        cliInstalled = true;
        cliVersion = ver.stdout.trim() || ver.stderr.trim();
        cliPath = cliPath || bin;
      } else if (bin !== "grok" && fs.existsSync(bin)) {
        cliInstalled = true;
        cliPath = bin;
      }
    }
  }

  const agentRunning = Boolean(managedAgent && !managedAgent.killed);
  const external = Boolean(settings.grokAgentUrl);

  return {
    cliInstalled,
    cliPath,
    cliVersion,
    agentRunning: agentRunning || external,
    agentManaged: agentRunning,
    agentUrl: managedUrl || settings.grokAgentUrl,
    message: !cliInstalled
      ? "Grok CLI not found. Install Grok Build and ensure `grok` is on PATH."
      : agentRunning
        ? `Managed Grok agent running at ${managedUrl}`
        : external
          ? `Using external agent URL ${settings.grokAgentUrl}`
          : "CLI ready. Start agent from Build tab or run headless prompts.",
  };
}

export async function runGrokPrompt(
  settings: AppSettings,
  req: GrokPromptRequest
): Promise<GrokPromptResponse> {
  const bin = resolveGrokBin(settings);
  if (!bin) {
    return { text: "", error: "Grok CLI not found" };
  }

  let prompt = req.prompt;
  if (req.mode === "enhance") {
    prompt =
      "You are an expert image-prompt engineer. Rewrite the following into one improved, " +
      "detailed image generation prompt. Output ONLY the improved prompt, no markdown or commentary.\n\n" +
      req.prompt;
  }

  const args = ["-p", prompt, "--output-format", "json"];
  if (req.model || settings.grokModel) {
    args.push("-m", req.model || settings.grokModel || "grok-build");
  }
  if (req.sessionId) {
    args.push("-r", req.sessionId);
  }
  // Safer default: no shell tools for enhance; chat/build can use tools if trusted
  if (req.mode === "enhance") {
    args.push("--tools", "web_search,web_fetch");
    args.push("--max-turns", "2");
  } else if (settings.grokTrustedLocal) {
    args.push("--permission-mode", "bypassPermissions");
  }

  const cwd = req.cwd || settings.defaultCwd || process.cwd();
  const result = await runCommand(bin, args, { cwd, timeoutMs: 300_000 });

  if (result.code !== 0 && !result.stdout.trim()) {
    return {
      text: "",
      error: result.stderr.trim() || `grok exited with code ${result.code}`,
    };
  }

  try {
    const json = JSON.parse(result.stdout.trim()) as {
      text?: string;
      sessionId?: string;
      stopReason?: string;
      usage?: Record<string, unknown>;
    };
    return {
      text: json.text || result.stdout.trim(),
      sessionId: json.sessionId,
      stopReason: json.stopReason,
      usage: json.usage,
    };
  } catch {
    return { text: result.stdout.trim() || result.stderr.trim() };
  }
}

export async function startManagedAgent(
  settings: AppSettings,
  req: AgentStartRequest = {}
): Promise<{ ok: boolean; url?: string; secret?: string; error?: string }> {
  if (managedAgent && !managedAgent.killed) {
    return {
      ok: true,
      url: managedUrl || undefined,
      secret: managedSecret || undefined,
    };
  }

  const bin = resolveGrokBin(settings);
  if (!bin) return { ok: false, error: "Grok CLI not found" };

  const port = req.port || settings.agentPort || 2419;
  const secret = settings.grokAgentSecret || randomBytes(16).toString("hex");
  const always =
    req.alwaysApprove ?? settings.grokTrustedLocal ? true : false;
  const model = req.model || settings.grokModel || "grok-build";
  const cwd = req.cwd || settings.defaultCwd || process.cwd();

  const args = ["agent"];
  if (always) args.push("--always-approve");
  args.push("-m", model, "serve", "--bind", `127.0.0.1:${port}`, "--secret", secret);

  try {
    const child = spawn(bin, args, {
      cwd,
      env: { ...process.env, GROK_AGENT_SECRET: secret },
      shell: false,
      windowsHide: true,
    });
    managedAgent = child;
    managedSecret = secret;
    managedPort = port;
    managedUrl = `ws://127.0.0.1:${port}`;

    child.stderr.on("data", () => {
      /* keep process alive; logs optional */
    });
    child.on("close", () => {
      managedAgent = null;
      managedSecret = null;
      managedUrl = null;
    });
    child.on("error", () => {
      managedAgent = null;
    });

    // brief settle
    await new Promise((r) => setTimeout(r, 800));

    return { ok: true, url: managedUrl, secret };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function stopManagedAgent(): { ok: boolean } {
  if (managedAgent) {
    managedAgent.kill();
    managedAgent = null;
    managedSecret = null;
    managedUrl = null;
  }
  return { ok: true };
}

export function getManagedAgentInfo() {
  return {
    running: Boolean(managedAgent && !managedAgent.killed),
    url: managedUrl,
    port: managedPort,
    // secret only returned to local settings flows, not logged
    hasSecret: Boolean(managedSecret),
  };
}
