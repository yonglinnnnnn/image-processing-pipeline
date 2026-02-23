import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { RefreshCw, ImageIcon, ZoomIn } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Lightbox } from "@/components/Lightbox";
import type { ImageRecord, LightboxImage } from "@/types";

interface ImageListProps {
  images: ImageRecord[];
  loading: boolean;
  onFetch: () => void;
}

export function ImageList({ images, loading, onFetch }: ImageListProps) {
  const [lightbox, setLightbox] = useState<{
    images: LightboxImage[];
    index: number;
  } | null>(null);

  const openLightbox = (imgs: LightboxImage[], index: number) =>
    setLightbox({ images: imgs, index });

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Processed Images
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onFetch}
              disabled={loading}
              className="h-8 text-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              {loading ? "Loading..." : "Fetch All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <ImageIcon className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No images loaded yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Click "Fetch All" to load your images
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {images.map((img, i) => {
                const lightboxImgs: LightboxImage[] = [];
                if (img.data.thumbnails.small)
                  lightboxImgs.push({
                    src: img.data.thumbnails.small,
                    label: "Small",
                    caption: img.data.metadata.caption,
                    filename: img.data.original_name,
                  });
                if (img.data.thumbnails.medium)
                  lightboxImgs.push({
                    src: img.data.thumbnails.medium,
                    label: "Medium",
                    caption: img.data.metadata.caption,
                    filename: img.data.original_name,
                  });

                return (
                  <div key={img.data.image_id}>
                    {i > 0 && <Separator className="mb-3" />}
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={img.status} />
                        <span className="text-sm font-medium text-gray-800 truncate flex-1">
                          {img.data.original_name}
                        </span>
                      </div>

                      {/* ID */}
                      <p className="text-xs text-gray-400 font-mono">
                        {img.data.image_id}
                      </p>

                      {/* Success */}
                      {img.status === "success" && (
                        <div className="space-y-2">
                          <div className="flex gap-3 text-xs text-gray-500">
                            {img.data.metadata.width &&
                              img.data.metadata.height && (
                                <span>
                                  {img.data.metadata.width}×
                                  {img.data.metadata.height}
                                </span>
                              )}
                            {img.data.metadata.format && (
                              <span className="uppercase">
                                {img.data.metadata.format}
                              </span>
                            )}
                            {img.data.metadata.size_bytes && (
                              <span>
                                {(img.data.metadata.size_bytes / 1024).toFixed(
                                  1
                                )}{" "}
                                KB
                              </span>
                            )}
                          </div>

                          {img.data.metadata.caption && (
                            <p className="text-sm text-gray-600 italic bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                              "{img.data.metadata.caption}"
                            </p>
                          )}

                          {lightboxImgs.length > 0 && (
                            <div className="flex gap-2 pt-1">
                              {lightboxImgs.map((lb, lbIdx) => (
                                <button
                                  key={lb.src}
                                  onClick={() =>
                                    openLightbox(lightboxImgs, lbIdx)
                                  }
                                  className="relative group rounded-lg overflow-hidden border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-zoom-in"
                                  title={`View ${lb.label} thumbnail`}
                                >
                                  <img
                                    src={lb.src}
                                    alt={`${lb.label} thumbnail`}
                                    className="h-16 w-auto object-cover transition-transform group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                    <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1 rounded">
                                    {lb.label[0]}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Failed */}
                      {img.status === "failed" && (
                        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">
                          {img.error}
                        </p>
                      )}

                      {/* Processing */}
                      {img.status === "processing" && (
                        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-100 flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Still
                          processing...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
