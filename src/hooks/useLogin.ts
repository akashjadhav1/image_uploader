import { useState } from 'react';
import { toast } from 'react-toastify';
import api from './api';

export type LoginPayload = {
  email: string;
  password: string;
};

export type UseLoginResult = {
  loading: boolean;
  error: string;
  /** Returns true on success so the caller can navigate away. */
  login: (payload: LoginPayload) => Promise<boolean>;
};

/**
 * Submits credentials to POST /auth/login and stores the returned token + user
 * in localStorage. Returns { loading, error, login }.
 */
export function useLogin(): UseLoginResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async ({ email, password }: LoginPayload): Promise<boolean> => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', { email, password });

      if (data?.token) localStorage.setItem('auth_token', data.token);
      if (data?.user) localStorage.setItem('auth_user', JSON.stringify(data.user));

      toast.success('Login successful!');
      return true;
    } catch (err: unknown) {
      const message =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.message ??
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.error ??
        'Login failed. Please check your credentials.';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, login };
}
