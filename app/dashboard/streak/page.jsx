'use client';

import { useEffect, useState } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function daysSince(date) {
  return Math.floor((Date.now() - new Date(date)) / 86400000);
}

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, duration = 1200, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [to]);
  return <>{val.toLocaleString()}{suffix}</>;
}

// ── Flame streak display ──────────────────────────────────────────────────────
function FlameDisplay({ streak }) {
  const size = Math.min(140 + streak * 0.5, 200);
  return (
    <div className="flex flex-col items-center">
      <div className="flame-wrap" style={{ '--size': `${size}px` }}>
        <div className="flame-emoji">🔥</div>
        <div className="flame-glow" />
      </div>
      <div className="streak-num"><Counter to={streak} duration={1000} /></div>
      <div className="streak-label">Day Streak</div>
    </div>
  );
}

// ── 30-Day Activity Heatmap ───────────────────────────────────────────────────
function ActivityHeatmap({ activityMap }) {
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key   = d.toDateString();
    const secs  = activityMap?.[key] || 0;
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const isToday = key === new Date().toDateString();
    let intensity = 0;
    if (secs > 0)     intensity = 1;
    if (secs > 1800)  intensity = 2; // 30min+
    if (secs > 3600)  intensity = 3; // 1h+
    if (secs > 7200)  intensity = 4; // 2h+
    return { key, secs, label, isToday, intensity };
  });

  const colors = [
    'rgba(255,255,255,0.05)',
    'rgba(124,58,237,0.25)',
    'rgba(124,58,237,0.45)',
    'rgba(124,58,237,0.7)',
    '#7c3aed',
  ];

  return (
    <div>
      <div className="flex gap-1.5 flex-wrap">
        {days.map(({ key, secs, label, isToday, intensity }) => (
          <div key={key} className="heatmap-cell group relative"
            style={{
              background: colors[intensity],
              boxShadow: intensity > 0 ? `0 0 ${intensity * 4}px rgba(124,58,237,0.4)` : 'none',
              border: isToday ? '1px solid #a78bfa' : '1px solid transparent',
            }}>
            {/* Tooltip */}
            <div className="heatmap-tip">
              <div className="font-semibold text-white">{label}</div>
              <div>{secs > 0 ? fmt(secs) + ' studied' : 'No session'}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-slate-600">Less</span>
        {colors.map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
        ))}
        <span className="text-xs text-slate-600">More</span>
      </div>
    </div>
  );
}

// ── Badge Card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge, earned, progress, total }) {
  const pct = Math.min(100, Math.round((progress / total) * 100));
  return (
    <div className={`badge-card ${earned ? 'earned' : 'locked'}`}>
      <div className="badge-icon" style={{ filter: earned ? 'none' : 'grayscale(1) opacity(0.3)' }}>
        {badge.icon}
      </div>
      <div className="badge-name" style={{ color: earned ? 'white' : '#475569' }}>
        {badge.name}
      </div>
      <div className="badge-desc">{badge.desc}</div>
      {!earned && (
        <div className="mt-2 w-full">
          <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }} />
          </div>
          <div className="text-xs text-slate-600 mt-1 text-center">{pct}%</div>
        </div>
      )}
      {earned && (
        <div className="earned-badge">✓ Earned</div>
      )}
    </div>
  );
}

