'use client';

import { useEffect, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPES = [
  { id: 'worksheet',    label: 'Worksheet',    icon: '📄' },
  { id: 'assignment',   label: 'Assignment',   icon: '✏️' },
  { id: 'project',      label: 'Project',      icon: '🔨' },
  { id: 'presentation', label: 'Presentation', icon: '📊' },
  { id: 'exam',         label: 'Exam',         icon: '📝' },
  { id: 'other',        label: 'Other',        icon: '📌' },
];

const PRIORITIES = [
  { id: 'low',    label: 'Low',    color: '#64748b' },
  { id: 'medium', label: 'Medium', color: '#3b82f6' },
  { id: 'high',   label: 'High',   color: '#f97316' },
  { id: 'urgent', label: 'Urgent', color: '#ef4444' },
];

const URGENCY_CONFIG = {
  overdue:  { label: 'Overdue',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.3)',    glow: 'rgba(239,68,68,0.4)',   icon: '🚨' },
  today:    { label: 'Due Today',  color: '#f97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.3)',   glow: 'rgba(249,115,22,0.35)', icon: '⚡' },
  tomorrow: { label: 'Tomorrow',   color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  glow: 'rgba(251,191,36,0.3)',  icon: '⏰' },
  soon:     { label: 'Very Soon',  color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)',  glow: 'rgba(167,139,250,0.25)',icon: '📅' },
  thisweek: { label: 'This Week',  color: '#38bdf8', bg: 'rgba(56,189,248,0.06)',  border: 'rgba(56,189,248,0.15)',  glow: 'none',                  icon: '🗓️' },
  upcoming: { label: 'Upcoming',   color: '#34d399', bg: 'rgba(52,211,153,0.05)',  border: 'rgba(52,211,153,0.12)',  glow: 'none',                  icon: '✅' },
  done:     { label: 'Completed',  color: '#475569', bg: 'rgba(71,85,105,0.06)',   border: 'rgba(71,85,105,0.15)',   glow: 'none',                  icon: '✓'  },
};

function getUrgency(dueDate, status) {
  if (status === 'completed') return 'done';
  const diff = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  if (diff < 0)  return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 3)  return 'soon';
  if (diff <= 7)  return 'thisweek';
  return 'upcoming';
}

function daysLeftLabel(dueDate, status) {
  if (status === 'completed') return 'Done';
  const diff = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  if (diff < 0)   return Math.abs(diff) + 'd overdue';
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Tomorrow';
  return diff + ' days left';
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
}

// ── Countdown ring for urgent items ──────────────────────────────────────────
function UrgencyRing({ dueDate, status, color, size = 44 }) {
  const diff     = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  const maxDays  = 7;
  const pct      = status === 'completed' ? 100 : Math.max(0, Math.min(100, ((maxDays - Math.max(diff, 0)) / maxDays) * 100));
  const r        = (size - 4) / 2;
  const circ     = 2 * Math.PI * r;
  const offset   = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .6s ease', filter: 'drop-shadow(0 0 4px ' + color + ')' }} />
    </svg>
  );
}

