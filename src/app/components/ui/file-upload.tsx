import { useCallback, useEffect, useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "./button";

interface FileUploadProps {
  value?: string; // Current image URL if exists
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export function FileUpload({
  value,
  onChange,
  onRemove,
  accept = "image/*",
  maxSize = 5,
  disabled = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return "Please upload an image file (PNG, JPG, GIF, etc.)";
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      return `File size must be less than ${maxSize}MB`;
    }

    return null;
  };

  const handleFile = useCallback(
    (file: File) => {
      setError("");
      
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Simulate upload delay (in real implementation, this would be an API call)
      setUploading(true);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setUploading(false);
        onChange(file);
      };
      reader.readAsDataURL(file);
    },
    [onChange, maxSize]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled) return;

      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile, disabled]
  );

  const handleRemove = useCallback(() => {
    setPreview(undefined);
    setError("");
    onChange(null);
    onRemove?.();
  }, [onChange, onRemove]);

  // Show preview if image exists
  if (preview) {
    return (
      <div className="relative">
        <div className="relative rounded-lg border-2 border-neutral-200 overflow-hidden group">
          <img
            src={preview}
            alt="Upload preview"
            className="w-full h-64 object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white">
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Uploading...</span>
              </div>
            </div>
          )}
          {!disabled && !uploading && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8 rounded-full shadow-lg"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          Click the × button to remove and upload a different image
        </p>
      </div>
    );
  }

  // Show upload area
  return (
    <div className="space-y-2">
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : error
            ? "border-red-300 bg-red-50"
            : "border-neutral-300 bg-neutral-50 hover:border-neutral-400"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="file-upload"
        />
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className={`p-3 rounded-full mb-4 ${
            dragActive ? "bg-blue-100" : "bg-neutral-100"
          }`}>
            {dragActive ? (
              <Upload className="w-8 h-8 text-blue-600" />
            ) : (
              <ImageIcon className="w-8 h-8 text-neutral-400" />
            )}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-neutral-900 mb-1">
              {dragActive ? "Drop your image here" : "Drop your image here, or browse"}
            </p>
            <p className="text-xs text-neutral-500">
              PNG, JPG, GIF up to {maxSize}MB
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("file-upload")?.click();
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span className="font-medium">Error:</span> {error}
        </p>
      )}
    </div>
  );
}
