'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// ── Confetti burst ────────────────────────────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 40 });
  const colors = ['#fbbf24','#f97316','#a78bfa','#34d399','#38bdf8','#f87171','#fff'];
  return (
    <div style={{ position:'fixed',inset:0,pointerEvents:'none',zIndex:100,overflow:'hidden' }}>
      {pieces.map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: Math.random() * 100 + 'vw',
          top: '-20px',
          width: 8 + Math.random() * 8,
          height: 8 + Math.random() * 8,
          background: colors[i % colors.length],
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `fall ${2 + Math.random() * 2}s ease-in ${Math.random() * 1.5}s forwards`,
          transform: `rotate(${Math.random() * 360}deg)`,
          opacity: 0,
        }} />
      ))}
    </div>
  );
}

// ── Milestone celebration modal ───────────────────────────────────────────────
function MilestoneCelebration({ milestone, onClaim }) {
  const [claiming, setClaiming] = useState(false);
  const handleClaim = async () => {
    setClaiming(true);
    await onClaim(milestone.days);
    setClaiming(false);
  };
  return (
    <div style={{ position:'fixed',inset:0,zIndex:90,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(12px)' }}>
      <div style={{ background:'rgba(5,8,18,0.98)',border:'2px solid ' + milestone.color + '50',borderRadius:32,maxWidth:420,width:'100%',padding:44,textAlign:'center',boxShadow:'0 0 80px ' + milestone.color + '30, 0 40px 80px rgba(0,0,0,0.7)',position:'relative',overflow:'hidden' }}>
        {/* Glow bg */}
        <div style={{ position:'absolute',inset:0,background:'radial-gradient(circle at 50% 30%,' + milestone.color + '10,transparent 70%)',pointerEvents:'none' }} />

        <div style={{ fontSize:72,marginBottom:16,lineHeight:1,filter:'drop-shadow(0 0 20px ' + milestone.color + ')' }}>
          {milestone.icon}
        </div>

        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:'clamp(1.6rem,5vw,2.2rem)',color:'white',marginBottom:8,letterSpacing:'-1px' }}>
          🎉 Milestone Hit!
        </div>
        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:20,color:milestone.color,marginBottom:6 }}>
          {milestone.label}
        </div>
        <div style={{ color:'#94a3b8',fontSize:14,marginBottom:32,lineHeight:1.6 }}>
          You've been studying consistently for <strong style={{ color:'white' }}>{milestone.days} days</strong>!
          {milestone.stars > 0 && <span> You've earned <strong style={{ color:'#fbbf24' }}>{milestone.stars} star{milestone.stars>1?'s':''}⭐</strong>!</span>}
        </div>

        {milestone.stars > 0 && (
          <div style={{ display:'flex',justifyContent:'center',gap:6,marginBottom:28 }}>
            {Array.from({ length: milestone.stars }).map((_, i) => (
              <span key={i} style={{ fontSize:28,filter:'drop-shadow(0 0 8px #fbbf24)',animation:'starPop .3s ease ' + i*0.1 + 's both' }}>⭐</span>
            ))}
          </div>
        )}

        <button onClick={handleClaim} disabled={claiming}
          style={{ width:'100%',padding:'16px 0',borderRadius:20,border:'none',background:'linear-gradient(135deg,' + milestone.color + ',' + milestone.color + 'aa)',color:'#000',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,cursor:'pointer',boxShadow:'0 0 40px ' + milestone.color + '60',transition:'all .2s' }}>
          {claiming ? '⏳ Claiming...' : milestone.stars > 0 ? 'Claim ' + milestone.stars + ' Star' + (milestone.stars>1?'s':'') + '! ⭐' : '🎯 Awesome! Continue Streak'}
        </button>
      </div>
    </div>
  );
}

