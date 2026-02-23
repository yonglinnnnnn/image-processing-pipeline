import { useState } from "react";
import axios from "axios";
import { ImageIcon } from "lucide-react";
import { UploadCard } from "@/components/UploadCard";
import { ImageList } from "@/components/ImageList";
import type { ImageRecord } from "@/types";

const API_BASE = "http://localhost:8000/api";

export default function App() {
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    image_id: string;
    status: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Image list state
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

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

  const handleFetchImages = async () => {
    setLoadingImages(true);
    try {
      const res = await axios.get(`${API_BASE}/images`);
      setImages(res.data);
    } catch {
      // errors handled inside ImageList aren't needed here,
      // but you could lift them up if you want a global error banner
    } finally {
      setLoadingImages(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-4">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Image Processing Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload images for background processing and thumbnail generation
          </p>
        </div>

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

        <ImageList
          images={images}
          loading={loadingImages}
          onFetch={handleFetchImages}
        />
      </div>
    </div>
  );
}
