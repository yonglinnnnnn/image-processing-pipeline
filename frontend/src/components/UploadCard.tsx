import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    <Card className="mb-6 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Upload Image</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <label
          htmlFor="file-input"
          className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors
            ${
              file
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300"
            }`}
        >
          <Upload
            className={`w-7 h-7 mb-2 ${
              file ? "text-indigo-500" : "text-gray-400"
            }`}
          />
          {file ? (
            <span className="text-sm font-medium text-indigo-600">
              {file.name}
            </span>
          ) : (
            <>
              <span className="text-sm font-medium text-gray-600">
                Click to upload
              </span>
              <span className="text-xs text-gray-400 mt-0.5">
                JPG, JPEG, PNG supported
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
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <img
              src={preview}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {file?.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {file ? (file.size / 1024).toFixed(1) + " KB" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onUpload}
            disabled={!file || uploading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </>
            )}
          </Button>
          {file && (
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex-shrink-0"
            >
              Reset
            </Button>
          )}
        </div>

        {/* Success alert */}
        {uploadResult && (
          <Alert className="border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800">
              <p className="font-medium">Queued for processing!</p>
              <p className="text-xs mt-1 font-mono text-emerald-700">
                ID: {uploadResult.image_id}
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Fetch images below to check when processing is complete.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Error alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
