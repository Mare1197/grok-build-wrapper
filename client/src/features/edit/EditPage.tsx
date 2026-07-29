import { Loader2 } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export function EditPage() {
  const editImage = useAppStore((s) => s.editImage);
  const setEditImage = useAppStore((s) => s.setEditImage);
  const editPrompt = useAppStore((s) => s.editPrompt);
  const setEditPrompt = useAppStore((s) => s.setEditPrompt);
  const runEdit = useAppStore((s) => s.runEdit);
  const loading = useAppStore((s) => s.loading);
  const provider = useAppStore((s) => s.provider);
  const providers = useAppStore((s) => s.providers);
  const info = providers.find((p) => p.id === provider);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setEditImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header>
        <h1 className="text-xl font-semibold">Edit / Remix</h1>
        <p className="text-sm text-slate-400">
          Natural-language image edits. Best with xAI Grok Imagine. Pollinations does not support edit.
        </p>
      </header>

      {!info?.capabilities.edit && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          Current provider <strong>{info?.label || provider}</strong> has no edit API. Switch to xAI in
          Imagine/Settings.
        </div>
      )}

      <div className="panel space-y-3 p-4">
        <label className="label">Source image</label>
        {editImage ? (
          <img src={editImage} alt="edit source" className="max-h-72 rounded-lg border border-white/10" />
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-slate-500">
            Upload an image or open one from Gallery → Edit
          </div>
        )}
        <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
        <label className="label">Edit instruction</label>
        <textarea
          className="input min-h-[100px]"
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          placeholder="Render as pencil sketch with detailed shading…"
        />
        <button
          type="button"
          className="btn-primary"
          disabled={loading || !editImage || !editPrompt.trim() || !info?.capabilities.edit}
          onClick={() => void runEdit()}
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : null}
          Apply edit
        </button>
      </div>
    </div>
  );
}
