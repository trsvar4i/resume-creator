'use client';

import { useEffect, useRef, useState } from 'react';
import { useResumeStore, useStoreHydrated } from '@/store/resumeStore';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopBar } from '@/components/layout/TopBar';
import { StepPersonal } from '@/components/wizard/StepPersonal';
import { StepPosition } from '@/components/wizard/StepPosition';
import { StepExperience } from '@/components/wizard/StepExperience';
import { StepEducation } from '@/components/wizard/StepEducation';
import { StepAssemble } from '@/components/wizard/StepAssemble';
import { ResumeCanvas } from '@/components/resume/ResumeCanvas';
import { STEP_PAGES, TOTAL_PAGES, globalPageIndex } from '@/data/flow';
import { decodeResumeHash, isTransferHash } from '@/utils/transfer';
import { useIsPhone } from '@/hooks/useIsPhone';

const STEP_NAMES = [
  'Личное и фото',
  'Должность и навыки',
  'Опыт работы',
  'Образование',
  'Сборка и дизайн',
];

export default function BuilderPage() {
  const {
    resume,
    currentStep,
    subStep,
    goNext,
    goBack,
    importResume,
    isPreviewOpen,
    togglePreview,
    previewMode,
    setPreviewMode,
  } = useResumeStore();

  const hydrated = useStoreHydrated();
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);

  // Opening a transfer link (#r1.…) loads the résumé from it, after the user confirms a replacement.
  // Also reacts when a link is pasted into the address bar of an already open tab (hash change only).
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const importFromHash = async () => {
      const hash = window.location.hash;
      if (!isTransferHash(hash)) return;
      const data = await decodeResumeHash(hash);
      if (cancelled) return;
      history.replaceState(null, '', window.location.pathname + window.location.search); // don't keep data in the address bar
      if (!data) {
        setNotice({ tone: 'error', text: 'Не удалось открыть ссылку: она повреждена или обрезана. Скопируйте её целиком ещё раз.' });
        return;
      }
      const { personal, experience, education, skills } = useResumeStore.getState().resume;
      const hasData = Boolean(
        personal.lastName || personal.firstName || personal.targetPosition || experience.length || education.length || skills.length
      );
      if (hasData && !window.confirm('Заменить резюме на этом устройстве данными из ссылки?')) return;
      importResume(data);
      setNotice({ tone: 'ok', text: 'Резюме загружено из ссылки. Фото не переносится: добавьте его на шаге 1.' });
    };

    void importFromHash();
    const onHashChange = () => void importFromHash();
    window.addEventListener('hashchange', onHashChange);
    return () => {
      cancelled = true;
      window.removeEventListener('hashchange', onHashChange);
    };
  }, [hydrated, importResume]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 8000);
    return () => clearTimeout(t);
  }, [notice]);
  const isPhone = useIsPhone();
  const mainRef = useRef<HTMLElement>(null);

  // On a phone the A4 preview is unreadably small: start in the Mobile PDF layout instead
  useEffect(() => {
    if (window.innerWidth < 640) setPreviewMode('mobile');
    // once, on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every step starts at the top (the scroll position used to carry over between steps)
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [currentStep, subStep]);

  const isFirst = currentStep === 0 && (!isPhone || subStep === 0);
  const pages = STEP_PAGES[currentStep];
  const page = pages[Math.min(subStep, pages.length - 1)];
  const pageNumber = globalPageIndex(currentStep, isPhone ? subStep : 0) + 1;
  const lastPageOfStep = !isPhone || subStep === pages.length - 1;
  const nextLabel = isPhone
    ? lastPageOfStep
      ? currentStep === 3
        ? 'Собрать резюме'
        : 'Далее'
      : 'Далее'
    : `Далее: ${STEP_NAMES[currentStep + 1] ?? ''}`;

  // Keyboard shortcuts: Cmd/Ctrl + P to toggle preview, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З')) {
        e.preventDefault();
        togglePreview();
      } else if (e.key === 'Escape' && isPreviewOpen) {
        togglePreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen, togglePreview]);

  if (!hydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas text-sm text-muted-foreground">
        Загружаем черновик…
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {notice && (
        <div role="status" className="pointer-events-none fixed inset-x-0 top-14 z-40 flex justify-center px-3">
          <div
            className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-lg border bg-card px-4 py-2.5 text-sm shadow-lg ${
              notice.tone === 'error' ? 'border-destructive/50 text-destructive' : 'border-border text-foreground'
            }`}
          >
            <span>{notice.text}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Закрыть" className="opacity-60 hover:opacity-100">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <TopBar />

      {/* Phone only: where am I in the flow */}
      <div className="sm:hidden shrink-0 border-b border-border bg-card px-3 pt-2 pb-2.5">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Назад"
            onClick={() => goBack(true)}
            disabled={isFirst}
            className="-ml-1"
          >
            <ArrowLeft />
          </Button>
          <p className="flex-1 min-w-0 truncate text-sm font-semibold text-foreground">{page.title}</p>
          <span className="text-xs tabular-nums text-muted-foreground">
            {pageNumber} / {TOTAL_PAGES}
          </span>
        </div>
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_PAGES}
          aria-valuenow={pageNumber}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${(pageNumber / TOTAL_PAGES) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 5: Full-screen assembly workstation */}
      {currentStep === 4 ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <StepAssemble />
        </div>
      ) : (
        /* Steps 1-4: Focus wizard layout + slide-over preview drawer */
        <div className="flex-1 relative flex overflow-hidden">
          <main ref={mainRef} className="flex-1 overflow-y-auto">
            <div className="max-w-[640px] mx-auto pt-8 px-4 pb-28">
              {currentStep === 0 && <StepPersonal />}
              {currentStep === 1 && <StepPosition />}
              {currentStep === 2 && <StepExperience />}
              {currentStep === 3 && <StepEducation />}
            </div>
          </main>

          {/* Slide-over Preview Drawer */}
          {isPreviewOpen && (
            <aside
              aria-label="Боковая панель предпросмотра"
              className="absolute inset-y-0 right-0 z-20 flex w-full flex-col border-l border-border bg-card shadow-xl md:static md:w-[520px] md:max-w-[90vw] md:shrink-0"
            >
              {/* Drawer header */}
              <div className="h-12 border-b border-border px-4 flex items-center justify-between shrink-0 bg-card">
                <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'pc' | 'mobile')}>
                  <TabsList>
                    <TabsTrigger value="pc">A4 / ПК</TabsTrigger>
                    <TabsTrigger value="mobile">Mobile PDF</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button type="button" variant="ghost" size="sm" onClick={togglePreview} aria-label="Закрыть предпросмотр">
                  <X /> Закрыть <kbd className="text-[10px] opacity-60 font-sans">Esc</kbd>
                </Button>
              </div>

              {/* Drawer canvas body */}
              <div className="flex-1 overflow-y-auto p-4 bg-canvas flex justify-center items-start">
                <ResumeCanvas
                  resume={resume}
                  mode={previewMode}
                  className="w-full"
                />
              </div>
            </aside>
          )}

          {/* Bottom navigation */}
          <footer className="fixed bottom-0 inset-x-0 bg-card border-t border-border z-10">
            <div className="max-w-[640px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                className="max-sm:hidden"
                onClick={() => goBack(isPhone)}
                disabled={isFirst}
              >
                <ArrowLeft /> Назад
              </Button>

              <Button type="button" onClick={() => goNext(isPhone)} className="flex-1 sm:flex-none">
                <span className="truncate">{nextLabel}</span> <ArrowRight />
              </Button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
