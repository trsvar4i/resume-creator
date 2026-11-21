'use client';

import React from 'react';
import type { ResumeDocument } from '@/types/resume';
import { ResumeHeader } from '../parts/ResumeHeader';
import { ResumeHighlights } from '../parts/ResumeHighlights';
import { ResumeSummary } from '../parts/ResumeSummary';
import { ResumeExperience } from '../parts/ResumeExperience';
import { ResumeSkills } from '../parts/ResumeSkills';
import { ResumeEducation } from '../parts/ResumeEducation';

interface ClassicTemplateProps {
  resume: ResumeDocument;
  compact?: boolean;
}

const HR_STYLE: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  margin: '14px 0',
};

export function ClassicTemplate({ resume, compact = false }: ClassicTemplateProps) {
  const { personal, aiContent, experience, education, skills } = resume;
  const gap = compact ? 10 : 14;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      <ResumeHeader personal={personal} compact={compact} />

      {aiContent.highlights.length > 0 && (
        <>
          <hr style={HR_STYLE} />
          <ResumeHighlights highlights={aiContent.highlights} compact={compact} />
        </>
      )}

      {aiContent.summary && (
        <>
          <hr style={HR_STYLE} />
          <ResumeSummary summary={aiContent.summary} compact={compact} />
        </>
      )}

      {experience.length > 0 && (
        <>
          <hr style={HR_STYLE} />
          <ResumeExperience experience={experience} compact={compact} />
        </>
      )}

      {skills.length > 0 && (
        <>
          <hr style={HR_STYLE} />
          <ResumeSkills skills={skills} compact={compact} />
        </>
      )}

      {education.length > 0 && (
        <>
          <hr style={HR_STYLE} />
          <ResumeEducation education={education} compact={compact} />
        </>
      )}
    </div>
  );
}
