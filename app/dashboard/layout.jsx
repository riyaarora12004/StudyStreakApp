'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import NotificationBell from '@/components/NotificationBell';
import OfflineBanner from '@/components/OfflineBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';

const navItems = [
  { icon: '🏠', label: 'Dashboard',    href: '/dashboard' },
  { icon: '📚', label: 'Subjects',     href: '/dashboard/subjects' },
  { icon: '🤖', label: 'AI Plan',      href: '/dashboard/ai-plan' },
  { icon: '⏱️', label: 'Timer',        href: '/dashboard/timer' },
  { icon: '🔥', label: 'Streak',       href: '/dashboard/streak' },
  { icon: '📊', label: 'Analytics',    href: '/dashboard/analytics' },
  { icon: '⭐', label: 'Rewards',      href: '/dashboard/rewards' },
  { icon: '💬', label: 'AI Tutor',     href: '/dashboard/doubt-solver' },
  { icon: '📋', label: 'Deadlines',    href: '/dashboard/deadlines' },
  { icon: '🏆', label: 'Leaderboard',  href: '/dashboard/leaderboard' },
  { icon: '📝', label: 'Notes', href: '/dashboard/notes' }
];

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ width:38, height:38, borderRadius:12, border:'1px solid var(--border)', background:'var(--glass)', cursor:'pointer', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s', flexShrink:0 }}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

