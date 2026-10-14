'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

export default function ImageUploader({ onUpload, currentImage, folder = 'uploads', className = '' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      // Get presigned URL
      const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
      });
      const { uploadUrl, publicUrl } = await presignRes.json();

      if (!uploadUrl) {
        // Fallback: use the local preview as the URL (no storage bucket configured)
        console.warn('Storage not configured, using data URL fallback');
        onUpload?.(preview);
        setUploading(false);
        return;
      }

      // Upload directly to the storage bucket
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      setPreview(publicUrl);
      onUpload?.(publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleClear = () => {
    setPreview(null);
    onUpload?.(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={className}>
      {preview ? (
        <div className="relative group rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border-primary)' }}>
          <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/90 text-black hover:bg-white transition-colors">
              Replace
            </button>
            <button onClick={handleClear}
              className="p-1.5 rounded-lg bg-white/90 text-red-500 hover:bg-white transition-colors">
              <X size={14} />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-white" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-[var(--color-brand)]"
          style={{
            borderColor: dragActive ? 'var(--color-brand)' : 'var(--color-border-primary)',
            background: dragActive ? 'var(--color-brand-glow)' : 'transparent',
          }}
        >
          {uploading ? (
            <Loader2 size={24} className="mx-auto animate-spin mb-2" style={{ color: 'var(--color-brand)' }} />
          ) : (
            <ImageIcon size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-muted)' }} />
          )}
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {uploading ? 'Uploading...' : 'Click or drag image to upload'}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            PNG, JPG, WebP up to 5MB
          </p>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  );
}
