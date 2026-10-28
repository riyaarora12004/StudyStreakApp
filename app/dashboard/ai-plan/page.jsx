'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// ── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(text, speed = 18, enabled = false) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!enabled || !text) return;
    setDisplayed('');
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, enabled]);
  return displayed;
}

// ── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({ task, index, onToggle }) {
  const [done, setDone] = useState(task.completed || false);
  const priorityConfig = {
    high:   { label: 'High',   color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
    medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)'  },
    low:    { label: 'Low',    color: '#34d399', bg: 'rgba(52,211,153,0.1)'   },
  };
  const p = priorityConfig[task.priority] || priorityConfig.medium;

  const handleToggle = () => {
    setDone(v => !v);
    onToggle?.();
  };

  return (
    <div
      className="task-card"
      style={{
        '--accent': task.color,
        animationDelay: `${index * 0.08}s`,
        opacity: done ? 0.5 : 1,
        transition: 'opacity 0.3s',
      }}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          className="mt-1 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all"
          style={{
            background: done ? task.color : 'transparent',
            border: `2px solid ${done ? task.color : 'rgba(255,255,255,0.15)'}`,
            boxShadow: done ? `0 0 10px ${task.color}60` : 'none',
          }}
        >
          {done && <span style={{ fontSize: '10px', color: 'white' }}>✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-lg">{task.emoji}</span>
            <span className="font-bold text-white text-sm" style={{ fontFamily: 'Syne', textDecoration: done ? 'line-through' : 'none' }}>
              {task.subjectName}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: p.bg, color: p.color, border: `1px solid ${p.color}30` }}>
              {p.label}
            </span>
          </div>
          <p className="text-sm text-slate-300 mb-2 leading-relaxed">{task.topic}</p>
          {task.tip && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl text-xs text-slate-400"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="flex-shrink-0">💡</span>
              <span>{task.tip}</span>
            </div>
          )}
        </div>

        {/* Hours badge */}
        <div className="flex-shrink-0 text-center">
          <div className="text-xl font-black" style={{ fontFamily: 'Syne', color: task.color }}>{task.hours}h</div>
          <div className="text-xs text-slate-600">study</div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="mt-3 h-px" style={{ background: `linear-gradient(90deg, ${task.color}40, transparent)` }} />
    </div>
  );
}

