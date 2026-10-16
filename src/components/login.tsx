import React, { useState } from 'react'
import { useLogin } from '../hooks/useLogin'

type LoginPageProps = {
  onNavigate: (page: 'register' | 'home') => void;
};

function LoginPage({ onNavigate }: LoginPageProps) {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const { loading, error: apiError, login } = useLogin();

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const error = fieldError || apiError;

  const setError = (msg: string) => setFieldError(msg);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldError('');

    if (!email.trim()) { setError('Email is required.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Password is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    const success = await login({ email, password });
    if (success) onNavigate('home');
  };

  return (
    <div className='min-h-screen bg-[var(--clay-bg)] text-[var(--clay-text)] flex flex-col items-center justify-center px-4 py-10 transition-colors'>

      {/* Top bar – brand + theme toggle */}
      <div className='absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 sm:px-8'>
        <a href='/login' className='text-xl font-bold tracking-tight'>
          Image<span className='text-[var(--clay-primary)]'>Uploader</span>
        </a>
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
      </div>

      {/* Auth Card */}
      <div className='clay-card w-full max-w-md p-8 sm:p-10'>

        {/* Card header */}
        <div className='mb-8 text-center'>
          <div className='clay-circle mx-auto mb-4 flex h-16 w-16 items-center justify-center'>
            <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-8 w-8 text-[var(--clay-primary)]' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
              <circle cx='12' cy='7' r='4' />
            </svg>
          </div>
          <h1 className='text-2xl font-bold'>Welcome back</h1>
          <p className='mt-1 text-sm text-[var(--clay-text-muted)]'>Sign in to continue uploading</p>
        </div>

        {/* Error */}
        {error && (
          <div className='mb-5 rounded-xl px-4 py-3 text-sm font-medium text-white'
            style={{ background: 'var(--clay-danger)', boxShadow: '3px 3px 6px var(--clay-shadow-dark), -3px -3px 6px var(--clay-shadow-light)' }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-5' noValidate>

          {/* Email */}
          <div className='flex flex-col gap-2'>
            <label htmlFor='login-email' className='text-sm font-semibold text-[var(--clay-text-muted)]'>
              Email Address
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clay-text-muted)]'>
                <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <rect x='2' y='4' width='20' height='16' rx='2' />
                  <path d='m22 7-3.9 3.9a2 2 0 0 1-2.8 0L11 7' />
                </svg>
              </span>
              <input
                id='login-email'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='clay-input'
                style={{ paddingLeft: '2.75rem' }}
                autoComplete='email'
              />
            </div>
          </div>

          {/* Password */}
          <div className='flex flex-col gap-2'>
            <label htmlFor='login-password' className='text-sm font-semibold text-[var(--clay-text-muted)]'>
              Password
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clay-text-muted)]'>
                <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
                  <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                </svg>
              </span>
              <input
                id='login-password'
                type={showPassword ? 'text' : 'password'}
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='clay-input'
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                autoComplete='current-password'
              />
              <button
                type='button'
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-[var(--clay-text-muted)] hover:text-[var(--clay-primary)] transition-colors'
              >
                {showPassword ? (
                  <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94' />
                    <path d='M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19' />
                    <line x1='14.12' y1='14.12' x2='9.88' y2='9.88' />
                  </svg>
                ) : (
                  <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
                    <circle cx='12' cy='12' r='3' />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className='flex items-center justify-between text-sm'>
            <label className='flex cursor-pointer items-center gap-2 text-[var(--clay-text-muted)]'>
              <input type='checkbox' className='h-4 w-4 rounded' style={{ accentColor: 'var(--clay-primary)' }} />
              {' '}Remember me
            </label>
            <a href='/login' className='font-medium text-[var(--clay-primary)] hover:underline'>
              Forgot password?
            </a>
          </div>

          {/* Submit */}
          <button
            type='submit'
            disabled={loading}
            className='clay-btn-accent mt-1 w-full py-3 text-base disabled:opacity-60'
          >
            {loading ? (
              <span className='flex items-center justify-center gap-2'>
                <svg aria-hidden='true' className='h-4 w-4 animate-spin' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z' />
                </svg>
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>

        </form>

        {/* Divider */}
        <div className='my-6 flex items-center gap-3'>
          <div className='h-px flex-1' style={{ background: 'var(--clay-inner-dark)' }} />
          <span className='text-xs font-semibold uppercase tracking-wider text-[var(--clay-text-muted)]'>or</span>
          <div className='h-px flex-1' style={{ background: 'var(--clay-inner-dark)' }} />
        </div>

        {/* Register link */}
        <p className='text-center text-sm text-[var(--clay-text-muted)]'>
          Don't have an account?{' '}
          <button
            type='button'
            onClick={() => onNavigate('register')}
            className='font-semibold text-[var(--clay-primary)] hover:underline'
          >
            Create one
          </button>
        </p>

      </div>
    </div>
  );
}

export default LoginPage;
