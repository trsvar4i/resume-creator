'use client';

import { Eye, Moon, Sun, Wand2 } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STEP_NAMES = [
  'Личное и фото',
  'Должность и навыки',
  'Опыт работы',
  'Образование',
  'Сборка и дизайн',
];

export function TopBar() {
  const { resume, currentStep, setStep, togglePreview, loadExampleResume } = useResumeStore();

  // The UI theme is remembered across reloads (applied before first paint by the script in layout.tsx)
  const toggleTheme = () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-ui-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-ui-theme', next);
    try {
      localStorage.setItem('ui-theme', next);
    } catch {
      /* storage unavailable — theme just isn't remembered */
    }
  };

  // "Пример данных" replaces the whole draft, so never do it silently over real content
  const handleLoadExample = () => {
    const { personal, experience, education, skills } = resume;
    const hasData = Boolean(
      personal.lastName || personal.firstName || personal.targetPosition ||
      experience.length || education.length || skills.length
    );
    if (hasData && !window.confirm('Текущие данные будут заменены примером. Продолжить?')) return;
    loadExampleResume();
  };

  return (
    <header className="h-[52px] shrink-0 flex items-center gap-3 px-3 sm:px-4 border-b border-border bg-card">
      {/* Left: product logo */}
      <Logo />

      {/* Center: stepper. Only the current step shows its name; the others are just numbers 1–5 */}
      <nav className="flex min-w-0 flex-1 items-center justify-center gap-1" aria-label="Шаги">
        {STEP_NAMES.map((name, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          return (
            <Button
              key={name}
              type="button"
              size="sm"
              variant={isActive ? 'default' : 'ghost'}
              onClick={() => setStep(idx)}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Шаг ${idx + 1}: ${name}`}
              className={cn(
                'shrink-0 gap-0 px-2.5 transition-colors duration-300',
                !isActive && (isDone ? 'text-foreground' : 'text-muted-foreground')
              )}
            >
              <span className="min-w-4 text-center text-sm font-medium tabular-nums">{idx + 1}</span>
              {/* grows open for the active step and folds back for the others */}
              <span
                aria-hidden={!isActive}
                className={cn(
                  'overflow-hidden whitespace-nowrap transition-all duration-300 ease-out max-sm:hidden',
                  isActive ? 'ml-2 max-w-[180px] opacity-100' : 'ml-0 max-w-0 opacity-0'
                )}
              >
                {name}
              </span>
            </Button>
          );
        })}
      </nav>

      {/* Right: actions + constant logo */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLoadExample}
          title="Заполнить форму тестовыми данными"
          className="hidden lg:inline-flex text-muted-foreground"
        >
          <Wand2 /> Пример
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label="Переключить тему"
          className="text-muted-foreground"
        >
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
        </Button>
        <Button type="button" size="sm" onClick={togglePreview} aria-label="Предпросмотр">
          <Eye />
          <span className="hidden sm:inline">Предпросмотр</span>
          <kbd className="hidden md:inline text-[10px] opacity-60 font-sans">⌘P</kbd>
        </Button>
      </div>
    </header>
  );
}
