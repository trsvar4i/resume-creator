'use client';

import React from 'react';
import { normalizeUrl } from '@/utils/url';
import type { ResumeDocument } from '@/types/resume';
import { ResumeHighlights } from '../parts/ResumeHighlights';
import { ResumeSummary } from '../parts/ResumeSummary';
import { ResumeExperience } from '../parts/ResumeExperience';
import { ResumeEducation } from '../parts/ResumeEducation';
import { getAge, formatAge } from '@/utils/dateValidator';

interface ModernTemplateProps {
  resume: ResumeDocument;
  compact?: boolean;
  isMobile?: boolean;
}

export function ModernTemplate({ resume, compact = false, isMobile = false }: ModernTemplateProps) {
  const { personal, aiContent, experience, education, skills } = resume;
  const { lastName, firstName, middleName, photoUrl, showPhoto, targetPosition, contacts, showAge, birthDate } = personal;
  const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ') || 'Имя Фамилия';

  const age = showAge ? getAge(birthDate) : null;

  // Exact executive styling from obrazecv.ru/icon/2.svg:
  // Solid primary color sidebar, white text in sidebar, crisp right column
  const sidebarBg = 'var(--color-primary, #3F6592)';
  const sidebarWidth = isMobile ? '100%' : '32%';
  const mainWidth = isMobile ? '100%' : '68%';

  // 1. Mobile-friendly single-column layout
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
        {/* Mobile Header Banner */}
        <div style={{ background: sidebarBg, color: '#FFFFFF', padding: compact ? '16px 18px' : '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {showPhoto && photoUrl && (
              <img
                src={photoUrl}
                alt={fullName}
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'cover',
                  borderRadius: 4,
                  border: '2px solid rgba(255,255,255,0.4)',
                  flexShrink: 0,
                }}
              />
            )}
            <div>
              <h1 style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontWeight: 700, fontSize: 18, margin: 0, color: '#FFFFFF', lineHeight: 1.2 }}>
                {fullName}
              </h1>
              {targetPosition && (
                <p style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: '#E2E8F0', margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {targetPosition}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Body */}
        <div style={{ padding: compact ? '14px 16px' : '18px 20px', display: 'flex', flexDirection: 'column', gap: compact ? 12 : 16 }}>
          {/* Quick contacts */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', fontSize: 11, color: 'var(--color-text-muted)' }}>
            {contacts.phone && <a href={`tel:${contacts.phone}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{contacts.phone}</a>}
            {contacts.email && <a href={`mailto:${contacts.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{contacts.email}</a>}
            {contacts.city && <span>г. {contacts.city}</span>}
            {age !== null && <span>{formatAge(age)}</span>}
            {contacts.telegram && <a href={`https://t.me/${contacts.telegram.replace('@', '')}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{contacts.telegram}</a>}
          </div>

          {aiContent.summary && <ResumeSummary summary={aiContent.summary} compact={compact} />}
          {aiContent.highlights.length > 0 && <ResumeHighlights highlights={aiContent.highlights} compact={compact} />}
          {experience.length > 0 && <ResumeExperience experience={experience} compact={compact} />}
          {skills.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)', margin: '0 0 8px', borderBottom: '1.5px solid var(--color-primary)', paddingBottom: 3 }}>
                Навыки
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {skills.map((s, i) => (
                  <span key={i} style={{ fontFamily: "'ResumeSans', 'Inter', sans-serif", fontSize: 11, background: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: 3, color: 'var(--color-text-main)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {education.length > 0 && <ResumeEducation education={education} compact={compact} />}
        </div>
      </div>
    );
  }

  // 2. PC Desktop Executive 2-Column Layout (Matching obrazecv.ru/icon/2.svg)
  return (
    <div style={{ display: 'flex', flexDirection: 'row', minHeight: 1123, width: '100%', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
      {/* Left Sidebar (Solid Accent Blue #3F6592, White text) */}
      <aside
        style={{
          width: sidebarWidth,
          backgroundColor: sidebarBg,
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Top Avatar Box (#E9E9EB background if photo exists) */}
        {showPhoto && photoUrl ? (
          <div style={{ width: '100%', height: 180, backgroundColor: '#E9E9EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img
              src={photoUrl}
              alt={fullName}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        ) : (
          <div style={{ width: '100%', height: 28, backgroundColor: 'rgba(0,0,0,0.1)' }} />
        )}

        {/* Sidebar content container */}
        <div style={{ padding: compact ? '20px 18px' : '26px 22px', display: 'flex', flexDirection: 'column', gap: compact ? 18 : 22 }}>
          {/* Contacts Section */}
          <div>
            <h2 style={{
              fontFamily: "'ResumeSans', 'Inter', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#FFFFFF',
              margin: '0 0 10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
              paddingBottom: 4,
            }}>
              Контакты
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
              {contacts.phone && (
                <div>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', display: 'block' }}>Телефон</span>
                  <a href={`tel:${contacts.phone}`} style={{ color: '#FFFFFF', textDecoration: 'none', fontWeight: 500 }}>{contacts.phone}</a>
                </div>
              )}
              {contacts.email && (
                <div>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', display: 'block' }}>Email</span>
                  <a href={`mailto:${contacts.email}`} style={{ color: '#FFFFFF', textDecoration: 'none', wordBreak: 'break-all' }}>{contacts.email}</a>
                </div>
              )}
              {contacts.city && (
                <div>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', display: 'block' }}>Город проживания</span>
                  <span style={{ color: '#FFFFFF' }}>{contacts.city}</span>
                </div>
              )}
              {age !== null && (
                <div>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', display: 'block' }}>Возраст</span>
                  <span style={{ color: '#FFFFFF' }}>{formatAge(age)}</span>
                </div>
              )}
              {contacts.telegram && (
                <div>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', display: 'block' }}>Telegram</span>
                  <a href={`https://t.me/${contacts.telegram.replace('@', '')}`} style={{ color: '#FFFFFF', textDecoration: 'none' }}>{contacts.telegram}</a>
                </div>
              )}
              {contacts.portfolioUrl && (
                <div>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', display: 'block' }}>Портфолио / Ссылка</span>
                  <a href={normalizeUrl(contacts.portfolioUrl)} style={{ color: '#FFFFFF', textDecoration: 'none', wordBreak: 'break-all' }}>{contacts.portfolioUrl.replace(/^https?:\/\//, '')}</a>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Skills (Strict neat list with dashes per obrazecv.ru) */}
          {skills.length > 0 && (
            <div>
              <h2 style={{
                fontFamily: "'ResumeSans', 'Inter', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#FFFFFF',
                margin: '0 0 10px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
                paddingBottom: 4,
              }}>
                Профессиональные навыки
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {skills.map((s, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.95)', lineHeight: 1.4 }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>—</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sidebar Highlights (White micro-dots) */}
          {aiContent.highlights.length > 0 && (
            <div>
              <ResumeHighlights
                highlights={aiContent.highlights}
                compact={compact}
                textColor="#FFFFFF"
                dotColor="#FFFFFF"
              />
            </div>
          )}
        </div>
      </aside>

      {/* Right Column (Clean white, prominent header, crisp sections) */}
      <main
        style={{
          width: mainWidth,
          padding: compact ? '28px 30px' : '36px 38px',
          display: 'flex',
          flexDirection: 'column',
          gap: compact ? 16 : 22,
          boxSizing: 'border-box',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Candidate Header */}
        <div style={{ borderBottom: '2px solid var(--color-primary, #3F6592)', paddingBottom: 14 }}>
          <h1 style={{
            fontFamily: "'ResumeSans', 'Inter', sans-serif",
            fontWeight: 800,
            fontSize: 24,
            lineHeight: 1.15,
            color: '#1E293B',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}>
            {fullName}
          </h1>
          {targetPosition && (
            <p style={{
              fontFamily: "'ResumeSans', 'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-primary, #3F6592)',
              margin: '6px 0 0',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              {targetPosition}
            </p>
          )}
        </div>

        {/* Summary ("О себе") */}
        {aiContent.summary && (
          <ResumeSummary summary={aiContent.summary} compact={compact} />
        )}

        {/* Experience ("Опыт работы") */}
        {experience.length > 0 && (
          <ResumeExperience experience={experience} compact={compact} />
        )}

        {/* Education ("Образование") */}
        {education.length > 0 && (
          <ResumeEducation education={education} compact={compact} />
        )}
      </main>
    </div>
  );
}
