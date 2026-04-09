import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, authError, clearError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'reset'
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState('');

  const error = localError || authError;

  const setField = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setLocalError('');
    clearError();
  };

  const handleGoogle = async () => {
    setLoading(true);
    try { await loginWithGoogle(); }
    catch {}
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (mode === 'reset') {
      if (!form.email) { setLocalError('Enter your email address.'); return; }
      setLoading(true);
      try {
        await resetPassword(form.email);
        setResetSent(true);
      } catch {}
      finally { setLoading(false); }
      return;
    }

    if (mode === 'register') {
      if (!form.name.trim())                    { setLocalError('Enter your name.'); return; }
      if (form.password !== form.confirm)       { setLocalError('Passwords do not match.'); return; }
      if (form.password.length < 6)             { setLocalError('Password must be at least 6 characters.'); return; }
    }

    setLoading(true);
    try {
      if (mode === 'login')    await loginWithEmail(form.email, form.password);
      if (mode === 'register') await registerWithEmail(form.email, form.password, form.name);
    } catch {}
    finally { setLoading(false); }
  };

  const switchMode = (m) => {
    setMode(m);
    setLocalError('');
    clearError();
    setResetSent(false);
    setForm({ name: '', email: '', password: '', confirm: '' });
  };

  const FEATURES = [
    { icon: '📊', bg: 'rgba(99,102,241,0.15)', text: 'Real-time expense analytics & insights' },
    { icon: '🧠', bg: 'rgba(16,185,129,0.15)',  text: 'AI-powered spending pattern detection' },
    { icon: '🎯', bg: 'rgba(245,158,11,0.15)',  text: 'Custom budget tracking with alerts' },
    { icon: '🔒', bg: 'rgba(239,68,68,0.15)',   text: 'Secure — your data stays private' },
  ];

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-bg-orb auth-bg-orb-3" />

      {/* Left — branding */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon">💸</div>
          <div>
            <div className="auth-brand-name">FinTrack AI</div>
            <div className="auth-brand-tagline">Smart Money Manager</div>
          </div>
        </div>

        <h1 className="auth-headline">
          Take control of<br/>
          your <span>finances</span>
        </h1>
        <p className="auth-subheadline">
          Track every rupee, set smart budgets, and get AI-powered insights
          that help you build lasting financial habits.
        </p>

        <div className="auth-features">
          {FEATURES.map((f, i) => (
            <div key={i} className="auth-feature">
              <div className="auth-feature-icon" style={{ background: f.bg }}>
                {f.icon}
              </div>
              <span className="auth-feature-text">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form card */}
      <div className="auth-right">
        <div className="auth-card animate-in">

          {/* Titles */}
          {mode === 'login'    && <><div className="auth-card-title">Welcome back 👋</div><div className="auth-card-sub">Sign in to your account</div></>}
          {mode === 'register' && <><div className="auth-card-title">Create account ✨</div><div className="auth-card-sub">Start your financial journey</div></>}
          {mode === 'reset'    && <><div className="auth-card-title">Reset password 🔑</div><div className="auth-card-sub">We'll send you a reset link</div></>}

          {/* Error */}
          {error && (
            <div className="auth-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Reset success */}
          {resetSent && (
            <div className="auth-success">
              ✅ Reset link sent! Check your inbox at <strong>{form.email}</strong> and follow the instructions.
            </div>
          )}

          {/* Google button — only on login/register */}
          {mode !== 'reset' && !resetSent && (
            <>
              <button className="btn-google" onClick={handleGoogle} disabled={loading}>
                <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <div className="auth-divider">
                <div className="auth-divider-line"/><span className="auth-divider-text">or</span><div className="auth-divider-line"/>
              </div>
            </>
          )}

          {/* Form */}
          {!resetSent && (
            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-icon-wrap">
                    <span className="input-icon">👤</span>
                    <input className="input" type="text" placeholder="John Doe" value={form.name}
                      onChange={e => setField('name', e.target.value)} required />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-icon-wrap">
                  <span className="input-icon">✉️</span>
                  <input className="input" type="email" placeholder="you@email.com" value={form.email}
                    onChange={e => setField('email', e.target.value)} required />
                </div>
              </div>

              {mode !== 'reset' && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-icon-wrap">
                    <span className="input-icon">🔒</span>
                    <input className="input" type="password" placeholder="••••••••" value={form.password}
                      onChange={e => setField('password', e.target.value)} required minLength={6} />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="auth-forgot" onClick={() => switchMode('reset')}>
                  Forgot password?
                </div>
              )}

              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <div className="input-icon-wrap">
                    <span className="input-icon">🔒</span>
                    <input className="input" type="password" placeholder="••••••••" value={form.confirm}
                      onChange={e => setField('confirm', e.target.value)} required />
                  </div>
                </div>
              )}

              <button type="submit" className="btn-auth" disabled={loading}>
                {loading ? (
                  <><div className="spinner"/>{mode === 'reset' ? 'Sending...' : 'Please wait...'}</>
                ) : (
                  mode === 'login'    ? '→  Sign In' :
                  mode === 'register' ? '✨  Create Account' :
                                       '📧  Send Reset Link'
                )}
              </button>
            </form>
          )}

          {/* Mode toggles */}
          <div className="auth-toggle">
            {mode === 'login' && (
              <>Don't have an account?{' '}
                <span className="auth-toggle-link" onClick={() => switchMode('register')}>Sign up free</span>
              </>
            )}
            {mode === 'register' && (
              <>Already have an account?{' '}
                <span className="auth-toggle-link" onClick={() => switchMode('login')}>Sign in</span>
              </>
            )}
            {mode === 'reset' && (
              <>Remember it?{' '}
                <span className="auth-toggle-link" onClick={() => switchMode('login')}>Back to sign in</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
