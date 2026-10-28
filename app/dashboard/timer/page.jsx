'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const MODES = [
  { id: 'pomodoro',  label: 'Pomodoro',  icon: '🍅', desc: '25 min focus + 5 min break' },
  { id: 'countdown', label: 'Countdown', icon: '⏳', desc: 'Set your own target time'   },
  { id: 'stopwatch', label: 'Stopwatch', icon: '⏱️', desc: 'Free flow, count up'        },
];

const POMODORO_WORK  = 25 * 60;
const POMODORO_BREAK =  5 * 60;

function formatTime(s) {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return h + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
  return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

function RingProgress({ pct, color, size, stroke }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off  = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 8px ' + color + ')' }} />
    </svg>
  );
}

function DoneModal({ data, onClose }) {
  return (
    <div style={{ position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(8px)' }}>
      <div style={{ background:'rgba(8,12,24,0.97)',border:'1px solid rgba(139,92,246,0.3)',borderRadius:28,maxWidth:360,width:'100%',padding:36,textAlign:'center',boxShadow:'0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize:52,marginBottom:12 }}>🎉</div>
        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:26,color:'white',marginBottom:6 }}>Session Saved!</div>
        <div style={{ color:'#94a3b8',fontSize:13,marginBottom:20 }}>
          <strong style={{ color:'white' }}>{data.subject}</strong>
          {data.topic && <span> · <strong style={{ color:'#a78bfa' }}>{data.topic}</strong></span>}
          {' · '}<strong style={{ color:'white' }}>{data.minutes} min</strong>
        </div>
        <div style={{ background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:16,padding:14,marginBottom:10 }}>
          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:28,color:'#fbbf24' }}>+{data.xpEarned} XP ⚡</div>
          <div style={{ fontSize:12,color:'#64748b',marginTop:4 }}>earned this session</div>
        </div>
        {data.streak > 0 && (
          <div style={{ background:'rgba(249,115,22,0.08)',border:'1px solid rgba(249,115,22,0.2)',borderRadius:14,padding:10,marginBottom:10 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'#f97316' }}>🔥 {data.streak} Day Streak!</div>
          </div>
        )}
        {data.topicProgress && (
          <div style={{ background:data.topicProgress.quizUnlocked?'rgba(52,211,153,0.08)':'rgba(139,92,246,0.06)',border:'1px solid ' + (data.topicProgress.quizUnlocked?'rgba(52,211,153,0.3)':'rgba(139,92,246,0.2)'),borderRadius:14,padding:10,marginBottom:16 }}>
            <div style={{ fontSize:12,fontWeight:600,color:data.topicProgress.quizUnlocked?'#34d399':'#a78bfa' }}>
              {data.topicProgress.quizUnlocked
                ? '✅ Quiz unlocked for ' + data.topic + '!'
                : '📖 ' + data.topic + ': ' + data.topicProgress.logged + '/' + data.topicProgress.required + ' min studied'}
            </div>
          </div>
        )}
        <button onClick={onClose}
          style={{ width:'100%',padding:'14px 0',borderRadius:18,border:'none',background:'linear-gradient(135deg,#7c3aed,#2563eb)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 0 24px rgba(124,58,237,0.4)' }}>
          Continue Studying 💪
        </button>
      </div>
    </div>
  );
}