// ── Day Column ───────────────────────────────────────────────────────────────
function DayColumn({ day, dayIndex }) {
  const [tasks, setTasks] = useState(day.tasks || []);
  const completed = tasks.filter(t => t.completed).length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const motivationText = useTypewriter(day.motivation, 25, true);

  const handleToggle = (i) => {
    setTasks(p => p.map((t, idx) => idx === i ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="day-col" style={{ animationDelay: `${dayIndex * 0.15}s` }}>
      {/* Day header */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">
              {dayIndex === 0 ? '📅 Today' : '📆 Tomorrow'}
            </div>
            <h3 className="text-lg font-black text-white" style={{ fontFamily: 'Syne', letterSpacing: '-0.5px' }}>
              {day.label}
            </h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black" style={{ fontFamily: 'Syne', color: dayIndex === 0 ? '#a78bfa' : '#38bdf8' }}>
              {day.totalHours}h
            </div>
            <div className="text-xs text-slate-600">total</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>{completed}/{tasks.length} tasks done</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: dayIndex === 0
                  ? 'linear-gradient(90deg,#7c3aed,#a78bfa)'
                  : 'linear-gradient(90deg,#0891b2,#38bdf8)',
                boxShadow: dayIndex === 0 ? '0 0 8px #7c3aed80' : '0 0 8px #38bdf880',
              }} />
          </div>
        </div>

        {/* Motivation */}
        {day.motivation && (
          <div className="text-xs italic text-slate-500 mt-2 min-h-[1.2em]">
            "{motivationText}"
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg,rgba(139,92,246,0.3),transparent)' }} />

      {/* Tasks */}
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <TaskCard key={i} task={task} index={i} onToggle={() => handleToggle(i)} />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AIPlanPage() {
  const [plan,          setPlan]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [generating,    setGenerating]    = useState(false);
  const [error,         setError]         = useState('');
  const [availHours,    setAvailHours]    = useState(4);
  const [showSettings,  setShowSettings]  = useState(false);
  const aiMsg = useTypewriter(plan?.aiMessage, 12, !!plan);

  // ── Fetch existing plan ──────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/ai-plan')
      .then(r => r.json())
      .then(d => { setPlan(d.plan); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // ── Generate new plan ────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/ai-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableHours: availHours }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPlan(data.plan);
      setShowSettings(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const planAge = plan?.generatedAt
    ? Math.round((Date.now() - new Date(plan.generatedAt)) / 60000)
    : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=JetBrains+Mono:wght@400;600&family=DM+Sans:wght@300;400;500&display=swap');

        .grad-text { background:linear-gradient(135deg,#a78bfa,#38bdf8,#34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .grad-text-ai { background:linear-gradient(135deg,#34d399,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glass { background:rgba(255,255,255,0.03); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.07); }

        /* Neural network dots background */
        .neural-bg {
          background-image: radial-gradient(circle, rgba(52,211,153,0.08) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        /* AI message card */
        .ai-msg-card {
          background: linear-gradient(135deg, rgba(52,211,153,0.06), rgba(56,189,248,0.06));
          border: 1px solid rgba(52,211,153,0.2);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
        }
        .ai-msg-card::before {
          content:'';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(52,211,153,0.03), transparent);
          pointer-events: none;
        }

        /* Day columns */
        .day-col {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 24px;
          animation: fadeUp 0.5s ease forwards;
          opacity: 0;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

        /* Task cards */
        .task-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 14px;
          animation: fadeUp 0.4s ease forwards;
          opacity: 0;
          transition: all 0.2s;
        }
        .task-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(var(--accent-rgb,124,58,237),0.25);
          transform: translateX(4px);
        }

        /* Generate button */
        .btn-generate {
          background: linear-gradient(135deg, #059669, #0891b2);
          border: 1px solid rgba(52,211,153,0.4);
          box-shadow: 0 0 30px rgba(5,150,105,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          transition: all 0.3s;
          cursor: pointer;
        }
        .btn-generate:hover:not(:disabled) {
          box-shadow: 0 0 50px rgba(5,150,105,0.5);
          transform: translateY(-2px);
        }
        .btn-generate:disabled { opacity:0.6; cursor:not-allowed; }

        /* Hours slider */
        .hours-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg, #059669, #0891b2);
          outline: none;
        }
        .hours-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(52,211,153,0.5);
        }

        /* AI scanning animation */
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        .scan-line { position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,#34d399,transparent); animation:scan 2s linear infinite; }

        /* Pulse orb */
        @keyframes orbPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:1} }
        .orb-pulse { animation: orbPulse 2s ease-in-out infinite; }

        /* Typing cursor */
        .cursor::after { content:'|'; animation:blink 1s step-end infinite; color:#34d399; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

        /* Settings panel */
        @keyframes slideDown { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        .slide-down { animation: slideDown 0.25s ease; }

        .mono { font-family: 'JetBrains Mono', monospace; }

        .d1{animation-delay:0.05s} .d2{animation-delay:0.15s} .d3{animation-delay:0.25s}
      `}</style>

      {/* ─── Page Header ─── */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center orb-pulse"
              style={{ background: 'linear-gradient(135deg,#059669,#0891b2)', boxShadow: '0 0 20px rgba(52,211,153,0.4)' }}>
              🤖
            </div>
            <span className="text-xs mono text-emerald-500 tracking-widest">AI ENGINE v2.0</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, letterSpacing: '-1px' }}>
            Your <span className="grad-text-ai">AI Study Plan</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Personalized day-by-day schedule built from your subjects & deadlines
          </p>
        </div>

        <div className="flex items-center gap-3">
          {plan && (
            <span className="text-xs mono text-slate-600">
              Generated {planAge !== null ? (planAge < 60 ? `${planAge}m ago` : `${Math.round(planAge/60)}h ago`) : ''}
            </span>
          )}
          <button onClick={() => setShowSettings(p => !p)}
            className="px-4 py-2 rounded-xl text-sm text-slate-300 transition-all glass hover:border-emerald-500/30"
            style={{ fontFamily: 'Syne', fontWeight: 600 }}>
            ⚙️ Settings
          </button>
          <button onClick={handleGenerate} disabled={generating}
            className="btn-generate px-6 py-2.5 rounded-2xl text-white text-sm flex items-center gap-2">
            {generating ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/>
                </svg>
                AI Thinking...
              </>
            ) : (
              <>{plan ? '🔄 Regenerate' : '✨ Generate Plan'}</>
            )}
          </button>
        </div>
      </div>

      {/* ─── Settings panel ─── */}
      {showSettings && (
        <div className="slide-down glass rounded-2xl p-5 mb-6"
          style={{ border: '1px solid rgba(52,211,153,0.2)' }}>
          <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: 'Syne' }}>
            ⚙️ Plan Settings
          </h3>
          <div className="max-w-sm">
            <label className="text-xs text-slate-400 mb-3 block">
              Daily Available Hours: <span className="text-emerald-400 font-bold mono">{availHours}h</span>
            </label>
            <input type="range" min="1" max="12" step="0.5" value={availHours}
              onChange={e => setAvailHours(Number(e.target.value))}
              className="hours-slider mb-2" />
            <div className="flex justify-between text-xs text-slate-600">
              <span>1h (light)</span><span>6h (moderate)</span><span>12h (intense)</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-3">
            💡 AI will distribute your subjects across the available hours based on urgency and priority.
          </p>
        </div>
      )}

      {/* ─── Error ─── */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-2xl text-sm text-red-400 flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span>⚠️</span>
          <div>
            <div className="font-semibold">{error}</div>
            {error.includes('subject') && (
              <Link href="/dashboard/subjects" className="text-xs text-violet-400 hover:underline mt-0.5 block">
                → Go add subjects first
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ─── Loading state ─── */}
      {loading && (
        <div className="neural-bg rounded-3xl p-12 text-center"
          style={{ border: '1px solid rgba(52,211,153,0.1)' }}>
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full orb-pulse"
              style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(56,189,248,0.2))' }} />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
          </div>
          <p className="text-slate-500 text-sm mono">Loading your plan...</p>
        </div>
      )}

      {/* ─── Generating animation ─── */}
      {generating && (
        <div className="neural-bg rounded-3xl p-12 text-center relative overflow-hidden mb-6"
          style={{ border: '1px solid rgba(52,211,153,0.2)' }}>
          <div className="scan-line" />
          <div className="relative z-10">
            <div className="text-4xl mb-4 orb-pulse">🧠</div>
            <div className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Syne' }}>
              AI is analyzing your subjects...
            </div>
            <div className="mono text-xs text-emerald-500 space-y-1">
              {['Fetching subject data...', 'Calculating exam urgency...', 'Optimizing study schedule...', 'Building personalized plan...'].map((msg, i) => (
                <div key={i} className="flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }} />
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Empty state ─── */}
      {!loading && !generating && !plan && !error && (
        <div className="neural-bg rounded-3xl p-14 text-center"
          style={{ border: '1px solid rgba(52,211,153,0.1)' }}>
          <div className="text-6xl mb-5">🤖</div>
          <h2 className="text-2xl font-black text-white mb-3" style={{ fontFamily: 'Syne', letterSpacing: '-0.5px' }}>
            No Plan Yet
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto text-sm leading-relaxed">
            Click <strong className="text-white">"Generate Plan"</strong> and AI will analyze all your
            subjects, exam dates, and priorities — then build you a smart 2-day study schedule.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleGenerate} disabled={generating}
              className="btn-generate px-10 py-4 rounded-2xl text-white">
              ✨ Generate My AI Plan
            </button>
            <Link href="/dashboard/subjects">
              <button className="px-8 py-4 rounded-2xl text-slate-300 text-sm glass hover:border-violet-500/30 transition-all"
                style={{ fontFamily: 'Syne', fontWeight: 600 }}>
                📚 Manage Subjects First
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* ─── AI Plan Content ─── */}
      {!loading && !generating && plan && (
        <div className="fadeUp">

          {/* AI Message */}
          {plan.aiMessage && (
            <div className="ai-msg-card p-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 orb-pulse"
                  style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(56,189,248,0.2))', border: '1px solid rgba(52,211,153,0.3)' }}>
                  🤖
                </div>
                <div className="flex-1">
                  <div className="text-xs mono text-emerald-500 mb-1 tracking-widest">AI COACH MESSAGE</div>
                  <p className="text-sm text-slate-300 leading-relaxed cursor">
                    {aiMsg}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              {
                icon: '📋',
                val: plan.days?.reduce((a, d) => a + d.tasks.length, 0),
                label: 'Total Tasks',
                color: '#a78bfa',
              },
              {
                icon: '⏱️',
                val: `${plan.days?.reduce((a, d) => a + d.totalHours, 0)}h`,
                label: 'Hours Planned',
                color: '#38bdf8',
              },
              {
                icon: '📚',
                val: [...new Set(plan.days?.flatMap(d => d.tasks.map(t => t.subjectName)))].length,
                label: 'Subjects',
                color: '#34d399',
              },
            ].map(({ icon, val, label, color }) => (
              <div key={label} className="glass rounded-2xl p-4 text-center"
                style={{ border: `1px solid ${color}20` }}>
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-xl font-black" style={{ fontFamily: 'Syne', color }}>{val}</div>
                <div className="text-xs text-slate-600">{label}</div>
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="grid md:grid-cols-2 gap-6">
            {plan.days?.map((day, i) => (
              <DayColumn key={i} day={day} dayIndex={i} />
            ))}
          </div>

          {/* Regenerate footer */}
          <div className="mt-8 text-center">
            <p className="text-slate-600 text-xs mb-3 mono">
              Plan generated {new Date(plan.generatedAt).toLocaleString()}
            </p>
            <button onClick={handleGenerate} disabled={generating}
              className="btn-generate px-8 py-3 rounded-2xl text-white text-sm">
              🔄 Regenerate Plan
            </button>
          </div>
        </div>
      )}
    </>
  );
}