// ── Add/Edit form modal ───────────────────────────────────────────────────────
function DeadlineForm({ subjects, editing, onSave, onClose }) {
  const [form, setForm] = useState({
    title:         editing?.title         || '',
    type:          editing?.type          || 'assignment',
    priority:      editing?.priority      || 'medium',
    dueDate:       editing?.dueDate ? new Date(editing.dueDate).toISOString().split('T')[0] : '',
    dueTime:       editing?.dueDate ? new Date(editing.dueDate).toTimeString().slice(0,5) : '23:59',
    notes:         editing?.notes         || '',
    subjectId:     editing?.subjectId     || '',
    estimatedMins: editing?.estimatedMins || '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  const handleSave = async () => {
    if (!form.title.trim()) { setErr('Title is required'); return; }
    if (!form.dueDate)       { setErr('Due date is required'); return; }
    setSaving(true);
    setErr('');
    const dueDateTime = new Date(form.dueDate + 'T' + (form.dueTime || '23:59'));
    await onSave({ ...form, dueDate: dueDateTime.toISOString(), estimatedMins: parseInt(form.estimatedMins) || 0 });
    setSaving(false);
  };

  const s = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div style={{ position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'rgba(0,0,0,0.8)',backdropFilter:'blur(10px)' }}>
      <div style={{ background:'rgba(5,8,20,0.98)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:28,maxWidth:500,width:'100%',maxHeight:'90vh',overflow:'auto',padding:32,boxShadow:'0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'white',marginBottom:6 }}>
          {editing ? '✏️ Edit Deadline' : '➕ Add Deadline'}
        </div>
        <div style={{ color:'#475569',fontSize:13,marginBottom:24 }}>Track your worksheets, projects and assignments</div>

        {err && <div style={{ background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.25)',borderRadius:12,padding:'10px 14px',color:'#f87171',fontSize:13,marginBottom:16 }}>{err}</div>}

        {/* Title */}
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Title *</label>
          <input value={form.title} onChange={e => s('title', e.target.value)} placeholder="e.g. Chemistry Lab Report"
            style={{ ...inp }} />
        </div>

        {/* Type + Priority */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
          <div>
            <label style={lbl}>Type</label>
            <select value={form.type} onChange={e => s('type', e.target.value)} style={{ ...inp }}>
              {TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Priority</label>
            <select value={form.priority} onChange={e => s('priority', e.target.value)} style={{ ...inp }}>
              {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Due date + time */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
          <div>
            <label style={lbl}>Due Date *</label>
            <input type="date" value={form.dueDate} onChange={e => s('dueDate', e.target.value)} style={{ ...inp }} />
          </div>
          <div>
            <label style={lbl}>Due Time</label>
            <input type="time" value={form.dueTime} onChange={e => s('dueTime', e.target.value)} style={{ ...inp }} />
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Subject (optional)</label>
          <select value={form.subjectId} onChange={e => s('subjectId', e.target.value)} style={{ ...inp }}>
            <option value="">— No subject —</option>
            {subjects.map(sub => <option key={sub._id} value={sub._id}>{sub.emoji} {sub.name}</option>)}
          </select>
        </div>

        {/* Estimated time */}
        <div style={{ marginBottom:16 }}>
          <label style={lbl}>Estimated Time (minutes)</label>
          <input type="number" value={form.estimatedMins} onChange={e => s('estimatedMins', e.target.value)}
            placeholder="e.g. 60" min={0} style={{ ...inp }} />
        </div>

        {/* Notes */}
        <div style={{ marginBottom:24 }}>
          <label style={lbl}>Notes</label>
          <textarea value={form.notes} onChange={e => s('notes', e.target.value)}
            placeholder="Any extra details..." rows={2}
            style={{ ...inp, resize:'none', fontFamily:'DM Sans,sans-serif' }} />
        </div>

        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:'13px 0',borderRadius:16,border:'1px solid rgba(255,255,255,0.1)',background:'transparent',color:'#64748b',fontFamily:'Syne,sans-serif',fontWeight:600,fontSize:14,cursor:'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} style={{ flex:2,padding:'13px 0',borderRadius:16,border:'none',background:'linear-gradient(135deg,#f97316,#ef4444)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 0 24px rgba(249,115,22,0.4)' }}>
            {saving ? '⏳ Saving...' : editing ? 'Save Changes' : '➕ Add Deadline'}
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl = { display:'block',fontSize:11,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6,fontFamily:'Syne,sans-serif',fontWeight:600 };
const inp = { width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:'11px 14px',color:'white',fontSize:13,outline:'none',fontFamily:'DM Sans,sans-serif',boxSizing:'border-box',WebkitAppearance:'none' };

// ── Deadline card ─────────────────────────────────────────────────────────────
function DeadlineCard({ d, onComplete, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const urgency = getUrgency(d.dueDate, d.status);
  const cfg     = URGENCY_CONFIG[urgency];
  const typeObj = TYPES.find(t => t.id === d.type) || TYPES[5];
  const priObj  = PRIORITIES.find(p => p.id === d.priority) || PRIORITIES[1];
  const done    = d.status === 'completed';

  return (
    <div style={{ background:cfg.bg, border:'1px solid ' + cfg.border, borderRadius:20, padding:'16px 18px', transition:'all .2s', boxShadow: urgency === 'overdue' || urgency === 'today' ? '0 0 20px ' + cfg.glow : 'none', opacity: done ? 0.6 : 1 }}
      className="dcard">
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:expanded?14:0 }}>

        {/* Complete checkbox */}
        <button onClick={() => onComplete(d._id, done)} style={{ width:24,height:24,borderRadius:8,border:'2px solid ' + (done?cfg.color:'rgba(255,255,255,0.15)'),background:done?cfg.color:'transparent',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,transition:'all .2s',fontSize:13 }}>
          {done && '✓'}
        </button>

        {/* Urgency ring */}
        <div style={{ position:'relative',flexShrink:0 }}>
          <UrgencyRing dueDate={d.dueDate} status={d.status} color={cfg.color} size={40} />
          <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>{typeObj.icon}</div>
        </div>

        {/* Main info */}
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3,flexWrap:'wrap' }}>
            <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:done?'#475569':'white',textDecoration:done?'line-through':'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'100%' }}>
              {d.title}
            </span>
            <span style={{ fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:6,background:priObj.color+'20',color:priObj.color,flexShrink:0,fontFamily:'Syne,sans-serif',border:'1px solid '+priObj.color+'40' }}>
              {d.priority.toUpperCase()}
            </span>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
            {d.subjectName !== 'General' && (
              <span style={{ fontSize:11,color:'#64748b' }}>{d.subjectEmoji} {d.subjectName} ·</span>
            )}
            <span style={{ fontSize:11,color:cfg.color,fontWeight:600 }}>{cfg.icon} {daysLeftLabel(d.dueDate, d.status)}</span>
            <span style={{ fontSize:11,color:'#334155' }}>· {fmtDate(d.dueDate)}</span>
            {d.estimatedMins > 0 && <span style={{ fontSize:11,color:'#334155' }}>· ~{d.estimatedMins}m</span>}
          </div>
        </div>

        {/* Right actions */}
        <div style={{ display:'flex',alignItems:'center',gap:6,flexShrink:0 }}>
          <div style={{ fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:8,background:cfg.bg,border:'1px solid '+cfg.border,color:cfg.color,fontFamily:'Syne,sans-serif' }}>
            {cfg.label}
          </div>
          <button onClick={() => setExpanded(p => !p)} style={{ width:28,height:28,borderRadius:8,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.03)',color:'#475569',cursor:'pointer',fontSize:13 }}>
            {expanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:14,marginTop:2 }}>
          {d.notes && (
            <div style={{ fontSize:13,color:'#94a3b8',marginBottom:12,lineHeight:1.6,background:'rgba(255,255,255,0.02)',borderRadius:10,padding:'8px 12px' }}>
              📝 {d.notes}
            </div>
          )}
          <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
            <button onClick={() => onEdit(d)} style={{ padding:'7px 16px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#94a3b8',fontSize:12,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600 }}>
              ✏️ Edit
            </button>
            {!done && (
              <button onClick={() => onComplete(d._id, false)} style={{ padding:'7px 16px',borderRadius:10,border:'1px solid rgba(52,211,153,0.3)',background:'rgba(52,211,153,0.08)',color:'#34d399',fontSize:12,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600 }}>
                ✅ Mark Complete
              </button>
            )}
            {done && (
              <button onClick={() => onComplete(d._id, true)} style={{ padding:'7px 16px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#64748b',fontSize:12,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600 }}>
                ↩ Undo Complete
              </button>
            )}
            <button onClick={() => onDelete(d._id)} style={{ padding:'7px 16px',borderRadius:10,border:'1px solid rgba(239,68,68,0.25)',background:'rgba(239,68,68,0.06)',color:'#f87171',fontSize:12,cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600 }}>
              🗑 Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [stats,     setStats]     = useState({});
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [filter,    setFilter]    = useState('all');     // all | overdue | today | thisweek | completed
  const [typeFilter,setTypeFilter]= useState('all');
  const [sortBy,    setSortBy]    = useState('dueDate'); // dueDate | priority | subject

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchAll = async () => {
    const [dRes, sRes] = await Promise.all([
      fetch('/api/deadlines'),
      fetch('/api/subjects'),
    ]);
    const [dData, sData] = await Promise.all([dRes.json(), sRes.json()]);
    setDeadlines(dData.deadlines || []);
    setStats(dData.stats || {});
    setSubjects(sData.subjects || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSave = async (formData) => {
    const url    = '/api/deadlines';
    const method = editing ? 'PATCH' : 'POST';
    const body   = editing
      ? { id: editing._id, action: 'update', ...formData }
      : formData;

    const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { await fetchAll(); setShowForm(false); setEditing(null); }
  };

  const handleComplete = async (id, isDone) => {
    await fetch('/api/deadlines', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: isDone ? 'uncomplete' : 'complete' }),
    });
    fetchAll();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this deadline?')) return;
    await fetch('/api/deadlines', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'delete' }),
    });
    fetchAll();
  };

  // ── Filtering + sorting ──────────────────────────────────────────────────────
  let filtered = [...deadlines];

  if (filter === 'overdue')  filtered = filtered.filter(d => getUrgency(d.dueDate, d.status) === 'overdue');
  else if (filter === 'today') filtered = filtered.filter(d => getUrgency(d.dueDate, d.status) === 'today');
  else if (filter === 'thisweek') filtered = filtered.filter(d => { const u = getUrgency(d.dueDate,d.status); return ['today','tomorrow','soon','thisweek'].includes(u); });
  else if (filter === 'completed') filtered = filtered.filter(d => d.status === 'completed');
  else if (filter === 'pending')   filtered = filtered.filter(d => d.status !== 'completed');

  if (typeFilter !== 'all') filtered = filtered.filter(d => d.type === typeFilter);

  if (sortBy === 'priority') {
    const order = { urgent:0, high:1, medium:2, low:3 };
    filtered.sort((a,b) => (order[a.priority]||2) - (order[b.priority]||2));
  } else if (sortBy === 'subject') {
    filtered.sort((a,b) => a.subjectName.localeCompare(b.subjectName));
  } else {
    filtered.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
  }

  // Group by urgency for "all" view
  const grouped = filter === 'all' || filter === 'pending' ? {
    overdue:  filtered.filter(d => getUrgency(d.dueDate,d.status) === 'overdue'),
    today:    filtered.filter(d => getUrgency(d.dueDate,d.status) === 'today'),
    tomorrow: filtered.filter(d => getUrgency(d.dueDate,d.status) === 'tomorrow'),
    soon:     filtered.filter(d => getUrgency(d.dueDate,d.status) === 'soon'),
    thisweek: filtered.filter(d => getUrgency(d.dueDate,d.status) === 'thisweek'),
    upcoming: filtered.filter(d => getUrgency(d.dueDate,d.status) === 'upcoming'),
    done:     filtered.filter(d => getUrgency(d.dueDate,d.status) === 'done'),
  } : null;

  const showGrouped = (filter === 'all' || filter === 'pending') && sortBy === 'dueDate';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800;900&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@500&display=swap');
        @keyframes fu{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        .fu{animation:fu .38s ease forwards}
        .d1{animation-delay:.03s;opacity:0}.d2{animation-delay:.09s;opacity:0}.d3{animation-delay:.15s;opacity:0}.d4{animation-delay:.21s;opacity:0}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        .pulse{animation:pulse 2s ease-in-out infinite}
        .dcard{transition:transform .15s,box-shadow .15s}
        .dcard:hover{transform:translateY(-2px)}
        .fchip{padding:8px 16px;border-radius:11px;cursor:pointer;font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:#475569;transition:all .18s;font-family:'Syne',sans-serif;white-space:nowrap}
        .fchip:hover{background:rgba(255,255,255,0.07);color:#94a3b8}
        .fchip.on{color:white}
        select{color-scheme:dark}
        input[type=date],input[type=time]{color-scheme:dark}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:99px}
      `}</style>

      {(showForm || editing) && (
        <DeadlineForm
          subjects={subjects}
          editing={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {/* ─── Header ─── */}
      <div className="fu d1" style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:14 }}>
        <div>
          <h1 style={{ fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:900,letterSpacing:'-1px',margin:0,fontFamily:'Syne,sans-serif',color:'white' }}>
            Deadline <span style={{ background:'linear-gradient(135deg,#f97316,#ef4444)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text' }}>Tracker</span>
          </h1>
          <p style={{ color:'#64748b',fontSize:13,marginTop:4 }}>Worksheets, projects, assignments — all in one place</p>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }}
          style={{ padding:'12px 24px',borderRadius:16,border:'none',background:'linear-gradient(135deg,#f97316,#ef4444)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 0 28px rgba(249,115,22,0.4)',flexShrink:0 }}>
          ➕ Add Deadline
        </button>
      </div>

      {/* ─── Stat cards ─── */}
      <div className="fu d2" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:12,marginBottom:24 }}>
        {[
          { val: stats.overdue  || 0, label:'Overdue',   color:'#ef4444', icon:'🚨', urgent: (stats.overdue||0) > 0 },
          { val: stats.today    || 0, label:'Due Today',  color:'#f97316', icon:'⚡', urgent: (stats.today||0) > 0    },
          { val: stats.thisWeek || 0, label:'This Week',  color:'#fbbf24', icon:'📅', urgent: false },
          { val: stats.pending  || 0, label:'Pending',    color:'#a78bfa', icon:'⏳', urgent: false },
          { val: stats.completed|| 0, label:'Completed',  color:'#34d399', icon:'✅', urgent: false },
        ].map(({ val, label, color, icon, urgent }) => (
          <div key={label} className={urgent && val > 0 ? 'pulse' : ''}
            style={{ background:'rgba(255,255,255,0.03)',border:'1px solid ' + (urgent && val > 0 ? color+'40' : 'rgba(255,255,255,0.07)'),borderRadius:18,padding:'16px 12px',textAlign:'center',cursor:'pointer',transition:'all .2s',boxShadow: urgent && val > 0 ? '0 0 16px ' + color+'25' : 'none' }}
            onClick={() => setFilter(label.toLowerCase().replace(' ',''))}>
            <div style={{ fontSize:22,marginBottom:6 }}>{icon}</div>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:24,color }}>{val}</div>
            <div style={{ fontSize:11,color:'#475569',marginTop:2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ─── Filters ─── */}
      <div className="fu d3" style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:20,alignItems:'center' }}>
        {[
          { id:'all',       label:'All'        },
          { id:'pending',   label:'Pending'    },
          { id:'overdue',   label:'🚨 Overdue' },
          { id:'today',     label:'⚡ Today'   },
          { id:'thisweek',  label:'This Week'  },
          { id:'completed', label:'✅ Done'    },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={'fchip' + (filter === f.id ? ' on' : '')}
            style={filter === f.id ? { background:'rgba(249,115,22,0.12)',borderColor:'rgba(249,115,22,0.35)',color:'#f97316' } : {}}>
            {f.label}
          </button>
        ))}

        <div style={{ marginLeft:'auto',display:'flex',gap:8,flexWrap:'wrap' }}>
          {/* Type filter */}
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ padding:'8px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#94a3b8',fontSize:12,fontFamily:'Syne,sans-serif',outline:'none',cursor:'pointer' }}>
            <option value="all">All Types</option>
            {TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
          </select>
          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding:'8px 12px',borderRadius:10,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'#94a3b8',fontSize:12,fontFamily:'Syne,sans-serif',outline:'none',cursor:'pointer' }}>
            <option value="dueDate">Sort: Due Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="subject">Sort: Subject</option>
          </select>
        </div>
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <div style={{ textAlign:'center',padding:60,color:'#475569' }}>
          <div style={{ fontSize:40,marginBottom:12,display:'inline-block',animation:'fu .4s ease' }}>📋</div>
          <div style={{ fontSize:13 }}>Loading deadlines...</div>
        </div>
      ) : filtered.length === 0 && !showGrouped ? (
        <div className="fu" style={{ textAlign:'center',padding:60 }}>
          <div style={{ fontSize:48,marginBottom:16 }}>🎉</div>
          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'white',marginBottom:6 }}>
            {filter === 'completed' ? 'No completed items yet' : filter === 'overdue' ? 'No overdue items!' : 'Nothing here!'}
          </div>
          <div style={{ color:'#475569',fontSize:13 }}>
            {filter === 'all' ? 'Add your first deadline to get started.' : 'Try a different filter.'}
          </div>
        </div>
      ) : showGrouped ? (
        // Grouped view
        <div className="fu d4" style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {Object.entries(grouped).map(([urgency, items]) => {
            if (urgency === 'done') return null; // show completed separately
            if (!items.length) return null;
            const cfg = URGENCY_CONFIG[urgency];
            return (
              <div key={urgency}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8,marginTop:8 }}>
                  <span style={{ fontSize:14 }}>{cfg.icon}</span>
                  <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:cfg.color,textTransform:'uppercase',letterSpacing:'0.1em' }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontSize:11,color:'#334155',background:'rgba(255,255,255,0.04)',padding:'2px 8px',borderRadius:6 }}>{items.length}</span>
                  <div style={{ flex:1,height:1,background:cfg.border }} />
                </div>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {items.map(d => (
                    <DeadlineCard key={d._id} d={d}
                      onComplete={handleComplete}
                      onDelete={handleDelete}
                      onEdit={d => { setEditing(d); setShowForm(true); }} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Completed section collapsed by default */}
          {grouped.done?.length > 0 && (
            <div style={{ marginTop:12,opacity:0.7 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:8 }}>
                <span style={{ fontSize:14 }}>✓</span>
                <span style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:12,color:'#475569',textTransform:'uppercase',letterSpacing:'0.1em' }}>Completed</span>
                <span style={{ fontSize:11,color:'#334155',background:'rgba(255,255,255,0.04)',padding:'2px 8px',borderRadius:6 }}>{grouped.done.length}</span>
                <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.06)' }} />
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {grouped.done.slice(0,5).map(d => (
                  <DeadlineCard key={d._id} d={d}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onEdit={d => { setEditing(d); setShowForm(true); }} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state for pending view */}
          {Object.values(grouped).every(g => !g.length) && (
            <div style={{ textAlign:'center',padding:60 }}>
              <div style={{ fontSize:48,marginBottom:16 }}>🎉</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'white',marginBottom:6 }}>You're all caught up!</div>
              <div style={{ color:'#475569',fontSize:13 }}>No pending deadlines. Add one above.</div>
            </div>
          )}
        </div>
      ) : (
        // Flat list view (filtered / sorted non-default)
        <div className="fu d4" style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {filtered.map(d => (
            <DeadlineCard key={d._id} d={d}
              onComplete={handleComplete}
              onDelete={handleDelete}
              onEdit={d => { setEditing(d); setShowForm(true); }} />
          ))}
        </div>
      )}
    </>
  );
}