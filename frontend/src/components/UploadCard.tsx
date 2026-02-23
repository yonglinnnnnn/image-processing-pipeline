import { useRef } from "react";
import { Upload, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface UploadResult {
  image_id: string;
  status: string;
}

interface UploadCardProps {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  uploadResult: UploadResult | null;
  error: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onReset: () => void;
}

export function UploadCard({
  file,
  preview,
  uploading,
  uploadResult,
  error,
  onFileChange,
  onUpload,
  onReset,
}: UploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onReset();
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <label
        htmlFor="file-input"
        className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all
          ${
            file
              ? "border-violet-500 bg-violet-950/30"
              : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-600"
          }`}
      >
        <Upload
          className={`w-6 h-6 mb-2 ${
            file ? "text-violet-400" : "text-slate-500"
          }`}
        />
        {file ? (
          <span className="text-sm font-medium text-violet-300 px-4 text-center truncate max-w-full">
            {file.name}
          </span>
        ) : (
          <>
            <span className="text-sm font-medium text-slate-400">
              Click to upload
            </span>
            <span className="text-xs text-slate-600 mt-0.5">
              JPG, JPEG, PNG
            </span>
          </>
        )}
        <input
          id="file-input"
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png"
          onChange={onFileChange}
          className="hidden"
        />
      </label>

      {/* Preview */}
      {preview && (
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
          <img
            src={preview}
            alt="Preview"
            className="w-12 h-12 object-cover rounded-lg border border-slate-600 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate">
              {file?.name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {file ? (file.size / 1024).toFixed(1) + " KB" : ""}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onUpload}
          disabled={!file || uploading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
            bg-violet-600 hover:bg-violet-500 text-white
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-violet-600"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload
            </>
          )}
        </button>
        {file && (
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300 transition-all"
          >
            Reset
          </button>
        )}
      </div>

      {/* Success */}
      {uploadResult && (
        <div className="flex items-start gap-3 p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-emerald-300">
              Queued for processing!
            </p>
            <p className="text-xs font-mono text-emerald-500 mt-0.5">
              ID: {uploadResult.image_id}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Refresh the list to check status.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-3 bg-red-950/40 border border-red-800/50 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
