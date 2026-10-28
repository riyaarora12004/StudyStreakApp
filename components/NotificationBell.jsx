'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

const TYPE_COLORS = {
  streak_risk:  '#f87171',
  milestone:    '#fbbf24',
  quiz_unlock:  '#34d399',
  exam_soon:    '#f97316',
  achievement:  '#a78bfa',
  star_earned:  '#fbbf24',
};

export default function NotificationBell() {
  const [notifs,    setNotifs]    = useState([]);
  const [unread,    setUnread]    = useState(0);
  const [open,      setOpen]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const ref = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res  = await fetch('/api/notifications');
      const data = await res.json();
      setNotifs(data.notifications || []);
      setUnread(data.unreadCount   || 0);
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(p => !p);
    if (!open && unread > 0) {
      // Mark all as read after 2 seconds of viewing
      setTimeout(async () => {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAllRead: true }),
        });
        setUnread(0);
        setNotifs(p => p.map(n => ({ ...n, read: true })));
      }, 2000);
    }
  };

  const timeAgo = (date) => {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60)   return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400)return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
  };

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <style>{`
        @keyframes bellShake{0%,100%{transform:rotate(0)}20%{transform:rotate(-12deg)}40%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(8deg)}}
        .bell-shake{animation:bellShake .6s ease;}
        @keyframes dropIn{from{opacity:0;transform:translateY(-8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .notif-drop{animation:dropIn .2s cubic-bezier(0.34,1.56,0.64,1)}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
      `}</style>

      {/* Bell button */}
      <button onClick={handleOpen}
        style={{ position:'relative',width:38,height:38,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',transition:'all .2s',fontSize:18 }}
        className={unread > 0 ? 'bell-shake' : ''}>
        🔔
        {unread > 0 && (
          <span style={{ position:'absolute',top:-4,right:-4,minWidth:18,height:18,borderRadius:9,background:'linear-gradient(135deg,#ef4444,#f97316)',color:'white',fontSize:10,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',padding:'0 4px',fontFamily:'Syne,sans-serif',animation:'pulse 2s ease-in-out infinite',boxShadow:'0 0 8px rgba(239,68,68,0.6)' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="notif-drop" style={{ position:'absolute',right:0,top:46,width:320,maxWidth:'90vw',background:'rgba(5,8,18,0.98)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:20,boxShadow:'0 24px 60px rgba(0,0,0,0.6)',overflow:'hidden',zIndex:200 }}>
          {/* Header */}
          <div style={{ padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
            <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'white' }}>🔔 Notifications</span>
            {unread > 0 && (
              <span style={{ fontSize:11,color:'#64748b' }}>{unread} unread</span>
            )}
          </div>

          {/* Notification list */}
          <div style={{ maxHeight:360,overflowY:'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding:32,textAlign:'center',color:'#475569',fontSize:13 }}>
                <div style={{ fontSize:28,marginBottom:8 }}>✅</div>
                All caught up!
              </div>
            ) : (
              notifs.map(n => (
                <div key={n._id} onClick={() => setOpen(false)}
                  style={{ padding:'12px 18px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',gap:12,alignItems:'flex-start',background:n.read?'transparent':'rgba(255,255,255,0.02)',transition:'background .15s',cursor:'pointer' }}>
                  {/* Icon */}
                  <div style={{ width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0,background:(TYPE_COLORS[n.type]||'#64748b')+'15',border:'1px solid '+(TYPE_COLORS[n.type]||'#64748b')+'30' }}>
                    {n.icon || '🔔'}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:n.read?'#94a3b8':'white',marginBottom:2 }}>{n.title}</div>
                    <div style={{ fontSize:12,color:'#475569',lineHeight:1.4 }}>{n.message}</div>
                    <div style={{ fontSize:10,color:'#334155',marginTop:4 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && (
                    <div style={{ width:7,height:7,borderRadius:'50%',background:TYPE_COLORS[n.type]||'#7c3aed',flexShrink:0,marginTop:4,boxShadow:'0 0 6px '+(TYPE_COLORS[n.type]||'#7c3aed') }} />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding:'10px 18px',borderTop:'1px solid rgba(255,255,255,0.06)',textAlign:'center' }}>
            <Link href="/dashboard/rewards" onClick={() => setOpen(false)}
              style={{ fontSize:12,color:'#64748b',textDecoration:'none',hover:'color:white' }}>
              View Rewards & Stars →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 