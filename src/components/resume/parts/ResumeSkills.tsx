'use client';

import React from 'react';

interface ResumeSkillsProps {
  skills: string[];
  compact?: boolean;
}

export function ResumeSkills({ skills, compact = false }: ResumeSkillsProps) {
  if (!skills || skills.length === 0) return null;

  return (
    <section>
      <h2 style={{
        fontFamily: "'ResumeSans', 'Inter', sans-serif",
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--color-primary)',
        margin: 0,
        marginBottom: compact ? 4 : 6,
      }}>
        Навыки
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 4 : 6 }}>
        {skills.map((skill, i) => (
          <span key={i} style={{
            fontFamily: "'ResumeSans', 'Inter', sans-serif",
            fontSize: 11,
            color: 'var(--color-text-main)',
            background: 'var(--color-primary-light)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            padding: compact ? '1px 6px' : '2px 8px',
            lineHeight: 1.6,
          }}>
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}
