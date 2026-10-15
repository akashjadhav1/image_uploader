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
    <div className='min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-900 dark:text-gray-100'>
      {/* Top Navigation */}
      <nav className='sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900 sm:px-6'>
        {/* Left: Brand / Nav links */}
        <div className='flex items-center gap-6'>
          <a href='/#home' className='text-lg font-bold tracking-tight'>
            Image<span className='text-blue-600 dark:text-blue-400'>Uploader</span>
          </a>
          <div className='hidden items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300 md:flex'>
            <a href='/#home' className='hover:text-blue-600 dark:hover:text-blue-400'>Home</a>
            <a href='/#gallery' className='hover:text-blue-600 dark:hover:text-blue-400'>Gallery</a>
            <a href='/#uploads' className='hover:text-blue-600 dark:hover:text-blue-400'>Uploads</a>
          </div>
        </div>

        {/* Right: Theme toggle + Profile */}
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label='Toggle theme'
            className='rounded-full border border-gray-200 bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-yellow-300 dark:hover:bg-gray-700'
          >
            {darkMode ? (
              /* Sun icon */
              <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <circle cx='12' cy='12' r='4' />
                <path d='M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4' />
              </svg>
            ) : (
              /* Moon icon */
              <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                <path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' />
              </svg>
            )}
          </button>

          <div className='flex cursor-pointer items-center gap-2'>
            <div className='flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white dark:bg-blue-500'>
              AJ
            </div>
            <div className='hidden sm:block'>
              <p className='text-sm font-semibold leading-tight'>Akash Jadhav</p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>akash@example.com</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content: full-width image uploader (max 1 selection) + uploaded gallery */}
      <main className='w-full p-6'>
        <div className='w-full'>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 text-center transition-colors ${
              image ? 'py-4' : 'py-16'
            } ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
                : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800'
            }`}
          >
            {!image ? (
              <>
                <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-12 w-12 text-gray-400 dark:text-gray-500' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                  <path d='M17 8l-5-5-5 5' />
                  <path d='M12 3v12' />
                </svg>
                <p className='text-base font-semibold'>
                  {isDragging ? 'Drop the image here' : 'Click or drag an image to upload'}
                </p>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  Only 1 image allowed · JPG, PNG, GIF, WebP
                </p>
              </>
            ) : (
              <div className='flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4'>
                <div className='flex min-w-0 items-center gap-3'>
                  <img
                    src={image.previewUrl}
                    alt={image.file.name}
                    className='h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700'
                  />
                  <div className='min-w-0 text-left'>
                    <p className='truncate text-sm font-semibold'>{image.file.name}</p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      {(image.file.size / 1024).toFixed(1)} KB · 1 of 1 image (max)
                    </p>
                  </div>
                </div>
                <div className='flex shrink-0 items-center gap-2'>
                  <button
                    type='button'
                    onClick={handleRemove}
                    className='rounded-lg border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-red-950/40'
                  >
                    Remove
                  </button>
                  <button
                    type='button'
                    onClick={handleUpload}
                    className='rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
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
                className='absolute inset-0 cursor-pointer rounded-xl hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:border-blue-500'
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
            <p className='mt-3 w-full text-center text-sm font-medium text-red-600 dark:text-red-400'>
              {error}
            </p>
          )}

          {/* Uploaded images: 5 per row */}
          {uploaded.length > 0 && (
            <section className='mt-6 w-full'>
              <h2 className='mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                Uploaded Images ({uploaded.length})
              </h2>
              <div className='grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5'>
                {uploaded.map((img) => (
                  <div
                    key={img.id}
                    className='group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800'
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.file.name}
                      className='aspect-square w-full object-cover'
                    />
                    <button
                      type='button'
                      onClick={() => handleDeleteUploaded(img.id)}
                      aria-label={`Delete ${img.file.name}`}
                      className='absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 focus:opacity-100 group-hover:opacity-100'
                    >
                      <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                        <path d='M3 6h18' />
                        <path d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                        <path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' />
                      </svg>
                    </button>
                    <p className='truncate px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300'>
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