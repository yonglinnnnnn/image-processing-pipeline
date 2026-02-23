import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { LightboxImage } from "@/types";

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const current = images[index];

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-3xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Image + nav arrows */}
        <div className="relative w-full flex items-center justify-center">
          {images.length > 1 && (
            <button
              onClick={prev}
              className="absolute left-0 z-10 -translate-x-12 text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <img
            key={current.src}
            src={current.src}
            alt={current.label}
            className="max-h-[70vh] max-w-full rounded-xl shadow-2xl object-contain"
            style={{ animation: "fadeIn 0.15s ease" }}
          />

          {images.length > 1 && (
            <button
              onClick={next}
              className="absolute right-0 z-10 translate-x-12 text-white/70 hover:text-white transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="mt-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
              {current.label}
            </span>
            {current.filename && (
              <span className="text-sm text-white/70">{current.filename}</span>
            )}
          </div>
          {current.caption && (
            <p className="text-sm text-white/60 italic max-w-lg">
              "{current.caption}"
            </p>
          )}
          {images.length > 1 && (
            <p className="text-xs text-white/40">
              {index + 1} / {images.length}
            </p>
          )}
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-4">
            {images.map((img, i) => (
              <button
                key={img.src}
                onClick={() => setIndex(i)}
                className={`rounded-lg overflow-hidden border-2 transition-all ${
                  i === index
                    ? "border-white/80 scale-105"
                    : "border-white/20 opacity-50 hover:opacity-75"
                }`}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  className="h-12 w-auto object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
