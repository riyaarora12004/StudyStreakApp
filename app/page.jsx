'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PageSkeleton } from '@/components/Skeletons';

// ── Floating 3-D card that tilts on mouse-move ─────────────────────────────
function TiltCard({ children, className = '' }) {
  const ref = useRef(null);
  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * 18}deg) rotateX(${-y * 18}deg) scale3d(1.04,1.04,1.04)`;
  };
  const handleLeave = () => {
    if (ref.current)
      ref.current.style.transform =
        'perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
  };
  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{ transition: 'transform 0.15s ease', transformStyle: 'preserve-3d' }}
    >
      {children}
    </div>
  );
}

// ── Animated counter ────────────────────────────────────────────────────────
function Counter({ end, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = Math.ceil(end / 60);
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(start);
        }, 20);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Stars — deterministic so server & client match ──────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  width:  ((i * 7  + 13) % 20) / 10 + 1,
  height: ((i * 11 +  7) % 20) / 10 + 1,
  top:    ((i * 37 + 17) % 1000) / 10,
  left:   ((i * 53 + 29) % 1000) / 10,
  d:      ((i * 19 +  3) % 30)  / 10 + 2,
  delay:  ((i * 23 + 11) % 30)  / 10,
}));

function Stars() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div className="stars" aria-hidden>
      {STARS.map(({ id, width, height, top, left, d, delay }) => (
        <div
          key={id}
          className="star"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            top: `${top}%`,
            left: `${left}%`,
            '--d': `${d}s`,
            '--delay': `${delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Feature card data ────────────────────────────────────────────────────────
const features = [
  {
    icon: '🔥',
    title: 'Streak System',
    desc: 'Never break the chain. Daily streaks track your consistency and keep you motivated every single day.',
    gradient: 'from-orange-500/20 to-red-500/20',
    border: 'border-orange-500/30',
    glow: '0 0 30px rgba(249,115,22,0.3)',
  },
  {
    icon: '🤖',
    title: 'AI Study Planner',
    desc: 'Upload your subjects and let AI craft a personalized day-by-day study plan with smart hour allocation.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    border: 'border-violet-500/30',
    glow: '0 0 30px rgba(139,92,246,0.3)',
  },
  {
    icon: '⏱️',
    title: 'Focus Timer',
    desc: 'Pomodoro, countdown, or free flow — three timer modes to match any study style perfectly.',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    border: 'border-cyan-500/30',
    glow: '0 0 30px rgba(6,182,212,0.3)',
  },
  {
    icon: '🏆',
    title: 'Rewards & Badges',
    desc: 'Earn XP, unlock badges, level up from Beginner to Legend. Make studying feel like a game.',
    gradient: 'from-yellow-500/20 to-amber-500/20',
    border: 'border-yellow-500/30',
    glow: '0 0 30px rgba(234,179,8,0.3)',
  },
  {
    icon: '📊',
    title: 'Deep Analytics',
    desc: 'Visual charts show your weekly progress, subject distribution, and best study hours.',
    gradient: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/30',
    glow: '0 0 30px rgba(34,197,94,0.3)',
  },
  {
    icon: '🧠',
    title: 'AI Doubt Solver',
    desc: 'Stuck on a concept? Ask AI instantly. Your personal tutor available 24/7, no judgment.',
    gradient: 'from-pink-500/20 to-rose-500/20',
    border: 'border-pink-500/30',
    glow: '0 0 30px rgba(236,72,153,0.3)',
  },
];

const steps = [
  { num: '01', title: 'Create Account', desc: 'Sign up in seconds, no credit card needed.' },
  { num: '02', title: 'Upload Subjects', desc: 'Add your subjects, chapters, and exam dates.' },
  { num: '03', title: 'Get AI Plan', desc: 'AI builds your smart daily study schedule.' },
  { num: '04', title: 'Study & Streak', desc: 'Use the timer, earn rewards, stay consistent.' },
];

// ── Main Page ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #020408; color: #e2e8f0; overflow-x: hidden; }
        h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }

        /* Starfield */
        .stars { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
        .star { position: absolute; border-radius: 50%; background: white; animation: twinkle var(--d,3s) ease-in-out infinite var(--delay,0s); }
        @keyframes twinkle { 0%,100%{opacity:.1} 50%{opacity:.8} }

        /* Grid bg */
        .grid-bg {
          background-image: linear-gradient(rgba(139,92,246,0.07) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(139,92,246,0.07) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        /* Glow orbs */
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.35; animation: drift 8s ease-in-out infinite; }
        @keyframes drift { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }

        /* Gradient text */
        .grad-text {
          background: linear-gradient(135deg, #a78bfa, #38bdf8, #34d399);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .grad-text-fire {
          background: linear-gradient(135deg, #f97316, #fbbf24, #ef4444);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        /* Glassmorphism card */
        .glass {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* Navbar */
        .navbar {
          background: rgba(2,4,8,0.7);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(139,92,246,0.15);
        }

        /* CTA button */
        .btn-primary {
          background: linear-gradient(135deg, #7c3aed, #2563eb);
          border: 1px solid rgba(139,92,246,0.5);
          box-shadow: 0 0 30px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: all 0.3s ease;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .btn-primary:hover {
          box-shadow: 0 0 50px rgba(124,58,237,0.7), inset 0 1px 0 rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }
        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(139,92,246,0.4);
          transition: all 0.3s ease;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
        }
        .btn-secondary:hover {
          background: rgba(139,92,246,0.1);
          border-color: rgba(139,92,246,0.8);
          box-shadow: 0 0 20px rgba(139,92,246,0.2);
        }

        /* Streak flame animation */
        @keyframes flicker { 0%,100%{transform:scaleY(1) rotate(-2deg)} 25%{transform:scaleY(1.05) rotate(2deg)} 75%{transform:scaleY(0.97) rotate(-1deg)} }
        .flame { display:inline-block; animation: flicker 0.4s ease-in-out infinite; transform-origin: bottom; }

        /* Float in */
        @keyframes floatIn { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        .float-in { animation: floatIn 0.7s ease forwards; }
        .delay-1 { animation-delay: 0.1s; opacity:0; }
        .delay-2 { animation-delay: 0.25s; opacity:0; }
        .delay-3 { animation-delay: 0.4s; opacity:0; }
        .delay-4 { animation-delay: 0.55s; opacity:0; }

        /* 3D hero device mockup */
        .mockup-wrap {
          perspective: 1200px;
          animation: floatDevice 5s ease-in-out infinite;
        }
        @keyframes floatDevice { 0%,100%{transform:rotateX(4deg) rotateY(-8deg) translateY(0)} 50%{transform:rotateX(2deg) rotateY(-4deg) translateY(-15px)} }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #020408; }
        ::-webkit-scrollbar-thumb { background: #7c3aed; border-radius: 3px; }
      `}</style>

      {/* ─── Starfield ─────────────────────────────────── */}
      <Stars />

      {/* ─── Navbar ────────────────────────────────────── */}
      <nav className="navbar fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flame text-2xl">🔥</span>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.5px' }} className="grad-text">
            StudyStreak
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          {['Features', 'How it Works', 'Pricing'].map((item) => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g,'-')}`}
              className="hover:text-white transition-colors cursor-pointer">{item}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
      <button className="btn-secondary px-5 py-2 rounded-xl text-sm text-slate-200">
      Login
      </button>
    </Link>

    <Link href="/signup">
      <button className="btn-primary px-5 py-2 rounded-xl text-sm text-white">
      Get Started →
      </button>
    </Link>
        </div>
      </nav>

      {/* ─── Hero ──────────────────────────────────────── */}
      <section className="grid-bg relative min-h-screen flex items-center justify-center pt-20 overflow-hidden px-6">
        {/* Glow orbs */}
        <div className="orb w-96 h-96 bg-violet-600 top-20 -left-20" style={{ animationDelay: '0s' }} />
        <div className="orb w-80 h-80 bg-blue-600 bottom-20 right-0" style={{ animationDelay: '3s' }} />
        <div className="orb w-64 h-64 bg-cyan-500 top-1/2 left-1/2" style={{ animationDelay: '1.5s', transform: 'translate(-50%,-50%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div>
            <div className="float-in delay-1 inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs text-violet-300 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Powered by AI · Free to start
            </div>

            <h1 className="float-in delay-2" style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px' }}>
              Study Smarter.<br />
              <span className="grad-text-fire">Streak Harder.</span><br />
              <span className="grad-text">Win Every Exam.</span>
            </h1>

            <p className="float-in delay-3 mt-6 text-slate-400 text-lg leading-relaxed max-w-lg">
              AI builds your personalized study plan, tracks your daily streaks, rewards consistency,
              and keeps you focused with a built-in timer. Your academic transformation starts today.
            </p>

            <div className="float-in delay-4 flex flex-wrap gap-4 mt-10">
              <Link href="/signup">
                <button className="btn-primary px-8 py-4 rounded-2xl text-base text-white">
                  🚀 Start For Free
                </button>
              </Link>
              <button className="btn-secondary px-8 py-4 rounded-2xl text-base text-slate-200 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">▶</span>
                Watch Demo
              </button>
            </div>

            {/* Social proof */}
            <div className="float-in delay-4 flex items-center gap-6 mt-10">
              <div className="flex -space-x-3">
                {['🧑‍🎓','👩‍💻','🧑‍🔬','👩‍🏫','🧑‍💼'].map((e,i) => (
                  <div key={i} className="w-9 h-9 rounded-full glass flex items-center justify-center text-base border border-violet-500/30">{e}</div>
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">12,400+ students</div>
                <div className="text-xs text-slate-500">already crushing their goals</div>
              </div>
            </div>
          </div>

          {/* Right — 3D Mockup */}
          <div className="mockup-wrap hidden md:block" style={{ transformStyle: 'preserve-3d' }}>
            <div className="glass rounded-3xl overflow-hidden border border-violet-500/20 shadow-2xl"
              style={{ boxShadow: '0 40px 80px rgba(124,58,237,0.3), 0 0 0 1px rgba(139,92,246,0.2)' }}>
              {/* Mockup header */}
              <div className="px-5 py-3 flex items-center gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  {['#ff5f57','#febc2e','#28c840'].map(c => (
                    <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex-1 text-center text-xs text-slate-600 font-mono">studystreak.app/dashboard</div>
              </div>
              {/* Mockup content */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500">Good morning, Rahul 👋</div>
                    <div className="text-lg font-bold text-white" style={{ fontFamily: 'Syne' }}>Today's Study Plan</div>
                  </div>
                  <div className="glass rounded-2xl px-4 py-2 text-center border border-orange-500/30"
                    style={{ boxShadow: '0 0 20px rgba(249,115,22,0.2)' }}>
                    <div className="text-2xl font-black grad-text-fire" style={{ fontFamily: 'Syne' }}>🔥 14</div>
                    <div className="text-xs text-slate-500">day streak</div>
                  </div>
                </div>

                {/* Subject cards */}
                {[
                  { sub: 'Mathematics', topic: 'Differential Calculus', hrs: 2, color: '#7c3aed', pct: 65 },
                  { sub: 'Physics', topic: 'Wave Optics', hrs: 1.5, color: '#0ea5e9', pct: 40 },
                  { sub: 'Chemistry', topic: 'Organic Reactions', hrs: 1, color: '#10b981', pct: 80 },
                ].map(({ sub, topic, hrs, color, pct }) => (
                  <div key={sub} className="glass rounded-2xl p-4 border" style={{ borderColor: color + '30' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne' }}>{sub}</div>
                        <div className="text-xs text-slate-500">{topic}</div>
                      </div>
                      <div className="text-xs font-bold text-slate-300" style={{ color }}>{hrs}h</div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
                    </div>
                  </div>
                ))}

                {/* Timer preview */}
                <div className="glass rounded-2xl p-4 border border-cyan-500/20 flex items-center justify-between"
                  style={{ boxShadow: '0 0 20px rgba(6,182,212,0.1)' }}>
                  <div>
                    <div className="text-xs text-slate-500">Pomodoro Timer</div>
                    <div className="text-2xl font-black text-cyan-400" style={{ fontFamily: 'Syne', letterSpacing: '-1px' }}>24:47</div>
                  </div>
                  <button className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)', boxShadow: '0 0 20px rgba(14,165,233,0.4)' }}>
                    ⏸
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 text-xs animate-bounce">
          <span>Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-violet-500 to-transparent" />
        </div>
      </section>

      {/* ─── Stats ─────────────────────────────────────── */}
      <section className="relative z-10 py-16 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: 12400, suf: '+', label: 'Active Students' },
            { val: 98, suf: '%', label: 'Exam Pass Rate' },
            { val: 4200, suf: '+', label: 'Streaks Maintained' },
            { val: 500, suf: 'K+', label: 'Study Hours Logged' },
          ].map(({ val, suf, label }) => (
            <div key={label}>
              <div className="text-3xl md:text-4xl font-black grad-text" style={{ fontFamily: 'Syne' }}>
                <Counter end={val} suffix={suf} />
              </div>
              <div className="text-sm text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ──────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-xs text-violet-300 mb-4">
              ✨ Everything you need
            </div>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-1.5px' }}>
              Built for <span className="grad-text">Student Success</span>
            </h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto">
              Every feature is designed with one goal — making you study consistently and effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <TiltCard
                key={f.title}
                className={`glass rounded-3xl p-6 border ${f.border} bg-gradient-to-br ${f.gradient} cursor-pointer`}
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Syne' }}>{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ──────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-1.5px' }}>
              Up & Running in <span className="grad-text">4 Steps</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map(({ num, title, desc }, i) => (
              <div key={num} className="text-center group">
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl glass border border-violet-500/30 mb-4 mx-auto group-hover:border-violet-500/70 transition-all"
                  style={{ boxShadow: '0 0 0 0 rgba(139,92,246,0)' }}>
                  <span className="text-2xl font-black grad-text" style={{ fontFamily: 'Syne' }}>{num}</span>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute left-full top-1/2 w-full h-px bg-gradient-to-r from-violet-500/50 to-transparent" style={{ transform: 'translateY(-50%) translateX(8px)' }} />
                  )}
                </div>
                <h4 className="font-bold text-white mb-2" style={{ fontFamily: 'Syne' }}>{title}</h4>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <TiltCard className="glass rounded-3xl p-12 text-center border border-violet-500/20 overflow-hidden relative"
            style={{ boxShadow: '0 40px 80px rgba(124,58,237,0.2)' }}>
            <div className="orb w-64 h-64 bg-violet-700 -top-20 -left-20 opacity-40" />
            <div className="orb w-64 h-64 bg-blue-700 -bottom-20 -right-20 opacity-40" />
            <div className="relative z-10">
              <div className="text-5xl mb-4 flame">🔥</div>
              <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontFamily: 'Syne', fontWeight: 800, letterSpacing: '-1px' }}>
                Ready to <span className="grad-text">Start Your Streak?</span>
              </h2>
              <p className="text-slate-400 mt-4 mb-8 max-w-md mx-auto">
                Join thousands of students who transformed their study habits. Free forever, upgrade when you need more.
              </p>
              <Link href="/signup">
                <button className="btn-primary px-10 py-4 rounded-2xl text-base text-white">
                  🚀 Create Free Account
                </button>
              </Link>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ─── Footer ────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-white/5 py-10 px-6 text-center text-slate-600 text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="flame text-xl">🔥</span>
          <span style={{ fontFamily: 'Syne', fontWeight: 700, color: '#a78bfa' }}>StudyStreak</span>
        </div>
        <p>© 2025 StudyStreak. Built with ❤️ for students who refuse to give up.</p>
      </footer>
    </>
  );
}