export default function TimerPage() {
  const [mode,           setMode]           = useState('pomodoro');
  const [isRunning,      setIsRunning]      = useState(false);
  const [isPaused,       setIsPaused]       = useState(false);
  const [isBreak,        setIsBreak]        = useState(false);
  const [timeLeft,       setTimeLeft]       = useState(POMODORO_WORK);
  const [elapsed,        setElapsed]        = useState(0);
  const [cdHours,        setCdHours]        = useState(0);
  const [cdMins,         setCdMins]         = useState(25);
  const [subjects,       setSubjects]       = useState([]);
  const [selSubject,     setSelSubject]     = useState(null);
  const [selTopic,       setSelTopic]       = useState(null);
  const [sessions,       setSessions]       = useState([]);
  const [totalToday,     setTotalToday]     = useState(0);
  const [modal,          setModal]          = useState(null);
  const [saving,         setSaving]         = useState(false);
  const [pomodoroCount,  setPomodoroCount]  = useState(0);

  const intervalRef = useRef(null);
  const elapsedRef  = useRef(0);

  const cdTotalSecs = cdHours * 3600 + cdMins * 60;

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/subjects').then(r => r.json()).then(d => setSubjects(d.subjects || []));
    fetch('/api/sessions').then(r => r.json()).then(d => {
      const list = d.sessions || [];
      setSessions(list);
      const today = new Date().toDateString();
      const mins  = list
        .filter(s => new Date(s.createdAt).toDateString() === today)
        .reduce((a, s) => a + Math.round((s.durationSeconds || 0) / 60), 0);
      setTotalToday(mins);
    });
  }, []);

  // ── Sync countdown display when user edits time ─────────────────────────────
  useEffect(() => {
    if (!isRunning && mode === 'countdown') setTimeLeft(cdTotalSecs || 60);
  }, [cdHours, cdMins, isRunning, mode, cdTotalSecs]);

  // ── Reset on mode change ────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) return;
    elapsedRef.current = 0;
    setElapsed(0);
    setIsBreak(false);
    if (mode === 'pomodoro')  setTimeLeft(POMODORO_WORK);
    if (mode === 'countdown') setTimeLeft(cdTotalSecs || 60);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Timer end handler ───────────────────────────────────────────────────────
  const handleTimerEnd = useCallback(() => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    playBeep();
    if (mode === 'pomodoro' && !isBreak) {
      saveSession(elapsedRef.current, true);
      setPomodoroCount(p => p + 1);
      setIsBreak(true);
      setTimeLeft(POMODORO_BREAK);
      elapsedRef.current = 0;
      setTimeout(() => setIsRunning(true), 1500);
    } else if (mode === 'pomodoro' && isBreak) {
      setIsBreak(false);
      setTimeLeft(POMODORO_WORK);
    } else {
      saveSession(elapsedRef.current, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isBreak]);

  // ── Tick ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || isPaused) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      if (mode === 'stopwatch') {
        setElapsed(e => e + 1);
      } else {
        setTimeLeft(t => {
          if (t <= 1) { handleTimerEnd(); return 0; }
          return t - 1;
        });
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, mode, handleTimerEnd]);

  // ── Beep ────────────────────────────────────────────────────────────────────
  const playBeep = () => {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(); osc.stop(ctx.currentTime + 0.8);
    } catch (_) {}
  };

  // ── Save session ────────────────────────────────────────────────────────────
  const saveSession = async (secs, completed) => {
    const mins = Math.floor(secs / 60);
    if (mins < 1) return;
    setSaving(true);
    try {
      const sub = selSubject || {};
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId:       sub._id     || null,
          subjectName:     sub.name    || 'General Study',
          subjectEmoji:    sub.emoji   || '📚',
          subjectColor:    sub.color   || '#7c3aed',
          mode,
          durationSeconds: secs,
          targetSeconds:   mode === 'countdown' ? cdTotalSecs : 0,
          pomodoroCount,
        }),
      });
      const data = await res.json();

      // Log topic study time
      let topicProgress = null;
      if (sub._id && selTopic) {
        await fetch('/api/subjects/' + sub._id + '/topics', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logStudyTime', topicId: selTopic._id, minutes: mins }),
        });
        const newLogged = (selTopic.studyMinutesLogged || 0) + mins;
        const required  = selTopic.studyMinutesRequired || 20;
        topicProgress   = { logged: newLogged, required, quizUnlocked: newLogged >= required };
        setSelTopic(prev => prev ? { ...prev, studyMinutesLogged: newLogged } : null);
        setSubjects(prev => prev.map(s =>
          s._id === sub._id
            ? { ...s, topics: (s.topics || []).map(t => t._id === selTopic._id ? { ...t, studyMinutesLogged: newLogged } : t) }
            : s
        ));
      }

      if (res.ok) {
        setModal({ xpEarned: data.xpEarned || 0, streak: data.newStreak || 0, subject: sub.name || 'General Study', minutes: mins, topic: selTopic?.name || null, topicProgress });
        setTotalToday(t => t + mins);
        fetch('/api/sessions').then(r => r.json()).then(d => setSessions(d.sessions || []));
      }
    } catch (e) { console.error('[SAVE]', e); }
    setSaving(false);
  };

  // ── Controls ────────────────────────────────────────────────────────────────
  const startTimer = () => {
    elapsedRef.current = 0;
    setElapsed(0);
    if (mode === 'pomodoro')  setTimeLeft(POMODORO_WORK);
    if (mode === 'countdown') setTimeLeft(cdTotalSecs || 60);
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => setIsPaused(p => !p);

  const stopTimer = () => {
    if (isRunning && elapsedRef.current >= 60) saveSession(elapsedRef.current, false);
    clearInterval(intervalRef.current);
    setIsRunning(false); setIsPaused(false); setIsBreak(false);
    elapsedRef.current = 0; setElapsed(0);
    if (mode === 'pomodoro')  setTimeLeft(POMODORO_WORK);
    if (mode === 'countdown') setTimeLeft(cdTotalSecs || 60);
  };

  const resetTimer = () => {
    elapsedRef.current = 0; setElapsed(0); setIsBreak(false); setPomodoroCount(0);
    if (mode === 'pomodoro')  setTimeLeft(POMODORO_WORK);
    if (mode === 'countdown') setTimeLeft(cdTotalSecs || 60);
  };

  const handleSelectSubject = s => { setSelSubject(s); setSelTopic(null); };

  // ── Ring % ──────────────────────────────────────────────────────────────────
  const ringPct = (() => {
    if (mode === 'stopwatch') return Math.min(100, (elapsed / 3600) * 100);
    if (mode === 'pomodoro') {
      const total = isBreak ? POMODORO_BREAK : POMODORO_WORK;
      return ((total - timeLeft) / total) * 100;
    }
    const total = cdTotalSecs || 60;
    return Math.min(100, ((total - timeLeft) / total) * 100);
  })();

  const accent = isBreak ? '#34d399' : (selSubject?.color || '#7c3aed');
  const displayTime = mode === 'stopwatch' ? formatTime(elapsed) : formatTime(timeLeft);

  // ── Inline styles helpers ───────────────────────────────────────────────────
  const card = { background:'rgba(255,255,255,0.03)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:24,padding:24 };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:wght@700&family=DM+Sans:wght@400;500&display=swap');
        .grad{background:linear-gradient(135deg,#a78bfa,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        @keyframes fu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .4s ease forwards}
        .d1{animation-delay:.03s;opacity:0}.d2{animation-delay:.1s;opacity:0}.d3{animation-delay:.18s;opacity:0}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.55}}
        .blink{animation:blink 1.8s ease-in-out infinite}
        .mtab{padding:9px 16px;border-radius:12px;cursor:pointer;font-weight:600;font-size:13px;border:1px solid transparent;font-family:'Syne',sans-serif;background:transparent;color:#475569;transition:all .2s}
        .mtab:hover:not(:disabled){color:#94a3b8}
        .mtab.on{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.15);color:white}
        .chip{padding:7px 13px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:500;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:#64748b;display:inline-flex;align-items:center;gap:5px;transition:all .2s}
        .chip:hover{background:rgba(255,255,255,0.07);color:#94a3b8}
        .chip.on{color:white}
        .numinput{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:10px 0;color:white;font-family:'JetBrains Mono',monospace;font-size:22px;font-weight:700;text-align:center;outline:none;width:70px;transition:border-color .2s}
        .numinput:focus{border-color:rgba(139,92,246,0.5)}
        .btnmain{width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;cursor:pointer;border:none;transition:all .3s}
        .btnmain:hover{transform:scale(1.1)}
        .btnmain:active{transform:scale(0.93)}
        .btnsm{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#64748b;transition:all .2s}
        .btnsm:hover{background:rgba(255,255,255,0.09);color:white;transform:scale(1.06)}
        .srow{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.05);transition:background .2s}
        .srow:hover{background:rgba(255,255,255,0.04)}
      `}</style>

      {modal && <DoneModal data={modal} onClose={() => setModal(null)} />}

      {/* ─── Header ─── */}
      <div className="fu d1" style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28,flexWrap:'wrap',gap:14 }}>
        <div>
          <h1 style={{ fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:800,letterSpacing:'-1px',margin:0 }}>
            Study <span className="grad">Timer</span>
          </h1>
          <p style={{ color:'#64748b',fontSize:13,marginTop:4 }}>Focus. Track. Earn XP. Build your streak.</p>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          {[
            { val: Math.floor(totalToday/60) + 'h ' + (totalToday%60) + 'm', label:'studied today', border:'rgba(139,92,246,.2)' },
            { val: sessions.length + ' 🎯', label:'sessions', border:'rgba(249,115,22,.2)' },
          ].map(({ val, label, border }) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid '+border,borderRadius:16,padding:'10px 18px',textAlign:'center' }}>
              <div className="grad" style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:18 }}>{val}</div>
              <div style={{ fontSize:11,color:'#475569' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20,alignItems:'start' }}>

        {/* ─── Left: Timer ─── */}
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

          {/* Mode tabs */}
          <div className="fu d1" style={{ background:'rgba(255,255,255,0.03)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:4,display:'inline-flex',gap:4,width:'fit-content' }}>
            {MODES.map(m => (
              <button key={m.id} onClick={() => { if (!isRunning) setMode(m.id); }}
                disabled={isRunning} className={'mtab' + (mode===m.id?' on':'')}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Main timer card */}
          <div className="fu d2" style={{ background:'rgba(255,255,255,0.03)',backdropFilter:'blur(16px)',border:'1px solid ' + accent + '20',borderRadius:28,padding:28,position:'relative',overflow:'hidden',boxShadow:'0 0 60px ' + accent + '08' }}>
            <div style={{ position:'absolute',width:300,height:300,borderRadius:'50%',filter:'blur(80px)',opacity:.1,background:accent,top:'-3rem',right:'-3rem',pointerEvents:'none' }} />

            {/* Break banner */}
            {isBreak && (
              <div className="blink" style={{ background:'rgba(52,211,153,.08)',border:'1px solid rgba(52,211,153,.25)',borderRadius:14,padding:'10px 18px',textAlign:'center',marginBottom:20 }}>
                <span style={{ fontSize:13,fontWeight:600,color:'#34d399' }}>☕ Break Time! Relax for 5 minutes</span>
              </div>
            )}

            {/* Countdown input — only when not running */}
            {mode === 'countdown' && !isRunning && (
              <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:12,marginBottom:24,flexWrap:'wrap' }}>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <input className="numinput" type="number" value={cdHours} min={0} max={23}
                    onChange={e => setCdHours(Math.max(0, Math.min(23, parseInt(e.target.value)||0)))} />
                  <span style={{ color:'#64748b',fontSize:12 }}>hrs</span>
                </div>
                <span style={{ color:'#334155',fontSize:20,fontWeight:700 }}>:</span>
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <input className="numinput" type="number" value={cdMins} min={0} max={59}
                    onChange={e => setCdMins(Math.max(0, Math.min(59, parseInt(e.target.value)||0)))} />
                  <span style={{ color:'#64748b',fontSize:12 }}>min</span>
                </div>
                {cdTotalSecs > 0 && (
                  <div style={{ fontSize:11,color:'#475569',width:'100%',textAlign:'center' }}>
                    Total: {formatTime(cdTotalSecs)}
                  </div>
                )}
              </div>
            )}

            {/* Ring + time display */}
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center' }}>
              <div style={{ position:'relative',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <RingProgress pct={ringPct} color={accent} size={240} stroke={8} />
                <div style={{ position:'absolute',display:'flex',flexDirection:'column',alignItems:'center' }}>
                  {selSubject && <div style={{ fontSize:26,marginBottom:4 }}>{selSubject.emoji}</div>}
                  <div style={{ fontFamily:'JetBrains Mono,monospace',fontWeight:700,fontSize:'clamp(2.8rem,7vw,4.5rem)',letterSpacing:'-2px',lineHeight:1,color:accent,textShadow:'0 0 30px '+accent }}>
                    {displayTime}
                  </div>
                  <div style={{ fontSize:10,letterSpacing:3,color:accent,marginTop:6,fontFamily:'JetBrains Mono,monospace' }}>
                    {isBreak?'BREAK':isPaused?'PAUSED':isRunning?'FOCUSING':'READY'}
                  </div>
                </div>
              </div>

              {mode === 'pomodoro' && (
                <div style={{ display:'flex',gap:8,marginTop:14 }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ width:9,height:9,borderRadius:'50%',background:i<pomodoroCount%4?accent:'rgba(255,255,255,.1)',boxShadow:i<pomodoroCount%4?'0 0 8px '+accent:'none',transition:'all .3s' }} />
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:18,marginTop:28 }}>
              {isRunning && <button onClick={stopTimer} className="btnsm" title="Stop & Save">⏹</button>}
              <button onClick={isRunning ? pauseTimer : startTimer} className="btnmain"
                style={{ background:'linear-gradient(135deg,'+accent+','+accent+'99)',boxShadow:'0 0 28px '+accent+'60',color:'white' }}>
                {isRunning ? (isPaused ? '▶' : '⏸') : '▶'}
              </button>
              {!isRunning && <button onClick={resetTimer} className="btnsm" title="Reset">↺</button>}
            </div>

            {mode === 'stopwatch' && isRunning && elapsed >= 60 && (
              <div style={{ textAlign:'center',marginTop:14 }}>
                <button onClick={() => saveSession(elapsedRef.current, false)} disabled={saving}
                  style={{ padding:'9px 24px',borderRadius:12,border:'1px solid rgba(139,92,246,.4)',background:'rgba(124,58,237,.15)',color:'#a78bfa',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'Syne,sans-serif' }}>
                  {saving ? '⏳ Saving...' : '💾 Save Session'}
                </button>
              </div>
            )}

            <div style={{ textAlign:'center',marginTop:10,fontSize:11,color:'#334155',fontFamily:'JetBrains Mono,monospace' }}>
              {MODES.find(m => m.id === mode)?.desc}
            </div>
          </div>

          {/* Subject selector */}
          <div className="fu d3" style={{ ...card }}>
            <p style={{ fontSize:11,color:'#475569',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10,margin:'0 0 10px' }}>Studying Subject</p>
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              <button onClick={() => handleSelectSubject(null)}
                className={'chip' + (!selSubject?' on':'')}
                style={!selSubject?{ background:'rgba(139,92,246,.15)',borderColor:'rgba(139,92,246,.4)',color:'#a78bfa' }:{}}>
                📚 General
              </button>
              {subjects.map(s => (
                <button key={s._id} onClick={() => handleSelectSubject(s)}
                  className={'chip' + (selSubject?._id===s._id?' on':'')}
                  style={selSubject?._id===s._id?{ background:s.color+'18',borderColor:s.color+'50',color:'white' }:{}}>
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>

            {/* Topic selector */}
            {selSubject && (selSubject.topics||[]).filter(t=>t.status!=='completed').length > 0 && (
              <div style={{ marginTop:16,borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:16 }}>
                <p style={{ fontSize:11,color:'#475569',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10 }}>
                  Topic <span style={{ color:'#7c3aed',textTransform:'none',fontStyle:'normal',letterSpacing:'normal' }}>(select to track quiz unlock)</span>
                </p>
                <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:10 }}>
                  <button onClick={() => setSelTopic(null)}
                    className={'chip' + (!selTopic?' on':'')}
                    style={!selTopic?{ background:'rgba(100,116,139,.15)',borderColor:'rgba(100,116,139,.4)',color:'#94a3b8' }:{}}>
                    No specific topic
                  </button>
                  {(selSubject.topics||[]).filter(t=>t.status!=='completed').map(t => {
                    const logged   = t.studyMinutesLogged || 0;
                    const required = t.studyMinutesRequired || 20;
                    const ready    = logged >= required;
                    const isSel    = selTopic?._id === t._id;
                    return (
                      <button key={t._id} onClick={() => setSelTopic(t)}
                        className={'chip' + (isSel?' on':'')}
                        style={isSel?{ background:selSubject.color+'18',borderColor:selSubject.color+'50',color:'white' }:{}}>
                        {t.name}
                        <span style={{ fontSize:10,fontWeight:700,color:ready?'#34d399':'#475569' }}>
                          {ready ? '✓ ready' : logged+'/'+required+'m'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selTopic && (
                  <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:12,padding:12 }}>
                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:6 }}>
                      <span style={{ color:'#94a3b8' }}>📖 {selTopic.name}</span>
                      <span style={{ fontWeight:700,color:selSubject.color }}>{selTopic.studyMinutesLogged||0}/{selTopic.studyMinutesRequired||20} min</span>
                    </div>
                    <div style={{ height:6,borderRadius:6,background:'rgba(255,255,255,0.05)',overflow:'hidden' }}>
                      <div style={{
                        height:'100%',borderRadius:6,transition:'width .5s ease',
                        width:Math.min(100,Math.round(((selTopic.studyMinutesLogged||0)/(selTopic.studyMinutesRequired||20))*100))+'%',
                        background:(selTopic.studyMinutesLogged||0)>=(selTopic.studyMinutesRequired||20)?'#34d399':'linear-gradient(90deg,'+selSubject.color+'88,'+selSubject.color+')',
                        boxShadow:'0 0 8px '+selSubject.color+'50',
                      }} />
                    </div>
                    <div style={{ fontSize:11,marginTop:6,color:(selTopic.studyMinutesLogged||0)>=(selTopic.studyMinutesRequired||20)?'#34d399':'#475569' }}>
                      {(selTopic.studyMinutesLogged||0)>=(selTopic.studyMinutesRequired||20)
                        ? '✅ Quiz unlocked! Go to the subject page to take it.'
                        : 'Study '+((selTopic.studyMinutesRequired||20)-(selTopic.studyMinutesLogged||0))+' more minutes to unlock quiz'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right: Sessions ─── */}
        <div className="fu d3">
          <p style={{ fontSize:11,color:'#475569',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12 }}>Recent Sessions</p>
          {sessions.length === 0 ? (
            <div style={{ ...card,textAlign:'center',padding:32 }}>
              <div style={{ fontSize:32,marginBottom:8 }}>⏱️</div>
              <div style={{ color:'#64748b',fontSize:14 }}>No sessions yet</div>
              <div style={{ color:'#334155',fontSize:12,marginTop:4 }}>Start the timer to begin!</div>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {sessions.slice(0,10).map((s,i) => {
                const mins = Math.round((s.durationSeconds||0)/60);
                return (
                  <div key={s._id||i} className="srow">
                    <div style={{ width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0,background:(s.subjectColor||'#7c3aed')+'18',border:'1px solid '+(s.subjectColor||'#7c3aed')+'30' }}>
                      {s.subjectEmoji||'📚'}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{s.subjectName||'General'}</div>
                      <div style={{ fontSize:11,color:'#475569',fontFamily:'JetBrains Mono,monospace' }}>{s.mode}</div>
                    </div>
                    <div style={{ textAlign:'right',flexShrink:0 }}>
                      <div style={{ fontSize:14,fontWeight:700,fontFamily:'JetBrains Mono,monospace',color:s.subjectColor||'#7c3aed' }}>{mins}m</div>
                      <div style={{ fontSize:11,color:'#d97706' }}>+{s.xpEarned||0}⚡</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(139,92,246,.2)',borderRadius:12,padding:'9px 14px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <span style={{ fontSize:12,color:'#94a3b8',fontWeight:600 }}>Total Today</span>
                <span className="grad" style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:16 }}>
                  {Math.floor(totalToday/60)}h {totalToday%60}m
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}