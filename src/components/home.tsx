import React, { useEffect, useRef, useState } from 'react'

type SelectedImage = {
  file: File;
  previewUrl: string;
};

type UploadedImage = {
  id: number;
  file: File;
  previewUrl: string;
};

function Home() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [image, setImage] = useState<SelectedImage | null>(null);
  const [uploaded, setUploaded] = useState<UploadedImage[]>([]);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<SelectedImage | null>(null);
  imageRef.current = image;
  const uploadedRef = useRef<UploadedImage[]>([]);
  uploadedRef.current = uploaded;
  const nextIdRef = useRef<number>(1);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Release object URLs on unmount only (upload/remove revoke inline)
  useEffect(() => {
    return () => {
      if (imageRef.current) URL.revokeObjectURL(imageRef.current.previewUrl);
      uploadedRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  // Selection is capped at 1 image: a new pick replaces the pending one
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed (JPG, PNG, GIF, WebP...)');
      return;
    }
    setError('');
    if (image) URL.revokeObjectURL(image.previewUrl);
    setImage({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleRemove = () => {
    if (image) URL.revokeObjectURL(image.previewUrl);
    setImage(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Move the pending image into the uploaded gallery
  const handleUpload = () => {
    if (!image) return;
    setUploaded((prev) => [
      ...prev,
      { id: nextIdRef.current++, file: image.file, previewUrl: image.previewUrl },
    ]);
    setImage(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteUploaded = (id: number) => {
    setUploaded((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className='min-h-screen bg-[var(--clay-bg)] text-[var(--clay-text)] transition-colors'>
      {/* Top Navigation */}
      <nav className='clay-nav sticky top-0 z-10 flex items-center justify-between px-6 py-4 sm:px-8'>
        {/* Left: Brand / Nav links */}
        <div className='flex items-center gap-6'>
          <a href='/#home' className='text-xl font-bold tracking-tight'>
            Image<span className='text-[var(--clay-primary)]'>Uploader</span>
          </a>
          <div className='hidden items-center gap-4 text-sm font-medium text-[var(--clay-text-muted)] md:flex'>
            <a href='/#home' className='transition-colors hover:text-[var(--clay-primary)]'>Home</a>
            <a href='/#gallery' className='transition-colors hover:text-[var(--clay-primary)]'>Gallery</a>
            <a href='/#uploads' className='transition-colors hover:text-[var(--clay-primary)]'>Uploads</a>
          </div>
        </div>

        {/* Right: Theme toggle + Profile */}
        <div className='flex items-center gap-4'>
          <button
            type='button'
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label='Toggle theme'
            className='clay-circle p-3 text-[var(--clay-text-muted)] transition-colors hover:text-[var(--clay-primary)]'
          >
            {darkMode ? (
              <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <circle cx='12' cy='12' r='4' />
                <path d='M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4' />
              </svg>
            ) : (
              <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' />
              </svg>
            )}
          </button>

          <div className='flex cursor-pointer items-center gap-3'>
            <div className='clay-avatar flex h-10 w-10 items-center justify-center text-sm font-bold text-white'>
              AJ
            </div>
            <div className='hidden sm:block'>
              <p className='text-sm font-semibold leading-tight'>Akash Jadhav</p>
              <p className='text-xs text-[var(--clay-text-muted)]'>akash@example.com</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className='mx-auto w-full max-w-5xl p-6 pt-10'>
        <div className='w-full'>
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`clay-dropzone relative flex w-full flex-col items-center justify-center gap-4 px-8 text-center ${
              image ? 'py-6' : 'py-20'
            } ${isDragging ? 'clay-dropzone-active' : ''}`}
          >
            {!image ? (
              <>
                <div className='clay-circle p-5'>
                  <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-10 w-10 text-[var(--clay-primary)]' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                    <path d='M17 8l-5-5-5 5' />
                    <path d='M12 3v12' />
                  </svg>
                </div>
                <p className='text-lg font-semibold'>
                  {isDragging ? 'Drop the image here' : 'Click or drag an image to upload'}
                </p>
                <p className='text-sm text-[var(--clay-text-muted)]'>
                  Only 1 image allowed · JPG, PNG, GIF, WebP
                </p>
              </>
            ) : (
              <div className='flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-between'>
                <div className='flex min-w-0 items-center gap-4'>
                  <img
                    src={image.previewUrl}
                    alt={image.file.name}
                    className='clay-thumbnail h-16 w-16 shrink-0 object-cover'
                  />
                  <div className='min-w-0 text-left'>
                    <p className='truncate text-sm font-semibold'>{image.file.name}</p>
                    <p className='text-xs text-[var(--clay-text-muted)]'>
                      {(image.file.size / 1024).toFixed(1)} KB · 1 of 1 image (max)
                    </p>
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-3'>
                  <button
                    type='button'
                    onClick={handleRemove}
                    className='clay-btn-danger px-4 py-2 text-sm'
                  >
                    Remove
                  </button>
                  <button
                    type='button'
                    onClick={handleUpload}
                    className='clay-btn-accent px-5 py-2 text-sm'
                  >
                    Upload
                  </button>
                </div>
              </div>
            )}
            {!image && (
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='absolute inset-0 cursor-pointer rounded-[28px] focus:outline-none focus:ring-2 focus:ring-[var(--clay-primary)]/40'
                aria-label='Choose an image to upload'
              />
            )}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              className='hidden'
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {error && (
            <p className='mt-4 w-full text-center text-sm font-medium text-[var(--clay-danger)]'>
              {error}
            </p>
          )}

          {/* Uploaded images: 5 per row */}
          {uploaded.length > 0 && (
            <section className='mt-10 w-full'>
              <h2 className='clay-heading mb-5 text-sm uppercase tracking-wide'>
                Uploaded Images ({uploaded.length})
              </h2>
              <div className='grid w-full grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5'>
                {uploaded.map((img) => (
                  <div
                    key={img.id}
                    className='clay-image-card group relative overflow-hidden p-2'
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.file.name}
                      className='aspect-square w-full rounded-xl object-cover'
                    />
                    <button
                      type='button'
                      onClick={() => handleDeleteUploaded(img.id)}
                      aria-label={`Delete ${img.file.name}`}
                      className='clay-btn-danger absolute right-3 top-3 rounded-full p-2 text-white opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 group-hover:opacity-100'
                    >
                      <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                        <path d='M3 6h18' />
                        <path d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                        <path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' />
                      </svg>
                    </button>
                    <p className='truncate px-2 pt-2 pb-1 text-xs text-[var(--clay-text-muted)]'>
                      {img.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default Home;