import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useDeleteImages } from '../hooks/useDeleteImages'
import { useGetImages, type ImageItem } from '../hooks/useGetImages'
import { useUpload } from '../hooks/useUpload'

type SelectedImage = {
  file: File;
  previewUrl: string;
};

type HomeProps = {
  onNavigate?: (page: 'login' | 'register' | 'home') => void;
};

// Shows a spinner overlay until the image finishes loading (fades in on load)
function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className='relative aspect-square w-full overflow-hidden rounded-xl bg-[var(--clay-inner-dark)]/40'>
      {!loaded && !failed && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <svg aria-hidden='true' className='h-6 w-6 animate-spin text-[var(--clay-primary)]' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z' />
          </svg>
        </div>
      )}
      {failed && (
        <div className='absolute inset-0 flex items-center justify-center text-[10px] text-[var(--clay-text-muted)]'>
          Failed to load
        </div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full rounded-xl object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

function Home({ onNavigate }: HomeProps) {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [image, setImage] = useState<SelectedImage | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [deletingName, setDeletingName] = useState<string>('');
  const [downloadingUrl, setDownloadingUrl] = useState<string>('');
  const [activeNav, setActiveNav] = useState<'home' | 'gallery' | 'uploads'>('gallery');
  const { loading: uploading, upload: uploadImage } = useUpload();
  const { deleteImage } = useDeleteImages();
  const {
    images: serverImages,
    loading: imagesLoading,
    refetch: refetchImages,
  } = useGetImages();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<SelectedImage | null>(null);
  imageRef.current = image;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Release object URLs on unmount only (upload/remove revoke inline)
  useEffect(() => {
    return () => {
      if (imageRef.current) URL.revokeObjectURL(imageRef.current.previewUrl);
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

  // Upload the pending image, then refresh the gallery from the API
  const handleUpload = async () => {
    if (!image) return;
    const success = await uploadImage(image.file);
    if (!success) return;
    setImage(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Pull the latest list from the server (includes the new upload)
    void refetchImages();
  };

  // Delete a server-stored image, then refresh the list from the API
  const handleDeleteServerImage = async (fileName?: string) => {
    if (!fileName) return;
    setDeletingName(fileName);
    const success = await deleteImage(fileName);
    setDeletingName('');
    if (success) void refetchImages();
  };

  // Download an image as a file; falls back to opening in a new tab if blocked
  const handleDownloadImage = async (img: ImageItem) => {
    if (!img.url) return;
    setDownloadingUrl(img.url);
    const downloadName = img.originalName || img.fileName || `image-${img.id}`;
    try {
      const response = await fetch(img.url, { mode: 'cors' });
      if (!response.ok) throw new Error('response not ok');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = downloadName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success('Download started');
    } catch {
      // CORS or network blocked the blob download — open the image directly
      window.open(img.url, '_blank', 'noopener,noreferrer');
      toast.error('Direct download blocked; opened the image in a new tab.');
    } finally {
      setDownloadingUrl('');
    }
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

  const handleLogout = () => {
    // Clear all stored data on logout (keep the UI theme preference)
    const theme = localStorage.getItem('theme');
    localStorage.clear();
    if (theme) localStorage.setItem('theme', theme);
    onNavigate?.('login');
  };

  // Gallery render state: skeleton while first loading, animated empty state, else the grid
  const hasGalleryItems = serverImages.length > 0;
  const galleryLoading = imagesLoading && !hasGalleryItems;
  const galleryEmpty = !imagesLoading && !hasGalleryItems;

  // "Uploads" view: keep only images created by the currently logged-in user
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('auth_user') ?? '{}');
    } catch {
      return null;
    }
  })();
  const currentUserId = currentUser?.id ?? currentUser?._id ?? null;
  const visibleImages =
    activeNav === 'uploads'
      ? serverImages.filter(
          (img) =>
            (currentUserId && img.createdBy?.id === currentUserId) ||
            (!!currentUser?.username &&
              img.createdBy?.username?.toLowerCase() === currentUser.username.toLowerCase())
        )
      : serverImages;
  const hasVisibleItems = visibleImages.length > 0;
  const uploadsEmpty = !imagesLoading && hasGalleryItems && !hasVisibleItems;

  // Logged-in user details for the navbar
  const displayName: string =
    currentUser?.username || currentUser?.name || currentUser?.fullName || 'User';
  const displayEmail = currentUser?.email || '';
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

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
            <button type='button' onClick={() => setActiveNav('home')} className={`transition-colors hover:text-[var(--clay-primary)] ${activeNav === 'home' ? 'text-[var(--clay-primary)]' : ''}`}>Home</button>
            <button type='button' onClick={() => setActiveNav('gallery')} className={`transition-colors hover:text-[var(--clay-primary)] ${activeNav === 'gallery' ? 'text-[var(--clay-primary)]' : ''}`}>Gallery</button>
            <button type='button' onClick={() => setActiveNav('uploads')} className={`transition-colors hover:text-[var(--clay-primary)] ${activeNav === 'uploads' ? 'text-[var(--clay-primary)]' : ''}`}>Uploads</button>
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

          <button
            type='button'
            onClick={handleLogout}
            className='clay-btn px-4 py-2 text-sm font-semibold text-[var(--clay-text-muted)] transition-colors hover:text-[var(--clay-danger)]'
          >
            Logout
          </button>

          <div className='flex cursor-pointer items-center gap-3'>
            <div className='clay-avatar flex h-10 w-10 items-center justify-center text-sm font-bold text-white'>
              {initials}
            </div>
            <div className='hidden sm:block'>
              <p className='text-sm font-semibold capitalize leading-tight'>{displayName}</p>
              <p className='text-xs text-[var(--clay-text-muted)]'>{displayEmail}</p>
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
                    disabled={uploading}
                    className='clay-btn-accent px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
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

          {/* Gallery: skeleton while loading, animated empty state, else the grid */}
          <section className='mt-10 w-full'>
              {galleryLoading && (
                <>
                  <h2 className='clay-heading mb-5 text-sm uppercase tracking-wide'>Uploaded Images</h2>
                  <div className='grid w-full grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5'>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={`skeleton-${i}`} className='clay-image-card animate-pulse p-2'>
                        <div className='aspect-square w-full rounded-xl bg-[var(--clay-inner-dark)]/40' />
                        <div className='mx-2 mt-3 h-3 w-3/4 rounded-full bg-[var(--clay-inner-dark)]/40' />
                        <div className='mx-2 mt-2 h-3 w-1/2 rounded-full bg-[var(--clay-inner-dark)]/40' />
                        <div className='mx-2 mt-2 h-2.5 w-2/5 rounded-full bg-[var(--clay-inner-dark)]/40' />
                      </div>
                    ))}
                  </div>
                </>
              )}
              {galleryEmpty && (
                <div className='flex w-full flex-col items-center justify-center gap-6 rounded-[28px] px-6 py-16 text-center'>
                  <div className='relative flex h-24 w-24 items-center justify-center'>
                    <span className='absolute inset-0 m-auto h-24 w-24 rounded-full bg-[var(--clay-primary)]/20 animate-ping' />
                    <div className='clay-circle relative animate-bounce p-6'>
                      <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-10 w-10 text-[var(--clay-primary)]' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                        <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                        <circle cx='8.5' cy='8.5' r='1.5' />
                        <path d='M21 15l-5-5L5 21' />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold'>No images yet</h3>
                    <p className='mt-1 text-sm text-[var(--clay-text-muted)]'>
                      Upload your first image and it will show up here.
                    </p>
                  </div>
                </div>
              )}
              {uploadsEmpty && (
                <div className='flex w-full flex-col items-center justify-center gap-6 rounded-[28px] px-6 py-16 text-center'>
                  <div className='relative flex h-24 w-24 items-center justify-center'>
                    <span className='absolute inset-0 m-auto h-24 w-24 rounded-full bg-[var(--clay-primary)]/20 animate-ping' />
                    <div className='clay-circle relative animate-bounce p-6'>
                      <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-10 w-10 text-[var(--clay-primary)]' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                        <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                        <path d='M17 8l-5-5-5 5' />
                        <path d='M12 3v12' />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold'>No uploads by you yet</h3>
                    <p className='mt-1 text-sm text-[var(--clay-text-muted)]'>
                      Images you upload will appear here.
                    </p>
                  </div>
                </div>
              )}
              {!galleryLoading && !galleryEmpty && hasVisibleItems && (
                <>
                  <h2 className='clay-heading mb-5 text-sm uppercase tracking-wide'>
                    {activeNav === 'uploads' ? 'My Uploads' : 'Uploaded Images'} ({visibleImages.length}){imagesLoading ? ' · refreshing…' : ''}
                  </h2>
                  <div className='grid w-full grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5'>
                {visibleImages.map((img) => (
                  <div
                    key={`server-${img.id}`}
                    className='clay-image-card group relative overflow-hidden p-2'
                  >
                    <GalleryImage
                      src={img.url}
                      alt={img.originalName || img.fileName || `Image ${img.id}`}
                    />
                    <div className='absolute right-3 top-3 flex items-center gap-2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100'>
                      <button
                        type='button'
                        onClick={() => handleDownloadImage(img)}
                        disabled={downloadingUrl === img.url}
                        aria-label={`Download ${img.originalName || img.fileName || 'image'}`}
                        className='clay-btn-accent rounded-full p-2 text-white disabled:cursor-not-allowed'
                      >
                        {downloadingUrl === img.url ? (
                          <svg aria-hidden='true' className='h-4 w-4 animate-spin' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z' />
                          </svg>
                        ) : (
                          <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                            <path d='M7 10l5 5 5-5' />
                            <path d='M12 15V3' />
                          </svg>
                        )}
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDeleteServerImage(img.fileName)}
                        disabled={!img.fileName || deletingName === img.fileName}
                        aria-label={img.fileName ? `Delete ${img.fileName}` : 'Delete image'}
                        className='clay-btn-danger rounded-full p-2 text-white disabled:cursor-not-allowed'
                      >
                        {deletingName === img.fileName ? (
                          <svg aria-hidden='true' className='h-4 w-4 animate-spin' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z' />
                          </svg>
                        ) : (
                          <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M3 6h18' />
                            <path d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                            <path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className='px-2 pt-2 pb-1'>
                      <p className='truncate text-xs font-medium' title={img.originalName || img.fileName}>
                        {img.originalName || img.fileName || `Image ${img.id}`}
                      </p>
                      <p
                        className='truncate text-xs text-[var(--clay-primary)]'
                        title={img.createdBy?.username}
                      >
                        by {img.createdBy?.username || 'Unknown user'}
                      </p>
                      <p className='truncate text-[10px] text-[var(--clay-text-muted)]'>
                        {img.size ? `${(img.size / 1024).toFixed(1)} KB` : ''}
                        {img.size && img.uploadedAt ? ' · ' : ''}
                        {img.uploadedAt ? new Date(img.uploadedAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
                  </div>
                </>
              )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Home;