'use client';

import React from 'react';
import type { ExperienceItem } from '@/types/resume';

interface ResumeExperienceProps {
  experience: ExperienceItem[];
  compact?: boolean;
}

export function ResumeExperience({ experience, compact = false }: ResumeExperienceProps) {
  if (!experience || experience.length === 0) return null;

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
        marginBottom: compact ? 8 : 10,
        borderBottom: '1.5px solid var(--color-primary)',
        paddingBottom: 3,
      }}>
        Опыт работы
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 10 : 14 }}>
        {experience.map((item) => (
          <div key={item.id} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2, gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--color-text-main)' }}>
                  {item.company || 'Компания'}
                </span>
                {item.position && (
                  <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 6 }}>
                    — {item.position}
                  </span>
                )}
              </div>
              <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {item.startDate}{item.isCurrent ? ' — н.в.' : item.endDate ? ` — ${item.endDate}` : ''}
              </span>
            </div>

            {item.aiBullets && item.aiBullets.length > 0 ? (
              <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: compact ? 3 : 5 }}>
                {item.aiBullets.map((bullet, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 1,
                        backgroundColor: 'var(--color-primary)',
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11.5, color: 'var(--color-text-main)', lineHeight: 1.5, flex: 1 }}>
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            ) : item.rawDescription ? (
              <p style={{ margin: '4px 0 0', fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, color: 'var(--color-text-main)', lineHeight: 1.5 }}>
                {item.rawDescription}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