// ── 90-day calendar heatmap ───────────────────────────────────────────────────
function CalendarHeatmap({ activityData }) {
  const [hovered, setHovered] = useState(null);

  // Build 90-day grid
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key  = d.toISOString().split('T')[0];
    const data = activityData[key] || { minutes: 0, sessions: 0 };
    days.push({ date: d, key, ...data });
  }

  // Group into weeks
  const weeks = [];
  let week = [];
  // Pad first week
  const firstDay = days[0].date.getDay();
  for (let i = 0; i < firstDay; i++) week.push(null);
  days.forEach(d => {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const getColor = (mins) => {
    if (!mins) return 'rgba(255,255,255,0.04)';
    if (mins < 15) return 'rgba(139,92,246,0.25)';
    if (mins < 30) return 'rgba(139,92,246,0.45)';
    if (mins < 60) return 'rgba(139,92,246,0.65)';
    if (mins < 120) return 'rgba(139,92,246,0.82)';
    return '#a78bfa';
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div style={{ overflowX:'auto' }}>
      {/* Day labels */}
      <div style={{ display:'flex',marginBottom:6 }}>
        <div style={{ width:32 }} />
        {['S','M','T','W','T','F','S'].map((d,i) => (
          <div key={i} style={{ flex:1,textAlign:'center',fontSize:10,color:'#334155',minWidth:16 }}>{d}</div>
        ))}
      </div>

      <div style={{ display:'flex',gap:4,alignItems:'flex-start' }}>
        {/* Month labels on left */}
        <div style={{ display:'flex',flexDirection:'column',gap:0,width:28,flexShrink:0 }}>
          {weeks.map((week, wi) => {
            const firstReal = week.find(d => d);
            const showMonth = firstReal && firstReal.date.getDate() <= 7;
            return (
              <div key={wi} style={{ height:16,fontSize:9,color:'#334155',display:'flex',alignItems:'center',marginBottom:3 }}>
                {showMonth ? months[firstReal.date.getMonth()] : ''}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div style={{ flex:1,display:'flex',flexDirection:'column',gap:3 }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{ display:'flex',gap:3 }}>
              {week.map((day, di) => (
                <div key={di} style={{ flex:1,aspectRatio:'1',minWidth:12,maxWidth:18,borderRadius:3,position:'relative',cursor:day?'pointer':'default',transition:'transform .15s',background:day ? getColor(day.minutes) : 'transparent' }}
                  onMouseEnter={() => day && setHovered({ ...day, x: wi, y: di })}
                  onMouseLeave={() => setHovered(null)}
                  title={day ? day.date.toLocaleDateString('en-US',{month:'short',day:'numeric'}) + ': ' + day.minutes + ' min' : ''}>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div style={{ marginTop:12,padding:'8px 14px',background:'rgba(8,12,24,0.95)',border:'1px solid rgba(139,92,246,0.3)',borderRadius:10,fontSize:12,color:'white',display:'inline-block' }}>
          <strong>{hovered.date.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</strong>
          {' — '}{hovered.minutes > 0 ? hovered.minutes + ' min · ' + hovered.sessions + ' session' + (hovered.sessions!==1?'s':'') : 'No study'}
        </div>
      )}

      {/* Legend */}
      <div style={{ display:'flex',alignItems:'center',gap:6,marginTop:12,flexWrap:'wrap' }}>
        <span style={{ fontSize:11,color:'#334155' }}>Less</span>
        {['rgba(255,255,255,0.04)','rgba(139,92,246,0.25)','rgba(139,92,246,0.45)','rgba(139,92,246,0.65)','#a78bfa'].map((c,i) => (
          <div key={i} style={{ width:13,height:13,borderRadius:3,background:c }} />
        ))}
        <span style={{ fontSize:11,color:'#334155' }}>More</span>
        <span style={{ fontSize:11,color:'#475569',marginLeft:8 }}>
          {Object.values(activityData).filter(d => d.minutes > 0).length} active days in last 90 days
        </span>
      </div>
    </div>
  );
}

// ── Stars wallet card ─────────────────────────────────────────────────────────
function StarsWallet({ availableStars, totalStars, redeemedStars, bestDiscount, discountTable }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div style={{ background:'linear-gradient(135deg,rgba(251,191,36,0.06),rgba(249,115,22,0.06))',border:'1px solid rgba(251,191,36,0.2)',borderRadius:24,padding:24 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12 }}>
        <div>
          <div style={{ fontSize:11,color:'#92400e',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4 }}>⭐ Stars Wallet</div>
          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:'clamp(2rem,5vw,3rem)',color:'#fbbf24',lineHeight:1 }}>
            {availableStars}
            <span style={{ fontSize:16,color:'#92400e',fontWeight:600,marginLeft:6 }}>available</span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:12,color:'#78350f',marginBottom:2 }}>{totalStars} total earned · {redeemedStars} redeemed</div>
          {bestDiscount ? (
            <div style={{ background:'rgba(251,191,36,0.15)',border:'1px solid rgba(251,191,36,0.3)',borderRadius:12,padding:'8px 16px',display:'inline-block' }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:'#fbbf24' }}>{bestDiscount.discount}% OFF</div>
              <div style={{ fontSize:11,color:'#78350f' }}>discount available</div>
            </div>
          ) : (
            <div style={{ fontSize:12,color:'#78350f' }}>Earn 1 star for 5% off</div>
          )}
        </div>
      </div>

      {/* Star visual */}
      <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:16 }}>
        {Array.from({ length: Math.min(availableStars, 20) }).map((_, i) => (
          <span key={i} style={{ fontSize:22,filter:'drop-shadow(0 0 6px #fbbf24)',animation:'starFloat ' + (2 + (i%3)*0.5) + 's ease-in-out ' + (i*0.1) + 's infinite alternate' }}>⭐</span>
        ))}
        {availableStars > 20 && <span style={{ fontSize:14,color:'#92400e',alignSelf:'center' }}>+{availableStars-20} more</span>}
        {availableStars === 0 && <span style={{ fontSize:13,color:'#78350f' }}>Keep your streak going to earn stars!</span>}
      </div>

      {/* Discount table toggle */}
      <button onClick={() => setShowTable(p=>!p)}
        style={{ background:'transparent',border:'1px solid rgba(251,191,36,0.25)',borderRadius:10,padding:'6px 14px',color:'#92400e',fontSize:12,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600 }}>
        {showTable ? '▲ Hide' : '▼ View'} Discount Table
      </button>

      {showTable && (
        <div style={{ marginTop:14,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8 }}>
          {discountTable.map(d => (
            <div key={d.stars} style={{ background:availableStars>=d.stars?'rgba(251,191,36,0.12)':'rgba(255,255,255,0.03)',border:'1px solid ' + (availableStars>=d.stars?'rgba(251,191,36,0.3)':'rgba(255,255,255,0.07)'),borderRadius:12,padding:'10px 12px',textAlign:'center' }}>
              <div style={{ fontSize:15,fontWeight:800,fontFamily:'Syne,sans-serif',color:availableStars>=d.stars?'#fbbf24':'#475569' }}>{d.discount}% OFF</div>
              <div style={{ fontSize:11,color:availableStars>=d.stars?'#92400e':'#334155' }}>{d.stars} star{d.stars>1?'s':''}</div>
              {availableStars >= d.stars && <div style={{ fontSize:10,color:'#34d399',marginTop:2 }}>✓ Available</div>}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop:16,fontSize:12,color:'#78350f',background:'rgba(251,191,36,0.06)',borderRadius:10,padding:'10px 14px' }}>
        ⏳ Stars expire 90 days after earning · Contact support to redeem your discount code
      </div>
    </div>
  );
}

// ── Milestone roadmap ─────────────────────────────────────────────────────────
function MilestoneRoadmap({ milestones, currentStreak, celebrated }) {
  return (
    <div style={{ position:'relative' }}>
      {/* Connecting line */}
      <div style={{ position:'absolute',left:20,top:20,bottom:20,width:2,background:'rgba(255,255,255,0.06)',zIndex:0 }} />

      <div style={{ display:'flex',flexDirection:'column',gap:12,position:'relative',zIndex:1 }}>
        {milestones.map(m => {
          const done      = celebrated.includes(m.days);
          const current   = currentStreak >= m.days;
          const progress  = Math.min(100, Math.round((currentStreak / m.days) * 100));
          const remaining = Math.max(0, m.days - currentStreak);

          return (
            <div key={m.days} style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:18,background:done?'rgba(251,191,36,0.06)':current?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.02)',border:'1px solid ' + (done?'rgba(251,191,36,0.25)':current?'rgba(255,255,255,0.1)':'rgba(255,255,255,0.04)'),transition:'all .2s' }}>
              {/* Icon */}
              <div style={{ width:40,height:40,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,background:done||current?m.color+'18':'rgba(255,255,255,0.04)',border:'1px solid ' + (done||current?m.color+'40':'rgba(255,255,255,0.07)'),boxShadow:done?'0 0 16px ' + m.color + '40':'none' }}>
                {done ? '✅' : m.icon}
              </div>

              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:done?0:6 }}>
                  <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:done||current?'white':'#475569' }}>{m.label}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:done?'#fbbf24':current?m.color:'#334155',fontFamily:'Syne,sans-serif' }}>
                    {done ? '✓ Claimed' : current ? 'Reached!' : remaining + ' days left'}
                  </span>
                </div>
                {!done && (
                  <div style={{ height:4,borderRadius:4,background:'rgba(255,255,255,0.05)',overflow:'hidden' }}>
                    <div style={{ height:'100%',borderRadius:4,width:progress+'%',background:current?'linear-gradient(90deg,'+m.color+'88,'+m.color+')':'rgba(255,255,255,0.1)',boxShadow:current?'0 0 8px '+m.color+'60':'none',transition:'width 1s ease' }} />
                  </div>
                )}
              </div>

              {/* Stars badge */}
              {m.stars > 0 && (
                <div style={{ flexShrink:0,textAlign:'center',background:done?'rgba(251,191,36,0.1)':'rgba(255,255,255,0.03)',border:'1px solid ' + (done?'rgba(251,191,36,0.3)':'rgba(255,255,255,0.07)'),borderRadius:10,padding:'4px 10px' }}>
                  <div style={{ fontSize:13,fontWeight:700,color:done?'#fbbf24':'#334155',fontFamily:'Syne,sans-serif' }}>+{m.stars}⭐</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RewardsPage() {
  const [data,           setData]           = useState(null);
  const [activity,       setActivity]       = useState({});
  const [loading,        setLoading]        = useState(true);
  const [pendingMilestone, setPending]      = useState(null);   // next uncelebrated milestone
  const [showConfetti,   setShowConfetti]   = useState(false);
  const [activeTab,      setActiveTab]      = useState('overview');
  const [claimedStars,   setClaimedStars]   = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/stars').then(r => r.json()),
      fetch('/api/analytics').then(r => r.json()),
    ]).then(([starsData, analyticsData]) => {
      setData(starsData);
      // Build activity map from 14-day data + fill rest
      const map = {};
      (analyticsData.dailyData || []).forEach(d => {
        const dateObj = new Date(d.date);
        const key = dateObj.toISOString().split('T')[0];
        map[key] = { minutes: d.minutes, sessions: d.sessions };
      });
      setActivity(map);
      setLoading(false);

      // Show first uncelebrated milestone
      if (starsData.newMilestones?.length > 0) {
        setTimeout(() => setPending(starsData.newMilestones[0]), 500);
      }
    });
  }, []);

  const handleClaimMilestone = async (days) => {
    const res  = await fetch('/api/stars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ milestoneDays: days }),
    });
    const result = await res.json();

    if (res.ok && result.starsAwarded > 0) {
      setShowConfetti(true);
      setClaimedStars(result.starsAwarded);
      setTimeout(() => setShowConfetti(false), 4000);
    }

    setPending(null);
    // Refresh data
    fetch('/api/stars').then(r => r.json()).then(d => setData(d));
  };

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:320 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48,animation:'spin 2s linear infinite',display:'inline-block' }}>⭐</div>
        <div style={{ color:'#64748b',fontSize:13,marginTop:12 }}>Loading rewards...</div>
      </div>
    </div>
  );

  const { totalStars=0, availableStars=0, redeemedStars=0, currentStreak=0, longestStreak=0, milestones=[], celebratedMilestones=[], bestDiscount, discountTable=[], starHistory=[] } = data || {};

  const activeDays   = Object.values(activity).filter(d => d.minutes > 0).length;
  const totalMinutes = Object.values(activity).reduce((a, d) => a + (d.minutes||0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800;900&family=DM+Sans:wght@400;500&display=swap');
        @keyframes fu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .4s ease forwards}
        .d1{animation-delay:.03s;opacity:0}.d2{animation-delay:.1s;opacity:0}.d3{animation-delay:.18s;opacity:0}.d4{animation-delay:.26s;opacity:0}
        @keyframes fall{0%{opacity:1;transform:translateY(0) rotate(0deg)}100%{opacity:0;transform:translateY(100vh) rotate(720deg)}}
        @keyframes starPop{0%{transform:scale(0) rotate(-30deg)}60%{transform:scale(1.3)}100%{transform:scale(1)}}
        @keyframes starFloat{from{transform:translateY(0)}to{transform:translateY(-4px)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes flamePulse{0%,100%{transform:scaleY(1) scaleX(1)}50%{transform:scaleY(1.08) scaleX(0.96)}}
        .grad{background:linear-gradient(135deg,#fbbf24,#f97316);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .grad2{background:linear-gradient(135deg,#a78bfa,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .glass{background:rgba(255,255,255,0.03);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.07)}
        .tab{padding:9px 20px;border-radius:12px;cursor:pointer;font-weight:600;font-size:13px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:#475569;transition:all .2s;font-family:'Syne',sans-serif}
        .tab.on{background:rgba(251,191,36,0.12);border-color:rgba(251,191,36,0.35);color:#fbbf24}
        .stat-c{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:20px;text-align:center;transition:all .2s}
        .stat-c:hover{transform:translateY(-3px);box-shadow:0 16px 40px rgba(0,0,0,0.3)}
      `}</style>

      <Confetti active={showConfetti} />
      {pendingMilestone && (
        <MilestoneCelebration
          milestone={pendingMilestone}
          onClaim={handleClaimMilestone}
        />
      )}

      {/* ─── Header ─── */}
      <div className="fu d1" style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:900,letterSpacing:'-1px',margin:0,fontFamily:'Syne,sans-serif' }}>
          Stars & <span className="grad">Rewards</span>
        </h1>
        <p style={{ color:'#64748b',fontSize:13,marginTop:4 }}>
          Maintain your streak, earn stars, unlock premium discounts
        </p>
      </div>

      {/* ─── Top stat cards ─── */}
      <div className="fu d2" style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14,marginBottom:24 }}>
        {[
          { icon:'🔥', val: currentStreak, suffix:'d', label:'Current Streak', color:'#f97316', glow:'rgba(249,115,22,0.3)' },
          { icon:'⭐', val: availableStars, suffix:'',  label:'Available Stars', color:'#fbbf24', glow:'rgba(251,191,36,0.3)' },
          { icon:'📅', val: activeDays,    suffix:'d', label:'Active Days (90d)', color:'#a78bfa', glow:'rgba(139,92,246,0.3)' },
          { icon:'🏆', val: longestStreak, suffix:'d', label:'Best Streak',      color:'#34d399', glow:'rgba(52,211,153,0.3)' },
        ].map(({ icon, val, suffix, label, color, glow }) => (
          <div key={label} className="stat-c">
            <div style={{ fontSize:26,marginBottom:6 }}>{icon}</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:28,color,textShadow:'0 0 20px ' + glow }}>{val}{suffix}</div>
            <div style={{ fontSize:12,color:'#64748b',marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ─── Tabs ─── */}
      <div className="fu d2" style={{ display:'flex',gap:8,marginBottom:24,flexWrap:'wrap' }}>
        {[
          { id:'overview',  label:'🌟 Overview'  },
          { id:'calendar',  label:'📅 Calendar'  },
          { id:'stars',     label:'⭐ Stars'      },
          { id:'milestones',label:'🏁 Milestones' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={'tab' + (activeTab===t.id?' on':'')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="fu" style={{ display:'flex',flexDirection:'column',gap:20 }}>
          {/* Flame + streak */}
          <div className="glass" style={{ borderRadius:24,padding:28,textAlign:'center',border:'1px solid rgba(249,115,22,0.2)',background:'linear-gradient(135deg,rgba(249,115,22,0.05),rgba(251,191,36,0.05))' }}>
            <div style={{ fontSize:80,lineHeight:1,marginBottom:12,display:'inline-block',animation:'flamePulse 2s ease-in-out infinite',filter:'drop-shadow(0 0 20px #f97316)' }}>
              🔥
            </div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:'clamp(3rem,8vw,5rem)',color:'#f97316',lineHeight:1,letterSpacing:'-2px' }}>
              {currentStreak}
            </div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'white',marginTop:4 }}>
              Day Streak
            </div>
            <div style={{ fontSize:13,color:'#78350f',marginTop:8 }}>
              {currentStreak === 0
                ? 'Start studying today to begin your streak!'
                : currentStreak < 7
                  ? 'Keep going! ' + (7 - currentStreak) + ' days to your first star ⭐'
                  : 'Amazing consistency! Keep it up!'}
            </div>
          </div>

          {/* Quick stats row */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12 }}>
            {[
              { label:'Total Hours',    val: Math.round(totalMinutes/60 * 10)/10 + 'h', icon:'⏱️' },
              { label:'Stars Earned',   val: totalStars + ' ⭐',    icon:'🌟' },
              { label:'Best Discount',  val: bestDiscount ? bestDiscount.discount + '%' : '—', icon:'💰' },
              { label:'Next Milestone', val: (() => { const next = milestones.find(m => !celebratedMilestones.includes(m.days) && m.days > currentStreak); return next ? next.days - currentStreak + 'd' : 'Max!'; })(), icon:'🏁' },
            ].map(({ label, val, icon }) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:16,padding:16,textAlign:'center' }}>
                <div style={{ fontSize:20,marginBottom:6 }}>{icon}</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'white' }}>{val}</div>
                <div style={{ fontSize:11,color:'#475569',marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Star history */}
          {starHistory.length > 0 && (
            <div className="glass" style={{ borderRadius:20,padding:20 }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'white',marginBottom:14 }}>⭐ Star History</div>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {starHistory.map((h, i) => (
                  <div key={i} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:12,background:'rgba(251,191,36,0.05)',border:'1px solid rgba(251,191,36,0.12)' }}>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600,color:'white' }}>{h.reason}</div>
                      <div style={{ fontSize:11,color:'#64748b',marginTop:1 }}>
                        {new Date(h.earnedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                        {h.expiresAt && <span style={{ color:'#92400e' }}> · expires {new Date(h.expiresAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>}
                      </div>
                    </div>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:18,color:'#fbbf24' }}>+{h.stars}⭐</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── CALENDAR TAB ─── */}
      {activeTab === 'calendar' && (
        <div className="fu" style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div className="glass" style={{ borderRadius:24,padding:24 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,color:'white',marginBottom:4 }}>📅 90-Day Activity Calendar</div>
            <div style={{ fontSize:12,color:'#475569',marginBottom:20 }}>Your study consistency over the last 3 months</div>
            <CalendarHeatmap activityData={activity} />
          </div>

          {/* Month summary */}
          <div className="glass" style={{ borderRadius:20,padding:20 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'white',marginBottom:14 }}>📊 Summary</div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10 }}>
              {[
                { icon:'📅', val: activeDays, label:'Active Days',    color:'#a78bfa' },
                { icon:'⏱️', val: Math.round(totalMinutes/60*10)/10+'h', label:'Total Hours', color:'#38bdf8' },
                { icon:'📈', val: Math.round(activeDays/90*100)+'%', label:'Consistency', color:'#34d399' },
                { icon:'🔥', val: currentStreak+'d', label:'Current Streak', color:'#f97316' },
              ].map(({ icon, val, label, color }) => (
                <div key={label} style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:14,textAlign:'center' }}>
                  <div style={{ fontSize:18,marginBottom:4 }}>{icon}</div>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color }}>{val}</div>
                  <div style={{ fontSize:11,color:'#475569',marginTop:2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── STARS TAB ─── */}
      {activeTab === 'stars' && (
        <div className="fu" style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <StarsWallet
            availableStars={availableStars}
            totalStars={totalStars}
            redeemedStars={redeemedStars}
            bestDiscount={bestDiscount}
            discountTable={discountTable}
          />

          {/* How to earn */}
          <div className="glass" style={{ borderRadius:20,padding:20 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'white',marginBottom:14 }}>🌟 How to Earn Stars</div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {[
                { days:7,  stars:1,  desc:'Maintain a 7-day study streak'   },
                { days:14, stars:2,  desc:'Maintain a 14-day study streak'  },
                { days:30, stars:4,  desc:'Maintain a 30-day study streak'  },
                { days:60, stars:7,  desc:'Maintain a 60-day study streak'  },
                { days:100,stars:15, desc:'Achieve a 100-day legendary streak' },
              ].map(m => (
                <div key={m.days} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:12,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:13,color:currentStreak>=m.days?'white':'#475569' }}>🔥 {m.days}-day streak — {m.desc}</div>
                  <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#fbbf24',flexShrink:0,marginLeft:12 }}>+{m.stars}⭐</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:14,fontSize:12,color:'#475569',background:'rgba(255,255,255,0.02)',borderRadius:10,padding:'10px 14px' }}>
              ⏳ Stars expire 90 days after earning · Stars can be stacked for bigger discounts · Contact support to apply your discount
            </div>
          </div>
        </div>
      )}

      {/* ─── MILESTONES TAB ─── */}
      {activeTab === 'milestones' && (
        <div className="fu" style={{ display:'flex',flexDirection:'column',gap:16 }}>
          <div className="glass" style={{ borderRadius:24,padding:24 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:15,color:'white',marginBottom:4 }}>🏁 Streak Milestones</div>
            <div style={{ fontSize:12,color:'#475569',marginBottom:20 }}>Hit these milestones to earn stars and unlock rewards</div>
            <MilestoneRoadmap
              milestones={milestones}
              currentStreak={currentStreak}
              celebrated={celebratedMilestones}
            />
          </div>

          {/* Unclaimed milestones */}
          {milestones.filter(m => currentStreak >= m.days && !celebratedMilestones.includes(m.days)).length > 0 && (
            <div style={{ background:'linear-gradient(135deg,rgba(251,191,36,0.08),rgba(249,115,22,0.08))',border:'1px solid rgba(251,191,36,0.25)',borderRadius:20,padding:20 }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#fbbf24',marginBottom:12 }}>🎉 Unclaimed Milestones!</div>
              {milestones.filter(m => currentStreak >= m.days && !celebratedMilestones.includes(m.days)).map(m => (
                <div key={m.days} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8 }}>
                  <span style={{ fontSize:14,color:'white' }}>{m.icon} {m.label}</span>
                  <button onClick={() => setPending(m)}
                    style={{ padding:'8px 18px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#fbbf24,#f97316)',color:'#000',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,cursor:'pointer' }}>
                    Claim {m.stars > 0 ? m.stars + '⭐' : '🎯'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
} 