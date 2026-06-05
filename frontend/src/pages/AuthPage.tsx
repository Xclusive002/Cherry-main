import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useStore } from '../store';

export const AuthPage: React.FC = () => {
  const user = useStore((state) => state.user);
  const isLoading = useStore((state) => state.isLoading);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [subscriptionPrice, setSubscriptionPrice] = useState('9.99');
  const [signUpType, setSignUpType] = useState<'viewer' | 'creator'>('viewer');
  const [message, setMessage] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setUser = useStore((state) => state.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user?.is_authenticated) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      if (mode === 'login') {
        const result = await authAPI.login(username, password);
        setUser({
          id: result.user.id,
          username: result.user.username,
          is_creator: result.user.is_creator,
          is_authenticated: true,
          profile: result.user.profile,
        });
        navigate('/');
        } else {
        const priceValue = parseFloat(subscriptionPrice);
        const subscription_price = signUpType === 'creator' && !Number.isNaN(priceValue) ? priceValue : 0;
        if (signUpType === 'creator' && !agreeTerms) {
          throw new Error('You must agree to the Terms & Conditions to onboard as a creator.');
        }
        const result = await authAPI.register(
          username,
          password,
          email,
          signUpType === 'creator',
          bio,
          subscription_price,
          agreeTerms,
        );
        setUser({
          id: result.user.id,
          username: result.user.username,
          is_creator: result.user.is_creator,
          is_authenticated: true,
          profile: {
            subscription_price,
            allow_direct_messages: true,
            show_profile_public: true,
            hide_followers: false,
            allow_subscriptions: true,
            notification_newsletter: false,
            bio,
          },
        });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setMessage(
        error?.response?.data?.error ||
        error?.message ||
        'Unable to authenticate. Please check your network or try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl glass rounded-3xl border border-white/10 p-10"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{mode === 'login' ? 'Sign In' : 'Create Account'}</h1>
          <p className="text-text-secondary mt-2">
            {mode === 'login'
              ? 'Sign in to follow creators, purchase content, or join private rooms.'
              : 'Register as a user or creator to start selling content.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Password"
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSignUpType('viewer')}
                  className={`rounded-3xl border px-4 py-3 text-left transition ${
                    signUpType === 'viewer'
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-white/10 bg-secondary/70 text-text-secondary hover:border-primary/40'
                  } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                  disabled={isSubmitting}
                >
                  <p className="font-semibold">Viewer account</p>
                  <p className="text-sm text-text-secondary mt-1">Browse creators, follow favorites, and join conversations.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSignUpType('creator')}
                  className={`rounded-3xl border px-4 py-3 text-left transition ${
                    signUpType === 'creator'
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-white/10 bg-secondary/70 text-text-secondary hover:border-primary/40'
                  } ${isSubmitting ? 'cursor-not-allowed opacity-50' : ''}`}
                  disabled={isSubmitting}
                >
                  <p className="font-semibold">Creator onboarding</p>
                  <p className="text-sm text-text-secondary mt-1">Set your subscription price and start selling premium content.</p>
                </button>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary resize-none h-24 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSubmitting}
                  placeholder="Tell the community about yourself"
                />
              </div>

              {signUpType === 'creator' && (
                <div>
                  <label className="block text-sm text-text-secondary mb-2">Monthly subscription price</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={subscriptionPrice}
                    onChange={(e) => setSubscriptionPrice(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl border border-white/10 bg-secondary/70 px-4 py-3 text-white outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="9.99"
                  />
                  <div className="mt-3 flex items-start gap-2">
                    <input id="agreeTerms" type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                    <label htmlFor="agreeTerms" className="text-sm text-text-secondary">
                      I agree to the <a href="/terms" className="text-primary underline">Terms & Conditions</a>
                    </label>
                  </div>
                </div>
              )}
            </>
          )}

          {message && <p className="text-sm text-rose-400">{message}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                {mode === 'login' ? 'Signing in…' : 'Creating account…'}
              </span>
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="pt-6 text-center text-text-secondary">
          {mode === 'login' ? (
            <button onClick={() => setMode('register')} className="text-primary hover:text-primary/80 transition">
              Create a new account
            </button>
          ) : (
            <button onClick={() => setMode('login')} className="text-primary hover:text-primary/80 transition">
              Already have an account? Sign in
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
