import React, { useState } from 'react'
import { useRegister } from '../hooks/useRegister'

type RegisterPageProps = {
  onNavigate: (page: 'login') => void;
};

function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const { loading, error: apiError, register } = useRegister();

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const error = fieldError || apiError;

  const setError = (msg: string) => setFieldError(msg);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldError('');

    if (!fullName.trim()) { setError('Full name is required.'); return; }
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Password is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    const success = await register({ fullName, email, password });
    // Registration only creates the account — send the user to sign in.
    if (success) onNavigate('login');
  };

  const passwordStrength = (() => {
    if (!password) return { level: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = [
      { level: 1, label: 'Weak', color: 'var(--clay-danger)' },
      { level: 2, label: 'Fair', color: '#f59e0b' },
      { level: 3, label: 'Good', color: 'var(--clay-primary)' },
      { level: 4, label: 'Strong', color: 'var(--clay-success)' },
      { level: 5, label: 'Very Strong', color: 'var(--clay-success)' },
    ];
    return levels[Math.min(score, 4)] ?? levels[0];
  })();

  return (
    <div className='min-h-screen bg-[var(--clay-bg)] text-[var(--clay-text)] flex flex-col items-center justify-center px-4 py-10 transition-colors'>

      {/* Top bar */}
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
              <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
              <circle cx='9' cy='7' r='4' />
              <line x1='19' y1='8' x2='19' y2='14' />
              <line x1='22' y1='11' x2='16' y2='11' />
            </svg>
          </div>
          <h1 className='text-2xl font-bold'>Create account</h1>
          <p className='mt-1 text-sm text-[var(--clay-text-muted)]'>Start uploading in seconds</p>
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

          {/* Full Name */}
          <div className='flex flex-col gap-2'>
            <label htmlFor='reg-name' className='text-sm font-semibold text-[var(--clay-text-muted)]'>
              Full Name
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clay-text-muted)]'>
                <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                  <circle cx='12' cy='7' r='4' />
                </svg>
              </span>
              <input
                id='reg-name'
                type='text'
                placeholder='Akash Jadhav'
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className='clay-input'
                style={{ paddingLeft: '2.75rem' }}
                autoComplete='name'
              />
            </div>
          </div>

          {/* Email */}
          <div className='flex flex-col gap-2'>
            <label htmlFor='reg-email' className='text-sm font-semibold text-[var(--clay-text-muted)]'>
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
                id='reg-email'
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
            <label htmlFor='reg-password' className='text-sm font-semibold text-[var(--clay-text-muted)]'>
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
                id='reg-password'
                type={showPassword ? 'text' : 'password'}
                placeholder='Minimum 6 characters'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='clay-input'
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                autoComplete='new-password'
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

            {/* Strength bar */}
            {password && (
              <div className='mt-1 flex flex-col gap-1'>
                <div className='flex gap-1.5'>
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className='h-1.5 flex-1 rounded-full transition-all duration-300'
                      style={{
                        background: seg <= passwordStrength.level ? passwordStrength.color : 'var(--clay-inner-dark)',
                      }}
                    />
                  ))}
                </div>
                <p className='text-xs font-medium' style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className='flex flex-col gap-2'>
            <label htmlFor='reg-confirm' className='text-sm font-semibold text-[var(--clay-text-muted)]'>
              Confirm Password
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-[var(--clay-text-muted)]'>
                <svg xmlns='http://www.w3.org/2000/svg' aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                  <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
                  <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                </svg>
              </span>
              <input
                id='reg-confirm'
                type={showConfirm ? 'text' : 'password'}
                placeholder='Re-enter your password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className='clay-input'
                style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                autoComplete='new-password'
              />
              <button
                type='button'
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-[var(--clay-text-muted)] hover:text-[var(--clay-primary)] transition-colors'
              >
                {showConfirm ? (
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

            {/* Match indicator */}
            {confirmPassword && (
              <p className={`text-xs font-medium ${password === confirmPassword ? 'text-[var(--clay-success)]' : 'text-[var(--clay-danger)]'}`}>
                {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
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
                Creating account…
              </span>
            ) : 'Create Account'}
          </button>

        </form>

        {/* Divider */}
        <div className='my-6 flex items-center gap-3'>
          <div className='h-px flex-1' style={{ background: 'var(--clay-inner-dark)' }} />
          <span className='text-xs font-semibold uppercase tracking-wider text-[var(--clay-text-muted)]'>or</span>
          <div className='h-px flex-1' style={{ background: 'var(--clay-inner-dark)' }} />
        </div>

        {/* Login link */}
        <p className='text-center text-sm text-[var(--clay-text-muted)]'>
          Already have an account?{' '}
          <button
            type='button'
            onClick={() => onNavigate('login')}
            className='font-semibold text-[var(--clay-primary)] hover:underline'
          >
            Sign in
          </button>
        </p>

      </div>
    </div>
  );
}

export default RegisterPage;
