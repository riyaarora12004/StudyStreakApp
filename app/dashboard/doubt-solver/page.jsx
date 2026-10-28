'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

// ── Simple markdown renderer ──────────────────────────────────────────────────
function MarkdownText({ text }) {
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: 14, lineHeight: 1.75, color: '#cbd5e1' }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height: 8 }} />;

        // Headings
        if (line.startsWith('### ')) return <div key={i} style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 15, color: '#e2e8f0', margin: '14px 0 6px' }}>{line.slice(4)}</div>;
        if (line.startsWith('## '))  return <div key={i} style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 16, color: '#f1f5f9', margin: '16px 0 6px' }}>{line.slice(3)}</div>;

        // Bullets
        if (line.match(/^[\-\*] /)) {
          return (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <span style={{ color: '#22d3ee', flexShrink: 0, marginTop: 2 }}>▸</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }

        // Numbered list
        if (line.match(/^\d+\. /)) {
          const num = line.match(/^(\d+)\./)[1];
          return (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <span style={{ color: '#22d3ee', flexShrink: 0, fontFamily: 'JetBrains Mono,monospace', fontSize: 12, marginTop: 3 }}>{num}.</span>
              <span>{renderInline(line.replace(/^\d+\. /, ''))}</span>
            </div>
          );
        }

        // Key takeaway line
        if (line.includes('Key Takeaway')) {
          return (
            <div key={i} style={{ marginTop: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', fontSize: 13 }}>
              {renderInline(line)}
            </div>
          );
        }

        return <div key={i} style={{ marginBottom: 4 }}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

function renderInline(text) {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} style={{ color: '#e2e8f0', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 5, padding: '1px 6px', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#22d3ee' }}>{part.slice(1, -1)}</code>;
    return part;
  });
}

// ── Typing animation ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '4px 0' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#22d3ee', animation: 'dotBounce 1.2s ease-in-out ' + i*0.2 + 's infinite' }} />
      ))}
    </div>
  );
}

// ── Suggested questions ───────────────────────────────────────────────────────
const GENERIC_SUGGESTIONS = [
  'Explain this concept simply',
  'Give me a memory trick',
  'What are common mistakes?',
  'Explain with an example',
  'How does this connect to real life?',
  'Give me practice questions',
];

