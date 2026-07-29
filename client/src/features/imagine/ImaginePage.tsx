import { Copy, Loader2, Shuffle, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useMemo } from "react";
import { api } from "../../lib/api";
import { CATEGORIES, TAGS } from "../../lib/tags";
import { useAppStore } from "../../store/useAppStore";

export function ImaginePage() {
  const providers = useAppStore((s) => s.providers);
  const provider = useAppStore((s) => s.provider);
  const setProvider = useAppStore((s) => s.setProvider);
  const model = useAppStore((s) => s.model);
  const setModel = useAppStore((s) => s.setModel);
  const prompt = useAppStore((s) => s.prompt);
  const setPrompt = useAppStore((s) => s.setPrompt);
  const negativePrompt = useAppStore((s) => s.negativePrompt);
  const setNegative = useAppStore((s) => s.setNegative);
  const selectedTags = useAppStore((s) => s.selectedTags);
  const toggleTag = useAppStore((s) => s.toggleTag);
  const adjustTagWeight = useAppStore((s) => s.adjustTagWeight);
  const randomize = useAppStore((s) => s.randomize);
  const clearPrompt = useAppStore((s) => s.clearPrompt);
  const assembled = useAppStore((s) => s.assembled);
  const aspectRatio = useAppStore((s) => s.aspectRatio);
  const setAspect = useAppStore((s) => s.setAspect);
  const resolution = useAppStore((s) => s.resolution);
  const setResolution = useAppStore((s) => s.setResolution);
  const n = useAppStore((s) => s.n);
  const setN = useAppStore((s) => s.setN);
  const references = useAppStore((s) => s.references);
  const addReference = useAppStore((s) => s.addReference);
  const removeReference = useAppStore((s) => s.removeReference);
  const generate = useAppStore((s) => s.generate);
  const enhance = useAppStore((s) => s.enhance);
  const loading = useAppStore((s) => s.loading);
  const enhancing = useAppStore((s) => s.enhancing);
  const latest = useAppStore((s) => s.latest);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const setEditImage = useAppStore((s) => s.setEditImage);
  const setTab = useAppStore((s) => s.setTab);

  const info = providers.find((p) => p.id === provider);
  const fullPrompt = useMemo(() => assembled(), [assembled, prompt, selectedTags]);

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") addReference(reader.result);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <header>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="text-accent-soft" size={20} /> Imagine Studio
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Multi-provider image generation (xAI Grok Imagine + Pollinations). Enhance prompts with
            Grok Build. Google stub ready for later.
          </p>
        </header>

        <div className="panel space-y-3 p-4">
          <label className="label">Prompt</label>
          <textarea
            className="input min-h-[110px] resize-y"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want…"
          />
          <label className="label">Negative (optional)</label>
          <input
            className="input"
            value={negativePrompt}
            onChange={(e) => setNegative(e.target.value)}
            placeholder="blurry, low quality…"
          />
          <div>
            <div className="label">Assembled prompt</div>
            <div className="rounded-lg border border-dashed border-white/10 bg-ink-950/60 p-3 font-mono text-xs text-slate-300">
              {fullPrompt || <span className="text-slate-600">Tags and prompt appear here</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={loading} onClick={() => void generate()}>
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Generate
            </button>
            <button type="button" className="btn-ghost" disabled={enhancing} onClick={() => void enhance()}>
              {enhancing ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
              Enhance with Grok
            </button>
            <button type="button" className="btn-ghost" onClick={randomize}>
              <Shuffle size={16} /> Random tags
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => void navigator.clipboard.writeText(fullPrompt)}
            >
              <Copy size={16} /> Copy
            </button>
            <button type="button" className="btn-ghost" onClick={clearPrompt}>
              <Trash2 size={16} /> Clear
            </button>
          </div>
        </div>

        <div className="panel p-4">
          <div className="label mb-2">Tag palette</div>
          <div className="space-y-3">
            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">{cat}</div>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.filter((t) => t.category === cat).map((t) => {
                    const sel = selectedTags.find((s) => s.id === t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTag(t.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (sel) adjustTagWeight(t.id, 0.1);
                        }}
                        className={`rounded-full border px-2.5 py-1 text-xs transition ${
                          sel
                            ? "border-accent/50 bg-accent/20 text-white"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                        title="Click toggle · right-click +weight"
                      >
                        {t.label}
                        {sel && sel.weight !== 1 ? ` ${sel.weight.toFixed(1)}` : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {latest.length > 0 && (
          <div className="panel p-4">
            <div className="label mb-2">Latest results</div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {latest.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-lg border border-white/10">
                  <img src={api.imageUrl(item.id)} alt={item.prompt} className="aspect-square w-full object-cover" />
                  <div className="flex flex-wrap gap-1 p-2">
                    <button type="button" className="btn-ghost px-2 py-1 text-[11px]" onClick={() => void toggleFavorite(item.id)}>
                      {item.favorite ? "★ Fav" : "☆ Fav"}
                    </button>
                    <a className="btn-ghost px-2 py-1 text-[11px]" href={api.imageUrl(item.id)} download={`${item.id}.jpg`}>
                      Download
                    </a>
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-[11px]"
                      onClick={() => {
                        setEditImage(api.imageUrl(item.id));
                        setTab("edit");
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <div className="panel space-y-3 p-4">
          <div>
            <label className="label">Provider</label>
            <select
              className="input"
              value={provider}
              onChange={(e) => setProvider(e.target.value as typeof provider)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id} disabled={!p.enabled}>
                  {p.label}
                  {!p.ready ? " (not ready)" : ""}
                </option>
              ))}
            </select>
            {info?.readyMessage && (
              <p className="mt-1 text-[11px] text-amber-300/90">{info.readyMessage}</p>
            )}
          </div>
          <div>
            <label className="label">Model</label>
            <select className="input" value={model} onChange={(e) => setModel(e.target.value)}>
              {(info?.models || []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Aspect</label>
            <select className="input" value={aspectRatio} onChange={(e) => setAspect(e.target.value)}>
              {(info?.capabilities.aspectRatios || ["1:1"]).map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          {info?.capabilities.resolutions && (
            <div>
              <label className="label">Resolution</label>
              <select className="input" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                {info.capabilities.resolutions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Count (n)</label>
            <input
              className="input"
              type="number"
              min={1}
              max={info?.capabilities.batchMax || 4}
              value={n}
              onChange={(e) => setN(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="panel p-4">
          <label className="label">References ({references.length}/3)</label>
          <div
            className="mt-1 flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-ink-950/50 p-3 text-center text-xs text-slate-500"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
            onClick={() => document.getElementById("ref-input")?.click()}
          >
            Drop or click to add images
            <input
              id="ref-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {references.map((r, i) => (
              <div key={i} className="relative h-16 w-16 overflow-hidden rounded border border-white/10">
                <img src={r} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-0 top-0 bg-black/70 px-1 text-[10px]"
                  onClick={() => removeReference(i)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
