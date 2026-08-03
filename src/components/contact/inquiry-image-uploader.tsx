"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { inquiryImageKey, MAX_INQUIRY_IMAGES } from "@/lib/inquiry-images";

export type InquiryImageUploaderProps = {
  files: readonly File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  error?: string;
};

type InquiryImagePreviewProps = {
  file: File;
  disabled: boolean;
  onRemove: () => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function InquiryImagePreview({
  file,
  disabled,
  onRemove,
}: InquiryImagePreviewProps) {
  const [url] = useState(() => URL.createObjectURL(file));

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  return (
    <li className="border border-line bg-white p-2">
      <div className="relative aspect-square overflow-hidden bg-surface">
        <Image
          alt={`첨부 이미지 미리보기: ${file.name}`}
          className="object-cover"
          fill
          sizes="(min-width: 640px) 180px, 40vw"
          src={url}
          unoptimized
        />
      </div>
      <p className="mt-2 truncate text-xs" title={file.name}>
        {file.name}
      </p>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
        <span>{formatFileSize(file.size)}</span>
        <button
          aria-label={`${file.name} 제거`}
          className="min-h-8 px-2 underline disabled:opacity-50"
          disabled={disabled}
          onClick={onRemove}
          type="button"
        >
          제거
        </button>
      </div>
    </li>
  );
}

export function InquiryImageUploader({
  files,
  onChange,
  disabled = false,
  error,
}: InquiryImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (files.length === 0 && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [files.length]);

  const addFiles = (selected: FileList | readonly File[]) => {
    if (disabled) return;
    onChange([...files, ...Array.from(selected)]);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files);
  };

  const remaining = Math.max(0, MAX_INQUIRY_IMAGES - files.length);
  const describedBy = error
    ? "inquiry-images-guidance inquiry-images-error"
    : "inquiry-images-guidance";

  return (
    <div>
      <div className="text-sm font-medium">사진 첨부 (선택)</div>
      <p className="mt-1 text-sm text-muted" id="inquiry-images-guidance">
        제품 상태나 설치 환경을 확인할 수 있는 사진을 첨부해 주세요.
        <br />
        JPG, PNG, WebP · 장당 최대 5MB · 최대 3장
      </p>

      <input
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        id="inquiry-images-input"
        multiple
        onChange={handleInputChange}
        ref={inputRef}
        type="file"
      />
      <button
        aria-describedby={describedBy}
        className={`mt-3 flex min-h-28 w-full flex-col items-center justify-center border border-dashed px-4 py-5 text-center text-sm transition-colors focus-visible:outline disabled:cursor-not-allowed disabled:opacity-50 ${
          dragging ? "border-brand bg-brand/5" : "border-line bg-white"
        }`}
        disabled={disabled}
        id="inquiry-images-control"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        type="button"
      >
        <span className="font-medium">사진 선택 또는 여기로 끌어오기</span>
        <span className="mt-1 text-xs text-muted">
          {remaining > 0
            ? `${remaining}장 더 첨부할 수 있습니다.`
            : "첨부 가능한 사진을 모두 선택했습니다."}
        </span>
      </button>

      {files.length > 0 && (
        <ul
          className="mt-3 grid gap-3 sm:grid-cols-3"
          key={files.map(inquiryImageKey).join("|")}
        >
          {files.map((file, index) => (
            <InquiryImagePreview
              disabled={disabled}
              file={file}
              key={inquiryImageKey(file)}
              onRemove={() =>
                onChange(files.filter((_, fileIndex) => fileIndex !== index))
              }
            />
          ))}
        </ul>
      )}

      {error && (
        <p
          aria-live="polite"
          className="mt-2 text-xs text-brand"
          id="inquiry-images-error"
          role="alert"
        >
          {error}
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted">
        첨부한 사진은 문의 확인과 답변을 위해 이메일로 전송됩니다.
        <br />
        사진에 포함된 개인정보를 확인한 후 첨부해 주세요.
      </p>
    </div>
  );
}
