'use client';

import { useEffect, useState } from 'react';

// ── Podium (top 3) ────────────────────────────────────────────────────────────
function Podium({ top3 }) {
  if (!top3 || top3.length < 1) return null;

  const order  = [top3[1], top3[0], top3[2]].filter(Boolean); // 2nd, 1st, 3rd
  const heights = [160, 210, 130];
  const colors  = ['#94a3b8', '#fbbf24', '#cd7c2f'];
  const glows   = ['rgba(148,163,184,0.4)', 'rgba(251,191,36,0.5)', 'rgba(205,124,47,0.4)'];
  const sizes   = [48, 64, 44];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, marginBottom: 32, paddingTop: 20 }}>
      {order.map((user, i) => {
        if (!user) return <div key={i} style={{ width: 100 }} />;
        const isFirst = user.rank === 1;
        return (
          <div key={user.rank} className={'podium-' + i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100 }}>
            {/* Crown for 1st */}
            {isFirst && (
              <div style={{ fontSize: 28, marginBottom: 4, filter: 'drop-shadow(0 0 12px #fbbf24)', animation: 'crownFloat 3s ease-in-out infinite' }}>
                👑
              </div>
            )}

            {/* Avatar */}
            <div style={{
              width: sizes[i], height: sizes[i], borderRadius: '50%',
              background: 'linear-gradient(135deg,' + colors[i] + '33,' + colors[i] + '55)',
              border: '3px solid ' + colors[i],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: sizes[i] * 0.45,
              marginBottom: 8,
              boxShadow: '0 0 20px ' + glows[i],
              position: 'relative',
            }}>
              {user.name.charAt(0).toUpperCase()}
              {user.isMe && (
                <div style={{ position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#34d399', border: '2px solid #030612', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>✓</div>
              )}
            </div>

            {/* Name */}
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: user.isMe ? '#34d399' : 'white', textAlign: 'center', marginBottom: 4, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.isMe ? 'You' : user.name}
            </div>

            {/* XP / streak */}
            <div style={{ fontSize: 11, color: colors[i], fontWeight: 700, fontFamily: 'Syne,sans-serif', marginBottom: 6 }}>
              {user.xp?.toLocaleString()} XP
            </div>

            {/* Podium block */}
            <div style={{
              width: '100%', height: heights[i],
              background: 'linear-gradient(180deg,' + colors[i] + '22,' + colors[i] + '08)',
              border: '1px solid ' + colors[i] + '40',
              borderRadius: '12px 12px 0 0',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 12,
              boxShadow: '0 -4px 30px ' + glows[i] + '30',
            }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: i === 1 ? 28 : 22, color: colors[i], filter: 'drop-shadow(0 0 6px ' + glows[i] + ')' }}>
                {user.medal}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Rank row ─────────────────────────────────────────────────────────────────
function RankRow({ user, type, animate, delay }) {
  const isTop3 = user.rank <= 3;
  const colors = { 1: '#fbbf24', 2: '#94a3b8', 3: '#cd7c2f' };
  const rankColor = colors[user.rank] || (user.isMe ? '#34d399' : '#475569');

  return (
    <div className="rank-row" style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 16px', borderRadius: 16,
      background: user.isMe
        ? 'rgba(52,211,153,0.07)'
        : isTop3 ? 'rgba(251,191,36,0.04)' : 'rgba(255,255,255,0.025)',
      border: '1px solid ' + (user.isMe ? 'rgba(52,211,153,0.25)' : isTop3 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)'),
      transition: 'all .2s',
      animation: animate ? 'slideIn .35s ease ' + delay + 's both' : 'none',
      boxShadow: user.isMe ? '0 0 20px rgba(52,211,153,0.08)' : 'none',
    }}>
      {/* Rank */}
      <div style={{ width: 32, textAlign: 'center', flexShrink: 0 }}>
        {user.medal
          ? <span style={{ fontSize: 20 }}>{user.medal}</span>
          : <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 14, color: rankColor }}>{user.rank}</span>
        }
      </div>

      {/* Avatar */}
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: user.isMe ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)', border: '2px solid ' + (user.isMe ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: user.isMe ? '#34d399' : '#94a3b8', flexShrink: 0 }}>
        {user.name.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, color: user.isMe ? '#34d399' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.isMe ? 'You (' + user.name + ')' : user.name}
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 1 }}>
          {type === 'streak'
            ? '🏆 Best: ' + user.longest + ' days'
            : 'Level ' + (user.level || 1)}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {type === 'streak' ? (
          <>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: user.rank <= 3 ? rankColor : user.isMe ? '#34d399' : '#f97316' }}>
              🔥 {user.streak}
            </div>
            <div style={{ fontSize: 10, color: '#475569' }}>day streak</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: user.rank <= 3 ? rankColor : user.isMe ? '#34d399' : '#a78bfa' }}>
              {(user.xp || 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: '#475569' }}>XP</div>
          </>
        )}
      </div>
    </div>
  );
}

