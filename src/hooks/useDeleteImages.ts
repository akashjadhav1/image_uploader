import { useState } from 'react';
import { toast } from 'react-toastify';
import api from './api';

export type UseDeleteImagesResult = {
  loading: boolean;
  error: string;
  /** Deletes one image; returns true on success so the caller can refresh the list. */
  deleteImage: (fileName: string) => Promise<boolean>;
};

/**
 * Deletes an image via DELETE /api/images/:fileName.
 * The auth token is attached automatically by the shared api interceptor.
 * Returns { loading, error, deleteImage }.
 */
export function useDeleteImages(): UseDeleteImagesResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deleteImage = async (fileName: string): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      await api.delete(`/api/images/${encodeURIComponent(fileName)}`);

      toast.success('Image deleted successfully!');
      return true;
    } catch (err: unknown) {
      const message =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.message ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.error ??
        'Failed to delete image.';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, deleteImage };
}
