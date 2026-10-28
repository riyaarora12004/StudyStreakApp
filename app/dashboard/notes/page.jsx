'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// ── Note card for a single topic ──────────────────────────────────────────────
function TopicNoteCard({ topic, subjectColor }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }}>
      {/* Topic header */}
      <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: subjectColor, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white', fontFamily: 'Syne,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {topic.topicName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {topic.bestScore !== null && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: topic.bestScore >= 70 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: topic.bestScore >= 70 ? '#34d399' : '#f87171', fontFamily: 'Syne,sans-serif', fontWeight: 700 }}>
              {topic.bestScore}% quiz
            </span>
          )}
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: topic.status === 'completed' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)', color: topic.status === 'completed' ? '#34d399' : '#475569', fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
            {topic.status === 'completed' ? '✅ done' : '📖 in progress'}
          </span>
        </div>
      </div>

      {/* Notes content */}
      <div style={{ display: 'grid', gridTemplateColumns: topic.weak && topic.important ? '1fr 1fr' : '1fr', gap: 0 }}>
        {topic.weak && (
          <div style={{ padding: '12px 14px', borderRight: topic.important ? '1px solid rgba(255,255,255,0.04)' : 'none', background: 'rgba(248,113,113,0.03)' }}>
            <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>⚠️ Weak Points</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{topic.weak}</div>
          </div>
        )}
        {topic.important && (
          <div style={{ padding: '12px 14px', background: 'rgba(52,211,153,0.03)' }}>
            <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>⭐ Key Points</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{topic.important}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Subject section ───────────────────────────────────────────────────────────
function SubjectSection({ subject, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const topicCount    = subject.topicNotes.length;
  const hasSubjNotes  = subject.subjectNotes.syllabus || subject.subjectNotes.weak || subject.subjectNotes.important;
  const weakTopics    = subject.topicNotes.filter(t => t.weak).length;
  const importantTopics = subject.topicNotes.filter(t => t.important).length;

  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${subject.subjectColor}25`, borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}>
      {/* Subject header — clickable */}
      <div
        onClick={() => setOpen(p => !p)}
        style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', background: open ? `${subject.subjectColor}08` : 'transparent', transition: 'background .2s' }}>

        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${subject.subjectColor}18`, border: `1px solid ${subject.subjectColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {subject.subjectEmoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: 'white', marginBottom: 3 }}>
            {subject.subjectName}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {hasSubjNotes && (
              <span style={{ fontSize: 11, color: '#64748b' }}>📄 subject notes</span>
            )}
            {weakTopics > 0 && (
              <span style={{ fontSize: 11, color: '#f87171' }}>⚠️ {weakTopics} weak point{weakTopics > 1 ? 's' : ''}</span>
            )}
            {importantTopics > 0 && (
              <span style={{ fontSize: 11, color: '#34d399' }}>⭐ {importantTopics} key point{importantTopics > 1 ? 's' : ''}</span>
            )}
            {topicCount === 0 && !hasSubjNotes && (
              <span style={{ fontSize: 11, color: '#334155' }}>no topic notes yet</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontFamily: 'Syne,sans-serif', fontWeight: 700, padding: '4px 12px', borderRadius: 8, background: `${subject.subjectColor}15`, color: subject.subjectColor, border: `1px solid ${subject.subjectColor}30` }}>
            {topicCount + (hasSubjNotes ? 1 : 0)} note{(topicCount + (hasSubjNotes ? 1 : 0)) !== 1 ? 's' : ''}
          </span>
          <span style={{ color: '#334155', fontSize: 14 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: '0 20px 16px' }}>

          {/* Subject-level notes */}
          {hasSubjNotes && (
            <div style={{ marginBottom: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ padding: '8px 14px', background: `${subject.subjectColor}10`, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: subject.subjectColor, fontFamily: 'Syne,sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  📚 Subject-Level Notes
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0 }}>
                {subject.subjectNotes.syllabus && (
                  <div style={{ padding: '12px 14px', borderRight: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>📄 Syllabus Notes</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{subject.subjectNotes.syllabus}</div>
                  </div>
                )}
                {subject.subjectNotes.weak && (
                  <div style={{ padding: '12px 14px', borderRight: '1px solid rgba(255,255,255,0.04)', background: 'rgba(248,113,113,0.03)' }}>
                    <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>⚠️ Weak Areas</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{subject.subjectNotes.weak}</div>
                  </div>
                )}
                {subject.subjectNotes.important && (
                  <div style={{ padding: '12px 14px', background: 'rgba(52,211,153,0.03)' }}>
                    <div style={{ fontSize: 10, color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>⭐ Key Points</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{subject.subjectNotes.important}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Topic notes */}
          {topicCount > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, fontFamily: 'Syne,sans-serif' }}>
                Topic Notes ({topicCount})
              </div>
              {subject.topicNotes.map(t => (
                <TopicNoteCard key={t.topicId} topic={t} subjectColor={subject.subjectColor} />
              ))}
            </div>
          )}

          {/* Link to subject */}
          <Link href={`/dashboard/subjects/${subject.subjectId}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: subject.subjectColor, textDecoration: 'none', marginTop: 4, padding: '6px 14px', borderRadius: 10, background: `${subject.subjectColor}10`, border: `1px solid ${subject.subjectColor}25` }}>
            ✏️ Edit notes in {subject.subjectName}
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NotesPage() {
  const [notes,      setNotes]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState('all'); // all | weak | important | subject
  const [stats,      setStats]      = useState({});

  useEffect(() => {
    fetch('/api/notes').then(r => r.json()).then(d => {
      setNotes(d.notes || []);
      setStats({ topicNotes: d.totalTopicNotes || 0, subjectNotes: d.totalSubjectNotes || 0 });
      setLoading(false);
    });
  }, []);

  // Filter + search
  const filtered = notes
    .map(subject => {
      // Apply topic-level filter
      let topicNotes = subject.topicNotes;
      if (filter === 'weak')      topicNotes = topicNotes.filter(t => t.weak);
      if (filter === 'important') topicNotes = topicNotes.filter(t => t.important);

      // Apply search
      if (search) {
        const q = search.toLowerCase();
        topicNotes = topicNotes.filter(t =>
          t.topicName.toLowerCase().includes(q) ||
          t.weak.toLowerCase().includes(q) ||
          t.important.toLowerCase().includes(q)
        );
        const subjectMatches =
          subject.subjectName.toLowerCase().includes(q) ||
          subject.subjectNotes.syllabus.toLowerCase().includes(q) ||
          subject.subjectNotes.weak.toLowerCase().includes(q) ||
          subject.subjectNotes.important.toLowerCase().includes(q);
        if (!subjectMatches && topicNotes.length === 0) return null;
      }

      // Show subject if it has any matching content
      const hasSubjNotes = filter === 'important'
        ? subject.subjectNotes.important
        : filter === 'weak'
          ? subject.subjectNotes.weak
          : (subject.subjectNotes.syllabus || subject.subjectNotes.weak || subject.subjectNotes.important);

      if (!hasSubjNotes && topicNotes.length === 0) return null;

      return { ...subject, topicNotes };
    })
    .filter(Boolean);

  const totalNoteCount = notes.reduce((a, s) => a + s.topicNotes.length + (s.subjectNotes.syllabus || s.subjectNotes.weak || s.subjectNotes.important ? 1 : 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800;900&family=DM+Sans:wght@400;500&display=swap');
        @keyframes fu { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fu{animation:fu .38s ease forwards}
        .d1{animation-delay:.03s;opacity:0} .d2{animation-delay:.09s;opacity:0} .d3{animation-delay:.15s;opacity:0}
        .fchip{padding:8px 16px;border-radius:11px;cursor:pointer;font-size:12px;font-weight:700;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:#475569;transition:all .18s;font-family:'Syne',sans-serif;}
        .fchip:hover{background:rgba(255,255,255,0.06);color:#94a3b8}
        .fchip.on{background:rgba(124,58,237,0.15);border-color:rgba(124,58,237,0.4);color:#a78bfa}
      `}</style>

      {/* ─── Header ─── */}
      <div className="fu d1" style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2rem)', color: 'white', letterSpacing: '-1px', margin: '0 0 6px' }}>
          📝 <span style={{ background: 'linear-gradient(135deg,#a78bfa,#38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Notes Hub</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>All your weak points and key formulas — every subject, every topic, one place</p>
      </div>

      {/* ─── Stats ─── */}
      {!loading && (
        <div className="fu d2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { icon: '📚', val: notes.length,        label: 'Subjects with notes', color: '#a78bfa' },
            { icon: '📄', val: stats.subjectNotes,  label: 'Subject notes',       color: '#38bdf8' },
            { icon: '📝', val: stats.topicNotes,    label: 'Topic notes',         color: '#34d399' },
            { icon: '⚠️', val: notes.reduce((a,s)=>a+s.topicNotes.filter(t=>t.weak).length,0), label: 'Weak points', color: '#f87171' },
            { icon: '⭐', val: notes.reduce((a,s)=>a+s.topicNotes.filter(t=>t.important).length,0), label: 'Key points', color: '#fbbf24' },
          ].map(({ icon, val, label, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}20`, borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 22, color }}>{val}</div>
              <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Search + filter ─── */}
      <div className="fu d2" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#334155' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes, topics, subjects..."
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'DM Sans,sans-serif', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all',       label: 'All Notes'   },
            { id: 'weak',      label: '⚠️ Weak Points' },
            { id: 'important', label: '⭐ Key Points'  },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`fchip${filter === f.id ? ' on' : ''}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📝</div>
          <div style={{ fontSize: 13 }}>Loading your notes...</div>
        </div>
      ) : totalNoteCount === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 18, color: 'white', marginBottom: 8 }}>No notes yet</div>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
            Open any subject, expand a topic, and write in the <strong style={{ color: 'white' }}>Weak Points</strong> or <strong style={{ color: 'white' }}>Key Formulas</strong> boxes. They'll all appear here.
          </div>
          <Link href="/dashboard/subjects"
            style={{ display: 'inline-block', padding: '11px 24px', borderRadius: 14, background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            📚 Go to Subjects
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#475569' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 14 }}>No notes match your search</div>
        </div>
      ) : (
        <div className="fu d3">
          {filtered.map((subject, i) => (
            <SubjectSection
              key={subject.subjectId}
              subject={subject}
              defaultOpen={i === 0 || !!search}
            />
          ))}
        </div>
      )}

      {/* ─── Footer hint ─── */}
      {!loading && totalNoteCount > 0 && (
        <div style={{ marginTop: 20, padding: '12px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: '#334155', textAlign: 'center' }}>
          💡 Notes are also sent to the AI when generating quizzes and study plans — keep them updated for better results
        </div>
      )}
    </>
  );
}