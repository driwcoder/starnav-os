"use client";

import { useState } from "react";

interface FileUploaderProps {
  onUploaded: (url: string) => void;
}

export function FileUploader({ onUploaded }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/blob", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      onUploaded(data.url);
    }

    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p className="text-sm text-gray-500">Enviando...</p>}
    </div>
  );
}
