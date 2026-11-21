'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, Sparkles, X } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormField } from './FormField';
import { withBase } from '@/lib/basePath';
import { generateFallbackBullets } from '@/lib/fallbackAI';
import { cn } from '@/lib/utils';
import type { ExperienceItem } from '@/types/resume';

interface DiffState {
  status: 'idle' | 'loading' | 'review';
  original: string;
  bullets: string[];
}

function SkeletonLines() {
  return (
    <div className="flex flex-col gap-2 py-2">
      {[80, 65, 72].map((w, i) => (
        <div
          key={i}
          className="h-3 rounded-sm bg-muted animate-pulse"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

function parseMonthYear(val?: string): { month: number; year: number; totalMonths: number } | null {
  if (!val) return null;
  const cleaned = val.replace('/', '.').trim();
  const parts = cleaned.split('.');
  if (parts.length !== 2) return null;
  const m = parseInt(parts[0], 10);
  const y = parseInt(parts[1], 10);
  if (isNaN(m) || isNaN(y) || m < 1 || m > 12 || y < 1960 || y > 2040) return null;
  return { month: m, year: y, totalMonths: y * 12 + m };
}

function formatMonthYearInput(raw: string): string {
  let digits = raw.replace(/\D/g, '').slice(0, 6);
  if (digits.length >= 2) {
    let m = parseInt(digits.slice(0, 2), 10);
    if (m > 12) m = 12;
    if (m === 0) m = 1;
    digits = String(m).padStart(2, '0') + digits.slice(2);
  }
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

const bulletsToText = (bullets: string[]) => bullets.map((b) => `• ${b}`).join('\n');
const textToBullets = (text: string) =>
  text
    .split('\n')
    .map((line) => line.replace(/^\s*[•\-–*]\s*/, '').trim())
    .filter(Boolean);

function ExperienceCard({
  item,
  targetPosition,
  open,
  onToggle,
}: {
  item: ExperienceItem;
  targetPosition: string;
  /** phone only: cards collapse into an accordion (always expanded on wider screens) */
  open: boolean;
  onToggle: () => void;
}) {
  const { updateExperience, removeExperience } = useResumeStore();
  // phone only: the card is split in two short tabs instead of one long form
  const [tab, setTab] = useState<'main' | 'desc'>('main');
  const [diff, setDiff] = useState<DiffState>({
    status: 'idle',
    original: '',
    bullets: [],
  });
  const [error, setError] = useState<string | null>(null);
  // true when the bullets came from the built-in templates instead of an AI model (no key / static site)
  const [usedTemplates, setUsedTemplates] = useState(false);

  // Typewriter effect: after "Принять" the polished text is typed into the description field
  const [typed, setTyped] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTyping = typed !== null;

  const stopTyping = () => {
    if (typingTimer.current) clearInterval(typingTimer.current);
    typingTimer.current = null;
  };
  useEffect(() => stopTyping, []);

  const startTyping = (text: string) => {
    stopTyping();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;
    let shown = 0;
    const chunk = Math.max(1, Math.ceil(text.length / 140)); // whole text in ≈2.2 s
    setTyped('');
    typingTimer.current = setInterval(() => {
      shown = Math.min(text.length, shown + chunk);
      if (shown >= text.length) {
        stopTyping();
        setTyped(null);
      } else {
        setTyped(text.slice(0, shown));
      }
    }, 16);
  };

  const startObj = parseMonthYear(item.startDate);
  const endObj = parseMonthYear(item.endDate);
  const isDateInvalid = Boolean(
    !item.isCurrent && startObj && endObj && startObj.totalMonths >= endObj.totalMonths
  );

  const update = (data: Partial<ExperienceItem>) => updateExperience(item.id, data);

  const handleFormulate = async () => {
    setError(null);
    setUsedTemplates(false);
    setDiff({ status: 'loading', original: item.rawDescription, bullets: [] });
    try {
      const res = await fetch(withBase('/api/ai/formulate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: item.company,
          position: item.position,
          rawDescription: item.rawDescription,
          targetPosition,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.bullets) && data.bullets.length > 0) {
        setUsedTemplates(data.fallback === true);
        setDiff({ status: 'review', original: item.rawDescription, bullets: data.bullets });
        return;
      }
      throw new Error('no AI response');
    } catch {
      // No server / no AI (e.g. the static GitHub Pages build): fall back to the built-in templates in the browser
      const bullets = generateFallbackBullets(item.position, item.company, item.rawDescription, 'dynamic');
      setUsedTemplates(true);
      setDiff({ status: 'review', original: item.rawDescription, bullets });
    }
  };

  const handleAccept = () => {
    const text = bulletsToText(diff.bullets);
    update({ aiBullets: diff.bullets, rawDescription: text, bulletsSynced: true });
    setDiff({ status: 'idle', original: '', bullets: [] });
    startTyping(text);
  };

  const handleReject = () => {
    setDiff({ status: 'idle', original: '', bullets: [] });
  };

  const handleRegenerate = () => {
    handleFormulate();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none max-sm:cursor-pointer sm:pointer-events-none"
        >
          <span className="shrink-0 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Место работы
          </span>
          <span className="truncate text-sm font-medium text-foreground sm:hidden">
            {item.company || 'Без названия'}
            {item.position && ` — ${item.position}`}
          </span>
          <ChevronDown
            className={cn('ml-auto size-4 shrink-0 text-muted-foreground transition-transform sm:hidden', open && 'rotate-180')}
          />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => removeExperience(item.id)}
          aria-label="Удалить"
          className="text-muted-foreground hover:text-destructive"
        >
          <X />
        </Button>
      </div>

      <div className={cn('flex flex-col gap-4', !open && 'max-sm:hidden')}>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'main' | 'desc')} className="sm:hidden">
          <TabsList className="w-full">
            <TabsTrigger value="main">Основное</TabsTrigger>
            <TabsTrigger value="desc">Описание</TabsTrigger>
          </TabsList>
        </Tabs>

      <div className={cn('flex flex-col gap-4', tab !== 'main' && 'max-sm:hidden')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Компания" htmlFor={`company-${item.id}`} required>
          <Input
            id={`company-${item.id}`}
            placeholder="ООО Компания"
            value={item.company}
            onChange={(e) => update({ company: e.target.value })}
          />
        </FormField>
        <FormField label="Должность" htmlFor={`position-${item.id}`} required>
          <Input
            id={`position-${item.id}`}
            placeholder="Frontend Developer"
            value={item.position}
            onChange={(e) => update({ position: e.target.value })}
          />
        </FormField>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Начало (ММ/ГГГГ)" htmlFor={`start-${item.id}`} className="w-32">
            <Input
              id={`start-${item.id}`}
              placeholder="01/2022"
              inputMode="numeric"
              value={item.startDate}
              aria-invalid={isDateInvalid || undefined}
              onChange={(e) => update({ startDate: formatMonthYearInput(e.target.value) })}
            />
          </FormField>
          {!item.isCurrent && (
            <FormField label="Конец (ММ/ГГГГ)" htmlFor={`end-${item.id}`} className="w-32">
              <Input
                id={`end-${item.id}`}
                placeholder="12/2023"
                inputMode="numeric"
                value={item.endDate ?? ''}
                aria-invalid={isDateInvalid || undefined}
                onChange={(e) => update({ endDate: formatMonthYearInput(e.target.value) })}
              />
            </FormField>
          )}
          <div className="flex items-center gap-2 h-9">
            <Checkbox
              id={`current-${item.id}`}
              checked={item.isCurrent}
              onCheckedChange={(v) => update({ isCurrent: v === true, endDate: undefined })}
            />
            <label
              htmlFor={`current-${item.id}`}
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              По настоящее время
            </label>
          </div>
        </div>
        {isDateInvalid && (
          <p role="alert" className="text-xs font-medium text-destructive">
            Дата начала работы должна быть строго раньше даты окончания
          </p>
        )}
      </div>

      </div>

      <div className={cn('flex flex-col gap-4', tab !== 'desc' && 'max-sm:hidden')}>
      <FormField label="Описание обязанностей" htmlFor={`desc-${item.id}`}>
        <Textarea
          id={`desc-${item.id}`}
          placeholder="Опишите задачи в свободной форме…"
          value={isTyping ? `${typed}▍` : item.rawDescription}
          readOnly={isTyping}
          onChange={(e) => {
            const value = e.target.value;
            if (item.bulletsSynced) update({ rawDescription: value, aiBullets: textToBullets(value) });
            else update({ rawDescription: value });
          }}
          className={cn('min-h-24 resize-y', isTyping && 'border-ring ring-[3px] ring-ring/40')}
        />
        {isTyping && (
          <span className="flex items-center gap-1 text-[11px] text-[var(--ui-semantic-info)] animate-pulse">
            <Sparkles className="size-3" /> ИИ вписывает достижения…
          </span>
        )}
      </FormField>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={handleFormulate}
        disabled={diff.status === 'loading' || isTyping || !item.rawDescription.trim()}
      >
        <Sparkles /> Сформулировать достижения
      </Button>

      {error && (
        <p role="alert" className="text-xs text-destructive -mt-2">
          {error}
        </p>
      )}

      {diff.status === 'loading' && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground mb-2">Генерируем…</p>
          <SkeletonLines />
        </div>
      )}

      {diff.status === 'review' && (
        <div className="rounded-lg border border-border overflow-hidden">
          {usedTemplates && (
            <p className="border-b border-border bg-muted px-3 py-1.5 text-[11px] text-muted-foreground">
              ИИ сейчас недоступен — это шаблонная формулировка. Отредактируйте её под себя после принятия.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 sm:divide-x divide-border">
            <div className="p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Было</p>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{diff.original}</p>
            </div>
            <div className="p-3 bg-muted">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Стало</p>
              <ul className="flex flex-col gap-1.5">
                {diff.bullets.map((b, i) => (
                  <li key={i} className="flex gap-1.5 text-xs text-foreground">
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 p-3 border-t border-border bg-card">
            <Button type="button" size="sm" onClick={handleAccept}>
              Принять
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleRegenerate}>
              Пересобрать
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleReject}>
              Отклонить
            </Button>
          </div>
        </div>
      )}

      {/* Saved achievements: always rendered from the store, so they stay editable after a reload or the example data */}
      {diff.status !== 'review' && !item.bulletsSynced && item.aiBullets.length > 0 && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Достижения
          </p>
          <ul className="flex flex-col gap-1.5">
            {item.aiBullets.map((bullet, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="shrink-0 text-xs text-muted-foreground">•</span>
                <Input
                  value={bullet}
                  aria-label={`Достижение ${idx + 1}`}
                  className="h-8 text-xs"
                  onChange={(e) =>
                    update({ aiBullets: item.aiBullets.map((b, i) => (i === idx ? e.target.value : b)) })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Удалить пункт"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => update({ aiBullets: item.aiBullets.filter((_, i) => i !== idx) })}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

export function StepExperience() {
  const { resume, addExperience } = useResumeStore();
  const { experience, hasNoExperience, personal } = resume;
  // phone accordion: one card open at a time (the first one by default)
  const [openId, setOpenId] = useState<string | null>(() => experience[0]?.id ?? null);

  if (hasNoExperience) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Опыт работы</h1>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Вы указали, что у вас нет опыта работы.</p>
          <p className="text-xs text-muted-foreground mt-1">Перейдите к следующему шагу — образованию.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="max-sm:hidden text-xl font-semibold tracking-tight text-foreground mb-1.5">Опыт работы</h1>
        <p className="text-sm text-muted-foreground">Добавьте места работы, начиная с последнего.</p>
      </div>

      {experience.map((item) => (
        <ExperienceCard
          key={item.id}
          item={item}
          targetPosition={personal.targetPosition}
          open={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        className="self-start"
        onClick={() => setOpenId(addExperience())}
      >
        <Plus /> Добавить место работы
      </Button>
    </div>
  );
}
