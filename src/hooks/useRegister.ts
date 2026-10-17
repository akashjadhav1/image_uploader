import { useState } from 'react';
import { toast } from 'react-toastify';
import api from './api';

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type UseRegisterResult = {
  loading: boolean;
  error: string;
  /** Returns true on success so the caller can navigate away. */
  register: (payload: RegisterPayload) => Promise<boolean>;
};

/**
 * Submits new-user details to POST /auth/register and stores the returned
 * token + user in localStorage. Returns { loading, error, register }.
 */
export function useRegister(): UseRegisterResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const register = async ({
    fullName,
    email,
    password,
  }: RegisterPayload): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        username: fullName,
        name: fullName,
        email,
        password,
      };
      console.log('[register] POST', `${api.defaults.baseURL}/auth/register`, payload);

      const { data } = await api.post('/auth/register', payload);
      console.log('[register] success response:', data);

      if (data?.token) localStorage.setItem('auth_token', data.token);
      if (data?.user) localStorage.setItem('auth_user', JSON.stringify(data.user));

      toast.success('Registration successful!');
      return true;
    } catch (err: unknown) {
      console.error('[register] failed:', err);
      // Axios errors: err.response exists when the server replied (HTTP 4xx/5xx).
      // err.response is undefined for CORS blocks, network failures and timeouts.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosErr = err as any;
      console.log('[register] status:', axiosErr?.response?.status ?? 'no response');
      console.log('[register] response data:', axiosErr?.response?.data ?? null);
      console.log('[register] error message:', axiosErr?.message);

      const message =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.message ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.error ??
        (axiosErr?.response
          ? 'Registration failed. Please try again.'
          : axiosErr?.code === 'ECONNABORTED'
            ? 'The server took too long to respond. Please try again.'
            : 'Unable to reach the server. It may be offline (CORS or network error).');
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, register };
}
