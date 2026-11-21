'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { ResumeDocument } from '@/types/resume';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';

interface ResumeCanvasProps {
  resume: ResumeDocument;
  mode: 'pc' | 'mobile';
  className?: string;
}

const PC_WIDTH = 794;   // A4 at 96dpi
const MOBILE_WIDTH = 408;

export const PC_WIDTH_PX = PC_WIDTH;
export const MOBILE_WIDTH_PX = MOBILE_WIDTH;

interface ResumeSheetProps {
  resume: ResumeDocument;
  mode: 'pc' | 'mobile';
  /** DOM id (export looks the sheet up by it) */
  id?: string;
  /** CSS scale applied for on-screen fitting; 1 for export */
  scale?: number;
  sheetRef?: React.Ref<HTMLDivElement>;
  withShadow?: boolean;
}

/** The resume page itself at its real size (A4 = 794px wide, Mobile = 408px). Preview scales it; export renders it at 1:1. */
export function ResumeSheet({ resume, mode, id, scale = 1, sheetRef, withShadow = true }: ResumeSheetProps) {
  const canvasWidth = mode === 'pc' ? PC_WIDTH : MOBILE_WIDTH;
  const isMobile = mode === 'mobile';
  const compact = resume.appearance.density === 'compact';
  const isModern = resume.appearance.templateId === 'modern' && !isMobile;
  const canvasPadding = isModern ? 0 : (compact ? 24 : 32);

  const renderTemplate = () => {
    switch (resume.appearance.templateId) {
      case 'modern':
        return <ModernTemplate resume={resume} compact={compact} isMobile={isMobile} />;
      case 'minimal':
        return <MinimalTemplate resume={resume} compact={compact} isMobile={isMobile} />;
      case 'classic':
      default:
        return <ClassicTemplate resume={resume} compact={compact} />;
    }
  };

  return (
    <div
      ref={sheetRef}
      id={id}
      data-theme={resume.appearance.themeId}
      className={`resume-canvas ${isMobile ? 'resume-mobile-override' : ''} print-only-canvas`}
      style={{
        width: canvasWidth,
        minHeight: mode === 'pc' ? 1123 : 'auto', // A4 height at 96dpi
        background: '#FFFFFF',
        color: 'var(--color-text-main)',
        transformOrigin: 'top center',
        transform: scale === 1 ? undefined : `scale(${scale})`,
        fontFamily: "'ResumeSans', 'Inter', -apple-system, sans-serif",
        padding: canvasPadding,
        boxSizing: 'border-box',
        position: 'relative',
        boxShadow: withShadow ? '0 4px 20px rgba(0, 0, 0, 0.08)' : 'none',
        borderRadius: 0,
      }}
    >
      {renderTemplate()}
    </div>
  );
}

export function ResumeCanvas({ resume, mode, className }: ResumeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState<number>(1123);

  const canvasWidth = mode === 'pc' ? PC_WIDTH : MOBILE_WIDTH;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const availW = el.offsetWidth;
      if (availW > 0 && canvasWidth > 0) {
        setScale(Math.min(1, availW / canvasWidth));
      }
      // While hidden (display:none, e.g. another phone tab) the size is 0: keep the last good value
      if (innerRef.current && innerRef.current.offsetHeight > 0) {
        setInnerHeight(innerRef.current.offsetHeight);
      }
    };

    updateScale();
    // Observe both the available width and the resume itself: its height changes as content is edited
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    if (innerRef.current) observer.observe(innerRef.current);
    return () => observer.disconnect();
  }, [canvasWidth, mode]);

  return (
    <div
      ref={containerRef}
      // items-start: otherwise the flex row stretches the resume to the container's (fixed) height and it can never grow
      className={`${className || ''} flex items-start justify-center`}
      style={{
        width: '100%',
        height: innerHeight ? innerHeight * scale : 'auto',
        overflow: 'hidden',
      }}
    >
      <ResumeSheet resume={resume} mode={mode} id="resume-canvas-export-target" scale={scale} sheetRef={innerRef} />
    </div>
  );
}
