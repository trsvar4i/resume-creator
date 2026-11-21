'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ResumeSheet } from '@/components/resume/ResumeCanvas';
import { ChevronDown, FileText, Download, Smartphone, Sparkles } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { Button } from '@/components/ui/button';
import { ResumeChecklist } from './ResumeChecklist';
import { TransferPanel } from './TransferPanel';
import { getResumeIssues } from '@/utils/resumeIssues';
import { withBase } from '@/lib/basePath';
import { generateFallbackAIContent } from '@/lib/fallbackAI';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { TemplateId } from '@/types/resume';
import { COLOR_THEMES } from '@/data/themes';
import { getAge } from '@/utils/dateValidator';
import { exportResumeToPDF } from '@/utils/pdfExport';
import { exportResumeToTextPDF } from '@/utils/pdfTextExport';
import { exportResumeToDocx } from '@/utils/docxExport';

// ---- Collapsible section ----
interface InspectorSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/** Phone: the panel shows one group at a time (tabs live in StepAssemble). */
export type MobileView = 'preview' | 'design' | 'ai' | 'export';

function InspectorSection({ title, children, defaultOpen = true, className }: InspectorSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('border-b border-border', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold tracking-wide text-foreground outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
      >
        {title}
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ---- Template thumbnails ----
const TEMPLATES: { id: TemplateId; label: string; preview: React.ReactNode }[] = [
  {
    id: 'classic',
    label: 'Классика',
    preview: (
      <svg width="60" height="76" viewBox="0 0 60 76" fill="none">
        <rect width="60" height="76" fill="#F8F9FA" />
        {/* header */}
        <rect x="8" y="8" width="30" height="4" rx="1" fill="#18181B" opacity="0.7" />
        <rect x="8" y="14" width="20" height="2" rx="0.5" fill="#868E9C" />
        <rect x="8" y="20" width="44" height="0.5" fill="#D4D4D8" />
        {/* sections */}
        <rect x="8" y="24" width="12" height="1.5" rx="0.3" fill="#18181B" opacity="0.5" />
        <rect x="8" y="28" width="44" height="2" rx="0.5" fill="#D4D4D8" />
        <rect x="8" y="32" width="40" height="2" rx="0.5" fill="#D4D4D8" />
        <rect x="8" y="38" width="44" height="0.5" fill="#D4D4D8" />
        <rect x="8" y="42" width="12" height="1.5" rx="0.3" fill="#18181B" opacity="0.5" />
        <rect x="8" y="46" width="38" height="2" rx="0.5" fill="#D4D4D8" />
        <rect x="8" y="50" width="30" height="2" rx="0.5" fill="#D4D4D8" />
      </svg>
    ),
  },
  {
    id: 'modern',
    label: 'Модерн',
    preview: (
      <svg width="60" height="76" viewBox="0 0 60 76" fill="none">
        <rect width="60" height="76" fill="#F8F9FA" />
        {/* left sidebar */}
        <rect width="20" height="76" fill="#EFF6FF" />
        <circle cx="10" cy="14" r="6" fill="#BFDBFE" />
        <rect x="4" y="23" width="12" height="2" rx="0.5" fill="#1E3A8A" opacity="0.5" />
        <rect x="4" y="27" width="10" height="1.5" rx="0.3" fill="#868E9C" />
        <rect x="4" y="34" width="12" height="1" rx="0.3" fill="#1E3A8A" opacity="0.4" />
        <rect x="4" y="37" width="10" height="1.5" rx="0.3" fill="#D4D4D8" />
        <rect x="4" y="40" width="12" height="1.5" rx="0.3" fill="#D4D4D8" />
        {/* right content */}
        <rect x="24" y="8" width="12" height="1.5" rx="0.3" fill="#1E3A8A" opacity="0.4" />
        <rect x="24" y="12" width="30" height="2" rx="0.5" fill="#D4D4D8" />
        <rect x="24" y="16" width="28" height="2" rx="0.5" fill="#D4D4D8" />
        <rect x="24" y="22" width="12" height="1.5" rx="0.3" fill="#1E3A8A" opacity="0.4" />
        <rect x="24" y="26" width="30" height="2" rx="0.5" fill="#D4D4D8" />
        <rect x="24" y="30" width="22" height="2" rx="0.5" fill="#D4D4D8" />
      </svg>
    ),
  },
  {
    id: 'minimal',
    label: 'Минимал',
    preview: (
      <svg width="60" height="76" viewBox="0 0 60 76" fill="none">
        <rect width="60" height="76" fill="#F8F9FA" />
        {/* name big */}
        <rect x="8" y="8" width="38" height="5" rx="1" fill="#18181B" opacity="0.6" />
        <rect x="8" y="15" width="20" height="2" rx="0.5" fill="#868E9C" />
        {/* grid rows */}
        <rect x="8" y="24" width="10" height="1.5" rx="0.3" fill="#868E9C" opacity="0.6" />
        <rect x="20" y="24" width="32" height="1.5" rx="0.3" fill="#D4D4D8" />
        <rect x="20" y="28" width="28" height="1.5" rx="0.3" fill="#D4D4D8" />
        <rect x="8" y="34" width="10" height="1.5" rx="0.3" fill="#868E9C" opacity="0.6" />
        <rect x="20" y="34" width="32" height="1.5" rx="0.3" fill="#D4D4D8" />
        <rect x="20" y="38" width="24" height="1.5" rx="0.3" fill="#D4D4D8" />
        <rect x="8" y="44" width="8" height="1.5" rx="0.3" fill="#868E9C" opacity="0.6" />
        <rect x="20" y="44" width="32" height="1.5" rx="0.3" fill="#D4D4D8" />
      </svg>
    ),
  },
];

// ---- Skeleton ----
function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="mt-2 flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-muted"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

// ---- Main component ----
export function InspectorPanel({ mobileView = 'design' }: { mobileView?: MobileView }) {
  const hideUnless = (view: MobileView) => (mobileView !== view ? 'max-sm:hidden' : '');
  const {
    resume,
    updateAppearance,
    updateAIContent,
    setIsGenerating,
    isGenerating,
    previewMode,
  } = useResumeStore();
  const { appearance, aiContent } = resume;

  // Tone is part of the document (persisted), not local state that resets whenever this panel remounts
  const tone = aiContent.tone || 'dynamic';
  const setTone = (t: 'formal' | 'dynamic' | 'concise') => updateAIContent({ tone: t });
  const [pendingSummary, setPendingSummary] = useState<string>('');
  const [pendingHighlights, setPendingHighlights] = useState<string[]>([]);
  const [checkedHighlights, setCheckedHighlights] = useState<Set<number>>(new Set());
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTemplates, setAiTemplates] = useState(false);
  const [exportingStatus, setExportingStatus] = useState<string | null>(null);
  const [exportMode, setExportMode] = useState<'pc' | 'mobile' | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAiError(null);
    setPendingSummary('');
    setPendingHighlights([]);
    setAiTemplates(false);

    const { personal, hasNoExperience, experience, education, skills } = resume;
    const age = getAge(personal.birthDate);

    // Nothing reaches the resume until the user approves it
    const show = (data: { summary?: unknown; highlights?: unknown }, templates: boolean) => {
      setAiTemplates(templates);
      if (typeof data.summary === 'string') setPendingSummary(data.summary);
      if (Array.isArray(data.highlights)) {
        const highlights = data.highlights.filter((h): h is string => typeof h === 'string');
        setPendingHighlights(highlights);
        setCheckedHighlights(new Set(highlights.map((_, i) => i)));
      }
    };

    try {
      const res = await fetch(withBase('/api/ai/generate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPosition: personal.targetPosition,
          age,
          hasNoExperience,
          tone,
          experience,
          education,
          skills,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || typeof data.summary !== 'string') throw new Error('no AI response');
      show(data, data.fallback === true);
    } catch {
      // No server / no AI (e.g. the static GitHub Pages build): built-in templates, generated in the browser
      show(generateFallbackAIContent(personal.targetPosition, age, hasNoExperience, tone, experience, education, skills), true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptGenerated = () => {
    const accepted = pendingHighlights.filter((_, i) => checkedHighlights.has(i));
    updateAIContent({
      ...(pendingSummary ? { summary: pendingSummary } : {}),
      ...(accepted.length > 0 ? { highlights: accepted } : {}),
    });
    setPendingSummary('');
    setPendingHighlights([]);
  };

  const handleRejectGenerated = () => {
    setPendingSummary('');
    setPendingHighlights([]);
  };

  // Never silently hand over a half-empty resume: ask first if required fields are missing
  const confirmIfIncomplete = () => {
    const missing = getResumeIssues(resume).filter((i) => i.level === 'required');
    if (missing.length === 0) return true;
    return window.confirm(
      `В резюме не заполнено:\n• ${missing.map((m) => m.text).join('\n• ')}\n\nСкачать всё равно?`
    );
  };

  const handleDownload = async (mode: 'pc' | 'mobile') => {
    if (!confirmIfIncomplete()) return;
    try {
      setExportingStatus(`Подготовка к экспорту ${mode === 'pc' ? 'A4' : 'Mobile'}...`);
      // Export renders its own 1:1 copy of the resume (below), so it works from any tab/screen size,
      // even when the visible preview is hidden or scaled down.
      setExportMode(mode);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      const target = document.getElementById('resume-export-surface');
      if (!target) {
        throw new Error('Элемент холста резюме не найден');
      }

      const onProgress = (status: string) => setExportingStatus(status || null);
      try {
        // Real text PDF (selectable, searchable, readable by applicant-tracking systems)
        await exportResumeToTextPDF(target, resume, mode, onProgress);
      } catch (textErr) {
        // Safety net: if the vector export fails for any reason, still hand over a (picture) PDF
        console.warn('Text PDF failed, falling back to image PDF:', textErr);
        await exportResumeToPDF(target, resume, mode, onProgress);
      }
    } catch (err: unknown) {
      console.error('PDF export error:', err);
      alert('Ошибка при экспорте PDF: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setExportMode(null);
      setExportingStatus(null);
    }
  };

  const handleDownloadDocx = async () => {
    if (!confirmIfIncomplete()) return;
    try {
      setExportingStatus('Формирование DOCX документа...');
      await exportResumeToDocx(resume);
    } catch (err: unknown) {
      console.error('DOCX export error:', err);
      alert('Ошибка при экспорте DOCX: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setExportingStatus(null);
    }
  };

  const busy = !!exportingStatus;

  return (
    <aside className={cn(
        'inspector-panel relative flex w-full shrink-0 flex-col border-t border-border bg-card lg:h-full lg:w-[340px] lg:overflow-y-auto lg:border-l lg:border-t-0',
        mobileView === 'preview' && 'max-sm:hidden'
      )}>
      <InspectorSection title="Шаблон" className={hideUnless('design')}>
        <div className="flex gap-2.5">
          {TEMPLATES.map((tpl) => {
            const active = appearance.templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => updateAppearance({ templateId: tpl.id })}
                title={tpl.label}
                aria-pressed={active}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border-2 p-1.5 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  active ? 'border-primary' : 'border-border hover:border-input'
                )}
              >
                {tpl.preview}
                <span className="text-[11px] text-muted-foreground">{tpl.label}</span>
              </button>
            );
          })}
        </div>
      </InspectorSection>

      <InspectorSection title="Акцентный цвет" className={hideUnless('design')}>
        <div className="flex flex-wrap gap-2.5">
          {COLOR_THEMES.map((ct) => {
            const active = appearance.themeId === ct.id;
            return (
              <button
                key={ct.id}
                type="button"
                onClick={() => updateAppearance({ themeId: ct.id })}
                title={ct.label}
                aria-label={ct.label}
                aria-pressed={active}
                className="size-7 rounded-full outline-none transition-shadow focus-visible:ring-[3px] focus-visible:ring-ring/50"
                style={{
                  background: ct.color,
                  boxShadow: active ? `0 0 0 2px var(--ui-bg-surface), 0 0 0 4px ${ct.color}` : 'none',
                }}
              />
            );
          })}
        </div>
      </InspectorSection>

      <InspectorSection title="Плотность верстки" className={hideUnless('design')}>
        <Tabs
          value={appearance.density}
          onValueChange={(v) => updateAppearance({ density: v as 'standard' | 'compact' })}
        >
          <TabsList>
            <TabsTrigger value="standard">Стандартная</TabsTrigger>
            <TabsTrigger value="compact">Компактная</TabsTrigger>
          </TabsList>
        </Tabs>
      </InspectorSection>

      <InspectorSection title="ИИ-редактура" className={hideUnless('ai')}>
        <p className="mb-1.5 text-[11px] text-muted-foreground">Тон</p>
        <Tabs value={tone} onValueChange={(v) => setTone(v as 'formal' | 'dynamic' | 'concise')} className="mb-3">
          <TabsList>
            <TabsTrigger value="formal">Деловой</TabsTrigger>
            <TabsTrigger value="dynamic">Динамичный</TabsTrigger>
            <TabsTrigger value="concise">Краткий</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button type="button" className="w-full" onClick={handleGenerate} disabled={isGenerating}>
          <Sparkles /> {isGenerating ? 'Генерация…' : 'Сформировать «О себе»'}
        </Button>

        {isGenerating && <Skeleton lines={4} />}

        {aiError && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {aiError}
          </p>
        )}

        {!isGenerating && (pendingSummary || pendingHighlights.length > 0) && (
          <div className="mt-3 flex flex-col gap-3">
            {aiTemplates && (
              <p className="rounded-md bg-muted px-2.5 py-1.5 text-[11px] text-muted-foreground">
                ИИ сейчас недоступен — это шаблонный текст. Его можно будет отредактировать после добавления.
              </p>
            )}
            {pendingSummary && (
              <div>
                <p className="mb-1.5 text-xs font-semibold text-foreground">О себе</p>
                <p className="rounded-md border border-border bg-muted/50 p-2.5 text-xs leading-relaxed text-foreground">
                  {pendingSummary}
                </p>
              </div>
            )}

            {pendingHighlights.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground">Сильные стороны</p>
                <div className="flex flex-col gap-2">
                  {pendingHighlights.map((h, i) => (
                    <label key={i} className="flex cursor-pointer items-start gap-2.5">
                      <Checkbox
                        className="mt-0.5"
                        checked={checkedHighlights.has(i)}
                        onCheckedChange={(v) =>
                          setCheckedHighlights((prev) => {
                            const next = new Set(prev);
                            if (v === true) next.add(i);
                            else next.delete(i);
                            return next;
                          })
                        }
                      />
                      <span className="text-xs leading-snug text-foreground">{h}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAcceptGenerated}>
                Принять и добавить в резюме
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={handleRejectGenerated}>
                Отклонить
              </Button>
            </div>
          </div>
        )}
      </InspectorSection>

      <InspectorSection title="Сохранить и перенести" className={hideUnless('export')}>
        <TransferPanel />
      </InspectorSection>

      {/* Footer: export */}
      <div className={cn('mt-auto flex flex-col gap-2 border-t border-border bg-card px-4 py-3 lg:sticky lg:bottom-0', hideUnless('export'))}>
        <ResumeChecklist />
        {exportingStatus && (
          <div role="status" className="rounded-md bg-muted px-2.5 py-1.5 text-center text-xs font-medium text-foreground">
            {exportingStatus}
          </div>
        )}
        <Button type="button" className="max-sm:hidden" onClick={() => handleDownload('pc')} disabled={busy}>
          <Download /> {busy && previewMode === 'pc' ? 'Сборка PDF…' : 'Скачать ПК (A4) PDF'}
        </Button>
        <Button type="button" variant="outline" onClick={() => handleDownload('mobile')} disabled={busy}>
          <Smartphone /> {busy && previewMode === 'mobile' ? 'Сборка PDF…' : 'Скачать Mobile PDF'}
        </Button>
        <Button type="button" variant="secondary" onClick={handleDownloadDocx} disabled={busy}>
          <FileText /> Скачать DOCX (Word)
        </Button>
      </div>

      {exportMode &&
        createPortal(
          <div
            aria-hidden="true"
            style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, opacity: 0, pointerEvents: 'none' }}
          >
            <ResumeSheet resume={resume} mode={exportMode} id="resume-export-surface" withShadow={false} />
          </div>,
          document.body
        )}
    </aside>
  );
}
