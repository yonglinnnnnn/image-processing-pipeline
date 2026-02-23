import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { ImageIcon, RefreshCw, X, ChevronRight } from "lucide-react";
import { UploadCard } from "@/components/UploadCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Lightbox } from "@/components/Lightbox";
import type { ImageRecord, LightboxImage } from "@/types";

const API_BASE = "http://localhost:8000/api";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    image_id: string;
    status: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [lightbox, setLightbox] = useState<{
    images: LightboxImage[];
    index: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setUploadResult(null);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API_BASE}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult(res.data);
      fetchImages();
    } catch {
      setUploadError("Upload failed. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setUploadResult(null);
    setUploadError(null);
  };

  const fetchImages = useCallback(async () => {
    setLoadingImages(true);
    try {
      const res = await axios.get(`${API_BASE}/images`);
      setImages(res.data);
      // Keep selected image in sync
      if (selectedImage) {
        const updated = res.data.find(
          (img: ImageRecord) =>
            img.data.image_id === selectedImage.data.image_id
        );
        if (updated) setSelectedImage(updated);
      }
    } finally {
      setLoadingImages(false);
    }
  }, [selectedImage]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchImages();
  }, []);

  const openLightbox = (img: ImageRecord) => {
    const lbImgs: LightboxImage[] = [];
    if (img.data.thumbnails.small)
      lbImgs.push({
        src: img.data.thumbnails.small,
        label: "Small",
        caption: img.data.metadata.caption,
        filename: img.data.original_name,
      });
    if (img.data.thumbnails.medium)
      lbImgs.push({
        src: img.data.thumbnails.medium,
        label: "Medium",
        caption: img.data.metadata.caption,
        filename: img.data.original_name,
      });
    if (lbImgs.length > 0) setLightbox({ images: lbImgs, index: 0 });
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{ fontFamily: "'DM Mono', monospace" }}
    >
      {/* Top bar */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center gap-3 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600">
          <ImageIcon className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold tracking-widest uppercase text-slate-200">
          Image Processing Pipeline
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-500">{images.length} images</span>
          <button
            onClick={fetchImages}
            disabled={loadingImages}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 transition-colors px-3 py-1.5 rounded-lg border border-slate-700 hover:border-violet-500"
          >
            <RefreshCw
              className={`w-3 h-3 ${loadingImages ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </header>

      {/* 3-column layout */}
      <div className="flex h-[calc(100vh-57px)]">
        {/* Column 1 — Upload */}
        <div className="w-80 flex-shrink-0 border-r border-slate-800 overflow-y-auto p-5 bg-slate-900/30">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 font-semibold">
            Upload
          </p>
          <UploadCard
            file={file}
            preview={preview}
            uploading={uploading}
            uploadResult={uploadResult}
            error={uploadError}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
            onReset={handleReset}
          />
        </div>

        {/* Column 2 — Image list */}
        <div className="w-80 flex-shrink-0 border-r border-slate-800 overflow-y-auto bg-slate-900/10">
          <div className="sticky top-0 bg-slate-950/80 backdrop-blur px-5 py-3 border-b border-slate-800">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Processed Images
            </p>
          </div>
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-600">
              <ImageIcon className="w-8 h-8 mb-2" />
              <p className="text-xs">No images yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {images.map((img) => (
                <button
                  key={img.data.image_id}
                  onClick={() =>
                    setSelectedImage(
                      img.data.image_id === selectedImage?.data.image_id
                        ? null
                        : img
                    )
                  }
                  className={`w-full text-left px-5 py-4 hover:bg-slate-800/40 transition-colors flex items-start gap-3 group ${
                    selectedImage?.data.image_id === img.data.image_id
                      ? "bg-violet-950/40 border-l-2 border-violet-500"
                      : "border-l-2 border-transparent"
                  }`}
                >
                  {/* Thumbnail preview */}
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                    {img.status === "success" && img.data.thumbnails.small ? (
                      <img
                        src={img.data.thumbnails.small}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {img.data.original_name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {img.data.image_id}
                    </p>
                    <div className="mt-1.5">
                      <StatusBadge status={img.status} />
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-1 transition-transform ${
                      selectedImage?.data.image_id === img.data.image_id
                        ? "rotate-90 text-violet-400"
                        : "group-hover:translate-x-0.5"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Column 3 — Detail panel */}
        <div className="flex-1 overflow-y-auto">
          {selectedImage ? (
            <div className="h-full flex flex-col">
              {/* Detail header */}
              <div className="sticky top-0 bg-slate-950/80 backdrop-blur px-6 py-4 border-b border-slate-800 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <StatusBadge status={selectedImage.status} />
                  <span className="text-sm font-medium text-slate-200">
                    {selectedImage.data.original_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedImage.status === "success" && (
                    <button
                      onClick={() => openLightbox(selectedImage)}
                      className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/40 hover:border-violet-400 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View thumbnails
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thumbnail strip */}
              {selectedImage.status === "success" && (
                <div className="px-6 py-4 border-b border-slate-800 flex gap-3">
                  {selectedImage.data.thumbnails.small && (
                    <button
                      onClick={() => openLightbox(selectedImage)}
                      className="group relative rounded-xl overflow-hidden border border-slate-700 hover:border-violet-500 transition-colors"
                    >
                      <img
                        src={selectedImage.data.thumbnails.small}
                        alt="small"
                        className="h-20 w-auto object-cover"
                      />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
                        S
                      </span>
                    </button>
                  )}
                  {selectedImage.data.thumbnails.medium && (
                    <button
                      onClick={() => openLightbox(selectedImage)}
                      className="group relative rounded-xl overflow-hidden border border-slate-700 hover:border-violet-500 transition-colors"
                    >
                      <img
                        src={selectedImage.data.thumbnails.medium}
                        alt="medium"
                        className="h-20 w-auto object-cover"
                      />
                      <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
                        M
                      </span>
                    </button>
                  )}
                  {selectedImage.data.metadata.caption && (
                    <div className="flex-1 flex items-center px-4 py-2 bg-slate-800/40 rounded-xl border border-slate-700">
                      <p className="text-xs text-slate-400 italic">
                        "{selectedImage.data.metadata.caption}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* JSON viewer */}
              <div className="flex-1 p-6">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">
                  Raw JSON
                </p>
                <pre className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs text-slate-300 overflow-auto leading-relaxed">
                  {JSON.stringify(selectedImage, null, 2)
                    .split("\n")
                    .map((line, i) => {
                      const keyMatch = line.match(/^(\s*)("[\w_]+"):/);
                      const strMatch = !keyMatch && line.match(/"([^"]*)"/);
                      if (keyMatch) {
                        return (
                          <span key={i}>
                            <span className="text-slate-500">
                              {keyMatch[1]}
                            </span>
                            <span className="text-violet-400">
                              {keyMatch[2]}
                            </span>
                            <span className="text-slate-400">
                              {line.slice(keyMatch[0].length)}
                            </span>
                            {"\n"}
                          </span>
                        );
                      }
                      return <span key={i}>{line + "\n"}</span>;
                    })}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-700">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center mb-4">
                <ChevronRight className="w-6 h-6" />
              </div>
              <p className="text-sm">Select an image to view details</p>
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
