'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { localDestination } from '@/lib/auth/local-destination';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const searchParams = useSearchParams();
  const next = localDestination(searchParams.get('next'));
  const callbackError = searchParams.get('error');
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('sending');
    setErrorMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      const message = error.message.toLowerCase().includes('rate limit')
        ? 'Too many sign-in emails were requested. Wait a few minutes before trying again.'
        : error.message;
      setErrorMessage(message);
      console.error('Supabase magic-link error:', error);
      setStatus('error');
      return;
    }

    setCooldown(60);
    setStatus('sent');
  }

  async function handleGoogleSignIn() {
    setStatus('sending');
    setErrorMessage('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      console.error('Supabase Google sign-in error:', error);
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-16">
      <p className="text-2xs uppercase tracking-widest2 text-accent">Welcome back</p>
      <h1 className="mt-2 font-serif text-3xl font-medium text-foreground">Sign in</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Enter your email and we&rsquo;ll send a link to sign in. No password to remember.
      </p>

      {(callbackError || reason === 'session') && (
        <p role="alert" className="mt-5 rounded-md border border-border bg-surface p-3 text-sm text-muted-foreground">
          {reason === 'session'
            ? 'Your session expired. Request a fresh sign-in link to continue.'
            : 'That sign-in link is invalid or has expired. Request a new one below.'}
        </p>
      )}

      {status === 'sent' ? (
        <div className="mt-8 space-y-3 rounded-md border border-accent/40 bg-accent/10 p-4 text-sm text-foreground">
          <p>Check your inbox. We sent a sign-in link to {email}.</p>
          <button
            type="button"
            disabled={cooldown > 0}
            onClick={() => setStatus('idle')}
            className="text-accent underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground"
          >
            {cooldown > 0 ? `Request another link in ${cooldown}s` : 'Request another link'}
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <button
            type="button"
            disabled={status === 'sending'}
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            <span aria-hidden="true" className="text-base font-semibold">G</span>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 text-2xs uppercase tracking-widest2 text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>Email link</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm text-foreground">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-accent"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending...' : 'Send sign-in link'}
            </button>
          </form>
          {status === 'error' && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {errorMessage || 'Something went wrong sending the link. Please try again.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
