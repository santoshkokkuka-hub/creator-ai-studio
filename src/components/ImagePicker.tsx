import { useEffect, useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";

export interface PickedImage { id: string; file: File; url: string }

export function ImagePicker({ images, onChange, max = 20 }: { images: PickedImage[]; onChange: (imgs: PickedImage[]) => void; max?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  useEffect(() => () => images.forEach((i) => URL.revokeObjectURL(i.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const add = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    onChange([...images, ...next].slice(0, max));
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
        className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${drag ? "border-primary bg-primary/10" : "hover:border-primary/50 hover:bg-accent/30"}`}
      >
        <ImageUp className="h-8 w-8 text-primary" />
        <span className="mt-3 font-medium">Drop images here or click to browse</span>
        <span className="mt-1 text-xs text-muted-foreground">JPG, PNG or WEBP · up to {max} images</span>
      </button>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {images.map((img, i) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img src={img.url} alt={img.file.name} className="h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 rounded bg-background/80 px-1.5 text-xs">{i + 1}</span>
              <button aria-label="Remove image" onClick={() => { URL.revokeObjectURL(img.url); onChange(images.filter((x) => x.id !== img.id)); }} className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1 opacity-0 transition group-hover:opacity-100 focus:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
