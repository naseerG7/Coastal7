import { useEffect, useRef, useState } from "react";
import "./ImageDropzone.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function ImageDropzone({
  files = [],
  onFilesChange,
  maxFiles = 8,
  label = "Product images",
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const nextPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviews(nextPreviews);

    return () => {
      nextPreviews.forEach(({ url }) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  const addFiles = (fileList) => {
    if (disabled) return;

    const incomingFiles = Array.from(fileList || []);
    const nextErrors = [];
    const acceptedFiles = [];
    const existingKeys = new Set(
      files.map(
        (file) =>
          `${file.name}-${file.size}-${file.lastModified}`
      )
    );

    for (const file of incomingFiles) {
      const fileKey =
        `${file.name}-${file.size}-${file.lastModified}`;

      if (!ALLOWED_TYPES.includes(file.type)) {
        nextErrors.push(
          `${file.name}: use a JPEG, PNG, or WebP image.`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        nextErrors.push(
          `${file.name}: image size must not exceed 5 MB.`
        );
        continue;
      }

      if (existingKeys.has(fileKey)) {
        nextErrors.push(`${file.name}: already selected.`);
        continue;
      }

      if (files.length + acceptedFiles.length >= maxFiles) {
        nextErrors.push(
          `You can select a maximum of ${maxFiles} images.`
        );
        break;
      }

      existingKeys.add(fileKey);
      acceptedFiles.push(file);
    }

    setErrors(nextErrors);

    if (acceptedFiles.length > 0) {
      onFilesChange([...files, ...acceptedFiles]);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const removeFile = (fileToRemove) => {
    if (disabled) return;

    onFilesChange(
      files.filter((file) => file !== fileToRemove)
    );

    setErrors([]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  return (
    <section className="image-dropzone">
      <div className="image-dropzone-heading">
        <h3>{label}</h3>

        <span>
          {files.length}/{maxFiles} images
        </span>
      </div>

      <div
        className={`image-dropzone-area ${
          isDragging ? "is-dragging" : ""
        } ${disabled ? "is-disabled" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();

          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsDragging(false);
          }
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          className="image-dropzone-input"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled}
          onChange={(event) => {
            addFiles(event.target.files);
          }}
          aria-label={`Choose ${label.toLowerCase()}`}
        />

        <div className="image-dropzone-icon" aria-hidden="true">
          ↑
        </div>

        <p className="image-dropzone-title">
          Drag and drop your images here
        </p>

        <p className="image-dropzone-description">
          JPEG, PNG, or WebP · Maximum 5 MB per image
        </p>

        <button
          type="button"
          className="image-dropzone-browse"
          disabled={disabled || files.length >= maxFiles}
          onClick={() => inputRef.current?.click()}
        >
          Browse images
        </button>
      </div>

      {errors.length > 0 && (
        <ul className="image-dropzone-errors" role="alert">
          {errors.map((error, index) => (
            <li key={`${error}-${index}`}>{error}</li>
          ))}
        </ul>
      )}

      {previews.length > 0 && (
        <div className="image-dropzone-gallery">
          {previews.map(({ file, url }, index) => (
            <div
              className="image-dropzone-card"
              key={`${file.name}-${file.size}-${file.lastModified}`}
            >
              <img
                src={url}
                alt={`Selected image ${index + 1}: ${file.name}`}
              />

              {index === 0 && (
                <span className="image-dropzone-primary">
                  First image
                </span>
              )}

              <p title={file.name}>{file.name}</p>

              <span className="image-dropzone-size">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>

              <button
                type="button"
                className="image-dropzone-remove"
                disabled={disabled}
                onClick={() => removeFile(file)}
                aria-label={`Remove ${file.name}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ImageDropzone;