// ── My rank card ──────────────────────────────────────────────────────────────
function MyRankCard({ myRank, myStats, totalUsers, type }) {
  const topPct = totalUsers > 0 ? Math.round((1 - (myRank - 1) / totalUsers) * 100) : 0;
  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.08),rgba(56,189,248,0.05))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 20, padding: '18px 20px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4, fontFamily: 'Syne,sans-serif' }}>Your Rank</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 32, color: '#34d399', lineHeight: 1 }}>
            #{myRank}
            <span style={{ fontSize: 14, color: '#475569', fontWeight: 600, marginLeft: 6 }}>of {totalUsers}</span>
          </div>
          <div style={{ fontSize: 12, color: '#34d399', marginTop: 4 }}>Top {100 - topPct + 1}% of all students</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { icon: '⚡', val: (myStats.xp || 0).toLocaleString(), label: 'Total XP' },
            { icon: '🔥', val: myStats.streak + 'd', label: 'Streak' },
            { icon: '🏆', val: myStats.longest + 'd', label: 'Best Streak' },
          ].map(({ icon, val, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, marginBottom: 2 }}>{icon}</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 16, color: 'white' }}>{val}</div>
              <div style={{ fontSize: 10, color: '#475569' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LeaderboardPage() {
  const [board,      setBoard]      = useState([]);
  const [myRank,     setMyRank]     = useState(null);
  const [myStats,    setMyStats]    = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  const [type,       setType]       = useState('xp');     // xp | streak
  const [loading,    setLoading]    = useState(true);
  const [animated,   setAnimated]   = useState(false);

  const fetchBoard = async (t) => {
    setLoading(true);
    setAnimated(false);
    const res  = await fetch('/api/leaderboard?type=' + t);
    const data = await res.json();
    setBoard(data.board || []);
    setMyRank(data.myRank);
    setMyStats(data.myStats);
    setTotalUsers(data.totalUsers || 0);
    setLoading(false);
    setTimeout(() => setAnimated(true), 50);
  };

  useEffect(() => { fetchBoard(type); }, [type]);

  const top3   = board.slice(0, 3);
  const rest   = board.slice(3);
  const myInTop = board.some(u => u.isMe);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800;900&family=DM+Sans:wght@400;500&display=swap');
        @keyframes fu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .4s ease forwards}
        .d1{animation-delay:.03s;opacity:0} .d2{animation-delay:.1s;opacity:0} .d3{animation-delay:.17s;opacity:0}
        @keyframes crownFloat{0%,100%{transform:translateY(0) rotate(-5deg)}50%{transform:translateY(-6px) rotate(5deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmerBg{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .rank-row:hover{transform:translateX(4px);background:rgba(255,255,255,0.04)!important}
        .tab-pill{padding:10px 22px;border-radius:13px;cursor:pointer;font-weight:700;font-size:13px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:#475569;transition:all .2s;font-family:'Syne',sans-serif}
        .tab-pill.on{color:white}
        .tab-pill.xp.on{background:rgba(167,139,250,0.15);border-color:rgba(167,139,250,0.4);color:#a78bfa}
        .tab-pill.streak.on{background:rgba(249,115,22,0.12);border-color:rgba(249,115,22,0.35);color:#f97316}
      `}</style>

      {/* ─── Header ─── */}
      <div className="fu d1" style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', fontWeight: 900, letterSpacing: '-1.5px', margin: '0 0 8px', fontFamily: 'Syne,sans-serif', color: 'white' }}>
          🏆 <span style={{ background: 'linear-gradient(135deg,#fbbf24,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Leaderboard</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
          {totalUsers} students competing · Rankings update in real-time
        </p>

        {/* Type tabs */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className={'tab-pill xp' + (type === 'xp' ? ' on' : '')} onClick={() => setType('xp')}>
            ⚡ XP Rankings
          </button>
          <button className={'tab-pill streak' + (type === 'streak' ? ' on' : '')} onClick={() => setType('streak')}>
            🔥 Streak Rankings
          </button>
        </div>
      </div>

      {/* ─── My rank ─── */}
      {myStats && myRank && (
        <div className="fu d2">
          <MyRankCard myRank={myRank} myStats={myStats} totalUsers={totalUsers} type={type} />
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
          <div style={{ fontSize: 40, marginBottom: 12, animation: 'crownFloat 2s ease-in-out infinite', display: 'inline-block' }}>🏆</div>
          <div style={{ fontSize: 13 }}>Loading rankings...</div>
        </div>
      ) : (
        <div className="fu d3">
          {/* Podium */}
          <Podium top3={top3} />

          {/* Rest of board */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {board.map((user, i) => (
              <RankRow
                key={user.rank}
                user={user}
                type={type}
                animate={animated}
                delay={Math.min(i * 0.04, 0.5)}
              />
            ))}
          </div>

          {/* User not in top 50 */}
          {!myInTop && myStats && myRank && (
            <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#334155', marginBottom: 8, fontFamily: 'Syne,sans-serif' }}>
                — Your position —
              </div>
              <RankRow
                user={{ rank: myRank, name: myStats.name, xp: myStats.xp, streak: myStats.streak, longest: myStats.longest, level: myStats.level, isMe: true, medal: null }}
                type={type}
                animate={false}
                delay={0}
              />
            </div>
          )}

          {/* Motivation */}
          {myRank > 1 && myStats && (
            <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '14px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#64748b' }}>
                {type === 'xp'
                  ? '⚡ Earn ' + ((board[myRank - 2]?.xp || 0) - myStats.xp + 1).toLocaleString() + ' more XP to move up one rank'
                  : '🔥 Keep your streak going — ' + Math.max(0, (board[myRank - 2]?.streak || 0) - myStats.streak + 1) + ' more days to move up'}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}