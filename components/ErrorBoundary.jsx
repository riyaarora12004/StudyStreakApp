'use client';

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback, minimal } = this.props;

    if (fallback) return fallback;

    if (minimal) {
      return (
        <div style={{ padding: '20px 16px', borderRadius: 16, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 13, color: '#f87171', fontWeight: 600, marginBottom: 4 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 12 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: 'Syne,sans-serif', fontWeight: 600 }}>
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          {/* Broken screen icon */}
          <div style={{ fontSize: 64, marginBottom: 20, filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.4))' }}>💥</div>

          <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 900, fontSize: 24, color: 'white', marginBottom: 8, letterSpacing: '-0.5px' }}>
            Oops! Something broke
          </div>
          <div style={{ color: '#64748b', fontSize: 14, marginBottom: 8, lineHeight: 1.6 }}>
            This section crashed unexpectedly. Your data is safe — just this part of the page had an issue.
          </div>

          {/* Error message */}
          {this.state.error?.message && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '10px 14px', marginBottom: 24, fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: '#f87171', textAlign: 'left', wordBreak: 'break-word' }}>
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: '12px 24px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: 'white', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
              🔄 Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '12px 24px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', fontFamily: 'Syne,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}