// ── Chat bubble ───────────────────────────────────────────────────────────────
function Bubble({ msg, onRate }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}>
      {/* Avatar */}
      <div style={{ width: 34, height: 34, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, background: isUser ? 'rgba(139,92,246,0.2)' : 'rgba(34,211,238,0.12)', border: '1px solid ' + (isUser ? 'rgba(139,92,246,0.4)' : 'rgba(34,211,238,0.3)') }}>
        {isUser ? '👤' : '🤖'}
      </div>

      <div style={{ maxWidth: '82%', minWidth: 0 }}>
        <div style={{ padding: isUser ? '12px 16px' : '16px 18px', borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: isUser ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (isUser ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.08)'), boxShadow: isUser ? 'none' : '0 4px 24px rgba(0,0,0,0.2)' }}>
          {isUser
            ? <div style={{ fontSize: 14, color: '#c4b5fd', lineHeight: 1.6 }}>{msg.content}</div>
            : <MarkdownText text={msg.content} />
          }
        </div>

        {/* Rating for AI messages */}
        {!isUser && onRate && (
          <div style={{ display: 'flex', gap: 8, marginTop: 6, paddingLeft: 4 }}>
            <button onClick={() => onRate(msg._id, true)}
              style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(52,211,153,' + (msg.helpful===true?'0.5)':'0.2)'), background: msg.helpful===true?'rgba(52,211,153,0.15)':'transparent', color: msg.helpful===true?'#34d399':'#475569', fontSize: 11, cursor: 'pointer', transition: 'all .15s' }}>
              👍 Helpful
            </button>
            <button onClick={() => onRate(msg._id, false)}
              style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(248,113,113,' + (msg.helpful===false?'0.5)':'0.2)'), background: msg.helpful===false?'rgba(248,113,113,0.1)':'transparent', color: msg.helpful===false?'#f87171':'#475569', fontSize: 11, cursor: 'pointer', transition: 'all .15s' }}>
              👎 Not helpful
            </button>
            <span style={{ fontSize: 11, color: '#334155', alignSelf: 'center' }}>
              {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DoubtSolverPage() {
  const [subjects,     setSubjects]     = useState([]);
  const [selSubject,   setSelSubject]   = useState(null);
  const [sessions,     setSessions]     = useState([]);
  const [activeSession,setActiveSession]= useState(null);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [loadingData,  setLoadingData]  = useState(true);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // ── Fetch initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/subjects').then(r => r.json()),
      fetch('/api/doubt-solver').then(r => r.json()),
    ]).then(([subData, sessionData]) => {
      setSubjects(subData.subjects || []);
      setSessions(sessionData.sessions || []);
      setLoadingData(false);
    });
  }, []);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Load session messages ───────────────────────────────────────────────────
  const loadSession = async (sess) => {
    setActiveSession(sess);
    setSelSubject(subjects.find(s => s._id === sess.subjectId?.toString()) || null);
    const res  = await fetch('/api/doubt-solver?sessionId=' + sess._id);
    const data = await res.json();
    setMessages(data.messages || []);
  };

  // ── New chat ────────────────────────────────────────────────────────────────
  const newChat = () => {
    setActiveSession(null);
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setLoading(true);

    // Optimistic UI
    const tempMsg = { _id: 'temp-' + Date.now(), role: 'user', content: q, createdAt: new Date() };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res  = await fetch('/api/doubt-solver', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question:    q,
          subjectId:   selSubject?._id || null,
          sessionId:   activeSession?._id || null,
          conversationHistory: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        const aiMsg = { _id: data.messageId, role: 'ai', content: data.answer, createdAt: new Date(), helpful: null };
        setMessages(prev => [...prev, aiMsg]);

        // Update or create session
        if (!activeSession) {
          const newSess = {
            _id:          data.sessionId,
            subjectId:    selSubject?._id    || null,
            subjectName:  selSubject?.name   || 'General',
            subjectEmoji: selSubject?.emoji  || '📚',
            subjectColor: selSubject?.color  || '#7c3aed',
            totalQuestions: 1,
            updatedAt: new Date(),
            lastQuestion: q,
          };
          setActiveSession(newSess);
          setSessions(prev => [newSess, ...prev]);
        } else {
          setSessions(prev => prev.map(s => s._id === activeSession._id
            ? { ...s, totalQuestions: (s.totalQuestions||0)+1, lastQuestion: q, updatedAt: new Date() }
            : s
          ));
        }
      } else {
        setMessages(prev => [...prev.filter(m => m._id !== tempMsg._id), {
          _id: 'err-' + Date.now(), role: 'ai',
          content: '⚠️ ' + (data.message || 'Something went wrong. Try again.'),
          createdAt: new Date(),
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev.filter(m => m._id !== tempMsg._id), {
        _id: 'err-' + Date.now(), role: 'ai',
        content: '⚠️ Connection error. Please try again.',
        createdAt: new Date(),
      }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Rate answer ─────────────────────────────────────────────────────────────
  const rateAnswer = async (messageId, helpful) => {
    if (!activeSession) return;
    setMessages(prev => prev.map(m => m._id === messageId ? { ...m, helpful } : m));
    await fetch('/api/doubt-solver', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: activeSession._id, messageId, helpful }),
    });
  };

  // ── Suggestions ─────────────────────────────────────────────────────────────
  const getSuggestions = () => {
    if (!selSubject || !selSubject.topics) return GENERIC_SUGGESTIONS.slice(0, 4);
    const weakTopics = selSubject.topics.filter(t => t.status !== 'completed').slice(0, 3).map(t => 'Explain: ' + t.name);
    return [...weakTopics, ...GENERIC_SUGGESTIONS.slice(0, 3 - weakTopics.length + 1)].slice(0, 4);
  };

  const isEmptyChat = messages.length === 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500&display=swap');

        * { box-sizing: border-box; }

        @keyframes fu { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation: fu .35s ease forwards; }
        .d1{animation-delay:.03s;opacity:0} .d2{animation-delay:.1s;opacity:0}

        @keyframes dotBounce {
          0%,80%,100% { transform: scale(0.7); opacity: 0.4; }
          40%          { transform: scale(1);   opacity: 1;   }
        }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cursor { display: inline-block; width: 2px; height: 14px; background: #22d3ee; margin-left: 2px; animation: blink 1s step-end infinite; vertical-align: text-bottom; }

        /* Scrollbar */
        ::-webkit-scrollbar       { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }

        /* Textarea */
        .chat-input {
          flex: 1; background: transparent; border: none; outline: none; resize: none;
          color: #e2e8f0; font-family: 'DM Sans', sans-serif; font-size: 14px;
          line-height: 1.6; max-height: 140px; overflow-y: auto;
        }
        .chat-input::placeholder { color: #334155; }

        /* Sidebar item */
        .sess-item {
          padding: 12px 14px; border-radius: 14px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.02);
          transition: all .18s;
        }
        .sess-item:hover  { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
        .sess-item.active { background: rgba(34,211,238,0.06); border-color: rgba(34,211,238,0.25); }

        /* Suggestion chip */
        .sugg {
          padding: 9px 14px; border-radius: 12px; cursor: pointer; font-size: 12px; font-weight: 500;
          border: 1px solid rgba(34,211,238,0.2); background: rgba(34,211,238,0.05); color: #94a3b8;
          transition: all .15s; white-space: nowrap; font-family: 'DM Sans',sans-serif;
          text-align: left;
        }
        .sugg:hover { background: rgba(34,211,238,0.1); border-color: rgba(34,211,238,0.4); color: #22d3ee; }

        /* Subject chip */
        .sub-chip {
          padding: 7px 14px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 500;
          border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #64748b;
          transition: all .15s; white-space: nowrap;
        }
        .sub-chip:hover  { background: rgba(255,255,255,0.07); color: #94a3b8; }
        .sub-chip.active { color: white; }

        /* Scan line texture overlay */
        .scanlines::after {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px);
        }
      `}</style>

      <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 80px)', minHeight: 500, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(3,6,14,0.95)', position: 'relative' }}>

        {/* ─── Sidebar ─── */}
        {sidebarOpen && (
          <div className="fu d1" style={{ width: 260, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Sidebar header */}
            <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 15, color: '#22d3ee', letterSpacing: '-0.5px', marginBottom: 12 }}>
                🤖 AI Tutor
              </div>
              <button onClick={newChat}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.08)', color: '#22d3ee', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .18s' }}>
                + New Chat
              </button>
            </div>

            {/* Sessions list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px' }}>
              {loadingData ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#334155', fontSize: 12 }}>Loading...</div>
              ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: '#334155', fontSize: 12 }}>No chats yet.<br />Ask your first question!</div>
              ) : (
                sessions.map(s => (
                  <div key={s._id} onClick={() => loadSession(s)}
                    className={'sess-item ' + (activeSession?._id === s._id ? 'active' : '')}
                    style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{s.subjectEmoji}</span>
                      <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 12, color: activeSession?._id === s._id ? '#22d3ee' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.subjectName}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: '#334155', flexShrink: 0 }}>
                        {s.totalQuestions}q
                      </span>
                    </div>
                    {s.lastQuestion && (
                      <div style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.lastQuestion}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Sidebar footer */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: '#1e293b' }}>
              Powered by Gemini 2.0
            </div>
          </div>
        )}

        {/* ─── Main chat area ─── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

          {/* Top bar */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'rgba(3,6,14,0.8)', backdropFilter: 'blur(12px)' }}>
            {/* Toggle sidebar */}
            <button onClick={() => setSidebarOpen(p => !p)}
              style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              ☰
            </button>

            {/* Subject selector */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', flexWrap: 'nowrap' }}>
              <button onClick={() => setSelSubject(null)}
                className={'sub-chip ' + (!selSubject ? 'active' : '')}
                style={!selSubject ? { borderColor: 'rgba(34,211,238,0.4)', background: 'rgba(34,211,238,0.08)', color: '#22d3ee' } : {}}>
                📚 General
              </button>
              {subjects.map(s => (
                <button key={s._id} onClick={() => setSelSubject(s)}
                  className={'sub-chip ' + (selSubject?._id === s._id ? 'active' : '')}
                  style={selSubject?._id === s._id ? { borderColor: s.color + '60', background: s.color + '14', color: 'white' } : {}}>
                  {s.emoji} {s.name}
                </button>
              ))}
            </div>

            {selSubject && (
              <div style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 11, color: '#334155' }}>
                Context: {(selSubject.topics||[]).filter(t=>t.status==='completed').length} topics
              </div>
            )}
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

            {/* Empty state */}
            {isEmptyChat && (
              <div className="fu" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 32 }}>
                {/* Terminal-style intro */}
                <div style={{ fontFamily: 'JetBrains Mono,monospace', marginBottom: 28, maxWidth: 480 }}>
                  <div style={{ color: '#22d3ee', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#334155' }}>$ </span>ai_tutor --init
                  </div>
                  <div style={{ color: '#475569', fontSize: 12, marginBottom: 4 }}>
                    &gt; Loading subject context... <span style={{ color: '#34d399' }}>OK</span>
                  </div>
                  <div style={{ color: '#475569', fontSize: 12, marginBottom: 4 }}>
                    &gt; Connecting to Gemini 2.0... <span style={{ color: '#34d399' }}>OK</span>
                  </div>
                  <div style={{ color: '#475569', fontSize: 12 }}>
                    &gt; Ready to answer your questions<span className="cursor" />
                  </div>
                </div>

                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 'clamp(1.4rem,3vw,1.8rem)', color: 'white', marginBottom: 8, letterSpacing: '-0.5px' }}>
                  Ask Anything
                </div>
                <div style={{ color: '#475569', fontSize: 13, marginBottom: 28, maxWidth: 360 }}>
                  {selSubject
                    ? 'I have full context on ' + selSubject.name + ' including your topics, notes and weak areas.'
                    : 'Select a subject above for context-aware answers using your personal notes.'}
                </div>

                {/* Suggestion chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, maxWidth: 460, width: '100%' }}>
                  {getSuggestions().map(s => (
                    <button key={s} onClick={() => sendMessage(s)} className="sugg" style={{ textAlign: 'left' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <Bubble key={msg._id || i} msg={msg}
                onRate={msg.role === 'ai' ? rateAnswer : null} />
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)' }}>
                  🤖
                </div>
                <div style={{ padding: '14px 18px', borderRadius: '4px 18px 18px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <TypingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Follow-up suggestions (show after AI responds) */}
          {!isEmptyChat && !loading && (
            <div style={{ padding: '0 20px 10px', display: 'flex', gap: 8, overflowX: 'auto', flexWrap: 'nowrap', flexShrink: 0 }}>
              {['Explain in simpler terms', 'Give another example', 'How to remember this?', 'Practice question on this'].map(s => (
                <button key={s} onClick={() => sendMessage(s)} className="sugg">{s}</button>
              ))}
            </div>
          )}

          {/* ─── Input bar ─── */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 18, padding: '12px 16px', transition: 'border-color .2s', boxShadow: '0 0 0 0 rgba(34,211,238,0)' }}>
              <textarea
                ref={inputRef}
                className="chat-input"
                rows={1}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selSubject ? 'Ask anything about ' + selSubject.name + '...' : 'Ask any study question...'}
                style={{ minHeight: 22 }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                style={{ width: 38, height: 38, borderRadius: 12, border: 'none', background: input.trim() && !loading ? 'linear-gradient(135deg,#22d3ee,#0ea5e9)' : 'rgba(255,255,255,0.06)', color: input.trim() && !loading ? '#000' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'default', transition: 'all .2s', fontSize: 16, flexShrink: 0, boxShadow: input.trim() && !loading ? '0 0 16px rgba(34,211,238,0.4)' : 'none' }}>
                {loading ? '⏳' : '↑'}
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#1e293b', marginTop: 6, fontFamily: 'JetBrains Mono,monospace' }}>
              ↵ Enter to send · Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 