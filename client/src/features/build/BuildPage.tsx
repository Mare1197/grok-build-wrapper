import { Loader2, Play, Square, Send } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export function BuildPage() {
  const chat = useAppStore((s) => s.chat);
  const chatInput = useAppStore((s) => s.chatInput);
  const setChatInput = useAppStore((s) => s.setChatInput);
  const sendChat = useAppStore((s) => s.sendChat);
  const loading = useAppStore((s) => s.loading);
  const buildCwd = useAppStore((s) => s.buildCwd);
  const setBuildCwd = useAppStore((s) => s.setBuildCwd);
  const grokStatus = useAppStore((s) => s.grokStatus);
  const startAgent = useAppStore((s) => s.startAgent);
  const stopAgent = useAppStore((s) => s.stopAgent);
  const sessionId = useAppStore((s) => s.sessionId);
  const settings = useAppStore((s) => s.settings);

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Grok Build</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Web wrapper around local Grok Build. Messages run as{" "}
            <code className="rounded bg-white/5 px-1 font-mono text-xs">grok -p</code>{" "}
            (headless JSON). Optionally start a managed{" "}
            <code className="rounded bg-white/5 px-1 font-mono text-xs">grok agent serve</code>{" "}
            process for ACP clients.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void startAgent()}
            disabled={loading || grokStatus?.agentManaged}
          >
            <Play size={14} /> Start agent
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void stopAgent()}
            disabled={!grokStatus?.agentManaged}
          >
            <Square size={14} /> Stop agent
          </button>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="panel p-3 md:col-span-2">
          <label className="label">Working directory (cwd)</label>
          <input
            className="input font-mono text-xs"
            value={buildCwd}
            onChange={(e) => setBuildCwd(e.target.value)}
            placeholder="C:\Users\marko\projects\my-app"
          />
        </div>
        <div className="panel flex flex-col justify-center gap-1 p-3 text-xs text-slate-400">
          <div>
            Model:{" "}
            <span className="text-slate-200">{settings?.grokModel || "grok-build"}</span>
          </div>
          <div>
            Session:{" "}
            <span className="font-mono text-slate-200">{sessionId?.slice(0, 8) || "new"}</span>
          </div>
          <div className={grokStatus?.cliInstalled ? "text-emerald-400" : "text-amber-400"}>
            {grokStatus?.message}
          </div>
        </div>
      </div>

      <div className="panel flex min-h-[420px] flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-3 overflow-auto p-4">
          {chat.map((m) => (
            <div
              key={m.id}
              className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                m.role === "user"
                  ? "ml-auto bg-accent/25 text-white"
                  : m.role === "system"
                    ? "border border-white/10 bg-white/5 text-slate-400"
                    : "bg-ink-800 text-slate-100"
              }`}
            >
              <div className="mb-1 text-[10px] uppercase tracking-wider opacity-60">{m.role}</div>
              <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="animate-spin" size={16} /> Grok Build thinking…
            </div>
          )}
        </div>
        <form
          className="flex gap-2 border-t border-white/10 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void sendChat();
          }}
        >
          <input
            className="input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask Grok Build to code, explain, or plan…"
            disabled={loading}
          />
          <button type="submit" className="btn-primary shrink-0" disabled={loading || !chatInput.trim()}>
            <Send size={16} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