function InnerLayout({ children }) {
  const pathname          = usePathname();
  const router            = useRouter();
  const { data: session } = useSession();
  const { theme }         = useTheme();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [liveStats,  setLiveStats]  = useState({ streak: 0, xp: 0 });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.style.setProperty('--bg',           '#f1f5f9');
      root.style.setProperty('--sidebar-bg',   'rgba(255,255,255,0.97)');
      root.style.setProperty('--header-bg',    'rgba(241,245,249,0.92)');
      root.style.setProperty('--border',       'rgba(0,0,0,0.07)');
      root.style.setProperty('--border-strong','rgba(0,0,0,0.1)');
      root.style.setProperty('--text',         '#0f172a');
      root.style.setProperty('--text-muted',   '#64748b');
      root.style.setProperty('--glass',        'rgba(0,0,0,0.03)');
      root.style.setProperty('--nav-active',   'rgba(124,58,237,0.1)');
      root.style.setProperty('--nav-hover',    'rgba(124,58,237,0.06)');
      root.style.setProperty('--grid-line',    'rgba(0,0,0,0.035)');
    } else {
      root.style.setProperty('--bg',           '#050810');
      root.style.setProperty('--sidebar-bg',   'rgba(8,12,24,0.97)');
      root.style.setProperty('--header-bg',    'rgba(5,8,16,0.8)');
      root.style.setProperty('--border',       'rgba(139,92,246,0.12)');
      root.style.setProperty('--border-strong','rgba(255,255,255,0.08)');
      root.style.setProperty('--text',         '#e2e8f0');
      root.style.setProperty('--text-muted',   '#64748b');
      root.style.setProperty('--glass',        'rgba(255,255,255,0.03)');
      root.style.setProperty('--nav-active',   'rgba(124,58,237,0.15)');
      root.style.setProperty('--nav-hover',    'rgba(139,92,246,0.08)');
      root.style.setProperty('--grid-line',    'rgba(139,92,246,0.04)');
    }
    document.body.style.background = theme === 'light' ? '#f1f5f9' : '#050810';
    document.body.style.color      = theme === 'light' ? '#0f172a'  : '#e2e8f0';
  }, [theme]);

  useEffect(() => {
    const fetchStats = () => {
      fetch('/api/user/stats')
        .then(r => r.json())
        .then(d => { if (d.streak !== undefined) setLiveStats({ streak: d.streak, xp: d.xp }); })
        .catch(() => {});
    };
    fetchStats();
    const t = setInterval(fetchStats, 30000);
    return () => clearInterval(t);
  }, []);

  const displayStreak = liveStats.streak || session?.user?.currentStreak || 0;
  const displayXP     = liveStats.xp     || session?.user?.totalXP       || 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'DM Sans',sans-serif; transition:background .3s,color .3s; overflow-x:hidden; }
        h1,h2,h3,h4 { font-family:'Syne',sans-serif; }

        .sidebar { background:var(--sidebar-bg); backdrop-filter:blur(24px); border-right:1px solid var(--border); transition:width .3s cubic-bezier(.4,0,.2,1),background .3s; }

        .nav-item { display:flex; align-items:center; gap:12px; padding:11px 14px; border-radius:14px; transition:all .2s; cursor:pointer; color:var(--text-muted); font-size:14px; font-weight:500; text-decoration:none; white-space:nowrap; overflow:hidden; }
        .nav-item:hover  { background:var(--nav-hover); color:#c4b5fd; }
        .nav-item.active { background:var(--nav-active); color:#a78bfa; box-shadow:inset 3px 0 0 #7c3aed; }
        [data-theme="light"] .nav-item:hover  { color:#7c3aed; }
        [data-theme="light"] .nav-item.active { color:#7c3aed; }

        .grad-text { background:linear-gradient(135deg,#a78bfa,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glass { background:var(--glass); backdrop-filter:blur(16px); border:1px solid var(--border-strong); transition:background .3s,border .3s; }
        .main-area { transition:margin-left .3s cubic-bezier(.4,0,.2,1); }
        .grid-bg { background-image:linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px); background-size:50px 50px; }

        @keyframes flame { 0%,100%{transform:scaleY(1) rotate(-2deg)} 50%{transform:scaleY(1.06) rotate(2deg)} }
        .flame { display:inline-block; animation:flame .5s ease-in-out infinite; transform-origin:bottom; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .mobile-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:40; backdrop-filter:blur(4px); }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#7c3aed44; border-radius:2px; }

        [data-theme="light"] .glass { background:rgba(255,255,255,0.85); border-color:rgba(0,0,0,0.08); box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        [data-theme="light"] .nav-item { color:#475569; }
      `}</style>

      <OfflineBanner />

      <div style={{ display:'flex', minHeight:'100vh' }}>
        {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

        {/* ── Sidebar ── */}
        <aside className="sidebar" style={{ position:'fixed', top:0, left:0, height:'100%', zIndex:50, display:'flex', flexDirection:'column', width: collapsed ? 72 : 220 }}>

          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'20px 16px', borderBottom:'1px solid var(--border)' }}>
            <span className="flame" style={{ fontSize:24, flexShrink:0 }}>🔥</span>
            {!collapsed && <span className="grad-text" style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.1rem', letterSpacing:'-0.5px' }}>StudyStreak</span>}
          </div>

          <nav style={{ flex:1, padding:12, display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
            {navItems.map(({ icon, label, href }) => (
              <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
                {!collapsed && <span>{label}</span>}
              </Link>
            ))}
          </nav>

          <div style={{ padding:12, borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:8 }}>
            {!collapsed && session?.user && (
              <div className="glass" style={{ borderRadius:16, padding:12, display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#7c3aed,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'white', fontWeight:700 }}>
                  {session.user.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session.user.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{session.user.email}</div>
                </div>
              </div>
            )}
            <button onClick={() => signOut({ callbackUrl:'/login' })} className="nav-item" style={{ width:'100%', border:'none', background:'transparent', textAlign:'left' }}>
              <span style={{ fontSize:18, flexShrink:0 }}>🚪</span>
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>

          <button onClick={() => setCollapsed(p => !p)}
            style={{ position:'absolute', right:-12, top:76, width:24, height:24, borderRadius:'50%', background:'#7c3aed', border:'2px solid var(--bg)', color:'white', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10 }}>
            {collapsed ? '›' : '‹'}
          </button>
        </aside>

        {/* ── Main ── */}
        <div className="main-area grid-bg" style={{ flex:1, minHeight:'100vh', marginLeft: collapsed ? 72 : 220 }}>

          <header style={{ position:'sticky', top:0, zIndex:30, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', background:'var(--header-bg)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)' }}>
            <button style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:20, cursor:'pointer' }} onClick={() => setMobileOpen(p => !p)}>☰</button>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto' }}>
              <div className="glass" style={{ borderRadius:99, padding:'6px 14px', display:'flex', alignItems:'center', gap:6, fontSize:13, border:'1px solid rgba(249,115,22,0.3)' }}>
                <span className="flame">🔥</span>
                <span style={{ fontWeight:800, color:'#fb923c', fontFamily:'Syne' }}>{displayStreak}</span>
                <span style={{ color:'var(--text-muted)', fontSize:11 }}>streak</span>
              </div>
              <div className="glass" style={{ borderRadius:99, padding:'6px 14px', display:'flex', alignItems:'center', gap:6, fontSize:13, border:'1px solid rgba(139,92,246,0.3)' }}>
                <span>⚡</span>
                <span style={{ fontWeight:800, color:'#a78bfa', fontFamily:'Syne' }}>{displayXP} XP</span>
              </div>
              <ThemeToggle />
              <NotificationBell />
            </div>
          </header>

          <main style={{ padding:24 }}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider>
      <InnerLayout>{children}</InnerLayout>
    </ThemeProvider>
  );
}