// ── Level Progress Bar ────────────────────────────────────────────────────────
function LevelProgress({ levelInfo, xp }) {
  const pct = Math.min(100, Math.round(((xp - levelInfo.minXP) / (levelInfo.maxXP - levelInfo.minXP)) * 100));
  return (
    <div className="level-card" style={{ '--lc': levelInfo.color }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="level-icon">{levelInfo.icon}</div>
          <div>
            <div className="text-xs text-slate-500 uppercase tracking-widest">Current Level</div>
            <div className="level-name" style={{ color: levelInfo.color }}>{levelInfo.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Total XP</div>
          <div className="text-2xl font-black" style={{ fontFamily: 'Syne', color: levelInfo.color }}>
            <Counter to={xp} /> ⚡
          </div>
        </div>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${levelInfo.color}88, ${levelInfo.color})`,
            boxShadow: `0 0 12px ${levelInfo.color}60`,
          }}>
          <div className="shimmer" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-slate-600 mt-2">
        <span>{levelInfo.minXP.toLocaleString()} XP</span>
        <span className="text-slate-400">{pct}% to next level</span>
        <span>{levelInfo.maxXP.toLocaleString()} XP</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StreakPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('badges'); // badges | heatmap

  useEffect(() => {
    fetch('/api/streak')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="text-5xl mb-4" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔥</div>
        <div className="text-slate-500 text-sm">Loading your streak data...</div>
      </div>
    </div>
  );

  const { user, stats, earnedBadges = [], allBadges = [], activityMap = {}, nextBadge } = data || {};

  // Badge progress values
  const getBadgeProgress = (badge) => {
    if (badge.type === 'streak')   return user?.longestStreak  || 0;
    if (badge.type === 'xp')       return user?.totalXP        || 0;
    if (badge.type === 'sessions') return stats?.totalSessions  || 0;
    if (badge.type === 'hours')    return stats?.totalHours     || 0;
    return 0;
  };

  const earnedCount = earnedBadges.length;
  const totalBadges = allBadges.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&family=Orbitron:wght@700;900&display=swap');

        .grad-text { background:linear-gradient(135deg,#f97316,#fbbf24); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .grad-text-xp { background:linear-gradient(135deg,#a78bfa,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glass { background:rgba(255,255,255,0.03); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.07); }

        /* Flame animation */
        @keyframes flameAnim { 0%,100%{transform:scaleY(1) scaleX(1) rotate(-1deg)} 25%{transform:scaleY(1.05) scaleX(0.97) rotate(1deg)} 50%{transform:scaleY(1.08) scaleX(0.95) rotate(-1deg)} 75%{transform:scaleY(1.03) scaleX(0.98) rotate(2deg)} }
        @keyframes glowPulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.1)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .flame-wrap { position:relative; width:var(--size,160px); height:var(--size,160px); display:flex; align-items:center; justify-content:center; }
        .flame-emoji { font-size:calc(var(--size,160px) * 0.65); animation:flameAnim 0.6s ease-in-out infinite; position:relative; z-index:2; filter:drop-shadow(0 0 20px #f97316); }
        .flame-glow { position:absolute; inset:-20%; border-radius:50%; background:radial-gradient(circle,rgba(249,115,22,0.3),transparent 70%); animation:glowPulse 2s ease-in-out infinite; }
        .streak-num { font-family:'Orbitron',monospace; font-size:4rem; font-weight:900; color:#f97316; text-shadow:0 0 40px #f9731680; margin-top:-8px; line-height:1; }
        .streak-label { font-size:13px; color:#64748b; font-weight:600; letter-spacing:2px; text-transform:uppercase; margin-top:4px; }

        /* Stat cards */
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp 0.5s ease forwards; }
        .d1{animation-delay:0.05s;opacity:0} .d2{animation-delay:0.12s;opacity:0}
        .d3{animation-delay:0.19s;opacity:0} .d4{animation-delay:0.26s;opacity:0}
        .d5{animation-delay:0.33s;opacity:0} .d6{animation-delay:0.40s;opacity:0}

        .stat-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:20px; text-align:center; transition:all 0.2s; }
        .stat-card:hover { transform:translateY(-3px); box-shadow:0 16px 40px rgba(0,0,0,0.3); }

        /* Level card */
        .level-card { background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02)); border:1px solid rgba(var(--lc-rgb,139,92,246),0.2); border-radius:24px; padding:24px; }
        .level-icon { font-size:2.5rem; }
        .level-name { font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:800; }
        .shimmer { position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent); animation:shimmer 2s infinite; }
        @keyframes shimmer { from{transform:translateX(-100%)} to{transform:translateX(200%)} }

        /* Heatmap */
        .heatmap-cell { width:20px; height:20px; border-radius:4px; cursor:pointer; transition:all 0.15s; position:relative; }
        .heatmap-cell:hover { transform:scale(1.3); z-index:10; }
        .heatmap-tip { position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%); background:rgba(10,15,30,0.95); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:6px 10px; white-space:nowrap; font-size:11px; color:#94a3b8; pointer-events:none; opacity:0; transition:opacity 0.15s; z-index:20; }
        .heatmap-cell:hover .heatmap-tip { opacity:1; }

        /* Badge cards */
        .badge-card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:18px; padding:16px; text-align:center; transition:all 0.2s; display:flex; flex-direction:column; align-items:center; gap:4px; }
        .badge-card.earned { background:rgba(124,58,237,0.08); border-color:rgba(124,58,237,0.25); box-shadow:0 0 20px rgba(124,58,237,0.08); }
        .badge-card.earned:hover { transform:translateY(-4px); box-shadow:0 16px 40px rgba(124,58,237,0.15); }
        .badge-card.locked:hover { background:rgba(255,255,255,0.03); }
        .badge-icon { font-size:2.2rem; line-height:1; }
        .badge-name { font-family:'Syne',sans-serif; font-size:12px; font-weight:700; }
        .badge-desc { font-size:11px; color:#475569; }
        .earned-badge { font-size:10px; color:#a78bfa; font-weight:700; background:rgba(124,58,237,0.15); border:1px solid rgba(124,58,237,0.3); border-radius:20px; padding:2px 10px; margin-top:4px; }

        /* Tabs */
        .tab-btn { padding:8px 20px; border-radius:12px; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.03); color:#64748b; font-family:'Syne',sans-serif; }
        .tab-btn.active { background:rgba(249,115,22,0.15); border-color:rgba(249,115,22,0.4); color:#fb923c; }

        /* Next badge card */
        .next-badge { background:linear-gradient(135deg,rgba(251,191,36,0.06),rgba(249,115,22,0.06)); border:1px solid rgba(251,191,36,0.2); border-radius:20px; padding:16px; }

        /* Streak milestone labels */
        .milestone { display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
        .milestone:last-child { border-bottom:none; }
      `}</style>

      {/* ─── Header ─── */}
      <div className="fade-up d1 flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:800, letterSpacing:'-1px' }}>
            Streak & <span className="grad-text">Rewards</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {user?.name?.split(' ')[0]}'s journey · {daysSince(user?.joinedDate)} days since joining
          </p>
        </div>
        <div className="glass rounded-2xl px-5 py-2.5 flex items-center gap-2"
          style={{ border:'1px solid rgba(251,191,36,0.2)' }}>
          <span>🏅</span>
          <span className="font-bold text-sm" style={{ fontFamily:'Syne', color:'#fbbf24' }}>
            {earnedCount} / {totalBadges} Badges
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ─── Left: Flame + stats ─── */}
        <div className="space-y-5">

          {/* Flame */}
          <div className="fade-up d1 glass rounded-3xl p-8 flex flex-col items-center"
            style={{ border:'1px solid rgba(249,115,22,0.2)', background:'rgba(249,115,22,0.03)' }}>
            <FlameDisplay streak={user?.currentStreak || 0} />
            <div className="w-full mt-6 pt-5 border-t border-white/5 grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-xl font-black" style={{ fontFamily:'Syne', color:'#fbbf24' }}>
                  <Counter to={user?.longestStreak || 0} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Longest Streak</div>
              </div>
              <div>
                <div className="text-xl font-black" style={{ fontFamily:'Syne', color:'#34d399' }}>
                  <Counter to={stats?.totalSessions || 0} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Total Sessions</div>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="fade-up d2 grid grid-cols-2 gap-3">
            {[
              { icon:'⏰', val: stats?.totalHours || 0, suffix:'h', label:'Hours Studied', color:'#38bdf8' },
              { icon:'⚡', val: user?.totalXP     || 0, suffix:'',  label:'Total XP',      color:'#a78bfa' },
            ].map(({ icon, val, suffix, label, color }) => (
              <div key={label} className="stat-card">
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-xl font-black" style={{ fontFamily:'Syne', color }}>
                  <Counter to={val} suffix={suffix} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Next badge to earn */}
          {nextBadge && (
            <div className="fade-up d3 next-badge">
              <div className="text-xs text-yellow-600 uppercase tracking-widest mb-2">🎯 Next Badge</div>
              <div className="flex items-center gap-3">
                <div className="text-3xl" style={{ filter:'grayscale(0.5)' }}>{nextBadge.icon}</div>
                <div>
                  <div className="text-sm font-bold text-white" style={{ fontFamily:'Syne' }}>
                    {nextBadge.name}
                  </div>
                  <div className="text-xs text-slate-500">{nextBadge.desc}</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full" style={{ background:'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((getBadgeProgress(nextBadge) / nextBadge.threshold) * 100))}%`,
                    background:'linear-gradient(90deg,#f97316,#fbbf24)',
                    boxShadow:'0 0 8px rgba(249,115,22,0.5)',
                  }} />
              </div>
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>{getBadgeProgress(nextBadge).toLocaleString()}</span>
                <span>{nextBadge.threshold.toLocaleString()} needed</span>
              </div>
            </div>
          )}

          {/* Streak milestones */}
          <div className="fade-up d4 glass rounded-3xl p-5"
            style={{ border:'1px solid rgba(249,115,22,0.12)' }}>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-4">
              🏁 Streak Milestones
            </div>
            {[3,7,14,30,60,100].map(m => {
              const reached = (user?.longestStreak || 0) >= m;
              return (
                <div key={m} className="milestone">
                  <div className="text-base">{reached ? '✅' : '⭕'}</div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold" style={{ color: reached ? '#f97316' : '#475569' }}>
                      {m} Days
                    </span>
                  </div>
                  {reached && <span className="text-xs text-slate-600">reached!</span>}
                  {!reached && (
                    <span className="text-xs text-slate-700">
                      {m - (user?.currentStreak || 0)} more days
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Right: Level + Badges + Heatmap ─── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Level progress */}
          {user?.level && (
            <div className="fade-up d2">
              <LevelProgress levelInfo={user.level} xp={user.totalXP || 0} />
            </div>
          )}

          {/* All levels roadmap */}
          <div className="fade-up d3 glass rounded-3xl p-5"
            style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-4">
              🗺️ Level Roadmap
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {[
                { level:1, name:'Beginner', minXP:0,    icon:'🌱', color:'#94a3b8' },
                { level:2, name:'Scholar',  minXP:500,  icon:'📗', color:'#34d399' },
                { level:3, name:'Expert',   minXP:1500, icon:'💡', color:'#38bdf8' },
                { level:4, name:'Master',   minXP:3000, icon:'🔮', color:'#a78bfa' },
                { level:5, name:'Legend',   minXP:6000, icon:'👑', color:'#fbbf24' },
              ].map((l, i, arr) => {
                const reached = (user?.totalXP || 0) >= l.minXP;
                const current = user?.level?.level === l.level;
                return (
                  <div key={l.level} className="flex items-center">
                    <div className="flex flex-col items-center px-3">
                      <div className="text-xl mb-1" style={{ filter: reached ? 'none' : 'grayscale(1) opacity(0.3)' }}>
                        {l.icon}
                      </div>
                      <div className="text-xs font-bold" style={{ color: current ? l.color : reached ? '#94a3b8' : '#334155', fontFamily:'Syne' }}>
                        {l.name}
                      </div>
                      <div className="text-xs text-slate-700">{l.minXP.toLocaleString()}+</div>
                      {current && <div className="text-xs mt-1 px-2 py-0.5 rounded-full" style={{ background:`${l.color}20`, color:l.color, border:`1px solid ${l.color}40` }}>you</div>}
                    </div>
                    {i < arr.length - 1 && (
                      <div className="h-px w-8 flex-shrink-0"
                        style={{ background: reached ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.05)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabs */}
          <div className="fade-up d4 flex gap-2">
            <button onClick={() => setTab('badges')}   className={`tab-btn ${tab==='badges'   ? 'active':''}`}>🏅 All Badges</button>
            <button onClick={() => setTab('heatmap')}  className={`tab-btn ${tab==='heatmap'  ? 'active':''}`}>📅 Activity Map</button>
          </div>

          {/* Badges grid */}
          {tab === 'badges' && (
            <div className="fade-up d5">
              {/* Group by type */}
              {['streak','xp','sessions','hours'].map(type => {
                const typeBadges = allBadges.filter(b => b.type === type);
                const typeLabels = { streak:'🔥 Streak Badges', xp:'⚡ XP Badges', sessions:'📚 Session Badges', hours:'⏰ Hours Badges' };
                return (
                  <div key={type} className="mb-6">
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">{typeLabels[type]}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {typeBadges.map(badge => (
                        <BadgeCard
                          key={badge.id}
                          badge={badge}
                          earned={earnedBadges.includes(badge.id)}
                          progress={getBadgeProgress(badge)}
                          total={badge.threshold}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Activity heatmap */}
          {tab === 'heatmap' && (
            <div className="fade-up d5 glass rounded-3xl p-6"
              style={{ border:'1px solid rgba(139,92,246,0.15)' }}>
              <div className="text-sm font-semibold text-white mb-1" style={{ fontFamily:'Syne' }}>
                30-Day Activity Heatmap
              </div>
              <div className="text-xs text-slate-500 mb-5">
                Each square = one day. Darker = more study time.
              </div>
              <ActivityHeatmap activityMap={activityMap} />

              {/* This month summary */}
              <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
                {[
                  {
                    val: Object.keys(activityMap).filter(k =>
                      new Date(k) >= new Date(Date.now() - 30 * 86400000)
                    ).length,
                    label: 'Active Days',
                    color: '#a78bfa',
                  },
                  {
                    val: Math.round(
                      Object.values(activityMap).reduce((a,b) => a+b, 0) / 3600
                    ) + 'h',
                    label: '30-Day Hours',
                    color: '#38bdf8',
                  },
                  {
                    val: Math.round(
                      Object.values(activityMap).reduce((a,b)=>a+b,0) /
                      Math.max(1, Object.keys(activityMap).length) / 60
                    ) + 'm',
                    label: 'Avg Per Day',
                    color: '#34d399',
                  },
                ].map(({ val, label, color }) => (
                  <div key={label}>
                    <div className="text-xl font-black" style={{ fontFamily:'Syne', color }}>{val}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}