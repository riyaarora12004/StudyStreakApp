'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // multi-step form
  const [form, setForm] = useState({ name: '', email: '', password: '', goal: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const goals = [
    { icon: '🎯', label: 'Crack Entrance Exam', value: 'entrance' },
    { icon: '📚', label: 'Better Grades', value: 'grades' },
    { icon: '🔥', label: 'Build Study Habit', value: 'habit' },
    { icon: '🏆', label: 'Top of My Class', value: 'top' },
  ];

  const handleChange = (e) => {
    setError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');
      router.push('/login?registered=true');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; background: #020408; color: #e2e8f0; margin: 0; overflow-x: hidden; }
        h1,h2,h3 { font-family: 'Syne', sans-serif; }
        .grad-text { background: linear-gradient(135deg, #a78bfa, #38bdf8, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.08); }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.3; }
        .input-field {
          width: 100%; padding: 14px 16px; border-radius: 14px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 15px;
          outline: none; transition: all 0.2s;
        }
        .input-field:focus { border-color: rgba(139,92,246,0.6); box-shadow: 0 0 0 3px rgba(139,92,246,0.15); }
        .input-field::placeholder { color: #475569; }
        .btn-primary { background: linear-gradient(135deg, #7c3aed, #2563eb); border: 1px solid rgba(139,92,246,0.5); box-shadow: 0 0 30px rgba(124,58,237,0.35); transition: all 0.3s; font-family: 'Syne'; font-weight: 700; cursor: pointer; }
        .btn-primary:hover { box-shadow: 0 0 50px rgba(124,58,237,0.6); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .goal-card { cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px; text-align: center; }
        .goal-card:hover { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.07); }
        .goal-card.selected { border-color: #7c3aed; background: rgba(124,58,237,0.15); box-shadow: 0 0 20px rgba(124,58,237,0.2); }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .slide-in { animation: slideIn 0.3s ease forwards; }
        .progress-bar { height: 3px; background: rgba(255,255,255,0.07); border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #7c3aed, #38bdf8); transition: width 0.4s ease; }
      `}</style>

      <div className="min-h-screen relative flex items-center justify-center p-6">
        {/* BG orbs */}
        <div className="orb w-80 h-80 bg-violet-700" style={{ top: '-5rem', left: '-5rem' }} />
        <div className="orb w-64 h-64 bg-blue-700" style={{ bottom: '-5rem', right: '-5rem' }} />

        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span style={{ fontSize: '2rem' }}>🔥</span>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.5px' }} className="grad-text">
                StudyStreak
              </span>
            </Link>
          </div>

          {/* Card */}
          <div className="glass rounded-3xl p-8" style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)' }}>
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                  {step === 1 ? 'Create Account' : step === 2 ? 'Set Password' : 'Your Goal'}
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">Step {step} of 3</p>
              </div>
              <div className="flex gap-1.5">
                {[1,2,3].map(s => (
                  <div key={s} className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: s <= step ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : 'rgba(255,255,255,0.05)',
                      color: s <= step ? 'white' : '#475569',
                      border: s === step ? '2px solid rgba(139,92,246,0.5)' : '2px solid transparent',
                    }}>
                    {s < step ? '✓' : s}
                  </div>
                ))}
              </div>
            </div>
            <div className="progress-bar mb-8">
              <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Step 1 — Name & Email */}
            {step === 1 && (
              <div className="slide-in space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange}
                    placeholder="Rahul Sharma" className="input-field" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Email Address</label>
                  <input name="email" value={form.email} onChange={handleChange}
                    type="email" placeholder="rahul@example.com" className="input-field" />
                </div>
                <button
                  onClick={() => {
                  if (!form.name || !form.email) {
                    return setError('Please fill all fields.');
                  }

                  if (!/\S+@\S+\.\S+/.test(form.email)) {
                    return setError('Invalid email address.');
                  }

                  setStep(2);
                      }}
                  className="btn-primary w-full py-4 rounded-2xl text-white text-base mt-2">
                  Continue →
                </button>
              </div>
            )}

            {/* Step 2 — Password */}
            {step === 2 && (
              <div className="slide-in space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-2 block">Create Password</label>
                  <div className="relative">
                    <input name="password" value={form.password} onChange={handleChange}
                      type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" className="input-field pr-12" />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {/* Password strength */}
                  {form.password && (
                    <div className="mt-2 flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all"
                          style={{
                            background: i <= Math.min(4, Math.floor(form.password.length / 2))
                              ? ['#ef4444','#f97316','#eab308','#22c55e'][Math.min(3, Math.floor(form.password.length / 2) - 1)]
                              : 'rgba(255,255,255,0.07)'
                          }} />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setStep(1)}
                    className="flex-1 py-4 rounded-2xl text-slate-400 text-base transition-colors hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (form.password.length < 8) return setError('Password must be at least 8 characters.');
                      setStep(3);
                    }}
                    className="btn-primary flex-1 py-4 rounded-2xl text-white text-base">
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Goal */}
            {step === 3 && (
              <div className="slide-in">
                <p className="text-slate-400 text-sm mb-4">What's your main goal? (helps AI personalize your plan)</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {goals.map(({ icon, label, value }) => (
                    <div key={value}
                      className={`goal-card ${form.goal === value ? 'selected' : ''}`}
                      onClick={() => setForm(p => ({ ...p, goal: value }))}>
                      <div className="text-2xl mb-1">{icon}</div>
                      <div className="text-xs text-slate-300 font-medium">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)}
                    className="flex-1 py-4 rounded-2xl text-slate-400 text-base transition-colors hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    ← Back
                  </button>
                  <button onClick={handleSubmit} disabled={loading || !form.goal}
                    className="btn-primary flex-1 py-4 rounded-2xl text-white text-base">
                    {loading ? '⏳ Creating...' : '🚀 Start My Journey'}
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            {step === 1 && (
              <>
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-xs text-slate-600">or</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>
                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                    Login here
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}