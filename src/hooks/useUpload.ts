import { useState } from 'react';
import { toast } from 'react-toastify';
import api from './api';

export type UseUploadResult = {
  loading: boolean;
  error: string;
  /** Returns true on success so the caller can update the gallery. */
  upload: (file: File) => Promise<boolean>;
};

/**
 * Uploads a single image to POST /images using multipart/form-data.
 * The auth token is attached automatically by the shared api interceptor.
 * Returns { loading, error, upload }.
 */
export function useUpload(): UseUploadResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      await api.post('api/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Image uploaded successfully!');
      return true;
    } catch (err: unknown) {
      const message =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.message ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.error ??
        'Upload failed. Please try again.';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, upload };
}
