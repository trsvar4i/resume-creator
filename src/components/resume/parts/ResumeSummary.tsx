'use client';

import React from 'react';

interface ResumeSummaryProps {
  summary: string;
  compact?: boolean;
}

export function ResumeSummary({ summary, compact = false }: ResumeSummaryProps) {
  if (!summary) return null;

  return (
    <section>
      <h2
        style={{
          fontFamily: "'ResumeSans', 'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-primary)',
          margin: 0,
          marginBottom: compact ? 6 : 8,
          borderBottom: '1.5px solid var(--color-primary)',
          paddingBottom: 3,
        }}
      >
        О себе
      </h2>
      <p
        style={{
          fontFamily: "'ResumeSans', 'Inter', sans-serif",
          fontSize: 12,
          color: 'var(--color-text-main)',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {summary}
      </p>
    </section>
  );
}
