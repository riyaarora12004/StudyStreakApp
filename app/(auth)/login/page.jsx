'use client';

import { useState, useEffect, Suspense } from 'react'; // ← ADD Suspense
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// ── Wrap useSearchParams in its own component inside Suspense ────────────────
function RegisteredBanner() {
  const params = useSearchParams();
  const [registered, setRegistered] = useState(false);
  useEffect(() => {
    if (params.get('registered') === 'true') setRegistered(true);
  }, [params]);

  if (!registered) return null;
  return (
    <div className="mb-4 px-4 py-3 rounded-xl text-sm text-emerald-400 flex items-center gap-2"
      style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
      ✅ Account created! Please login.
    </div>
  );
}

// ── Main login form ──────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Please fill all fields.');
    setLoading(true);
    setError('');
    const res = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (res?.error) return setError('Invalid email or password.');
    window.location.href = '/dashboard'; // ← hard redirect, most reliable
  };

  return (
    <div className="glass rounded-3xl p-8"
      style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.12)' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-1px' }} className="mb-1">
        Welcome Back 👋
      </h1>
      <p className="text-slate-500 text-sm mb-8">Log in to continue your streak!</p>

      {/* ✅ Suspense wraps only the part that uses useSearchParams */}
      <Suspense fallback={null}>
        <RegisteredBanner />
      </Suspense>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-slate-400 mb-2 block">Email Address</label>
          <input name="email" value={form.email} onChange={handleChange}
            type="email" placeholder="rahul@example.com" className="input-field" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-400">Password</label>
            <a href="#" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input name="password" value={form.password} onChange={handleChange}
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password" className="input-field pr-12" />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="btn-primary w-full py-4 rounded-2xl text-white text-base mt-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                  strokeDasharray="30" strokeDashoffset="10" />
              </svg>
              Logging in...
            </span>
          ) : '🔥 Continue My Streak'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <span className="text-xs text-slate-600">or</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
      </div>

      <p className="text-center text-sm text-slate-500">
        New to StudyStreak?{' '}
        <Link href="/signup"
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Create free account →
        </Link>
      </p>
    </div>
  );
}

// ── Page export ──────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #020408; color: #e2e8f0; margin: 0; }
        h1,h2 { font-family: 'Syne', sans-serif; }
        .grad-text { background: linear-gradient(135deg, #a78bfa, #38bdf8, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.25; animation: drift 8s ease-in-out infinite; }
        @keyframes drift { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        .input-field { width:100%; padding:14px 16px; border-radius:14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:#e2e8f0; font-family:'DM Sans',sans-serif; font-size:15px; outline:none; transition:all 0.2s; }
        .input-field:focus { border-color:rgba(139,92,246,0.6); box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }
        .input-field::placeholder { color:#475569; }
        .btn-primary { background:linear-gradient(135deg,#7c3aed,#2563eb); border:1px solid rgba(139,92,246,0.5); box-shadow:0 0 30px rgba(124,58,237,0.35); transition:all 0.3s; font-family:'Syne'; font-weight:700; cursor:pointer; }
        .btn-primary:hover:not(:disabled) { box-shadow:0 0 50px rgba(124,58,237,0.6); transform:translateY(-1px); }
        .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }
        @keyframes cardIn { from{opacity:0;transform:translateY(30px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .card-in { animation: cardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .grid-lines { position:fixed; inset:0; z-index:0; pointer-events:none; background-image: linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px); background-size:50px 50px; }
        @keyframes bubbleFloat { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-12px) rotate(3deg)} }
        .bubble { animation: bubbleFloat 4s ease-in-out infinite; }
      `}</style>

      <div className="grid-lines" aria-hidden />

      <div className="min-h-screen relative flex overflow-hidden">
        <div className="orb w-96 h-96 bg-violet-700" style={{ top: '-8rem', left: '-8rem' }} />
        <div className="orb w-80 h-80 bg-cyan-700" style={{ bottom: '-5rem', right: '-5rem', animationDelay: '4s' }} />
        <div className="orb w-64 h-64 bg-pink-700" style={{ top: '50%', left: '50%', animationDelay: '2s' }} />

        {/* Left decorative panel */}
        <div className="hidden lg:flex flex-col justify-between relative z-10 w-1/2 p-12">
          <Link href="/" className="flex items-center gap-2">
            <span style={{ fontSize: '2rem' }}>🔥</span>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.5px' }}
              className="grad-text">StudyStreak</span>
          </Link>
          <div>
            <div className="space-y-6">
              {[
                { emoji: '🔥', label: 'Current Streak', val: '47 days',     color: '#f97316', delay: '0s'   },
                { emoji: '⏱️', label: 'Today Studied',  val: '3.5 hours',   color: '#38bdf8', delay: '1s'   },
                { emoji: '🏆', label: 'Rank',            val: '#12 / 1000',  color: '#eab308', delay: '2s'   },
                { emoji: '📚', label: 'Subjects Done',   val: '2 / 3 today', color: '#34d399', delay: '0.5s' },
              ].map(({ emoji, label, val, color, delay }) => (
                <div key={label} className="bubble glass rounded-2xl px-5 py-4 flex items-center gap-4 w-64"
                  style={{ animationDelay: delay, border: `1px solid ${color}25`, boxShadow: `0 0 20px ${color}15` }}>
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="text-sm font-bold" style={{ color, fontFamily: 'Syne' }}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
            <blockquote className="mt-10 text-slate-400 text-sm italic max-w-sm leading-relaxed">
              "StudyStreak turned my scattered studying into a disciplined routine."
            </blockquote>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-9 h-9 rounded-full glass flex items-center justify-center">👩‍🎓</div>
              <div>
                <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne' }}>Priya Menon</div>
                <div className="text-xs text-slate-600">IIT JEE 2024 — AIR 847</div>
              </div>
            </div>
          </div>
          <div className="text-slate-700 text-sm">© 2025 StudyStreak</div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 relative z-10 flex items-center justify-center p-6 lg:p-12">
          <div className="card-in w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2">
                <span style={{ fontSize: '2rem' }}>🔥</span>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.4rem' }}
                  className="grad-text">StudyStreak</span>
              </Link>
            </div>
            {/* ✅ Wrap entire form in Suspense */}
            <Suspense fallback={
              <div className="glass rounded-3xl p-8 text-center text-slate-500">Loading...</div>
            }>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}