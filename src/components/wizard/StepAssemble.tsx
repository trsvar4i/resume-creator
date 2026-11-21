'use client';

import React, { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { ResumeCanvas } from '@/components/resume/ResumeCanvas';
import { InspectorPanel, type MobileView } from '@/components/inspector/InspectorPanel';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function StepAssemble() {
  const { resume, previewMode, setPreviewMode } = useResumeStore();
  // Phone: one group at a time (preview / design / AI / download) instead of one long scroll
  const [view, setView] = useState<MobileView>('preview');

  return (
    // Phone: tabs + one group. Tablet: canvas on top, settings below. Desktop: side by side.
    <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <Tabs
        value={view}
        onValueChange={(v) => setView(v as MobileView)}
        className="sm:hidden sticky top-0 z-10 border-b border-border bg-card p-2"
      >
        <TabsList className="w-full">
          <TabsTrigger value="preview">Резюме</TabsTrigger>
          <TabsTrigger value="design">Дизайн</TabsTrigger>
          <TabsTrigger value="ai">ИИ</TabsTrigger>
          <TabsTrigger value="export">Скачать</TabsTrigger>
        </TabsList>
      </Tabs>

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col items-center gap-4 bg-canvas p-4 sm:p-6 lg:overflow-auto',
          view !== 'preview' && 'max-sm:hidden'
        )}
      >
        <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'pc' | 'mobile')} className="shrink-0">
          <TabsList>
            <TabsTrigger value="pc">
              A4 / ПК<span className="hidden sm:inline"> (210×297 мм)</span>
            </TabsTrigger>
            <TabsTrigger value="mobile">
              Mobile PDF<span className="hidden sm:inline"> (108×234 мм)</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex w-full justify-center shadow-md">
          <ResumeCanvas resume={resume} mode={previewMode} className="resume-canvas" />
        </div>
      </div>

      <InspectorPanel mobileView={view} />
    </div>
  );
}
