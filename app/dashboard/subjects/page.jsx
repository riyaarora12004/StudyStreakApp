'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const EMOJIS = ['📚','🔬','⚗️','🧬','📐','📏','🌍','📜','💻','🎨','🎵','🏛️','⚽','🧮','🔭','💡'];
const COLORS = [
  '#7c3aed','#2563eb','#0891b2','#059669','#d97706',
  '#dc2626','#db2777','#f59e0b','#4f46e5','#0d9488',
];
const PRIORITIES = [
  { value:'high',   label:'🔴 High',   color:'#f87171' },
  { value:'medium', label:'🟡 Medium', color:'#fbbf24' },
  { value:'low',    label:'🟢 Low',    color:'#34d399' },
];
const DEFAULT_FORM = {
  name:'',
  totalChapters:'',   
  emoji:'📚',
  color:'#7c3aed',
  examDate:'',
  dailyTargetHours:'1',
  priority:'medium',
};

function daysUntil(dateStr) {
  if (!dateStr) return 0;

  const exam = new Date(dateStr);
  if (isNaN(exam.getTime())) return 0;

  const diff = Math.ceil((exam - new Date()) / 86400000);
  return diff > 0 ? diff : 0;
}

// ── Subject Card ──────────────────────────────────────────────────────────────
function SubjectCard({ subject, onDelete }) {
  const totalTopics = Number(
  subject.topics?.length || subject.totalChapters || 0
);

const completedTopics = Number(
  subject.topics?.filter(t => t.status === 'completed').length ||
  subject.completedChapters ||
  0
);

const pct =
  totalTopics > 0
    ? Math.round((completedTopics / totalTopics) * 100)
    : 0;
  const days = daysUntil(subject.examDate);
  const urgent          = days <= 7;
  const weakTopics      = subject.topics?.filter(t=>t.quizAttempts?.some(a=>!a.passed)).length || 0;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${subject.name}"?`)) return;
    setDeleting(true);
    await onDelete(subject._id);
  };

  return (
    <Link href={`/dashboard/subjects/${subject._id}`}>
      <div className="subject-card" style={{ '--accent':subject.color }}>
        <div className="h-1 rounded-t-2xl -mt-px -mx-px"
          style={{ background:`linear-gradient(90deg,${subject.color},${subject.color}44)` }} />
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background:`${subject.color}18`, border:`1px solid ${subject.color}30` }}>
                {subject.emoji}
              </div>
              <div>
                <div className="font-bold text-white text-base" style={{ fontFamily:'Syne' }}>{subject.name}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background:PRIORITIES.find(p=>p.value===subject.priority)?.color+'18', color:PRIORITIES.find(p=>p.value===subject.priority)?.color, border:`1px solid ${PRIORITIES.find(p=>p.value===subject.priority)?.color}30` }}>
                    {PRIORITIES.find(p=>p.value===subject.priority)?.label}
                  </span>
                  {weakTopics > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background:'rgba(251,191,36,0.1)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.25)' }}>
                      ⚠️ {weakTopics} weak
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={handleDelete} disabled={deleting}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all text-sm">
              {deleting ? '⏳' : '🗑️'}
            </button>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-500">{totalTopics===0?'No topics yet':'Progress'}</span>
              <span className="font-semibold" style={{ color:subject.color }}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background:'rgba(255,255,255,0.05)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width:`${pct}%`, background:`linear-gradient(90deg,${subject.color},${subject.color}88)`, boxShadow:`0 0 10px ${subject.color}60` }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon:'📅', val:`${days}d`, label:'left', warn:urgent },
              { icon:'📖', val:totalTopics===0?'—':`${completedTopics}/${totalTopics}`, label:'topics' },
              { icon:'⏰', val:`${subject.dailyTargetHours}h`, label:'daily' },
            ].map(({icon,val,label,warn})=>(
              <div key={label} className="rounded-xl py-2 px-1"
                style={{ background:warn?'rgba(248,113,113,0.08)':'rgba(255,255,255,0.03)', border:`1px solid ${warn?'rgba(248,113,113,0.2)':'rgba(255,255,255,0.05)'}` }}>
                <div className="text-sm mb-0.5">{icon}</div>
                <div className="text-sm font-bold" style={{ fontFamily:'Syne', color:warn?'#f87171':'white' }}>{val}</div>
                <div className="text-xs text-slate-600">{label}</div>
              </div>
            ))}
          </div>

          {/* Open hint */}
          <div className="mt-4 text-center text-xs text-slate-600 hover:text-violet-400 transition-colors">
            {totalTopics===0?'→ Click to add topics':'→ Click to manage topics & take quizzes'}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubjectsPage() {
  const [subjects,  setSubjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(DEFAULT_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [filter,    setFilter]    = useState('all');

  const fetchSubjects = () => {
    setLoading(true);
    fetch('/api/subjects').then(r=>r.json()).then(d=>{ setSubjects(d.subjects||[]); setLoading(false); }).catch(()=>setLoading(false));
  };
  useEffect(()=>{ fetchSubjects(); },[]);

  const handleChange = e => { setError(''); setForm(p=>({...p,[e.target.name]:e.target.value})); };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.examDate || !form.totalChapters) {
    return setError('Name, total chapters, and exam date are required.');
    }
    setSaving(true); setError('');
    try {
      const res  = await fetch('/api/subjects',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Subject added! 🎉');
      setForm(DEFAULT_FORM); setShowForm(false); fetchSubjects();
      setTimeout(()=>setSuccess(''),3000);
    } catch(err){ setError(err.message); }
    finally{ setSaving(false); }
  };

  const handleDelete = async id => {
    await fetch(`/api/subjects/${id}`,{method:'DELETE'});
    setSubjects(p=>p.filter(s=>s._id!==id));
  };

  const filtered = filter==='all' ? subjects : subjects.filter(s=>s.priority===filter);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-12px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        .fade-up   { animation:fadeUp 0.4s ease forwards; }
        .slide-down{ animation:slideDown 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .d1{animation-delay:0s;opacity:0} .d2{animation-delay:0.08s;opacity:0}
        .d3{animation-delay:0.16s;opacity:0} .d4{animation-delay:0.24s;opacity:0}

        .grad-text { background:linear-gradient(135deg,#a78bfa,#38bdf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .glass { background:rgba(255,255,255,0.03); backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.07); }

        .subject-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:20px; overflow:hidden; transition:all 0.25s; cursor:pointer; text-decoration:none; display:block; }
        .subject-card:hover { border-color:rgba(139,92,246,0.35); transform:translateY(-4px); box-shadow:0 20px 50px rgba(0,0,0,0.4); }

        .form-card { background:rgba(8,12,24,0.9); border:1px solid rgba(139,92,246,0.2); border-radius:24px; box-shadow:0 40px 80px rgba(0,0,0,0.5); }
        .field-input { width:100%; padding:12px 14px; border-radius:12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); color:#e2e8f0; font-size:14px; outline:none; transition:all 0.2s; font-family:'DM Sans',sans-serif; }
        .field-input:focus { border-color:rgba(139,92,246,0.5); box-shadow:0 0 0 3px rgba(139,92,246,0.12); }
        .field-input::placeholder { color:#475569; }
        .field-label { font-size:12px; color:#64748b; margin-bottom:6px; display:block; font-weight:500; }

        .btn-primary { background:linear-gradient(135deg,#7c3aed,#2563eb); border:1px solid rgba(139,92,246,0.5); box-shadow:0 0 20px rgba(124,58,237,0.3); font-family:'Syne',sans-serif; font-weight:700; cursor:pointer; transition:all 0.2s; }
        .btn-primary:hover:not(:disabled) { box-shadow:0 0 40px rgba(124,58,237,0.5); transform:translateY(-1px); }
        .btn-primary:disabled { opacity:0.6; cursor:not-allowed; }

        .filter-btn { padding:6px 14px; border-radius:10px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#64748b; }
        .filter-btn.active { background:rgba(139,92,246,0.15); border-color:rgba(139,92,246,0.4); color:#a78bfa; }

        .emoji-btn { width:38px; height:38px; border-radius:10px; border:1px solid rgba(255,255,255,0.07); background:rgba(255,255,255,0.03); cursor:pointer; font-size:18px; transition:all 0.15s; display:flex; align-items:center; justify-content:center; }
        .emoji-btn:hover,.emoji-btn.selected { background:rgba(139,92,246,0.15); border-color:rgba(139,92,246,0.4); transform:scale(1.1); }
        .color-btn { width:26px; height:26px; border-radius:8px; cursor:pointer; transition:all 0.15s; border:2px solid transparent; }
        .color-btn.selected { border-color:white; transform:scale(1.2); }
      `}</style>

      {/* Header */}
      <div className="fade-up d1 flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:800, letterSpacing:'-1px' }}>
            My <span className="grad-text">Subjects</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {subjects.length} subject{subjects.length!==1?'s':''} · Click any subject to manage topics & take quizzes
          </p>
        </div>
        <button onClick={()=>{ setShowForm(p=>!p); setError(''); }}
          className="btn-primary px-6 py-3 rounded-2xl text-white text-sm flex items-center gap-2">
          {showForm?'✕ Close':'+ Add Subject'}
        </button>
      </div>

      {success && (
        <div className="fade-up mb-5 px-4 py-3 rounded-2xl text-sm text-emerald-400 flex items-center gap-2"
          style={{ background:'rgba(52,211,153,0.08)', border:'1px solid rgba(52,211,153,0.2)' }}>
          ✅ {success}
        </div>
      )}

      {/* Add Subject Form */}
      {showForm && (
        <div className="form-card slide-down p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-5" style={{ fontFamily:'Syne' }}>📚 Add New Subject</h2>
          {error && <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400" style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>⚠️ {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="field-label">Subject Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Mathematics, Physics..." className="field-input" />
              </div>
              <div>
              <label className="field-label">Total Chapters *</label>
              <input
                name="totalChapters"
                value={form.totalChapters}
                onChange={handleChange}
                type="number"
                min="1"
                placeholder="e.g. 12"
                className="field-input"
              />
            </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Exam Date *</label>
                  <input name="examDate" value={form.examDate} onChange={handleChange} type="date" className="field-input" min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="field-label">Daily Hours</label>
                  <input name="dailyTargetHours" value={form.dailyTargetHours} onChange={handleChange} type="number" min="0.5" max="12" step="0.5" className="field-input" />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="field-label">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map(({value,label,color})=>(
                  <button key={value} type="button" onClick={()=>setForm(p=>({...p,priority:value}))}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all"
                    style={{ background:form.priority===value?`${color}18`:'rgba(255,255,255,0.03)', border:`1px solid ${form.priority===value?color:'rgba(255,255,255,0.08)'}`, color:form.priority===value?color:'#64748b' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="field-label">Emoji</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map(e=>(
                  <button key={e} type="button" onClick={()=>setForm(p=>({...p,emoji:e}))}
                    className={`emoji-btn ${form.emoji===e?'selected':''}`}>{e}</button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="field-label">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c,i)=>(
                  <button key={i} type="button" onClick={()=>setForm(p=>({...p,color:c}))}
                    className={`color-btn ${form.color===c?'selected':''}`} style={{ background:c }} />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mb-5 p-4 rounded-2xl flex items-center gap-3"
              style={{ background:`${form.color}10`, border:`1px solid ${form.color}25` }}>
              <span className="text-3xl">{form.emoji}</span>
              <div>
                <div className="font-bold text-white" style={{ fontFamily:'Syne' }}>{form.name||'Subject Name'}</div>
                <div className="text-xs text-slate-500">{form.dailyTargetHours}h/day · {form.examDate?`${daysUntil(form.examDate)} days to exam`:'No date'}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex-1 py-3.5 rounded-2xl text-white text-sm">
                {saving?'⏳ Adding...':'✅ Add Subject'}
              </button>
              <button type="button" onClick={()=>{ setShowForm(false); setForm(DEFAULT_FORM); setError(''); }}
                className="px-6 py-3.5 rounded-2xl text-slate-400 hover:text-white transition-colors text-sm"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      {subjects.length > 0 && (
        <div className="fade-up d2 flex items-center gap-2 mb-6 flex-wrap">
          {['all','high','medium','low'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`filter-btn ${filter===f?'active':''}`}>
              {f==='all'?`All (${subjects.length})`:`${f.charAt(0).toUpperCase()+f.slice(1)} Priority`}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map(i=>(
            <div key={i} className="subject-card p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5"/>
                <div className="flex-1"><div className="h-4 bg-white/5 rounded w-3/4 mb-2"/><div className="h-3 bg-white/5 rounded w-1/2"/></div>
              </div>
              <div className="h-2 bg-white/5 rounded mb-4"/>
              <div className="grid grid-cols-3 gap-2">{[1,2,3].map(j=><div key={j} className="h-14 bg-white/5 rounded-xl"/>)}</div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="fade-up d3 text-center py-20">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily:'Syne' }}>
            {subjects.length===0?'No subjects yet':'No subjects match this filter'}
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            {subjects.length===0?'Add your first subject — then upload your syllabus and let AI build your topic list!':'Try a different filter.'}
          </p>
          {subjects.length===0&&(
            <button onClick={()=>setShowForm(true)} className="btn-primary px-8 py-3.5 rounded-2xl text-white text-sm">
              + Add Your First Subject
            </button>
          )}
        </div>
      ) : (
        <div className="fade-up d4 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(s=>(
            <SubjectCard key={s._id} subject={s} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </>
  );
}