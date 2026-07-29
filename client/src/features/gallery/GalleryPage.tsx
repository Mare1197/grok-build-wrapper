import { useEffect } from "react";
import { api } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";

export function GalleryPage() {
  const gallery = useAppStore((s) => s.gallery);
  const loadGallery = useAppStore((s) => s.loadGallery);
  const galleryQ = useAppStore((s) => s.galleryQ);
  const setGalleryQ = useAppStore((s) => s.setGalleryQ);
  const favoritesOnly = useAppStore((s) => s.favoritesOnly);
  const setFavoritesOnly = useAppStore((s) => s.setFavoritesOnly);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const removeGallery = useAppStore((s) => s.removeGallery);
  const reuseItem = useAppStore((s) => s.reuseItem);
  const setEditImage = useAppStore((s) => s.setEditImage);
  const setTab = useAppStore((s) => s.setTab);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery, galleryQ, favoritesOnly]);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Gallery</h1>
          <p className="text-sm text-slate-400">Local history under server/data/gallery</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="input w-56"
            placeholder="Search prompts…"
            value={galleryQ}
            onChange={(e) => setGalleryQ(e.target.value)}
          />
          <label className="btn-ghost cursor-pointer">
            <input
              type="checkbox"
              className="mr-2"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
            />
            Favorites
          </label>
        </div>
      </header>

      {gallery.length === 0 ? (
        <div className="panel p-10 text-center text-slate-500">No images yet. Generate from Imagine.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {gallery.map((item) => (
            <article key={item.id} className="panel overflow-hidden">
              <img
                src={api.imageUrl(item.id)}
                alt={item.prompt}
                className="aspect-square w-full object-cover"
              />
              <div className="space-y-2 p-3">
                <p className="line-clamp-2 text-xs text-slate-300">{item.prompt}</p>
                <p className="text-[10px] text-slate-500">
                  {item.provider} · {item.model}
                </p>
                <div className="flex flex-wrap gap-1">
                  <button type="button" className="btn-ghost px-2 py-1 text-[11px]" onClick={() => void toggleFavorite(item.id)}>
                    {item.favorite ? "★" : "☆"}
                  </button>
                  <button type="button" className="btn-ghost px-2 py-1 text-[11px]" onClick={() => reuseItem(item)}>
                    Re-run
                  </button>
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
                  <button type="button" className="btn-ghost px-2 py-1 text-[11px]" onClick={() => void removeGallery(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
