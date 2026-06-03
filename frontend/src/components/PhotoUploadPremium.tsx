import React, { useRef, useState } from 'react';

export default function PhotoUploadPremium({
  onFile,
  label = 'Choose photo',
}: {
  onFile: (file: File) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    onFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-40 h-40 rounded-xl bg-gradient-to-br from-pink-600 via-pink-500 to-pink-400 flex items-center justify-center overflow-hidden shadow-lg">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-white text-center px-2">
            <svg className="mx-auto mb-1 w-8 h-8 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 7V5a4 4 0 0 1 8 0v2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-sm font-medium">{label}</div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleClick}
        className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-md hover:brightness-105"
      >
        Upload Photo
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );
}
