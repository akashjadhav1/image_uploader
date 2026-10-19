import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from './api';

export type ImageItem = {
  id: string | number;
  url: string;
  fileName?: string;
  originalName?: string;
  size?: number;
  uploadedAt?: string;
  createdBy?: {
    id?: string;
    username?: string;
    email?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type UseGetImagesResult = {
  images: ImageItem[];
  loading: boolean;
  error: string;
  /** Re-fetch the image list (e.g. after an upload or delete). */
  refetch: () => Promise<void>;
};

/**
 * Fetches the logged-in user's images from GET /api/images.
 * The auth token is attached automatically by the shared api interceptor.
 * Loads on mount and exposes { images, loading, error, refetch }.
 */
export function useGetImages(): UseGetImagesResult {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Server origin (base URL minus the /api suffix) for relative /uploads paths
  const origin = (process.env.REACT_APP_BASE_URL ?? '').replace(/\/api\/?$/, '');

  const getImages = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/api/images');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = res?.data ?? {};
      console.log('[getImages] response:', data);

      // Support common list shapes: array | { images } | { data } | { data: { images } }
      const list = Array.isArray(data)
        ? data
        : data.images ?? data.data ?? data.data?.images ?? [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized: ImageItem[] = (Array.isArray(list) ? list : []).map((item: any, index: number) => {
        // API returns relative URLs like "/uploads/abc.jpg" — resolve against the server
        const rawUrl = item?.url ?? item?.imageUrl ?? item?.path ?? '';
        const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `${origin}${rawUrl}`;

        return {
          ...item,
          id: item?.id ?? item?._id ?? index,
          url,
          // fileName = stored/served name (used for delete); originalName = user's upload name (for display)
          fileName: item?.fileName,
          originalName: item?.file_name ?? item?.originalName ?? item?.fileName,
          createdBy: item?.createdBy ?? item?.created_by,
        };
      });

      setImages(normalized);
    } catch (err: unknown) {
      const message =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.message ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.error ??
        'Failed to load images.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [origin]);

  // Load the gallery on mount
  useEffect(() => {
    void getImages();
  }, [getImages]);

  return { images, loading, error, refetch: getImages };
}
