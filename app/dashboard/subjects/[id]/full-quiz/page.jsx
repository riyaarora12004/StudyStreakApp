'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, duration = 1200 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to]);
  return <>{val}</>;
}

// ── Radial score display ──────────────────────────────────────────────────────
function ScoreRing({ score, size = 200 }) {
  const r   = (size - 16) / 2;
  const c   = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const color = score >= 80 ? '#34d399' : score >= 70 ? '#fbbf24' : '#f87171';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={c} strokeDashoffset={off}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease', filter: `drop-shadow(0 0 12px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-4xl font-black" style={{ fontFamily: 'Orbitron', color }}>
          <Counter to={score} />%
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {score >= 70 ? '✅ Passed' : '❌ Failed'}
        </div>
      </div>
    </div>
  );
}

// ── Topic score bar ───────────────────────────────────────────────────────────
function TopicBar({ topic, score, isWeak }) {
  const color = score >= 80 ? '#34d399' : score >= 70 ? '#fbbf24' : '#f87171';
  return (
    <div className="topic-bar">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">{isWeak ? '⚠️' : '✅'}</span>
          <span className="text-sm text-white font-medium truncate">{topic}</span>
        </div>
        <span className="text-sm font-bold flex-shrink-0 ml-2" style={{ color, fontFamily: 'Syne' }}>
          {score}%
        </span>
      </div>
      <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, background: `linear-gradient(90deg,${color}88,${color})`, boxShadow: `0 0 8px ${color}60` }} />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FullQuizPage() {
  const { id }  = useParams();
  const router  = useRouter();

  // Phases: loading | intro | quiz | submitting | results
  const [phase,      setPhase]      = useState('loading');
  const [subject,    setSubject]    = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState({});
  const [flagged,    setFlagged]    = useState(new Set());
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [results,    setResults]    = useState(null);
  const [error,      setError]      = useState('');
  const timerRef = useRef(null);
  const [showReview, setShowReview] = useState(false);

  // Load subject info
  useEffect(() => {
    fetch(`/api/subjects/${id}`)
      .then(r => r.json())
      .then(d => { setSubject(d.subject); setPhase('intro'); })
      .catch(() => setError('Failed to load subject.'));
  }, [id]);

  const fmtTime = s => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // Start quiz — fetch questions
  const handleStart = async () => {
    setPhase('loading');
    try {
      const res  = await fetch('/api/full-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); setPhase('intro'); return; }
      setQuestions(data.questions);
      setTimeLeft(data.questions.length * 90); // 1.5 min per question
      setPhase('quiz');
    } catch {
      setError('Failed to generate quiz. Try again.');
      setPhase('intro');
    }
  };

  // Timer tick
  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Submit quiz
  const handleSubmit = async () => {
    clearInterval(timerRef.current);
    setPhase('submitting');

    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
    const score = Math.round((correct / questions.length) * 100);

    try {
      const res  = await fetch('/api/full-quiz', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: id, score, answers, questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResults({ ...data, correct, total: questions.length });
      setPhase('results');
    } catch (e) {
      setError('Failed to save results. ' + e.message);
      setPhase('quiz');
    }
  };

  const answered  = Object.keys(answers).length;
  const q         = questions[current];
  const timerWarn = timeLeft < 120;

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#050810' }}>
      <div className="text-center">
        <div className="text-6xl mb-4" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🎓</div>
        <div className="text-slate-400">Generating your final exam...</div>
      </div>
    </div>
  );

  // ── SUBMITTING ────────────────────────────────────────────────────────────────
  if (phase === 'submitting') return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: '#050810' }}>
      <div className="text-center">
        <div className="text-6xl mb-4" style={{ animation: 'pulse 1s ease-in-out infinite', display: 'inline-block' }}>🧠</div>
        <div className="text-slate-400 text-sm">AI is analysing your answers...</div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Orbitron:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { background: #050810 !important; font-family: 'DM Sans',sans-serif; }

        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes resultIn{ from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes shimmer { from{transform:translateX(-100%)} to{transform:translateX(200%)} }
        @keyframes confetti{ 0%{transform:translateY(0) rotate(0)} 100%{transform:translateY(100vh) rotate(720deg)} }

        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .d1{animation-delay:0.05s;opacity:0} .d2{animation-delay:0.15s;opacity:0}
        .d3{animation-delay:0.25s;opacity:0} .d4{animation-delay:0.35s;opacity:0}

        .grad-text { background:linear-gradient(135deg,#fbbf24,#f97316); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glass { background:rgba(255,255,255,0.03); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.07); }

        /* Intro card */
        .intro-card { background:rgba(8,12,24,0.95); border:1px solid rgba(251,191,36,0.2); border-radius:28px; max-width:600px; width:100%; padding:40px; box-shadow:0 40px 80px rgba(0,0,0,0.6); }

        /* Quiz layout */
        .quiz-wrap   { min-height:100vh; background:#050810; display:flex; flex-direction:column; }
        .quiz-header { background:rgba(8,12,24,0.9); backdrop-filter:blur(20px); border-bottom:1px solid rgba(255,255,255,0.05); padding:14px 24px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:30; }
        .quiz-body   { flex:1; max-width:800px; margin:0 auto; width:100%; padding:32px 24px; }

        /* Options */
        .opt { width:100%; text-align:left; padding:16px 18px; border-radius:16px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#cbd5e1; font-size:14px; cursor:pointer; transition:all 0.15s; margin-bottom:10px; display:flex; align-items:center; gap:12px; }
        .opt:hover:not(:disabled) { border-color:rgba(251,191,36,0.4); background:rgba(251,191,36,0.06); color:white; }
        .opt.selected { border-color:#f59e0b; background:rgba(245,158,11,0.12); color:white; }
        .opt-key { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; background:rgba(255,255,255,0.06); color:#64748b; font-family:'Syne',sans-serif; }
        .opt.selected .opt-key { background:rgba(245,158,11,0.3); color:#fbbf24; }

        /* Question nav dots */
        .q-dot { width:28px; height:28px; border-radius:8px; border:none; cursor:pointer; font-size:11px; font-weight:700; transition:all 0.15s; font-family:'Syne',sans-serif; }
        .q-dot:hover { transform:scale(1.1); }

        /* Topic bars */
        .topic-bar { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:14px; padding:12px 14px; margin-bottom:8px; transition:all 0.2s; }
        .topic-bar:hover { background:rgba(255,255,255,0.04); }

        /* Analysis cards */
        .analysis-card { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:20px; }

        /* Timer warning */
        @keyframes timerBlink { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .timer-warn { animation: timerBlink 1s ease-in-out infinite; }

        /* Difficulty badge */
        .diff-easy   { color:#34d399; background:rgba(52,211,153,0.1);  border:1px solid rgba(52,211,153,0.25);  }
        .diff-medium { color:#fbbf24; background:rgba(251,191,36,0.1);  border:1px solid rgba(251,191,36,0.25);  }
        .diff-hard   { color:#f87171; background:rgba(248,113,113,0.1); border:1px solid rgba(248,113,113,0.25); }

        /* Confetti pieces */
        .confetti-piece { position:fixed; width:10px; height:10px; top:-10px; animation:confetti 3s ease-in forwards; }
      `}</style>

      {/* ── INTRO PHASE ── */}
      {phase === 'intro' && (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background:'#050810' }}>
          {/* Confetti for completed */}
          {subject?.fullQuizDone && Array.from({length:20}).map((_,i)=>(
            <div key={i} className="confetti-piece" style={{
              left:`${Math.random()*100}vw`,
              background:['#fbbf24','#a78bfa','#34d399','#f87171','#38bdf8'][i%5],
              borderRadius:Math.random()>0.5?'50%':'2px',
              animationDelay:`${Math.random()*2}s`,
              animationDuration:`${2+Math.random()*2}s`,
            }}/>
          ))}

          <div className="intro-card fade-up">
            {/* Back */}
            <Link href={`/dashboard/subjects/${id}`}
              className="text-xs text-slate-500 hover:text-amber-400 flex items-center gap-1 mb-6 transition-colors">
              ← Back to {subject?.name}
            </Link>

            {/* Subject info */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background:`${subject?.color}18`, border:`1px solid ${subject?.color}30` }}>
                {subject?.emoji}
              </div>
              <div>
                <div className="text-xs text-amber-500 uppercase tracking-widest mb-1">🎓 Final Exam</div>
                <h1 className="text-2xl font-black text-white" style={{ fontFamily:'Syne' }}>
                  {subject?.name}
                </h1>
                <div className="text-sm text-slate-500 mt-0.5">
                  Full Syllabus Quiz · {subject?.topics?.filter(t=>t.status==='completed').length} topics covered
                </div>
              </div>
            </div>

            {/* Previous attempt */}
            {subject?.fullQuizDone && (
              <div className="mb-6 p-4 rounded-2xl"
                style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.2)' }}>
                <div className="text-xs text-amber-400 font-bold mb-1">Previous Attempt</div>
                <div className="text-2xl font-black" style={{ fontFamily:'Syne', color:subject.fullQuizScore>=70?'#34d399':'#f87171' }}>
                  {subject.fullQuizScore}%
                </div>
                {subject.fullQuizWeakAreas?.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    Weak areas: {subject.fullQuizWeakAreas.slice(0,3).join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Info cards */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon:'❓', val:'20', label:'Questions' },
                { icon:'⏱️', val:'30m', label:'Time Limit' },
                { icon:'🎯', val:'70%', label:'Pass Mark' },
              ].map(({icon,val,label})=>(
                <div key={label} className="text-center p-4 rounded-2xl"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-lg font-black text-white" style={{ fontFamily:'Syne' }}>{val}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>

            {/* Rules */}
            <div className="mb-8 space-y-2">
              {[
                '🤖 Questions are AI-generated from your completed topics and personal notes',
                '🚩 Flag questions to review before submitting',
                '⏱️ Timer auto-submits when time runs out',
                '📊 AI analyses your weak areas after submission',
                '🔄 You can retake the quiz to improve your score',
              ].map(r=>(
                <div key={r} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="flex-shrink-0 text-base">{r.slice(0,2)}</span>
                  <span>{r.slice(3)}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-4 rounded-xl text-sm text-red-400"
                style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
                ⚠️ {error}
              </div>
            )}

            <button onClick={handleStart}
              className="w-full py-4 rounded-2xl text-white font-bold text-base transition-all hover:scale-105"
              style={{ background:'linear-gradient(135deg,#d97706,#f59e0b)', boxShadow:'0 0 40px rgba(245,158,11,0.4)', fontFamily:'Syne' }}>
              🎓 {subject?.fullQuizDone ? 'Retake Final Quiz' : 'Start Final Quiz'} →
            </button>
          </div>
        </div>
      )}

      {/* ── QUIZ PHASE ── */}
      {phase === 'quiz' && q && (
        <div className="quiz-wrap">
          {/* Header */}
          <div className="quiz-header">
            <div className="flex items-center gap-3">
              <div className="text-xl">{subject?.emoji}</div>
              <div>
                <div className="text-xs text-slate-500">{subject?.name} · Final Quiz</div>
                <div className="text-sm font-bold text-white" style={{ fontFamily:'Syne' }}>
                  Q{current+1}/{questions.length}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="hidden sm:flex items-center gap-3 flex-1 mx-6">
              <div className="flex-1 h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width:`${(answered/questions.length)*100}%`, background:'linear-gradient(90deg,#d97706,#f59e0b)' }} />
              </div>
              <span className="text-xs text-slate-500">{answered}/{questions.length} answered</span>
            </div>

            {/* Timer */}
            <div className={`font-mono text-lg font-black flex items-center gap-2 ${timerWarn?'timer-warn':''}`}
              style={{ fontFamily:'Orbitron', color:timerWarn?'#f87171':'#94a3b8' }}>
              ⏱ {fmtTime(timeLeft)}
            </div>
          </div>

          <div className="quiz-body">
            <div className="grid lg:grid-cols-4 gap-6">

              {/* Question area */}
              <div className="lg:col-span-3">
                {/* Difficulty + topic badge */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold diff-${q.difficulty||'medium'}`}>
                    {q.difficulty === 'easy' ? '🟢' : q.difficulty === 'hard' ? '🔴' : '🟡'} {q.difficulty || 'medium'}
                  </span>
                  {q.topic && (
                    <span className="text-xs px-3 py-1 rounded-full text-slate-400"
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      📚 {q.topic}
                    </span>
                  )}
                  {flagged.has(current) && (
                    <span className="text-xs px-3 py-1 rounded-full text-amber-400"
                      style={{ background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.25)' }}>
                      🚩 Flagged
                    </span>
                  )}
                </div>

                {/* Question text */}
                <div className="text-lg text-white font-semibold mb-6 leading-relaxed"
                  style={{ fontFamily:'Syne' }}>
                  {current+1}. {q.question}
                </div>

                {/* Options */}
                {q.options.map((opt, oi) => (
                  <button key={oi} onClick={() => setAnswers(p=>({...p,[current]:oi}))}
                    className={`opt ${answers[current] === oi ? 'selected' : ''}`}>
                    <span className="opt-key">{['A','B','C','D'][oi]}</span>
                    {opt}
                  </button>
                ))}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
                  <div className="flex gap-2">
                    <button onClick={() => setCurrent(p=>Math.max(0,p-1))} disabled={current===0}
                      className="px-4 py-2.5 rounded-xl text-sm text-slate-400 disabled:opacity-30 transition-all"
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                      ← Prev
                    </button>
                    <button
                      onClick={() => { setFlagged(p => { const n=new Set(p); n.has(current)?n.delete(current):n.add(current); return n; }); }}
                      className="px-4 py-2.5 rounded-xl text-sm transition-all"
                      style={{ background:flagged.has(current)?'rgba(251,191,36,0.1)':'rgba(255,255,255,0.04)', border:`1px solid ${flagged.has(current)?'rgba(251,191,36,0.3)':'rgba(255,255,255,0.08)'}`, color:flagged.has(current)?'#fbbf24':'#64748b' }}>
                      🚩 {flagged.has(current)?'Unflag':'Flag'}
                    </button>
                  </div>

                  {current < questions.length-1 ? (
                    <button onClick={() => setCurrent(p=>p+1)}
                      className="px-6 py-2.5 rounded-xl text-sm text-white font-semibold transition-all"
                      style={{ background:'rgba(245,158,11,0.2)', border:'1px solid rgba(245,158,11,0.4)' }}>
                      Next →
                    </button>
                  ) : (
                    <button onClick={handleSubmit}
                      className="px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:scale-105"
                      style={{ background:'linear-gradient(135deg,#059669,#0891b2)', fontFamily:'Syne' }}>
                      Submit Quiz ✓
                    </button>
                  )}
                </div>
              </div>

              {/* Right panel: question grid + submit */}
              <div className="space-y-4">
                <div className="glass rounded-2xl p-4">
                  <div className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Question Map</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {questions.map((_,i) => (
                      <button key={i} onClick={() => setCurrent(i)}
                        className="q-dot"
                        style={{
                          background: i===current
                            ? '#f59e0b'
                            : flagged.has(i)
                              ? 'rgba(251,191,36,0.3)'
                              : answers[i] !== undefined
                                ? 'rgba(52,211,153,0.3)'
                                : 'rgba(255,255,255,0.05)',
                          color: i===current ? '#000' : answers[i]!==undefined ? '#34d399' : '#475569',
                          boxShadow: i===current ? '0 0 12px rgba(245,158,11,0.5)' : 'none',
                        }}>
                        {i+1}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{background:'rgba(52,211,153,0.3)'}}/> Answered ({answered})</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{background:'rgba(251,191,36,0.3)'}}/> Flagged ({flagged.size})</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded" style={{background:'rgba(255,255,255,0.05)'}}/> Unanswered ({questions.length-answered})</div>
                  </div>
                </div>

                {/* Early submit */}
                {answered === questions.length && (
                  <button onClick={handleSubmit}
                    className="w-full py-3.5 rounded-2xl text-white text-sm font-bold transition-all hover:scale-105"
                    style={{ background:'linear-gradient(135deg,#059669,#0891b2)', fontFamily:'Syne', boxShadow:'0 0 24px rgba(5,150,105,0.4)' }}>
                    ✅ Submit All Answers
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULTS PHASE ── */}
      {phase === 'results' && results && (
        <div className="min-h-screen p-6" style={{ background:'#050810' }}>
          <div className="max-w-3xl mx-auto">

            {/* Confetti for pass */}
            {results.score >= 70 && Array.from({length:30}).map((_,i)=>(
              <div key={i} className="confetti-piece" style={{
                left:`${Math.random()*100}vw`,
                background:['#fbbf24','#a78bfa','#34d399','#38bdf8','#f97316'][i%5],
                borderRadius:Math.random()>0.5?'50%':'2px',
                animationDelay:`${Math.random()*1.5}s`,
                animationDuration:`${2+Math.random()*2}s`,
                width:`${8+Math.random()*8}px`, height:`${8+Math.random()*8}px`,
              }}/>
            ))}

            {/* Score hero */}
            <div className="fade-up d1 text-center mb-8">
              <div className="text-5xl mb-3">{results.score >= 90?'🏆':results.score>=70?'🎉':'💪'}</div>
              <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily:'Syne' }}>
                {results.score >= 90 ? 'Outstanding!' : results.score >= 70 ? 'Quiz Passed!' : 'Keep Pushing!'}
              </h1>
              <div className="flex justify-center mb-4">
                <ScoreRing score={results.score} />
              </div>
              <div className="text-slate-400 text-sm">
                {results.correct}/{results.total} correct · {subject?.name} Final Quiz
              </div>
            </div>

            {/* AI Overall Feedback */}
            {results.analysis?.overallFeedback && (
              <div className="fade-up d2 mb-6 p-5 rounded-2xl"
                style={{ background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)' }}>
                <div className="text-xs text-violet-400 font-bold mb-2 uppercase tracking-wider">🤖 AI Analysis</div>
                <p className="text-sm text-slate-300 leading-relaxed">{results.analysis.overallFeedback}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Topic scores */}
              <div className="fade-up d3 analysis-card">
                <div className="text-sm font-bold text-white mb-4" style={{ fontFamily:'Syne' }}>
                  📊 Performance by Topic
                </div>
                <div className="max-h-64 overflow-y-auto pr-1">
                  {[...results.weakAreas, ...results.strongAreas].map((t,i) => (
                    <TopicBar key={i}
                      topic={t.topic}
                      score={t.score}
                      isWeak={results.weakAreas.some(w=>w.topic===t.topic)} />
                  ))}
                </div>
              </div>

              {/* AI advice for weak areas */}
              <div className="fade-up d3 analysis-card">
                <div className="text-sm font-bold text-white mb-4" style={{ fontFamily:'Syne' }}>
                  🎯 Focus Areas
                </div>
                {results.weakAreas.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">🌟</div>
                    <div className="text-sm text-emerald-400 font-semibold">No weak areas!</div>
                    <div className="text-xs text-slate-500 mt-1">You aced every topic.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.analysis?.weakAreaAdvice?.map((a,i) => (
                      <div key={i} className="p-3 rounded-xl"
                        style={{ background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.15)' }}>
                        <div className="text-xs font-bold text-red-400 mb-1">{a.topic}</div>
                        <div className="text-xs text-slate-400">{a.advice}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Study Plan */}
            {results.analysis?.studyPlan && (
              <div className="fade-up d4 mb-6 p-5 rounded-2xl"
                style={{ background:'rgba(56,189,248,0.05)', border:'1px solid rgba(56,189,248,0.2)' }}>
                <div className="text-xs text-cyan-400 font-bold mb-2 uppercase tracking-wider">📅 Recommended Study Plan</div>
                <p className="text-sm text-slate-300 leading-relaxed">{results.analysis.studyPlan}</p>
              </div>
            )}

            {/* Motivational note */}
            {results.analysis?.motivationalNote && (
              <div className="fade-up mb-6 p-4 rounded-2xl text-center"
                style={{ background:'linear-gradient(135deg,rgba(251,191,36,0.06),rgba(249,115,22,0.06))', border:'1px solid rgba(251,191,36,0.2)' }}>
                <div className="text-sm font-semibold text-yellow-400" style={{ fontFamily:'Syne' }}>
                  ✨ {results.analysis.motivationalNote}
                </div>
              </div>
            )}

            {/* Review answers toggle */}
            <div className="fade-up mb-6">
              <button onClick={() => setShowReview(p=>!p)}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-white transition-all"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)' }}>
                {showReview ? '▲ Hide Answer Review' : '▼ Review All Answers'}
              </button>

              {showReview && (
                <div className="mt-4 space-y-3">
                  {questions.map((q,i) => {
                    const isCorrect = answers[i] === q.correct;
                    return (
                      <div key={i} className="p-4 rounded-2xl"
                        style={{ background:isCorrect?'rgba(52,211,153,0.04)':'rgba(248,113,113,0.04)', border:`1px solid ${isCorrect?'rgba(52,211,153,0.15)':'rgba(248,113,113,0.15)'}` }}>
                        <div className="flex items-start gap-2 mb-2">
                          <span className="flex-shrink-0">{isCorrect?'✅':'❌'}</span>
                          <div className="text-sm text-white font-medium">{q.question}</div>
                        </div>
                        {!isCorrect && (
                          <div className="text-xs text-slate-500 mb-1 ml-6">
                            Your answer: <span className="text-red-400">{q.options[answers[i]] || 'Skipped'}</span>
                          </div>
                        )}
                        <div className="text-xs ml-6 mb-1" style={{ color:'#34d399' }}>
                          ✓ {q.options[q.correct]}
                        </div>
                        <div className="text-xs text-slate-600 ml-6 italic">{q.explanation}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="fade-up flex gap-3 flex-wrap">
              <Link href={`/dashboard/subjects/${id}`} className="flex-1">
                <button className="w-full py-3.5 rounded-2xl text-white text-sm font-bold"
                  style={{ background:'linear-gradient(135deg,#7c3aed,#2563eb)', fontFamily:'Syne' }}>
                  ← Back to Subject
                </button>
              </Link>
              <button onClick={handleStart}
                className="flex-1 py-3.5 rounded-2xl text-white text-sm font-semibold transition-all"
                style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', color:'#fbbf24', fontFamily:'Syne' }}>
                🔄 Retake Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}