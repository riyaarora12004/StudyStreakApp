'use client';

// ── Base shimmer block ────────────────────────────────────────────────────────
function Shimmer({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s ease-in-out infinite',
      flexShrink: 0,
      ...style,
    }} />
  );
}

// ── Global shimmer keyframe (inject once) ─────────────────────────────────────
export function SkeletonStyles() {
  return (
    <style>{`
      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  );
}

// ── Stat card skeleton ────────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 20 }}>
      <Shimmer width={32} height={32} radius={10} style={{ marginBottom: 12 }} />
      <Shimmer width="60%" height={28} radius={6} style={{ marginBottom: 8 }} />
      <Shimmer width="80%" height={12} radius={4} />
    </div>
  );
}

// ── Card skeleton ─────────────────────────────────────────────────────────────
export function CardSkeleton({ lines = 3 }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <Shimmer width={40} height={40} radius={12} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Shimmer width="55%" height={14} radius={4} />
          <Shimmer width="35%" height={10} radius={4} />
        </div>
      </div>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Shimmer key={i} width={i % 2 === 0 ? '100%' : '75%'} height={12} radius={4} />
      ))}
    </div>
  );
}

// ── Subject card skeleton ─────────────────────────────────────────────────────
export function SubjectCardSkeleton() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shimmer width={48} height={48} radius={14} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Shimmer width={120} height={16} radius={4} />
            <Shimmer width={80}  height={11} radius={4} />
          </div>
        </div>
        <Shimmer width={60} height={24} radius={8} />
      </div>
      <Shimmer width="100%" height={6} radius={3} style={{ marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <Shimmer width={70} height={28} radius={8} />
        <Shimmer width={70} height={28} radius={8} />
      </div>
    </div>
  );
}

// ── Topic row skeleton ────────────────────────────────────────────────────────
export function TopicRowSkeleton() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Shimmer width={32} height={32} radius={10} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Shimmer width="50%" height={13} radius={4} />
        <Shimmer width="100%" height={6}  radius={3} />
      </div>
      <Shimmer width={60} height={28} radius={8} />
    </div>
  );
}

// ── Session row skeleton ──────────────────────────────────────────────────────
export function SessionRowSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <Shimmer width={36} height={36} radius={10} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <Shimmer width="55%" height={12} radius={4} />
        <Shimmer width="30%" height={10} radius={4} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        <Shimmer width={36} height={14} radius={4} />
        <Shimmer width={28} height={10} radius={4} />
      </div>
    </div>
  );
}

// ── Analytics chart skeleton ──────────────────────────────────────────────────
export function ChartSkeleton({ height = 200 }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 20 }}>
      <Shimmer width="40%" height={16} radius={4} style={{ marginBottom: 20 }} />
      <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        {Array.from({ length: 14 }).map((_, i) => {
          const h = 30 + Math.sin(i * 0.8) * 40 + Math.random() * 30;
          return <Shimmer key={i} width="100%" height={h} radius={4} style={{ flex: 1 }} />;
        })}
      </div>
    </div>
  );
}

// ── Deadline card skeleton ────────────────────────────────────────────────────
export function DeadlineCardSkeleton() {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Shimmer width={24} height={24} radius={8} />
      <Shimmer width={40} height={40} radius={12} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Shimmer width="55%" height={14} radius={4} />
        <Shimmer width="70%" height={11} radius={4} />
      </div>
      <Shimmer width={70} height={28} radius={10} />
    </div>
  );
}

// ── Chat message skeleton ─────────────────────────────────────────────────────
export function ChatSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '24px 20px' }}>
      {/* User msg */}
      <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 12 }}>
        <Shimmer width={34} height={34} radius={12} />
        <Shimmer width="55%" height={48} radius="18px 4px 18px 18px" />
      </div>
      {/* AI msg */}
      <div style={{ display: 'flex', gap: 12 }}>
        <Shimmer width={34} height={34} radius={12} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Shimmer width="90%" height={13} radius={4} />
          <Shimmer width="75%" height={13} radius={4} />
          <Shimmer width="82%" height={13} radius={4} />
          <Shimmer width="60%" height={13} radius={4} />
        </div>
      </div>
    </div>
  );
}

// ── Full-page loading ─────────────────────────────────────────────────────────
export function PageSkeleton({ type = 'default' }) {
  if (type === 'subjects') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SkeletonStyles />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Shimmer width={180} height={28} radius={6} />
          <Shimmer width={120} height={40} radius={14} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => <SubjectCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (type === 'timer') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <SkeletonStyles />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Shimmer width={280} height={44} radius={14} />
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 28, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <Shimmer width={260} height={260} radius="50%" />
            <div style={{ display: 'flex', gap: 20 }}>
              <Shimmer width={50} height={50} radius="50%" />
              <Shimmer width={70} height={70} radius="50%" />
              <Shimmer width={50} height={50} radius="50%" />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4,5].map(i => <SessionRowSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (type === 'analytics') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SkeletonStyles />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
          {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <ChartSkeleton height={200} />
        <ChartSkeleton height={160} />
      </div>
    );
  }

  if (type === 'deadlines') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonStyles />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12, marginBottom: 16 }}>
          {[1,2,3,4,5].map(i => <StatCardSkeleton key={i} />)}
        </div>
        {[1,2,3,4,5,6].map(i => <DeadlineCardSkeleton key={i} />)}
      </div>
    );
  }

  // default
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SkeletonStyles />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
        {[1,2,3,4].map(i => <StatCardSkeleton key={i} />)}
      </div>
      {[1,2,3].map(i => <CardSkeleton key={i} lines={3} />)}
    </div>
  );
}