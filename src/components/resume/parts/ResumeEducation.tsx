'use client';

import React from 'react';
import type { EducationItem } from '@/types/resume';

interface ResumeEducationProps {
  education: EducationItem[];
  compact?: boolean;
}

const levelLabel = (level: EducationItem['level']) => {
  if (level === 'higher') return 'Высшее';
  if (level === 'secondary') return 'Среднее профессиональное';
  return 'Курсы / сертификаты';
};

export function ResumeEducation({ education, compact = false }: ResumeEducationProps) {
  if (!education || education.length === 0) return null;

  return (
    <section>
      <h2 style={{
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
      }}>
        Образование
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12 }}>
        {education.map((item) => (
          <div key={item.id} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--color-text-main)', flex: 1, minWidth: 0 }}>
                {item.institution || 'Учебное заведение'}
              </span>
              <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {item.graduationYear > 0 ? item.graduationYear : ''}
              </span>
            </div>
            {item.faculty && (
              <p style={{ margin: '1px 0 0', fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, color: 'var(--color-text-muted)' }}>
                {item.faculty}
              </p>
            )}
            <p style={{ margin: '1px 0 0', fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11, color: 'var(--color-text-muted)' }}>
              {levelLabel(item.level)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
