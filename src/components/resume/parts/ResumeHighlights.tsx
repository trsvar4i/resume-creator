'use client';

import React from 'react';

interface ResumeHighlightsProps {
  highlights: string[];
  compact?: boolean;
  textColor?: string;
  dotColor?: string;
}

export function ResumeHighlights({
  highlights,
  compact = false,
  textColor = 'var(--color-text-main)',
  dotColor = 'var(--color-primary)',
}: ResumeHighlightsProps) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <section>
      <h2
        style={{
          fontFamily: "'ResumeSans', 'Inter', sans-serif",
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: dotColor,
          margin: 0,
          marginBottom: compact ? 6 : 8,
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          paddingBottom: 4,
        }}
      >
        Сильные стороны
      </h2>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: compact ? 4 : 6,
        }}
      >
        {highlights.map((h, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: 1,
                backgroundColor: dotColor,
                marginTop: 6,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'ResumeSans', 'Inter', sans-serif",
                fontSize: 11.5,
                color: textColor,
                lineHeight: 1.45,
                flex: 1,
              }}
            >
              {h}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
