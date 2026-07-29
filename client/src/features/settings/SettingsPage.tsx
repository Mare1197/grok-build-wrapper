import { useState } from "react";
import { useAppStore } from "../../store/useAppStore";

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const grokStatus = useAppStore((s) => s.grokStatus);
  const refreshGrok = useAppStore((s) => s.refreshGrok);
  const [xai, setXai] = useState("");
  const [google, setGoogle] = useState("");
  const [cwd, setCwd] = useState(settings?.defaultCwd || "");
  const [model, setModel] = useState(settings?.grokModel || "grok-build");
  const [port, setPort] = useState(settings?.agentPort || 2419);
  const [trusted, setTrusted] = useState(settings?.grokTrustedLocal || false);
  const [provider, setProvider] = useState(settings?.defaultProvider || "pollinations");
  const [bin, setBin] = useState(settings?.grokBin || "");
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    await saveSettings({
      xaiApiKey: xai || undefined,
      googleApiKey: google || undefined,
      defaultCwd: cwd,
      grokModel: model,
      agentPort: port,
      grokTrustedLocal: trusted,
      defaultProvider: provider,
      grokBin: bin || undefined,
    });
    setXai("");
    setGoogle("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-400">
          Keys stay on the local server only (masked in the UI). Never committed to git.
        </p>
      </header>

      <div className="panel space-y-4 p-4">
        <div>
          <label className="label">xAI API key {settings?.hasXaiApiKey ? `(set: ${settings.xaiApiKeyMasked})` : ""}</label>
          <input
            className="input font-mono"
            type="password"
            value={xai}
            onChange={(e) => setXai(e.target.value)}
            placeholder="xai-… leave blank to keep"
          />
        </div>
        <div>
          <label className="label">Google API key (future) {settings?.hasGoogleApiKey ? "(set)" : ""}</label>
          <input
            className="input font-mono"
            type="password"
            value={google}
            onChange={(e) => setGoogle(e.target.value)}
            placeholder="optional"
          />
        </div>
        <div>
          <label className="label">Default image provider</label>
          <select className="input" value={provider} onChange={(e) => setProvider(e.target.value as "xai" | "pollinations" | "google")}>
            <option value="pollinations">Pollinations</option>
            <option value="xai">xAI Grok Imagine</option>
            <option value="google">Google (stub)</option>
          </select>
        </div>
        <div>
          <label className="label">Default Grok Build cwd</label>
          <input className="input font-mono text-xs" value={cwd} onChange={(e) => setCwd(e.target.value)} />
        </div>
        <div>
          <label className="label">Grok model</label>
          <input className="input" value={model} onChange={(e) => setModel(e.target.value)} />
        </div>
        <div>
          <label className="label">Grok binary path (optional)</label>
          <input
            className="input font-mono text-xs"
            value={bin}
            onChange={(e) => setBin(e.target.value)}
            placeholder="%USERPROFILE%\.grok\bin\grok.exe"
          />
        </div>
        <div>
          <label className="label">Managed agent port</label>
          <input
            className="input"
            type="number"
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={trusted} onChange={(e) => setTrusted(e.target.checked)} />
          Trusted local agent (bypass tool permission prompts — use only on your machine)
        </label>
        <div className="flex gap-2">
          <button type="button" className="btn-primary" onClick={() => void onSave()}>
            Save
          </button>
          <button type="button" className="btn-ghost" onClick={() => void refreshGrok()}>
            Refresh Grok status
          </button>
          {saved && <span className="self-center text-sm text-emerald-400">Saved</span>}
        </div>
      </div>

      <div className="panel space-y-1 p-4 text-sm text-slate-400">
        <div className="label">Grok Build status</div>
        <div>CLI: {grokStatus?.cliInstalled ? "yes" : "no"} {grokStatus?.cliPath && `· ${grokStatus.cliPath}`}</div>
        <div>Version: {grokStatus?.cliVersion || "—"}</div>
        <div>Agent: {grokStatus?.agentRunning ? "running" : "idle"} {grokStatus?.agentUrl || ""}</div>
        <div className="pt-1 text-xs">{grokStatus?.message}</div>
      </div>
    </div>
  );
}
