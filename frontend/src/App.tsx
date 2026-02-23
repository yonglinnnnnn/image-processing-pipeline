import { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://localhost:8000/api";

interface ImageRecord {
  status: string;
  data: {
    image_id: string;
    original_name: string;
    processed_at: string | null;
    metadata: {
      width?: number;
      height?: number;
      format?: string;
      size_bytes?: number;
      caption?: string;
    };
    thumbnails: {
      small?: string;
      medium?: string;
    };
  };
  error: string | null;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    image_id: string;
    status: string;
  } | null>(null);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setUploadResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult(res.data);
    } catch (err) {
      setError("Upload failed. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  const handleFetchImages = async () => {
    setLoadingImages(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/images`);
      setImages(res.data);
    } catch {
      setError("Failed to fetch images.");
    } finally {
      setLoadingImages(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="app">
      <h1>Image Processing Pipeline</h1>

      {/* Upload Section */}
      <div className="card">
        <h2>Upload Image</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={handleFileChange}
        />

        {preview && (
          <div className="preview">
            <img src={preview} alt="Preview" />
            <p>{file?.name}</p>
          </div>
        )}

        <div className="button-row">
          <button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
          {file && <button onClick={handleReset}>Reset</button>}
        </div>

        {uploadResult && (
          <div className="result success">
            <p>Queued for processing!</p>
            <p>
              <strong>ID:</strong> {uploadResult.image_id}
            </p>
            <p>
              <strong>Status:</strong> {uploadResult.status}
            </p>
            <p className="hint">
              Processing happens in the background. Fetch all images below to
              check when it's done.
            </p>
          </div>
        )}

        {error && <div className="result error">{error}</div>}
      </div>

      {/* Image List Section */}
      <div className="card">
        <h2>Processed Images</h2>
        <button onClick={handleFetchImages} disabled={loadingImages}>
          {loadingImages ? "Loading..." : "Fetch All Images"}
        </button>

        {images.length > 0 && (
          <div className="image-list">
            {images.map((img) => (
              <div
                key={img.data.image_id}
                className={`image-card ${img.status}`}
              >
                <div className="image-header">
                  <span className={`badge ${img.status}`}>{img.status}</span>
                  <strong>{img.data.original_name}</strong>
                </div>
                <p className="image-id">ID: {img.data.image_id}</p>

                {img.status === "success" && (
                  <>
                    <div className="meta">
                      <span>
                        {img.data.metadata.width}×{img.data.metadata.height}
                      </span>
                      <span>{img.data.metadata.format?.toUpperCase()}</span>
                      <span>
                        {img.data.metadata.size_bytes
                          ? (img.data.metadata.size_bytes / 1024).toFixed(1) +
                            " KB"
                          : ""}
                      </span>
                    </div>
                    {img.data.metadata.caption && (
                      <p className="caption">{img.data.metadata.caption}</p>
                    )}
                    <div className="thumbnails">
                      {img.data.thumbnails.small && (
                        <img
                          src={img.data.thumbnails.small}
                          alt="small thumbnail"
                          title="Small"
                        />
                      )}
                      {img.data.thumbnails.medium && (
                        <img
                          src={img.data.thumbnails.medium}
                          alt="medium thumbnail"
                          title="Medium"
                        />
                      )}
                    </div>
                  </>
                )}

                {img.status === "failed" && (
                  <p className="error-msg">Error: {img.error}</p>
                )}

                {img.status === "processing" && (
                  <p className="processing-msg">⏳ Still processing...</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
