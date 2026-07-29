import {
  FolderOpen,
  ImageIcon,
  MessageSquare,
  Pencil,
  Settings,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useEffect } from "react";
import { EditPage } from "../features/edit/EditPage";
import { GalleryPage } from "../features/gallery/GalleryPage";
import { BuildPage } from "../features/build/BuildPage";
import { ImaginePage } from "../features/imagine/ImaginePage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { useAppStore, type TabId } from "../store/useAppStore";

const NAV: { id: TabId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "build", label: "Build", icon: <Terminal size={18} />, hint: "Grok Build CLI chat" },
  { id: "imagine", label: "Imagine", icon: <Sparkles size={18} />, hint: "Image studio" },
  { id: "gallery", label: "Gallery", icon: <ImageIcon size={18} />, hint: "History" },
  { id: "edit", label: "Edit", icon: <Pencil size={18} />, hint: "Image edit" },
  { id: "settings", label: "Settings", icon: <Settings size={18} />, hint: "Keys & agent" },
];

export function App() {
  const tab = useAppStore((s) => s.tab);
  const setTab = useAppStore((s) => s.setTab);
  const bootstrap = useAppStore((s) => s.bootstrap);
  const error = useAppStore((s) => s.error);
  const setError = useAppStore((s) => s.setError);
  const grokStatus = useAppStore((s) => s.grokStatus);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 bg-ink-900/90">
        <div className="border-b border-white/10 px-4 py-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/20 text-accent-soft">
              <MessageSquare size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">Grok Build</div>
              <div className="text-[11px] text-slate-400">Wrapper + Imagine</div>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  active
                    ? "bg-accent/20 text-white shadow-glow"
                    : "text-slate-300 hover:bg-white/5"
                }`}
                title={item.hint}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 text-[11px] text-slate-500">
          <div className="mb-1 flex items-center gap-1.5 text-slate-400">
            <FolderOpen size={12} />
            Grok CLI
          </div>
          <div className={grokStatus?.cliInstalled ? "text-emerald-400/90" : "text-amber-400/90"}>
            {grokStatus?.cliInstalled ? "CLI detected" : "CLI not found"}
          </div>
          <div className="mt-1 truncate opacity-80">
            {grokStatus?.agentRunning ? "Agent running" : "Agent idle"}
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        {error && (
          <div className="flex items-center justify-between border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            <span>{error}</span>
            <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setError()}>
              Dismiss
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
          {tab === "build" && <BuildPage />}
          {tab === "imagine" && <ImaginePage />}
          {tab === "gallery" && <GalleryPage />}
          {tab === "edit" && <EditPage />}
          {tab === "settings" && <SettingsPage />}
        </div>
      </main>
    </div>
  );
}
