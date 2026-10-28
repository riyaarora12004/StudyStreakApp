'use client';

import { useEffect, useState } from 'react';
export const dynamic = 'force-dynamic';
// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ to, duration = 1000, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to, duration]);
  return <>{val.toLocaleString()}{suffix}</>;
}

// ── Bar Chart (14-day) ────────────────────────────────────────────────────────
function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.minutes), 1);
  const [hovered, setHovered] = useState(null);

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="flex">
        <div className="flex flex-col justify-between text-right pr-2 text-xs text-slate-700"
          style={{ minWidth: '36px', height: '160px' }}>
          <span>{Math.round(max)}m</span>
          <span>{Math.round(max / 2)}m</span>
          <span>0</span>
        </div>

        {/* Bars */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ height: '160px' }}>
            {[0,1,2].map(i => (
              <div key={i} className="w-full h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>

          <div className="flex items-end gap-1 relative" style={{ height: '160px' }}>
            {data.map((d, i) => {
              const h     = Math.max(2, (d.minutes / max) * 148);
              const today = i === data.length - 1;
              const isHov = hovered === i;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end group cursor-pointer relative"
                  style={{ height: '160px' }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}>
                  {/* Tooltip */}
                  {isHov && (
                    <div className="chart-tooltip">
                      <div className="font-semibold text-white text-xs">{d.label}</div>
                      <div className="text-violet-400 text-xs">{d.minutes}m studied</div>
                      <div className="text-slate-500 text-xs">{d.sessions} session{d.sessions !== 1 ? 's' : ''}</div>
                    </div>
                  )}
                  <div className="bar-col w-full rounded-t-md transition-all duration-700"
                    style={{
                      height: `${h}px`,
                      background: today
                        ? 'linear-gradient(180deg,#a78bfa,#7c3aed)'
                        : d.minutes > 0
                          ? `linear-gradient(180deg,rgba(139,92,246,0.6),rgba(139,92,246,0.25))`
                          : 'rgba(255,255,255,0.04)',
                      boxShadow: today ? '0 0 16px rgba(124,58,237,0.5)' : isHov && d.minutes > 0 ? '0 0 10px rgba(124,58,237,0.3)' : 'none',
                      transform: isHov ? 'scaleX(1.05)' : 'scaleX(1)',
                    }} />
                </div>
              );
            })}
          </div>

          {/* X labels - show every 2nd */}
          <div className="flex mt-2">
            {data.map((d, i) => (
              <div key={i} className="flex-1 text-center" style={{ fontSize: '10px', color: i === data.length-1 ? '#a78bfa' : '#334155' }}>
                {i % 2 === 0 || i === data.length - 1 ? d.label.split(' ')[1] : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Donut Chart (subject breakdown) ──────────────────────────────────────────
function DonutChart({ data }) {
  const total  = data.reduce((a, d) => a + d.minutes, 0) || 1;
  const size   = 180;
  const cx     = size / 2;
  const cy     = size / 2;
  const r      = 65;
  const stroke = 28;
  const c      = 2 * Math.PI * r;
  const [hov,  setHov] = useState(null);

  let offset = 0;
  const segments = data.map((d, i) => {
    const pct  = d.minutes / total;
    const dash = pct * c;
    const seg  = { ...d, pct, dash, offset, idx: i };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* SVG donut */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none"
            stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
          {segments.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={hov === i ? stroke + 4 : stroke}
              strokeDasharray={`${s.dash} ${c - s.dash}`}
              strokeDashoffset={-s.offset}
              style={{ transition: 'stroke-width 0.2s', cursor: 'pointer', filter: hov === i ? `drop-shadow(0 0 8px ${s.color})` : 'none' }}
              onMouseEnter={() => setHov(i)}
              onMouseLeave={() => setHov(null)}
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hov !== null ? (
            <>
              <div className="text-lg">{segments[hov]?.emoji}</div>
              <div className="text-xs font-bold text-white text-center px-2" style={{ fontFamily: 'Syne' }}>
                {Math.round(segments[hov]?.pct * 100)}%
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-black text-white" style={{ fontFamily: 'Syne' }}>
                {Math.round(total / 60)}h
              </div>
              <div className="text-xs text-slate-500">total</div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2 min-w-0">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setHov(i)}
            onMouseLeave={() => setHov(null)}>
            <div className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: s.color, boxShadow: hov === i ? `0 0 8px ${s.color}` : 'none' }} />
            <div className="text-xs truncate" style={{ color: hov === i ? 'white' : '#64748b' }}>
              {s.emoji} {s.name}
            </div>
            <div className="ml-auto text-xs font-semibold flex-shrink-0"
              style={{ color: s.color, fontFamily: 'Syne' }}>
              {Math.round(s.minutes / 60 * 10) / 10}h
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Week comparison bar ───────────────────────────────────────────────────────
function WeekComparison({ thisWeek, lastWeek }) {
  const max  = Math.max(thisWeek, lastWeek, 1);
  const diff = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 100;
  const up   = diff >= 0;

  return (
    <div className="space-y-4">
      {[
        { label: 'This Week', mins: thisWeek, color: '#a78bfa', glow: 'rgba(167,139,250,0.4)' },
        { label: 'Last Week', mins: lastWeek, color: '#334155', glow: 'none'                   },
      ].map(({ label, mins, color, glow }) => (
        <div key={label}>
          <div className="flex justify-between text-xs mb-1.5">
            <span style={{ color: color === '#334155' ? '#475569' : color }}>{label}</span>
            <span className="font-bold" style={{ color, fontFamily: 'Syne' }}>
              {Math.round(mins / 60 * 10) / 10}h
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${(mins / max) * 100}%`,
                background: color === '#334155'
                  ? 'rgba(51,65,85,0.6)'
                  : `linear-gradient(90deg,${color}88,${color})`,
                boxShadow: `0 0 8px ${glow}`,
              }} />
          </div>
        </div>
      ))}
      <div className={`text-center text-sm font-bold mt-2`}
        style={{ color: up ? '#34d399' : '#f87171', fontFamily: 'Syne' }}>
        {up ? '↑' : '↓'} {Math.abs(diff)}% vs last week
      </div>
    </div>
  );
}

// ── Subject progress cards ────────────────────────────────────────────────────
function SubjectProgress({ subjects }) {
  return (
    <div className="space-y-3">
      {subjects.map(s => {
        const pct  = Math.round((s.completedChapters / s.totalChapters) * 100);
        const days = Math.max(0, Math.ceil((new Date(s.examDate) - new Date()) / 86400000));
        const urgent = days <= 7;
        return (
          <div key={s._id} className="subj-row">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{s.emoji}</span>
                <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne' }}>{s.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: urgent ? '#f87171' : '#64748b' }}>
                  {days}d left
                </span>
                <span className="text-sm font-bold" style={{ color: s.color, fontFamily: 'Syne' }}>{pct}%</span>
              </div>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg,${s.color}88,${s.color})`,
                  boxShadow: `0 0 8px ${s.color}60`,
                }} />
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>{s.completedChapters}/{s.totalChapters} chapters</span>
              <span>{Math.round((s.totalHoursStudied || 0) * 10) / 10}h studied</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Timer mode pie ────────────────────────────────────────────────────────────
function ModePie({ modeMap }) {
  const total = Object.values(modeMap).reduce((a, b) => a + b, 0) || 1;
  const modes = [
    { key: 'stopwatch', icon: '⏱️', label: 'Stopwatch', color: '#38bdf8' },
    { key: 'pomodoro',  icon: '🍅', label: 'Pomodoro',  color: '#f87171' },
    { key: 'countdown', icon: '⏳', label: 'Countdown', color: '#34d399' },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {modes.map(({ key, icon, label, color }) => {
        const count = modeMap[key] || 0;
        const pct   = Math.round((count / total) * 100);
        return (
          <div key={key} className="text-center p-3 rounded-2xl"
            style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-lg font-black" style={{ color, fontFamily: 'Syne' }}>{pct}%</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            <div className="text-xs text-slate-700">{count} sessions</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [range,   setRange]   = useState('14d');

  useEffect(() => {
  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics');
      const json = await res.json();
      setData(json);
      setLoading(false); // 🔥 IMPORTANT
    } catch (err) {
      console.error(err);
      setLoading(false); // also stop loading on error
    }
  };

  fetchAnalytics();
  const t = setInterval(fetchAnalytics, 15000);

  return () => clearInterval(t);
}, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center space-y-3">
        <div className="text-5xl" style={{ animation: 'spin 2s linear infinite', display: 'inline-block' }}>📊</div>
        <div className="text-slate-500 text-sm">Crunching your data...</div>
      </div>
    </div>
  );

  const { dailyData = [], subjectBreakdown = [], modeMap = {}, weekComparison = {}, totals = {}, bestHour, subjects = [], user = {} } = data || {};

  const noData = totals.sessions === 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .grad-text  { background:linear-gradient(135deg,#a78bfa,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glass      { background:rgba(255,255,255,0.03); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.07); }
        .chart-card { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.07); border-radius:24px; padding:24px; }

        @keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .fade-up { animation:fadeUp 0.5s ease forwards; }
        .d1{animation-delay:0.05s;opacity:0} .d2{animation-delay:0.12s;opacity:0}
        .d3{animation-delay:0.19s;opacity:0} .d4{animation-delay:0.26s;opacity:0}
        .d5{animation-delay:0.33s;opacity:0} .d6{animation-delay:0.40s;opacity:0}

        /* Stat cards */
        .stat-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:20px; transition:all 0.2s; }
        .stat-card:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,0.3); border-color:rgba(139,92,246,0.3); }

        /* Chart tooltip */
        .chart-tooltip { position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%); background:rgba(8,12,24,0.95); border:1px solid rgba(139,92,246,0.3); border-radius:10px; padding:8px 12px; z-index:20; white-space:nowrap; pointer-events:none; box-shadow:0 8px 24px rgba(0,0,0,0.4); }

        /* Subject rows */
        .subj-row { background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:14px; transition:all 0.2s; }
        .subj-row:hover { border-color:rgba(139,92,246,0.2); background:rgba(255,255,255,0.04); }

        /* Insight cards */
        .insight { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:16px; padding:16px; display:flex; align-items:flex-start; gap:12px; }
        .insight-icon { font-size:1.5rem; flex-shrink:0; }
        .insight-title { font-size:13px; font-weight:700; color:white; font-family:'Syne',sans-serif; }
        .insight-desc { font-size:12px; color:#475569; margin-top:2px; }
      `}</style>

      {/* ─── Header ─── */}
      <div className="fade-up d1 flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:800, letterSpacing:'-1px' }}>
            Study <span className="grad-text">Analytics</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Deep dive into your study patterns and progress
          </p>
        </div>
      </div>

      {noData ? (
        <div className="chart-card text-center py-20">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-black text-white mb-2" style={{ fontFamily:'Syne' }}>No Data Yet</h2>
          <p className="text-slate-500 text-sm">Complete a study session on the Timer page to start seeing analytics!</p>
        </div>
      ) : (
        <>
          {/* ─── Top stats ─── */}
          <div className="fade-up d2 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon:'⏱️', val:Math.round(totals.minutes/60*10)/10, suffix:'h', label:'Total Hours',    color:'#38bdf8' },
              { icon:'📚', val:totals.sessions,                       suffix:'',  label:'Total Sessions', color:'#a78bfa' },
              { icon:'📅', val:totals.avgPerDay,                      suffix:'m', label:'Avg Per Day',    color:'#34d399' },
              { icon:'🔥', val:user.currentStreak || 0,               suffix:'d', label:'Current Streak', color:'#f97316' },
            ].map(({ icon, val, suffix, label, color }) => (
              <div key={label} className="stat-card text-center">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-2xl font-black" style={{ fontFamily:'Syne', color }}>
                  <Counter to={val} suffix={suffix} />
                </div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* ─── Left column ─── */}
            <div className="lg:col-span-2 space-y-6">

              {/* 14-day bar chart */}
              <div className="fade-up d3 chart-card">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-bold text-white" style={{ fontFamily:'Syne' }}>
                      Daily Study Time
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Last 14 days · minutes per day</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-sm" style={{ background:'rgba(139,92,246,0.4)' }} />
                    <span className="text-slate-500">Past days</span>
                    <div className="w-3 h-3 rounded-sm ml-2" style={{ background:'#7c3aed' }} />
                    <span className="text-slate-500">Today</span>
                  </div>
                </div>
                <BarChart data={dailyData} />
              </div>

              {/* Subject breakdown donut */}
              {subjectBreakdown.length > 0 && (
                <div className="fade-up d4 chart-card">
                  <h2 className="text-base font-bold text-white mb-1" style={{ fontFamily:'Syne' }}>
                    Subject Breakdown
                  </h2>
                  <p className="text-xs text-slate-500 mb-5">Time distribution across all subjects</p>
                  <DonutChart data={subjectBreakdown} />
                </div>
              )}

              {/* Subject progress */}
              {subjects.length > 0 && (
                <div className="fade-up d5 chart-card">
                  <h2 className="text-base font-bold text-white mb-1" style={{ fontFamily:'Syne' }}>
                    Subject Progress
                  </h2>
                  <p className="text-xs text-slate-500 mb-5">Chapter completion & exam countdown</p>
                  <SubjectProgress subjects={subjects} />
                </div>
              )}
            </div>

            {/* ─── Right column ─── */}
            <div className="space-y-6">

              {/* Week comparison */}
              <div className="fade-up d3 chart-card">
                <h2 className="text-base font-bold text-white mb-1" style={{ fontFamily:'Syne' }}>
                  Week vs Week
                </h2>
                <p className="text-xs text-slate-500 mb-5">This week vs last week</p>
                <WeekComparison
                  thisWeek={weekComparison.thisWeek || 0}
                  lastWeek={weekComparison.lastWeek || 0}
                />
              </div>

              {/* Timer mode usage */}
              <div className="fade-up d4 chart-card">
                <h2 className="text-base font-bold text-white mb-1" style={{ fontFamily:'Syne' }}>
                  Timer Modes
                </h2>
                <p className="text-xs text-slate-500 mb-4">How you prefer to study</p>
                <ModePie modeMap={modeMap} />
              </div>

              {/* AI Insights */}
              <div className="fade-up d5 chart-card">
                <h2 className="text-base font-bold text-white mb-4" style={{ fontFamily:'Syne' }}>
                  💡 Smart Insights
                </h2>
                <div className="space-y-3">

                  {bestHour && (
                    <div className="insight">
                      <span className="insight-icon">🕐</span>
                      <div>
                        <div className="insight-title">Peak Study Hour</div>
                        <div className="insight-desc">You study best around <strong style={{ color:'#38bdf8' }}>{bestHour}</strong>. Schedule tough topics then!</div>
                      </div>
                    </div>
                  )}

                  {weekComparison.thisWeek > weekComparison.lastWeek ? (
                    <div className="insight">
                      <span className="insight-icon">📈</span>
                      <div>
                        <div className="insight-title">You're improving!</div>
                        <div className="insight-desc">
                          <strong style={{ color:'#34d399' }}>+{Math.round(((weekComparison.thisWeek - weekComparison.lastWeek) / Math.max(1, weekComparison.lastWeek)) * 100)}%</strong> more study time than last week. Keep it up!
                        </div>
                      </div>
                    </div>
                  ) : weekComparison.lastWeek > weekComparison.thisWeek ? (
                    <div className="insight">
                      <span className="insight-icon">💪</span>
                      <div>
                        <div className="insight-title">Push harder!</div>
                        <div className="insight-desc">Last week you studied <strong style={{ color:'#f87171' }}>{Math.round(weekComparison.lastWeek/60*10)/10}h</strong>. Try to beat that!</div>
                      </div>
                    </div>
                  ) : null}

                  {subjectBreakdown.length > 1 && (() => {
                    const urgent = subjects.find(s => {
                      const days = Math.ceil((new Date(s.examDate) - new Date()) / 86400000);
                      return days <= 14 && days > 0;
                    });
                    if (!urgent) return null;
                    const days = Math.ceil((new Date(urgent.examDate) - new Date()) / 86400000);
                    return (
                      <div className="insight">
                        <span className="insight-icon">⚠️</span>
                        <div>
                          <div className="insight-title">Urgent: {urgent.name}</div>
                          <div className="insight-desc">
                            Exam in <strong style={{ color:'#f87171' }}>{days} days</strong>! {urgent.totalChapters - urgent.completedChapters} chapters remaining.
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {totals.sessions >= 10 && (
                    <div className="insight">
                      <span className="insight-icon">🎯</span>
                      <div>
                        <div className="insight-title">Consistency Score</div>
                        <div className="insight-desc">
                          <strong style={{ color:'#a78bfa' }}>{dailyData.filter(d => d.minutes > 0).length}/14</strong> active days this fortnight. {dailyData.filter(d => d.minutes > 0).length >= 10 ? 'Excellent!' : 'Try to study every day!'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="insight">
                    <span className="insight-icon">⚡</span>
                    <div>
                      <div className="insight-title">XP Pace</div>
                      <div className="insight-desc">
                        At your current pace, you'll reach the next level in about <strong style={{ color:'#fbbf24' }}>{Math.max(1, Math.round((500 - ((user.totalXP || 0) % 500)) / Math.max(1, totals.avgPerDay)))} days</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}