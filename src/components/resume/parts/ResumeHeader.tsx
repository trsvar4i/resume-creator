'use client';

import React from 'react';
import { normalizeUrl } from '@/utils/url';
import type { PersonalInfo } from '@/types/resume';
import { getAge, formatAge } from '@/utils/dateValidator';

interface ResumeHeaderProps {
  personal: PersonalInfo;
  compact?: boolean;
}

export function ResumeHeader({ personal, compact = false }: ResumeHeaderProps) {
  const { lastName, firstName, middleName, birthDate, showAge, photoUrl, showPhoto,
    targetPosition, contacts } = personal;

  const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ');
  const age = showAge ? getAge(birthDate) : null;

  const metaParts: string[] = [];
  if (age !== null) metaParts.push(formatAge(age));
  if (contacts.city) metaParts.push(contacts.city);

  return (
    <header style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        <h1 style={{
          fontFamily: "'ResumeSerif', 'PT Serif', Georgia, serif",
          fontWeight: 700,
          fontSize: 24,
          lineHeight: 1.2,
          color: 'var(--color-text-main)',
          margin: 0,
        }}>
          {fullName || 'Имя Фамилия'}
        </h1>

        {targetPosition && (
          <p style={{
            fontFamily: "'ResumeSans', 'Inter', sans-serif",
            fontSize: 14,
            color: 'var(--color-text-muted)',
            margin: compact ? '2px 0 0' : '4px 0 0',
          }}>
            {targetPosition}
          </p>
        )}

        {metaParts.length > 0 && (
          <p style={{
            fontFamily: "'ResumeSans', 'Inter', sans-serif",
            fontSize: 12,
            color: 'var(--color-text-muted)',
            margin: '2px 0 0',
          }}>
            {metaParts.join(' · ')}
          </p>
        )}

        <address style={{
          marginTop: compact ? 6 : 10,
          fontStyle: 'normal',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px 12px',
        }}>
          {contacts.phone && (
            <a href={`tel:${contacts.phone}`} style={{ fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
              {contacts.phone}
            </a>
          )}
          {contacts.email && (
            <a href={`mailto:${contacts.email}`} style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none' }}>
              {contacts.email}
            </a>
          )}
          {contacts.telegram && (
            <a href={`https://t.me/${contacts.telegram.replace('@', '')}`} style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none' }}>
              {contacts.telegram.startsWith('@') ? contacts.telegram : `@${contacts.telegram}`}
            </a>
          )}
          {contacts.portfolioUrl && (
            <a href={normalizeUrl(contacts.portfolioUrl)} style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none' }}>
              {contacts.portfolioUrl.replace(/^https?:\/\//, '')}
            </a>
          )}
        </address>
      </div>

      {showPhoto && photoUrl && (
        <div style={{ flexShrink: 0 }}>
          <img
            src={photoUrl}
            alt={fullName}
            width={72}
            height={88}
            style={{
              width: 72,
              height: 88,
              objectFit: 'cover',
              border: '1px solid var(--color-border)',
              display: 'block',
            }}
          />
        </div>
      )}
    </header>
  );
}
