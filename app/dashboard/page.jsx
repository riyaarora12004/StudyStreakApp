'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PageSkeleton } from '@/components/Skeletons';
const greetings = ['Good morning', 'Good afternoon', 'Good evening'];
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return greetings[0];
  if (h < 17) return greetings[1];
  return greetings[2];
}
function daysUntil(dateStr) {
  if (!dateStr) return null;

  const exam = new Date(dateStr);
  if (isNaN(exam.getTime())) return null;

  const diff = Math.ceil((exam - new Date()) / 86400000);
  return diff > 0 ? diff : null;
}
const levelNames = ['Beginner', 'Scholar', 'Expert', 'Master', 'Legend'];
function getLevel(xp) {
  if (xp < 500)  return { name: 'Beginner', next: 500,  color: '#94a3b8' };
  if (xp < 1500) return { name: 'Scholar',  next: 1500, color: '#34d399' };
  if (xp < 3000) return { name: 'Expert',   next: 3000, color: '#38bdf8' };
  if (xp < 6000) return { name: 'Master',   next: 6000, color: '#a78bfa' };
  return           { name: 'Legend',  next: 10000, color: '#fbbf24' };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ xp: 0, streak: 0 });

  useEffect(() => {
    fetch('/api/subjects')
      .then(r => r.json())
      .then(d => { setSubjects(d.subjects || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const xp = stats.xp ?? 0;
const streak = stats.streak ?? 0;
  const level  = getLevel(xp);
  const xpPct  = Math.min(100, Math.round((xp / level.next) * 100));

  const totalSubjects  = subjects.length;
  const avgProgress = totalSubjects
  ? Math.round(
      subjects.reduce((acc, s) => {
        const completed = Number(s.completedChapters || 0);
        const total     = Number(s.totalChapters || 0);

        if (!total) return acc;

        return acc + (completed / total) * 100;
      }, 0) / totalSubjects
    )
  : 0;
const subjectsWithDays = subjects.map(s => ({
  ...s,
  daysRemaining: daysUntil(s.examDate),
}));

const urgentSubject = subjectsWithDays
  .filter(s => s.daysRemaining)
  .sort((a, b) => a.daysRemaining - b.daysRemaining)[0];
useEffect(() => {
  const fetchStats = () => {
    fetch('/api/user/stats')
      .then(r => r.json())
      .then(d => {
        if (d.xp !== undefined) {
          setStats({ xp: d.xp, streak: d.streak });
        }
      });
  };

  fetchStats();
  const t = setInterval(fetchStats, 30000);
  return () => clearInterval(t);
}, []);
  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .d1{animation-delay:0.05s;opacity:0} .d2{animation-delay:0.12s;opacity:0}
        .d3{animation-delay:0.19s;opacity:0} .d4{animation-delay:0.26s;opacity:0}
        .d5{animation-delay:0.33s;opacity:0} .d6{animation-delay:0.40s;opacity:0}
        .stat-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:20px; padding:20px; transition:all 0.2s; }
        .stat-card:hover { border-color:rgba(139,92,246,0.3); transform:translateY(-2px); box-shadow:0 12px 40px rgba(124,58,237,0.1); }
        .grad-text { background:linear-gradient(135deg,#a78bfa,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .quick-action { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; padding:16px; cursor:pointer; transition:all 0.2s; text-decoration:none; display:flex; align-items:center; gap:14px; }
        .quick-action:hover { background:rgba(139,92,246,0.08); border-color:rgba(139,92,246,0.3); transform:translateX(4px); }
        @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(249,115,22,0.4)} 70%{box-shadow:0 0 0 12px rgba(249,115,22,0)} 100%{box-shadow:0 0 0 0 rgba(249,115,22,0)} }
        .pulse-ring { animation: pulse-ring 2s infinite; }
      `}</style>

      {/* ─── Header ─── */}
      <div className="fade-up d1 mb-8">
        <p className="text-slate-500 text-sm">{getGreeting()}, {session?.user?.name?.split(' ')[0] || 'Student'} 👋</p>
        <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 800, letterSpacing: '-1px', marginTop: '4px' }}>
          Your <span className="grad-text">Study Dashboard</span>
        </h1>
      </div>

      {/* ─── Streak + Level hero row ─── */}
      <div className="fade-up d2 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* Streak */}
        <div className="stat-card flex items-center gap-5 md:col-span-1"
          style={{ border: '1px solid rgba(249,115,22,0.25)', background: 'rgba(249,115,22,0.05)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl pulse-ring flex-shrink-0"
            style={{ background: 'rgba(249,115,22,0.15)' }}>🔥</div>
          <div>
            <div className="text-3xl font-black" style={{ fontFamily: 'Syne', color: '#fb923c' }}>{streak}</div>
            <div className="text-sm text-slate-400">Day Streak</div>
            <div className="text-xs text-slate-600 mt-0.5">Keep it going!</div>
          </div>
        </div>

        {/* Level + XP */}
        <div className="stat-card md:col-span-2"
          style={{ border: `1px solid ${level.color}25`, background: `${level.color}08` }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Current Level</div>
              <div className="text-xl font-black" style={{ fontFamily: 'Syne', color: level.color }}>
                {level.name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Total XP</div>
              <div className="text-xl font-black" style={{ fontFamily: 'Syne', color: level.color }}>
                {xp.toLocaleString()} ⚡
              </div>
            </div>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${level.color}, ${level.color}88)`, boxShadow: `0 0 10px ${level.color}60` }} />
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1.5">
            <span>{xp} XP</span>
            <span>{level.next} XP to next level</span>
          </div>
        </div>
      </div>

      {/* ─── Stats row ─── */}
      <div className="fade-up d3 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: '📚', label: 'Subjects', val: totalSubjects, color: '#a78bfa', sub: 'uploaded' },
          { icon: '📈', label: 'Avg Progress', val: `${avgProgress}%`, color: '#34d399', sub: 'across subjects' },
          { icon: '⏰', label: 'Urgent', val: urgentSubject ? `${urgentSubject.daysRemaining}d` : '—', color: '#f87171', sub: urgentSubject?.name || 'no exams soon' },
          { icon: '🎯', label: 'Today\'s Goal', val: '0/3h', color: '#38bdf8', sub: 'hours studied' },
        ].map(({ icon, label, val, color, sub }) => (
          <div key={label} className="stat-card text-center">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-xl font-black" style={{ fontFamily: 'Syne', color }}>{val}</div>
            <div className="text-xs font-medium text-white mt-0.5">{label}</div>
            <div className="text-xs text-slate-600 mt-0.5 truncate">{sub}</div>
          </div>
        ))}
      </div>

      {/* ─── Main content grid ─── */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Quick actions */}
        <div className="fade-up d4 md:col-span-1 space-y-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h2>
          {[
            { icon: '📚', label: 'Add New Subject',   sub: 'Upload & track a subject', href: '/dashboard/subjects', color: '#a78bfa' },
            { icon: '⏱️', label: 'Start Timer',        sub: 'Begin a study session',    href: '/dashboard/timer',    color: '#38bdf8' },
            { icon: '🤖', label: 'Generate AI Plan',   sub: 'Get your daily plan',       href: '/dashboard/ai-plan',  color: '#34d399' },
            { icon: '📊', label: 'View Analytics',     sub: 'See your progress',         href: '/dashboard/analytics',color: '#fbbf24' },
          ].map(({ icon, label, sub, href, color }) => (
            <Link key={href} href={href} className="quick-action">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                {icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs text-slate-500">{sub}</div>
              </div>
              <span className="ml-auto text-slate-600 text-sm">›</span>
            </Link>
          ))}
        </div>

        {/* Subject overview */}
        <div className="fade-up d5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">My Subjects</h2>
            <Link href="/dashboard/subjects"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              View all →
            </Link>
          </div>

          {loading ? (
            <PageSkeleton type="subjects" />
          ) : subjects.length === 0 ? (
            <div className="stat-card text-center py-12">
              <div className="text-5xl mb-4">📚</div>
              <div className="text-white font-semibold mb-2" style={{ fontFamily: 'Syne' }}>
                No subjects yet
              </div>
              <div className="text-slate-500 text-sm mb-6">
                Add your first subject to get started!
              </div>
              <Link href="/dashboard/subjects">
                <button
                  className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
                  style={{
                    background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                    border: '1px solid rgba(139,92,246,0.4)'
                  }}
                >
                  + Add Subject
                </button>
              </Link>
            </div>
          ) : subjects.length === 0 ? (
            <div className="stat-card text-center py-12">
              <div className="text-5xl mb-4">📚</div>
              <div className="text-white font-semibold mb-2" style={{ fontFamily: 'Syne' }}>No subjects yet</div>
              <div className="text-slate-500 text-sm mb-6">Add your first subject to get started!</div>
              <Link href="/dashboard/subjects">
                <button className="px-6 py-3 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', border: '1px solid rgba(139,92,246,0.4)' }}>
                  + Add Subject
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.slice(0, 4).map((s) => {
                const completed = Number(s.completedChapters || 0);
                const total     = Number(s.totalChapters || 0);
                const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;
                const days = daysUntil(s.examDate);
                const urgent = days && days <= 7;
                return (
                  <div key={s._id} className="stat-card"
                    style={{ borderColor: urgent ? 'rgba(248,113,113,0.2)' : undefined }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{s.emoji}</span>
                        <div>
                          <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Syne' }}>{s.name}</div>
                          <div className="text-xs text-slate-500">{s.completedChapters}/{s.totalChapters} chapters</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold" style={{ color: urgent ? '#f87171' : '#94a3b8' }}>
                          {days}d left
                        </div>
                        <div className="text-xs text-slate-600">{pct}% done</div>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: s.color || '#7c3aed', boxShadow: `0 0 8px ${s.color || '#7c3aed'}60` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}