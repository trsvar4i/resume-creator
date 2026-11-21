'use client';

import React from 'react';
import { normalizeUrl } from '@/utils/url';
import type { ResumeDocument } from '@/types/resume';
import { getAge, formatAge } from '@/utils/dateValidator';

interface MinimalTemplateProps {
  resume: ResumeDocument;
  compact?: boolean;
  isMobile?: boolean;
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'ResumeSans', 'Inter', sans-serif",
  fontSize: 9,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-text-muted)',
};

const LEFT_COL = '25%';
const RIGHT_COL = '75%';

function GridRow({ label, children, compact = false }: { label: React.ReactNode; children: React.ReactNode; compact?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 24, marginBottom: compact ? 12 : 20 }}>
      <div style={{ width: LEFT_COL, flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ width: RIGHT_COL }}>
        {children}
      </div>
    </div>
  );
}

function MobileSection({ label, children, compact = false }: { label: React.ReactNode; children: React.ReactNode; compact?: boolean }) {
  return (
    <div style={{ marginBottom: compact ? 12 : 18 }}>
      <div style={{ marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

export function MinimalTemplate({ resume, compact = false, isMobile = false }: MinimalTemplateProps) {
  const { personal, aiContent, experience, education, skills } = resume;
  const { lastName, firstName, middleName, birthDate, showAge, photoUrl, showPhoto, targetPosition, contacts } = personal;
  const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ');
  const age = showAge ? getAge(birthDate) : null;

  const metaParts: string[] = [];
  if (age !== null) metaParts.push(formatAge(age));
  if (contacts.city) metaParts.push(contacts.city);

  if (isMobile) {
    return (
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {/* Header */}
        <div style={{ marginBottom: compact ? 16 : 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontFamily: "'ResumeSerif', 'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 22, margin: 0, color: 'var(--color-text-main)' }}>
                {fullName || 'Имя Фамилия'}
              </h1>
              {targetPosition && <p style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 13, color: 'var(--color-text-muted)', margin: '3px 0 0' }}>{targetPosition}</p>}
              {metaParts.length > 0 && <p style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{metaParts.join(' · ')}</p>}
            </div>
            {showPhoto && photoUrl && (
              <img src={photoUrl} alt={fullName} width={60} height={72} style={{ width: 60, height: 72, objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }} />
            )}
          </div>
          <address style={{ marginTop: 8, fontStyle: 'normal', display: 'flex', flexWrap: 'wrap', gap: '3px 10px' }}>
            {contacts.phone && <a href={`tel:${contacts.phone}`} style={{ fontSize: 11, color: 'var(--color-text-muted)', textDecoration: 'none' }}>{contacts.phone}</a>}
            {contacts.email && <a href={`mailto:${contacts.email}`} style={{ fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none' }}>{contacts.email}</a>}
            {contacts.telegram && <a href={`https://t.me/${contacts.telegram.replace('@', '')}`} style={{ fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none' }}>{contacts.telegram.startsWith('@') ? contacts.telegram : `@${contacts.telegram}`}</a>}
            {contacts.portfolioUrl && <a href={normalizeUrl(contacts.portfolioUrl)} style={{ fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none' }}>{contacts.portfolioUrl.replace(/^https?:\/\//, '')}</a>}
          </address>
        </div>

        {aiContent.highlights.length > 0 && (
          <MobileSection compact={compact} label={<span style={LABEL_STYLE}>Сильные стороны</span>}>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {aiContent.highlights.map((h, i) => <li key={i} style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, lineHeight: 1.5, color: 'var(--color-text-main)', marginBottom: 2 }}>{h}</li>)}
            </ul>
          </MobileSection>
        )}

        {aiContent.summary && (
          <MobileSection compact={compact} label={<span style={LABEL_STYLE}>О себе</span>}>
            <p style={{ margin: 0, fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, color: 'var(--color-text-main)', lineHeight: 1.6 }}>{aiContent.summary}</p>
          </MobileSection>
        )}

        {experience.length > 0 && (
          <MobileSection compact={compact} label={<span style={LABEL_STYLE}>Опыт работы</span>}>
            {experience.map((item) => (
              <div key={item.id} style={{ marginBottom: compact ? 10 : 14 }}>
                <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 10, color: 'var(--color-text-muted)' }}>
                  {item.startDate}{item.isCurrent ? ' — н.в.' : item.endDate ? ` — ${item.endDate}` : ''}
                </span>
                <div>
                  <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--color-text-main)' }}>{item.company}</span>
                  {item.position && <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 4 }}>· {item.position}</span>}
                </div>
                {item.aiBullets?.length > 0 && (
                  <ul style={{ margin: '4px 0 0', paddingLeft: 14 }}>
                    {item.aiBullets.map((b, i) => <li key={i} style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11, color: 'var(--color-text-main)', lineHeight: 1.5, marginBottom: 2 }}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </MobileSection>
        )}

        {skills.length > 0 && (
          <MobileSection compact={compact} label={<span style={LABEL_STYLE}>Навыки</span>}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {skills.map((s, i) => <span key={i} style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11, background: 'var(--color-primary-light)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '1px 6px', color: 'var(--color-text-main)' }}>{s}</span>)}
            </div>
          </MobileSection>
        )}

        {education.length > 0 && (
          <MobileSection compact={compact} label={<span style={LABEL_STYLE}>Образование</span>}>
            {education.map((item) => (
              <div key={item.id} style={{ marginBottom: compact ? 8 : 12 }}>
                <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontWeight: 600, fontSize: 12, color: 'var(--color-text-main)' }}>{item.institution}</span>
                {item.faculty && <p style={{ margin: '1px 0 0', fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11, color: 'var(--color-text-muted)' }}>{[item.faculty, item.graduationYear > 0 ? item.graduationYear : null].filter(Boolean).join(' · ')}</p>}
              </div>
            ))}
          </MobileSection>
        )}
      </div>
    );
  }

  // Desktop: Swiss grid layout
  return (
    <div style={{ width: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
      {/* Header row */}
      <GridRow compact={compact} label={
        <div>
          {metaParts.length > 0 && <p style={{ ...LABEL_STYLE, margin: 0, marginBottom: 4 }}>{metaParts.join(' · ')}</p>}
          <address style={{ fontStyle: 'normal', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {contacts.phone && <a href={`tel:${contacts.phone}`} style={{ fontSize: 10, color: 'var(--color-text-muted)', textDecoration: 'none' }}>{contacts.phone}</a>}
            {contacts.email && <a href={`mailto:${contacts.email}`} style={{ fontSize: 10, color: 'var(--color-primary)', textDecoration: 'none' }}>{contacts.email}</a>}
            {contacts.telegram && <a href={`https://t.me/${contacts.telegram.replace('@', '')}`} style={{ fontSize: 10, color: 'var(--color-primary)', textDecoration: 'none' }}>{contacts.telegram.startsWith('@') ? contacts.telegram : `@${contacts.telegram}`}</a>}
            {contacts.portfolioUrl && <a href={normalizeUrl(contacts.portfolioUrl)} style={{ fontSize: 10, color: 'var(--color-primary)', textDecoration: 'none' }}>{contacts.portfolioUrl.replace(/^https?:\/\//, '')}</a>}
          </address>
        </div>
      }>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: "'ResumeSerif', 'PT Serif', Georgia, serif", fontWeight: 700, fontSize: 24, margin: 0, color: 'var(--color-text-main)', lineHeight: 1.2 }}>
              {fullName || 'Имя Фамилия'}
            </h1>
            {targetPosition && <p style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 14, color: 'var(--color-text-muted)', margin: '4px 0 0' }}>{targetPosition}</p>}
          </div>
          {showPhoto && photoUrl && (
            <img src={photoUrl} alt={fullName} width={72} height={88} style={{ width: 72, height: 88, objectFit: 'cover', border: '1px solid var(--color-border)', flexShrink: 0 }} />
          )}
        </div>
      </GridRow>

      {aiContent.highlights.length > 0 && (
        <GridRow compact={compact} label={<span style={LABEL_STYLE}>Сильные стороны</span>}>
          <ul style={{ margin: 0, paddingLeft: 14 }}>
            {aiContent.highlights.map((h, i) => <li key={i} style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, lineHeight: 1.5, color: 'var(--color-text-main)', marginBottom: 3 }}>{h}</li>)}
          </ul>
        </GridRow>
      )}

      {aiContent.summary && (
        <GridRow compact={compact} label={<span style={LABEL_STYLE}>О себе</span>}>
          <p style={{ margin: 0, fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, color: 'var(--color-text-main)', lineHeight: 1.65 }}>{aiContent.summary}</p>
        </GridRow>
      )}

      {experience.map((item) => (
        <GridRow key={item.id} compact={compact} label={
          <div>
            <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 2 }}>
              {item.startDate}{item.isCurrent ? ' — н.в.' : item.endDate ? ` — ${item.endDate}` : ''}
            </span>
            <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11, fontWeight: 600, color: 'var(--color-text-main)' }}>
              {item.company}
            </span>
          </div>
        }>
          <div>
            {item.position && <p style={{ margin: '0 0 4px', fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)' }}>{item.position}</p>}
            {item.aiBullets?.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: 14 }}>
                {item.aiBullets.map((b, i) => <li key={i} style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, lineHeight: 1.5, color: 'var(--color-text-main)', marginBottom: 2 }}>{b}</li>)}
              </ul>
            ) : item.rawDescription ? (
              <p style={{ margin: 0, fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, lineHeight: 1.5, color: 'var(--color-text-main)' }}>{item.rawDescription}</p>
            ) : null}
          </div>
        </GridRow>
      ))}

      {skills.length > 0 && (
        <GridRow compact={compact} label={<span style={LABEL_STYLE}>Навыки</span>}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 4 : 6 }}>
            {skills.map((s, i) => <span key={i} style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11, background: 'var(--color-primary-light)', border: '1px solid var(--color-border)', borderRadius: 3, padding: '2px 7px', color: 'var(--color-text-main)' }}>{s}</span>)}
          </div>
        </GridRow>
      )}

      {education.map((item) => (
        <GridRow key={item.id} compact={compact} label={
          <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 10, color: 'var(--color-text-muted)' }}>{item.graduationYear > 0 ? item.graduationYear : ''}</span>
        }>
          <div>
            <span style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontWeight: 600, fontSize: 13, color: 'var(--color-text-main)' }}>{item.institution}</span>
            {item.faculty && <p style={{ margin: '1px 0 0', fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, color: 'var(--color-text-muted)' }}>{item.faculty}</p>}
          </div>
        </GridRow>
      ))}
    </div>
  );
}
