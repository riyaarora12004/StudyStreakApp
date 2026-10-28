'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleGenAI } from '@google/genai';

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, []);
  const colors = {
    success: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', color: '#34d399' },
    error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#f87171' },
    info:    { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', color: '#a78bfa' },
  };
  const c = colors[type] || colors.success;
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:999, padding:'12px 20px', borderRadius:14, background:c.bg, border:`1px solid ${c.border}`, color:c.color, fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', animation:'toastIn .3s cubic-bezier(0.34,1.56,0.64,1)' }}>
      {message}
    </div>
  );
}

// ── Quiz Modal ────────────────────────────────────────────────────────────────
function QuizModal({ topic, subjectName, subjectColor, onClose, onResult }) {
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [current,   setCurrent]   = useState(0);
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result,    setResult]    = useState(null);
  const [timeLeft,  setTimeLeft]  = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const generate = async () => {
      try {
        const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });
        const context = [
          topic.importantPoints ? `Key points: ${topic.importantPoints}` : '',
          topic.weakPoints      ? `Weak areas: ${topic.weakPoints}`       : '',
        ].filter(Boolean).join('\n');

        const prompt = `Generate a 10-question multiple choice quiz for this topic:
Topic: "${topic.name}"
Subject: "${subjectName}"
${context}

Return ONLY valid JSON array. No markdown. No backticks:
[{"question":"?","options":["A","B","C","D"],"correct":0,"explanation":"brief explanation"}]

Rules: 10 questions, mix of conceptual and application, 4 options each, exactly one correct (index 0-3).`;

        const result = await genAI.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
        const raw     = result.text.trim();
        const cleaned = raw.replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
        const qs      = JSON.parse(cleaned);
        setQuestions(qs);
        setTimeLeft(qs.length * 60);
      } catch (e) {
        console.error(e);
        setQuestions([{
          question: `What is the main concept of "${topic.name}"?`,
          options: ['Core principles and fundamentals', 'Advanced applications only', 'Historical background', 'None of the above'],
          correct: 0,
          explanation: 'Understanding core principles is fundamental to mastering any topic.',
        }]);
        setTimeLeft(60);
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, []);

  useEffect(() => {
    if (loading || submitted || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, submitted]);

  const handleAnswer = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers(p => ({ ...p, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    clearInterval(timerRef.current);
    if (submitted) return;
    let correct = 0;
    const weakAreas = [];
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
      else weakAreas.push(q.question.slice(0, 60) + (q.question.length > 60 ? '...' : ''));
    });
    const score  = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;
    setResult({ score, correct, total: questions.length, passed, weakAreas });
    setSubmitted(true);
    onResult({ score, totalQ: questions.length, passed, weakAreas });
  };

  const fmtTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const answered = Object.keys(answers).length;
  const q = questions[current];

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(12px)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'#080c18',border:'1px solid rgba(139,92,246,0.3)',borderRadius:28,width:'100%',maxWidth:640,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 40px 80px rgba(0,0,0,0.7)' }}>
        <style>{`
          .opt-btn{width:100%;text-align:left;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:#cbd5e1;font-size:14px;cursor:pointer;transition:all .15s;margin-bottom:10px;}
          .opt-btn:hover:not(:disabled){border-color:rgba(139,92,246,0.5);background:rgba(139,92,246,0.08);color:white;}
          .opt-btn.sel{border-color:#7c3aed;background:rgba(124,58,237,0.15);color:white;}
          .opt-btn.correct-ans{border-color:#34d399;background:rgba(52,211,153,0.12);color:#34d399;}
          .opt-btn.wrong-ans{border-color:#f87171;background:rgba(248,113,113,0.12);color:#f87171;}
          @keyframes resultIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
          .result-in{animation:resultIn .4s cubic-bezier(0.34,1.56,0.64,1);}
          @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        `}</style>

        {/* Header */}
        <div style={{ padding:'24px 24px 20px',borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
            <div style={{ fontSize:11,textTransform:'uppercase',letterSpacing:'0.1em',color:subjectColor }}>📝 Topic Quiz</div>
            {!submitted && !loading && (
              <div style={{ fontFamily:'monospace',fontSize:13,fontWeight:700,color:timeLeft<60?'#f87171':'#94a3b8' }}>⏱ {fmtTime(timeLeft)}</div>
            )}
          </div>
          <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:18,color:'white' }}>{topic.name}</div>
        </div>

        <div style={{ padding:24 }}>
          {/* Loading */}
          {loading && (
            <div style={{ textAlign:'center',padding:'48px 0' }}>
              <div style={{ fontSize:40,marginBottom:16,display:'inline-block',animation:'spin 1s linear infinite' }}>🧠</div>
              <div style={{ color:'#64748b',fontSize:13 }}>AI is generating your quiz...</div>
            </div>
          )}

          {/* Result */}
          {submitted && result && (
            <div className="result-in" style={{ textAlign:'center' }}>
              <div style={{ fontSize:56,marginBottom:12 }}>{result.passed ? '🎉' : '😔'}</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:40,color:result.passed?'#34d399':'#f87171',marginBottom:6 }}>
                {result.score}%
              </div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'white',marginBottom:4 }}>
                {result.passed ? 'Topic Unlocked! ✅' : 'Not quite there yet'}
              </div>
              <div style={{ color:'#64748b',fontSize:13,marginBottom:24 }}>
                {result.correct}/{result.total} correct · {result.passed ? 'Topic marked complete!' : 'You need 70% to pass. Review and retry.'}
              </div>

              {/* Weak areas */}
              {result.weakAreas.length > 0 && !result.passed && (
                <div style={{ textAlign:'left',marginBottom:20,padding:16,borderRadius:16,background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.2)' }}>
                  <div style={{ fontSize:11,fontWeight:700,color:'#f87171',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.08em' }}>
                    ⚠️ Questions you got wrong:
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                    {result.weakAreas.map((w, i) => (
                      <div key={i} style={{ display:'flex',gap:8,fontSize:12,color:'#94a3b8' }}>
                        <span style={{ color:'#f87171',flexShrink:0 }}>•</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer review */}
              <div style={{ display:'flex',flexDirection:'column',gap:10,textAlign:'left',marginBottom:20 }}>
                {questions.map((q, i) => {
                  const isCorrect = answers[i] === q.correct;
                  return (
                    <div key={i} style={{ padding:14,borderRadius:14,background:isCorrect?'rgba(52,211,153,0.06)':'rgba(248,113,113,0.06)',border:`1px solid ${isCorrect?'rgba(52,211,153,0.2)':'rgba(248,113,113,0.2)'}` }}>
                      <div style={{ fontSize:13,color:'white',marginBottom:6,fontWeight:500 }}>{q.question}</div>
                      <div style={{ fontSize:12,color:isCorrect?'#34d399':'#f87171',marginBottom:isCorrect?0:4 }}>
                        {isCorrect ? '✓ Correct' : `✗ You chose: ${q.options[answers[i]] ?? 'Skipped'}`}
                      </div>
                      {!isCorrect && (
                        <div style={{ fontSize:12,color:'#475569',marginBottom:4 }}>
                          Correct: {q.options[q.correct]}
                        </div>
                      )}
                      <div style={{ fontSize:11,color:'#334155',fontStyle:'italic' }}>{q.explanation}</div>
                    </div>
                  );
                })}
              </div>

              <button onClick={onClose} style={{ width:'100%',padding:'14px 0',borderRadius:18,border:'none',background:'linear-gradient(135deg,#7c3aed,#2563eb)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer' }}>
                {result.passed ? '🎉 Back to Topics' : '📚 Back to Study'}
              </button>
            </div>
          )}

          {/* Questions */}
          {!loading && !submitted && q && (
            <>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
                <div style={{ fontSize:12,color:'#475569' }}>Question {current+1} of {questions.length}</div>
                <div style={{ fontSize:12,color:'#475569' }}>{answered} answered</div>
              </div>
              <div style={{ height:6,borderRadius:6,background:'rgba(255,255,255,0.05)',marginBottom:20 }}>
                <div style={{ height:'100%',borderRadius:6,transition:'width .3s',width:`${((current+1)/questions.length)*100}%`,background:`linear-gradient(90deg,${subjectColor},${subjectColor}88)` }} />
              </div>

              <div style={{ fontSize:15,fontWeight:600,color:'white',marginBottom:20,lineHeight:1.5 }}>{q.question}</div>

              <div style={{ marginBottom:20 }}>
                {q.options.map((opt, oi) => (
                  <button key={oi} onClick={() => handleAnswer(current, oi)}
                    className={`opt-btn${answers[current]===oi?' sel':''}`}>
                    <span style={{ fontWeight:700,color:'#475569',marginRight:8 }}>{['A','B','C','D'][oi]}.</span>
                    {opt}
                  </button>
                ))}
              </div>

              <div style={{ display:'flex',gap:10 }}>
                <button onClick={() => setCurrent(p => Math.max(0, p-1))} disabled={current===0}
                  style={{ flex:1,padding:'12px 0',borderRadius:12,fontSize:13,color:'#64748b',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer',opacity:current===0?0.3:1 }}>
                  ← Previous
                </button>
                {current < questions.length - 1 ? (
                  <button onClick={() => setCurrent(p => p+1)}
                    style={{ flex:1,padding:'12px 0',borderRadius:12,fontSize:13,color:'white',fontWeight:600,background:'rgba(124,58,237,0.2)',border:'1px solid rgba(124,58,237,0.4)',cursor:'pointer' }}>
                    Next →
                  </button>
                ) : (
                  <button onClick={handleSubmit}
                    style={{ flex:1,padding:'12px 0',borderRadius:12,fontSize:13,color:'white',fontWeight:700,background:'linear-gradient(135deg,#7c3aed,#2563eb)',border:'none',cursor:'pointer' }}>
                    Submit Quiz ✓
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Topic Card ────────────────────────────────────────────────────────────────
function TopicCard({ topic, idx, subjectColor, subjectName, onQuizResult, onDeleteTopic, onNotesUpdate }) {
  const [expanded,    setExpanded]    = useState(false);
  const [showQuiz,    setShowQuiz]    = useState(false);
  const [notes,       setNotes]       = useState({ weak: topic.weakPoints||'', important: topic.importantPoints||'' });
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesChanged,setNotesChanged]= useState(false);
  const [toast,       setToast]       = useState(null);
  const [subjectId,   setSubjectId]   = useState('');

  useEffect(() => { setSubjectId(window.location.pathname.split('/').pop()); }, []);

  // Track if notes changed since last save
  useEffect(() => {
    const changed = notes.weak !== (topic.weakPoints||'') || notes.important !== (topic.importantPoints||'');
    setNotesChanged(changed);
  }, [notes]);

  const quizUnlocked = (topic.studyMinutesLogged || 0) >= (topic.studyMinutesRequired || 20);
  const pct          = Math.min(100, Math.round(((topic.studyMinutesLogged||0) / (topic.studyMinutesRequired||20)) * 100));
  const lastAttempt  = topic.quizAttempts?.slice(-1)[0];

  const statusConfig = {
    completed: { icon:'✅', label:'Completed',   color:'#34d399', bg:'rgba(52,211,153,0.08)',   border:'rgba(52,211,153,0.25)'  },
    unlocked:  { icon:'📖', label:'In Progress', color:'#a78bfa', bg:'rgba(139,92,246,0.06)',   border:'rgba(139,92,246,0.15)'  },
    locked:    { icon:'🔒', label:'Locked',      color:'#475569', bg:'rgba(255,255,255,0.02)',  border:'rgba(255,255,255,0.06)' },
  };
  const st = statusConfig[topic.status] || statusConfig.unlocked;

  const handleNotesSave = async () => {
    setSavingNotes(true);
    const res = await fetch(`/api/subjects/${subjectId}/topics`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action:'updateTopicNotes', topicId:topic._id, weakPoints:notes.weak, importantPoints:notes.important }),
    });
    setSavingNotes(false);
    if (res.ok) {
      setNotesChanged(false);
      setToast('✅ Notes saved to your account!');
      onNotesUpdate(topic._id, notes.weak, notes.important);
    } else {
      setToast('❌ Failed to save notes');
    }
  };

  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {showQuiz && (
        <QuizModal
          topic={{ ...topic, weakPoints:notes.weak, importantPoints:notes.important }}
          subjectName={subjectName}
          subjectColor={subjectColor}
          onClose={() => setShowQuiz(false)}
          onResult={(res) => { setShowQuiz(false); onQuizResult(topic._id, res); }}
        />
      )}

      <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:16, transition:'all .2s', animation:'fadeUp .4s ease forwards', opacity:0, animationDelay:`${idx*0.05}s` }}>
        {/* Main row */}
        <div style={{ display:'flex',alignItems:'center',gap:14,cursor:'pointer' }} onClick={() => setExpanded(p=>!p)}>
          {/* Number */}
          <div style={{ width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,flexShrink:0,fontFamily:'Syne,sans-serif',background:topic.status==='completed'?'#34d399':`${subjectColor}25`,color:topic.status==='completed'?'white':subjectColor }}>
            {topic.status==='completed' ? '✓' : idx+1}
          </div>

          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:600,fontSize:14,color:'white',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textDecoration:topic.status==='completed'?'line-through':'none',opacity:topic.status==='completed'?0.6:1 }}>
              {topic.name}
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10,marginTop:3,flexWrap:'wrap' }}>
              {topic.status !== 'completed' && (
                <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:56,height:4,borderRadius:4,background:'rgba(255,255,255,0.06)' }}>
                    <div style={{ height:'100%',borderRadius:4,width:`${pct}%`,background:quizUnlocked?'#34d399':subjectColor }} />
                  </div>
                  <span style={{ fontSize:11,color:quizUnlocked?'#34d399':'#475569' }}>
                    {quizUnlocked ? '✓ Quiz ready' : `${topic.studyMinutesLogged||0}/${topic.studyMinutesRequired}m`}
                  </span>
                </div>
              )}
              {lastAttempt && (
                <span style={{ fontSize:11,color:lastAttempt.passed?'#34d399':'#f87171' }}>Best: {topic.bestScore}%</span>
              )}
              {/* Show notes indicator */}
              {(topic.weakPoints || topic.importantPoints) && (
                <span style={{ fontSize:10,color:'#334155',background:'rgba(255,255,255,0.04)',padding:'2px 6px',borderRadius:6 }}>📝 has notes</span>
              )}
            </div>
          </div>

          <div style={{ display:'flex',alignItems:'center',gap:8,flexShrink:0 }}>
            <span style={{ fontSize:11,padding:'4px 10px',borderRadius:99,fontWeight:600,background:st.bg,color:st.color,border:`1px solid ${st.border}` }}>
              {st.icon} {st.label}
            </span>
            <span style={{ color:'#334155',fontSize:12 }}>{expanded?'▲':'▼'}</span>
          </div>
        </div>

        {/* Expanded */}
        {expanded && (
          <div style={{ marginTop:16,paddingTop:16,borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            {/* Study time status */}
            {topic.status !== 'completed' && (
              <div style={{ padding:'10px 14px',borderRadius:12,marginBottom:14,fontSize:13,background:quizUnlocked?'rgba(52,211,153,0.07)':'rgba(255,255,255,0.03)',border:`1px solid ${quizUnlocked?'rgba(52,211,153,0.2)':'rgba(255,255,255,0.07)'}` }}>
                {quizUnlocked ? (
                  <span style={{ color:'#34d399' }}>✅ Studied {topic.studyMinutesLogged} min — Quiz is unlocked!</span>
                ) : (
                  <span style={{ color:'#64748b' }}>
                    ⏱️ Study <strong style={{ color:'white' }}>{topic.studyMinutesRequired - (topic.studyMinutesLogged||0)} more minutes</strong> on the timer to unlock the quiz.{' '}
                    <Link href="/dashboard/timer" style={{ color:'#a78bfa' }}>→ Go to Timer</Link>
                  </span>
                )}
              </div>
            )}

            {/* ── NOTES SECTION ── */}
            <div style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:14,marginBottom:14 }}>
              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12 }}>
                <div style={{ fontSize:12,fontWeight:700,color:'#94a3b8',fontFamily:'Syne,sans-serif' }}>
                  📝 Your Notes for this Topic
                </div>
                <div style={{ fontSize:10,color:'#334155' }}>
                  💾 Saved to your account · loads every time you return
                </div>
              </div>

              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12 }}>
                {/* Weak points */}
                <div>
                  <label style={{ display:'block',fontSize:11,color:'#f87171',fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em' }}>
                    ⚠️ Weak Points / Confusing Areas
                  </label>
                  <textarea
                    value={notes.weak}
                    onChange={e => setNotes(p => ({ ...p, weak: e.target.value }))}
                    placeholder="What confuses you? What needs more practice?"
                    rows={4}
                    style={{ width:'100%',padding:'10px 12px',borderRadius:12,background:'rgba(248,113,113,0.04)',border:'1px solid rgba(248,113,113,0.2)',color:'#e2e8f0',fontSize:13,outline:'none',resize:'vertical',fontFamily:'DM Sans,sans-serif',boxSizing:'border-box' }}
                  />
                </div>
                {/* Important points */}
                <div>
                  <label style={{ display:'block',fontSize:11,color:'#34d399',fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em' }}>
                    ⭐ Important Points / Key Formulas
                  </label>
                  <textarea
                    value={notes.important}
                    onChange={e => setNotes(p => ({ ...p, important: e.target.value }))}
                    placeholder="Key formulas, mnemonics, must-remember definitions..."
                    rows={4}
                    style={{ width:'100%',padding:'10px 12px',borderRadius:12,background:'rgba(52,211,153,0.04)',border:'1px solid rgba(52,211,153,0.2)',color:'#e2e8f0',fontSize:13,outline:'none',resize:'vertical',fontFamily:'DM Sans,sans-serif',boxSizing:'border-box' }}
                  />
                </div>
              </div>

              <button onClick={handleNotesSave} disabled={savingNotes || !notesChanged}
                style={{ padding:'9px 20px',borderRadius:12,border:'none',background:notesChanged?'linear-gradient(135deg,#7c3aed,#2563eb)':'rgba(255,255,255,0.06)',color:notesChanged?'white':'#334155',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,cursor:notesChanged?'pointer':'default',transition:'all .2s',boxShadow:notesChanged?'0 0 20px rgba(124,58,237,0.35)':'none' }}>
                {savingNotes ? '⏳ Saving...' : notesChanged ? '💾 Save Notes' : '✓ Notes Saved'}
              </button>
              {!notesChanged && (notes.weak || notes.important) && (
                <span style={{ fontSize:11,color:'#475569',marginLeft:10 }}>Last saved notes are shown above</span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
              {topic.status !== 'completed' && (
                <button onClick={() => setShowQuiz(true)} disabled={!quizUnlocked}
                  style={{ padding:'8px 18px',borderRadius:12,border:`1px solid ${quizUnlocked?'rgba(52,211,153,0.4)':'rgba(255,255,255,0.08)'}`,background:quizUnlocked?'rgba(52,211,153,0.1)':'rgba(255,255,255,0.04)',color:quizUnlocked?'#34d399':'#334155',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,cursor:quizUnlocked?'pointer':'default',opacity:quizUnlocked?1:0.5 }}>
                  {quizUnlocked ? '🧠 Take Quiz' : `🔒 Study ${topic.studyMinutesRequired-(topic.studyMinutesLogged||0)}m more`}
                </button>
              )}
              {topic.status === 'completed' && lastAttempt && (
                <button onClick={() => setShowQuiz(true)}
                  style={{ padding:'8px 18px',borderRadius:12,border:'1px solid rgba(52,211,153,0.3)',background:'rgba(52,211,153,0.08)',color:'#34d399',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,cursor:'pointer' }}>
                  🔄 Retake Quiz
                </button>
              )}
              <button onClick={() => onDeleteTopic(topic._id)}
                style={{ padding:'8px 18px',borderRadius:12,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.03)',color:'#475569',fontFamily:'Syne,sans-serif',fontWeight:600,fontSize:13,cursor:'pointer' }}>
                🗑️ Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SubjectDetailPage() {
  const { id }  = useParams();
  const router  = useRouter();
  const [subject,       setSubject]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('topics');
  const [showAddTopics, setShowAddTopics] = useState(false);
  const [toast,         setToast]         = useState(null);

  // Add topics state
  const [addMethod,    setAddMethod]    = useState('ai');
  const [syllabusText, setSyllabusText] = useState('');
  const [examBoard,    setExamBoard]    = useState('');
  const [bulkText,     setBulkText]     = useState('');
  const [extracting,   setExtracting]   = useState(false);
  const [extracted,    setExtracted]    = useState([]);
  const [studyMins,    setStudyMins]    = useState(20);
  const [saving,       setSaving]       = useState(false);

  // Subject-level notes
  const [subjectNotes,  setSubjectNotes]  = useState({ syllabus:'', weak:'', important:'' });
  const [savingNotes,   setSavingNotes]   = useState(false);
  const [notesChanged,  setNotesChanged]  = useState(false);

  useEffect(() => {
    fetch(`/api/subjects/${id}`)
      .then(r => r.json())
      .then(d => {
        setSubject(d.subject);
        const n = { syllabus:d.subject.syllabusNotes||'', weak:d.subject.weakPoints||'', important:d.subject.importantPoints||'' };
        setSubjectNotes(n);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!subject) return;
    const changed = subjectNotes.syllabus !== (subject.syllabusNotes||'') || subjectNotes.weak !== (subject.weakPoints||'') || subjectNotes.important !== (subject.importantPoints||'');
    setNotesChanged(changed);
  }, [subjectNotes]);

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const res  = await fetch('/api/extract-topics', {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ syllabusText, subjectName:subject?.name, examBoard }),
      });
      const data = await res.json();
      if (res.ok) setExtracted(data.topics);
      else setToast('❌ ' + data.message);
    } catch { setToast('❌ Failed to extract topics'); }
    setExtracting(false);
  };

  const handleBulkParse = () => {
    const topics = bulkText.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>l.replace(/^[\d\.\-\*]+\s*/,''));
    setExtracted(topics);
  };

  const handleSaveTopics = async () => {
    if (!extracted.length) return;
    setSaving(true);
    const res = await fetch(`/api/subjects/${id}/topics`, {
      method: 'PATCH', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ action:'addTopics', topics:extracted, studyMinutesRequired:studyMins }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubject(data.subject);
      setShowAddTopics(false);
      setExtracted([]);
      setSyllabusText('');
      setBulkText('');
      setToast('✅ ' + extracted.length + ' topics saved!');
    }
    setSaving(false);
  };

  const handleQuizResult = async (topicId, result) => {
    await fetch(`/api/subjects/${id}/topics`, {
      method: 'PATCH', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ action:'saveQuizResult', topicId, ...result }),
    });
    const fresh = await fetch(`/api/subjects/${id}`).then(r=>r.json());
    if (fresh.subject) setSubject(fresh.subject);
  };

  const handleDeleteTopic = async (topicId) => {
    if (!confirm('Delete this topic?')) return;
    const res  = await fetch(`/api/subjects/${id}/topics`, {
      method: 'PATCH', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ action:'deleteTopic', topicId }),
    });
    const data = await res.json();
    if (res.ok) { setSubject(data.subject); setToast('🗑️ Topic deleted'); }
  };

  const handleNotesUpdate = (topicId, weak, important) => {
    setSubject(p => ({ ...p, topics: p.topics.map(t => t._id===topicId ? {...t,weakPoints:weak,importantPoints:important} : t) }));
  };

  const handleSubjectNotesSave = async () => {
    setSavingNotes(true);
    const res = await fetch(`/api/subjects/${id}/topics`, {
      method: 'PATCH', headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ action:'updateSubjectNotes', syllabusNotes:subjectNotes.syllabus, weakPoints:subjectNotes.weak, importantPoints:subjectNotes.important }),
    });
    setSavingNotes(false);
    if (res.ok) {
      setNotesChanged(false);
      setSubject(p => ({ ...p, syllabusNotes:subjectNotes.syllabus, weakPoints:subjectNotes.weak, importantPoints:subjectNotes.important }));
      setToast('✅ Subject notes saved to your account!');
    } else {
      setToast('❌ Failed to save notes');
    }
  };

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:320 }}>
      <div style={{ fontSize:40,animation:'spin 1s linear infinite',display:'inline-block' }}>📚</div>
    </div>
  );
  if (!subject) return (
    <div style={{ textAlign:'center',padding:80,color:'#475569' }}>
      Subject not found. <Link href="/dashboard/subjects" style={{ color:'#a78bfa' }}>← Back</Link>
    </div>
  );

  const completedTopics = subject.topics?.filter(t=>t.status==='completed').length || 0;
  const totalTopics     = subject.topics?.length || 0;
  const pct             = totalTopics ? Math.round((completedTopics/totalTopics)*100) : 0;
  const days            = Math.max(0, Math.ceil((new Date(subject.examDate)-new Date())/86400000));
  const allDone         = totalTopics > 0 && completedTopics === totalTopics;
  const weakTopics      = subject.topics?.filter(t=>t.quizAttempts?.some(a=>!a.passed)) || [];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes toastIn { from{opacity:0;transform:translateY(12px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
        .fu{animation:fadeUp .4s ease forwards}
        .d1{animation-delay:.03s;opacity:0} .d2{animation-delay:.1s;opacity:0}
        .d3{animation-delay:.17s;opacity:0} .d4{animation-delay:.24s;opacity:0}
        .tab-btn{padding:8px 18px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:#475569;font-family:'Syne',sans-serif;}
        .tab-btn.active{background:rgba(124,58,237,0.15);border-color:rgba(124,58,237,0.4);color:#a78bfa;}
        .method-tab{flex:1;padding:10px;border-radius:12px;cursor:pointer;transition:all .2s;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:#475569;font-size:12px;font-weight:600;text-align:center;font-family:'Syne',sans-serif;}
        .method-tab.active{background:rgba(124,58,237,0.15);border-color:rgba(124,58,237,0.4);color:#a78bfa;}
        input,textarea{color-scheme:dark;}
        @keyframes shimmer{from{transform:translateX(-100%)}to{transform:translateX(200%)}}
      `}</style>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* ─── Header ─── */}
      <div className="fu d1" style={{ marginBottom:24 }}>
        <Link href="/dashboard/subjects" style={{ fontSize:12,color:'#475569',textDecoration:'none',display:'flex',alignItems:'center',gap:4,marginBottom:16 }}>
          ← Back to Subjects
        </Link>

        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:16 }}>
            <div style={{ width:64,height:64,borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,flexShrink:0,background:`${subject.color}18`,border:`1px solid ${subject.color}30` }}>
              {subject.emoji}
            </div>
            <div>
              <h1 style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:'clamp(1.4rem,3vw,1.8rem)',color:'white',letterSpacing:'-0.5px',margin:0 }}>{subject.name}</h1>
              <div style={{ display:'flex',gap:12,marginTop:4,flexWrap:'wrap' }}>
                <span style={{ fontSize:12,color:'#475569' }}>{completedTopics}/{totalTopics} topics done</span>
                <span style={{ fontSize:12,color:days<=7?'#f87171':'#64748b' }}>📅 {days} days to exam</span>
                {weakTopics.length > 0 && <span style={{ fontSize:12,color:'#fbbf24' }}>⚠️ {weakTopics.length} weak topics</span>}
              </div>
            </div>
          </div>

          {/* Circular progress */}
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ position:'relative',width:60,height:60 }}>
              <svg width="60" height="60" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5"/>
                <circle cx="30" cy="30" r="24" fill="none" stroke={subject.color} strokeWidth="5"
                  strokeDasharray={150.8} strokeDashoffset={150.8-(pct/100*150.8)} strokeLinecap="round"
                  style={{ filter:`drop-shadow(0 0 5px ${subject.color})` }}/>
              </svg>
              <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:13,color:subject.color }}>{pct}%</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop:16,height:6,borderRadius:6,background:'rgba(255,255,255,0.05)',overflow:'hidden' }}>
          <div style={{ height:'100%',borderRadius:6,width:`${pct}%`,background:`linear-gradient(90deg,${subject.color}88,${subject.color})`,boxShadow:`0 0 12px ${subject.color}60`,transition:'width 1s ease',position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',inset:0,background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)',animation:'shimmer 2s infinite' }}/>
          </div>
        </div>
      </div>

      {/* ─── All topics done banner ─── */}
      {allDone && !subject.fullQuizDone && (
        <div className="fu d2" style={{ marginBottom:20,padding:20,borderRadius:20,display:'flex',alignItems:'center',gap:16,flexWrap:'wrap',background:'linear-gradient(135deg,rgba(251,191,36,0.08),rgba(249,115,22,0.08))',border:'1px solid rgba(251,191,36,0.3)' }}>
          <span style={{ fontSize:32 }}>🎓</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,color:'white',marginBottom:2 }}>All topics completed! Ready for Full Syllabus Quiz?</div>
            <div style={{ fontSize:12,color:'#64748b' }}>Take the final quiz to complete this subject and get your weak area analysis.</div>
          </div>
          <Link href={`/dashboard/subjects/${id}/full-quiz`}>
            <button style={{ padding:'12px 24px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#fbbf24,#f97316)',color:'#000',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer' }}>
              🏆 Take Final Quiz
            </button>
          </Link>
        </div>
      )}

      {/* ─── Tabs ─── */}
      <div className="fu d2" style={{ display:'flex',gap:8,marginBottom:20,flexWrap:'wrap' }}>
        {[{ id:'topics',label:'📚 Topics' },{ id:'notes',label:'📝 Notes' },{ id:'analysis',label:'📊 Analysis' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab===t.id?'active':''}`}>{t.label}</button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ TOPICS */}
      {activeTab === 'topics' && (
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div className="fu d3">
            <button onClick={() => setShowAddTopics(p=>!p)}
              style={{ padding:'12px 24px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#7c3aed,#2563eb)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer',boxShadow:'0 0 24px rgba(124,58,237,0.35)' }}>
              {showAddTopics ? '✕ Cancel' : totalTopics > 0 ? '🔄 Replace Topics' : '+ Add Topics'}
            </button>
          </div>

          {showAddTopics && (
            <div className="fu" style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:24,padding:24 }}>
              <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white',marginBottom:16 }}>Add Topics to {subject.name}</h3>
              <div style={{ display:'flex',gap:8,marginBottom:20 }}>
                {[{ id:'ai',label:'🤖 AI Extract' },{ id:'bulk',label:'📋 Bulk Paste' }].map(m => (
                  <button key={m.id} onClick={() => setAddMethod(m.id)} className={`method-tab ${addMethod===m.id?'active':''}`}>{m.label}</button>
                ))}
              </div>

              {addMethod === 'ai' && (
                <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                  <input value={examBoard} onChange={e=>setExamBoard(e.target.value)}
                    placeholder="Exam Board / Class (e.g. CBSE Class 12, JEE, NEET...)"
                    style={{ padding:'12px 16px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'white',fontSize:13,outline:'none' }}/>
                  <textarea value={syllabusText} onChange={e=>setSyllabusText(e.target.value)}
                    placeholder="Paste syllabus text... or leave blank to auto-generate topics for this subject."
                    rows={5} style={{ padding:'12px 16px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'white',fontSize:13,outline:'none',resize:'vertical',fontFamily:'DM Sans,sans-serif' }}/>
                  <button onClick={handleExtract} disabled={extracting}
                    style={{ padding:'12px 24px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#7c3aed,#2563eb)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,cursor:'pointer',alignSelf:'flex-start' }}>
                    {extracting ? '🤖 Extracting...' : '🤖 Extract Topics with AI'}
                  </button>
                </div>
              )}

              {addMethod === 'bulk' && (
                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  <textarea value={bulkText} onChange={e=>setBulkText(e.target.value)}
                    placeholder={"1. Introduction\n2. Limits and Continuity\n3. Derivatives\n..."}
                    rows={8} style={{ padding:'12px 16px',borderRadius:12,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'white',fontSize:13,outline:'none',resize:'vertical',fontFamily:'monospace' }}/>
                  <button onClick={handleBulkParse}
                    style={{ padding:'10px 20px',borderRadius:12,border:'1px solid rgba(124,58,237,0.4)',background:'rgba(124,58,237,0.15)',color:'#a78bfa',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,cursor:'pointer',alignSelf:'flex-start' }}>
                    Parse Topics
                  </button>
                </div>
              )}

              {extracted.length > 0 && (
                <div style={{ marginTop:20 }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                    <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'white' }}>{extracted.length} Topics — Edit if needed:</div>
                    <button onClick={() => setExtracted(p=>[...p,'New Topic'])} style={{ fontSize:12,color:'#a78bfa',background:'none',border:'none',cursor:'pointer' }}>+ Add more</button>
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:4,maxHeight:200,overflowY:'auto',marginBottom:14 }}>
                    {extracted.map((t, i) => (
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:10,background:'rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize:11,color:'#475569',width:20,flexShrink:0 }}>{i+1}.</span>
                        <input value={t} onChange={e=>setExtracted(p=>p.map((x,xi)=>xi===i?e.target.value:x))}
                          style={{ flex:1,background:'transparent',border:'none',color:'#e2e8f0',fontSize:13,outline:'none' }}/>
                        <button onClick={() => setExtracted(p=>p.filter((_,xi)=>xi!==i))} style={{ color:'#334155',background:'none',border:'none',cursor:'pointer',fontSize:13 }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:16 }}>
                    <label style={{ fontSize:12,color:'#64748b' }}>Min study time per topic:</label>
                    <input type="number" value={studyMins} min={5} max={120} step={5} onChange={e=>setStudyMins(Number(e.target.value))}
                      style={{ width:70,padding:'8px 10px',borderRadius:10,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'white',fontSize:13,outline:'none',textAlign:'center' }}/>
                    <span style={{ fontSize:12,color:'#475569' }}>minutes (before quiz unlocks)</span>
                  </div>
                  <button onClick={handleSaveTopics} disabled={saving}
                    style={{ width:'100%',padding:'14px 0',borderRadius:14,border:'none',background:'linear-gradient(135deg,#7c3aed,#2563eb)',color:'white',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,cursor:'pointer' }}>
                    {saving ? '⏳ Saving...' : `✅ Save ${extracted.length} Topics`}
                  </button>
                </div>
              )}
            </div>
          )}

          {totalTopics === 0 ? (
            <div className="fu d4" style={{ textAlign:'center',padding:60,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:24 }}>
              <div style={{ fontSize:48,marginBottom:16 }}>📋</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:18,color:'white',marginBottom:6 }}>No Topics Yet</div>
              <div style={{ color:'#475569',fontSize:13 }}>Add topics via AI extraction or paste them manually above.</div>
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {subject.topics.map((t, i) => (
                <TopicCard key={t._id} topic={t} idx={i}
                  subjectColor={subject.color} subjectName={subject.name}
                  onQuizResult={handleQuizResult}
                  onDeleteTopic={handleDeleteTopic}
                  onNotesUpdate={handleNotesUpdate} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ NOTES */}
      {activeTab === 'notes' && (
        <div className="fu" style={{ background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:24,padding:24 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4 }}>
            <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'white',margin:0 }}>📝 {subject.name} — Subject Notes</h3>
            <div style={{ fontSize:11,color:'#334155' }}>💾 Stored in your account · available on any device</div>
          </div>
          <div style={{ fontSize:12,color:'#475569',marginBottom:20 }}>
            These notes are saved to your profile and load automatically every time you open this subject.
          </div>

          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            <div>
              <label style={{ display:'block',fontSize:11,color:'#64748b',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>📄 Syllabus Overview / General Notes</label>
              <textarea value={subjectNotes.syllabus} onChange={e=>setSubjectNotes(p=>({...p,syllabus:e.target.value}))}
                placeholder="Paste your syllabus, exam pattern, marking scheme, or any general notes..."
                rows={4} style={{ width:'100%',padding:'12px 14px',borderRadius:14,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',color:'#e2e8f0',fontSize:13,outline:'none',resize:'vertical',fontFamily:'DM Sans,sans-serif',boxSizing:'border-box' }}/>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
              <div>
                <label style={{ display:'block',fontSize:11,color:'#f87171',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>⚠️ Subject-Wide Weak Points</label>
                <textarea value={subjectNotes.weak} onChange={e=>setSubjectNotes(p=>({...p,weak:e.target.value}))}
                  placeholder="Which areas do you find most challenging overall?"
                  rows={4} style={{ width:'100%',padding:'12px 14px',borderRadius:14,background:'rgba(248,113,113,0.04)',border:'1px solid rgba(248,113,113,0.2)',color:'#e2e8f0',fontSize:13,outline:'none',resize:'vertical',fontFamily:'DM Sans,sans-serif',boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ display:'block',fontSize:11,color:'#34d399',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>⭐ Key Formulas / Must-Know</label>
                <textarea value={subjectNotes.important} onChange={e=>setSubjectNotes(p=>({...p,important:e.target.value}))}
                  placeholder="Most important formulas, theorems, definitions..."
                  rows={4} style={{ width:'100%',padding:'12px 14px',borderRadius:14,background:'rgba(52,211,153,0.04)',border:'1px solid rgba(52,211,153,0.2)',color:'#e2e8f0',fontSize:13,outline:'none',resize:'vertical',fontFamily:'DM Sans,sans-serif',boxSizing:'border-box' }}/>
              </div>
            </div>
          </div>

          <div style={{ marginTop:20,display:'flex',alignItems:'center',gap:14 }}>
            <button onClick={handleSubjectNotesSave} disabled={savingNotes || !notesChanged}
              style={{ padding:'12px 28px',borderRadius:14,border:'none',background:notesChanged?'linear-gradient(135deg,#7c3aed,#2563eb)':'rgba(255,255,255,0.06)',color:notesChanged?'white':'#334155',fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,cursor:notesChanged?'pointer':'default',transition:'all .2s',boxShadow:notesChanged?'0 0 24px rgba(124,58,237,0.35)':'none' }}>
              {savingNotes ? '⏳ Saving...' : notesChanged ? '💾 Save Notes' : '✓ Notes Saved'}
            </button>
            {!notesChanged && (subjectNotes.syllabus || subjectNotes.weak || subjectNotes.important) && (
              <span style={{ fontSize:12,color:'#475569' }}>Notes are up to date ✓</span>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ ANALYSIS */}
      {activeTab === 'analysis' && (
        <div className="fu" style={{ display:'flex',flexDirection:'column',gap:16 }}>
          {/* Stat cards */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:12 }}>
            {[
              { icon:'✅', val:completedTopics, label:'Completed',  color:'#34d399' },
              { icon:'⚠️', val:weakTopics.length, label:'Weak Topics', color:'#f87171' },
              { icon:'🔓', val:subject.topics?.filter(t=>(t.studyMinutesLogged||0)>=(t.studyMinutesRequired||20)&&t.status!=='completed').length||0, label:'Quiz Ready', color:'#fbbf24' },
              { icon:'🔒', val:subject.topics?.filter(t=>(t.studyMinutesLogged||0)<(t.studyMinutesRequired||20)&&t.status!=='completed').length||0, label:'Need Study', color:'#a78bfa' },
            ].map(({ icon,val,label,color }) => (
              <div key={label} style={{ background:'rgba(255,255,255,0.03)',border:`1px solid ${color}20`,borderRadius:18,padding:16,textAlign:'center' }}>
                <div style={{ fontSize:22,marginBottom:6 }}>{icon}</div>
                <div style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:24,color }}>{val}</div>
                <div style={{ fontSize:11,color:'#475569',marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Weak topics */}
          {weakTopics.length > 0 && (
            <div style={{ background:'rgba(248,113,113,0.04)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:20,padding:20 }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#f87171',marginBottom:14 }}>
                ⚠️ Topics Needing More Attention
              </div>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {weakTopics.map(t => {
                  const lastAttempt = t.quizAttempts?.slice(-1)[0];
                  return (
                    <div key={t._id} style={{ padding:14,borderRadius:14,background:'rgba(248,113,113,0.05)',border:'1px solid rgba(248,113,113,0.12)' }}>
                      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:6 }}>
                        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:'white' }}>{t.name}</div>
                        <div style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:16,color:'#f87171',flexShrink:0 }}>{t.bestScore}%</div>
                      </div>
                      <div style={{ fontSize:11,color:'#475569',marginBottom: lastAttempt?.weakAreas?.length > 0 ? 8 : 0 }}>
                        {t.quizAttempts?.length} attempt(s) · Best score: {t.bestScore}%
                      </div>
                      {/* ── FIXED: Weak areas from quiz results ── */}
                      {lastAttempt?.weakAreas?.length > 0 && (
                        <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                          <div style={{ fontSize:10,color:'#f87171',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2 }}>
                            Questions answered wrong:
                          </div>
                          {lastAttempt.weakAreas.map((area, i) => (
                            <div key={i} style={{ display:'flex',gap:8,fontSize:12,color:'#94a3b8',padding:'4px 8px',background:'rgba(248,113,113,0.06)',borderRadius:8 }}>
                              <span style={{ color:'#f87171',flexShrink:0 }}>•</span>
                              <span>{area}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full quiz result */}
          {subject.fullQuizDone && (
            <div style={{ background:'rgba(251,191,36,0.05)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:20,padding:20 }}>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#fbbf24',marginBottom:10 }}>🎓 Final Syllabus Quiz</div>
              <div style={{ fontFamily:'Syne,sans-serif',fontWeight:900,fontSize:32,color:subject.fullQuizScore>=70?'#34d399':'#f87171',marginBottom:8 }}>{subject.fullQuizScore}%</div>
              {subject.fullQuizWeakAreas?.length > 0 && (
                <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                  <div style={{ fontSize:11,color:'#64748b',marginBottom:4 }}>Focus areas:</div>
                  {subject.fullQuizWeakAreas.map((w,i)=>(
                    <div key={i} style={{ display:'flex',gap:8,fontSize:12,color:'#fbbf24' }}>
                      <span>•</span><span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Timer progress */}
          <div style={{ background:'rgba(56,189,248,0.04)',border:'1px solid rgba(56,189,248,0.15)',borderRadius:20,padding:20 }}>
            <div style={{ fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:14,color:'#38bdf8',marginBottom:10 }}>⏱️ Study Progress by Topic</div>
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {subject.topics?.map(t => {
                const p = Math.min(100,Math.round(((t.studyMinutesLogged||0)/(t.studyMinutesRequired||20))*100));
                return (
                  <div key={t._id} style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <div style={{ fontSize:12,color:'#64748b',width:120,flexShrink:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.name}</div>
                    <div style={{ flex:1,height:5,borderRadius:4,background:'rgba(255,255,255,0.05)' }}>
                      <div style={{ height:'100%',borderRadius:4,width:`${p}%`,background:p>=100?'#34d399':subject.color,transition:'width .5s' }} />
                    </div>
                    <div style={{ fontSize:11,color:'#475569',width:48,textAlign:'right',flexShrink:0 }}>{t.studyMinutesLogged||0}/{t.studyMinutesRequired||20}m</div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop:12,fontSize:12,color:'#475569' }}>
              Use the <Link href="/dashboard/timer" style={{ color:'#a78bfa' }}>Timer</Link> and select this subject + topic to log study time automatically.
            </div>
          </div>
        </div>
      )}
    </>
  );
}