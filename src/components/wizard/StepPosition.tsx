'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { withBase } from '@/lib/basePath';
import { STEP_PAGES } from '@/data/flow';

const BASE_ROLE_SKILLS: Record<string, string[]> = {
  default: [
    'Управление проектами',
    'Деловая коммуникация',
    'Работа в команде',
    'Аналитическое мышление',
    'Постановка задач',
    'Оптимизация процессов',
    'Английский язык',
    'Ведение переговоров',
  ],
  dev: [
    'JavaScript',
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'Git',
    'Docker',
    'PostgreSQL',
    'REST API',
    'CI/CD',
    'Python',
    'Базы данных',
  ],
  pm: [
    'Agile / Scrum',
    'Jira',
    'CustDev',
    'Unit-экономика',
    'A/B-тестирование',
    'Product Analytics',
    'Figma',
    'Управление бэклогом',
    'Roadmap',
    'Анализ конкурентов',
  ],
  design: [
    'Figma',
    'UI/UX Design',
    'CJM',
    'Дизайн-системы',
    'Прототипирование',
    'User Research',
    'Adobe Illustrator',
    'Типографика',
    'Адаптивный дизайн',
  ],
  marketing: [
    'Интернет-маркетинг',
    'SEO',
    'Яндекс.Директ',
    'Таргетированная реклама',
    'Google Analytics',
    'Контент-маркетинг',
    'Email-рассылки',
    'CPA-сети',
  ],
};

const MAX_SKILLS = 30;

function detectCategory(position: string): keyof typeof BASE_ROLE_SKILLS {
  const t = position.toLowerCase();
  const has = (...patterns: RegExp[]) => patterns.some((p) => p.test(t));
  // \b doesn't work with Cyrillic, so Russian stems are matched as prefixes after a non-letter
  const start = (stem: string) => new RegExp(`(^|[^a-zа-яё])${stem}`, 'i');

  if (has(/\b(dev|developer|frontend|front-end|backend|back-end|fullstack|full-stack|engineer|qa)\b/, start('програм'), start('разработ'), start('инженер'))) return 'dev';
  if (has(/\b(product|project|pm|manager)\b/, start('менедж'), start('руковод'), start('управлен'))) return 'pm';
  if (has(/\b(design|designer|ui|ux|ui\/ux)\b/, start('дизайн'))) return 'design';
  if (has(/\b(marketing|marketer|smm|seo|ppc)\b/, start('маркет'), start('реклам'), start('таргет'))) return 'marketing';
  return 'default';
}

export function StepPosition() {
  const { resume, updatePersonal, setSkills, setHasNoExperience, subStep } = useResumeStore();
  // Phone flow: one page at a time (everything is visible on wider screens)
  const activePage = STEP_PAGES[1][subStep]?.id;
  const onlyOn = (id: string) => activePage !== id && 'max-sm:hidden';
  const { personal, skills, hasNoExperience } = resume;

  const [skillInput, setSkillInput] = useState('');
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  // Re-writing the position means a different job: the old skills no longer fit, so they are dropped
  // right away (on the first keystroke), and the user picks skills for the new position from scratch.
  const [skillsWereReset, setSkillsWereReset] = useState(false);
  const handlePositionChange = (value: string) => {
    updatePersonal({ targetPosition: value });
    if (skills.length > 0) {
      setSkills([]);
      setSkillsWereReset(true);
    }
    setAiSuggestions([]);
  };

  // Category fallback. Whole-word matching: plain `includes('ui')` used to match "build", "guide", "quiet"...
  const category = detectCategory(personal.targetPosition);

  // Automatic skill suggestions when the position is entered (debounced, stale responses are aborted)
  const trimmedPosition = personal.targetPosition.trim();
  const positionFilled = trimmedPosition.length > 0;
  useEffect(() => {
    if (trimmedPosition.length < 3) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsGeneratingSkills(true);
      try {
        const res = await fetch(withBase('/api/ai/generate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetPosition: trimmedPosition, hasNoExperience }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.suggestedSkills)) {
            setAiSuggestions(
              data.suggestedSkills.filter((x: unknown): x is string => typeof x === 'string' && x.trim() !== '')
            );
          }
        }
      } catch {
        // Aborted or offline: gracefully fall back to the base skills of the role
      } finally {
        if (!controller.signal.aborted) setIsGeneratingSkills(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
      setIsGeneratingSkills(false);
    };
  }, [trimmedPosition, hasNoExperience]);

  // Combine AI suggestions with base role skills (no duplicates). Too-short position => no stale AI list
  const visibleAiSuggestions = trimmedPosition.length < 3 ? [] : aiSuggestions;
  const allSuggested = Array.from(
    new Set([...visibleAiSuggestions, ...(BASE_ROLE_SKILLS[category] || BASE_ROLE_SKILLS.default)])
  );

  const addSkill = (raw: string) => {
    const trimmed = raw.trim().replace(/,+$/, '').trim();
    if (!trimmed) return;
    if (skills.length >= MAX_SKILLS) return;
    if (skills.includes(trimmed)) return;
    setSkills([...skills, trimmed]);
    setSkillsWereReset(false);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    } else if (e.key === 'Backspace' && skillInput === '' && skills.length > 0) {
      setSkills(skills.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-0">
      <h1 className="max-sm:hidden text-xl font-semibold tracking-tight text-foreground mb-6">
        Должность и ключевые навыки
      </h1>

      {/* 1. Target position (removed "пишется от руки") */}
      <div className={cn("border border-border rounded-xl p-4 bg-card mb-6", onlyOn('position'))}>
        <label className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              1. Желаемая должность
              <span className="text-destructive ml-0.5">*</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              {isGeneratingSkills ? (
                <span className="text-[var(--ui-semantic-info)] animate-pulse">
                  ИИ подбирает навыки...
                </span>
              ) : (
                'Основа для подбора навыков и резюме'
              )}
            </span>
          </div>

          <Input
            type="text"
            placeholder="Например: Product Manager / Руководитель проектов"
            value={personal.targetPosition}
            onChange={(e) => handlePositionChange(e.target.value)}
            className="h-10 font-medium"
          />

          <p className="text-[11px] text-muted-foreground mt-0.5">
            При вводе должности ИИ моментально генерирует блок релевантных профессиональных навыков ниже.
          </p>
        </label>
      </div>

      {/* 2. Skills section: locked until the target position is entered */}
      <fieldset
        disabled={!positionFilled}
        className={cn(
          'border border-border rounded-xl p-4 bg-card mb-6 min-w-0 transition-opacity',
          !positionFilled && 'opacity-50 cursor-not-allowed',
          onlyOn('skills')
        )}
      >
        <legend className="sr-only">Профессиональные навыки</legend>
        {positionFilled && (
          <p className="sm:hidden mb-3 text-xs text-muted-foreground">
            Должность: <span className="font-medium text-foreground">{trimmedPosition}</span>
          </p>
        )}
        {skillsWereReset && positionFilled && skills.length === 0 && (
          <p role="status" className="text-[11px] text-[var(--ui-semantic-info)] mb-2">
            Должность изменилась — прежние навыки убраны. Выберите навыки для новой должности.
          </p>
        )}
        {!positionFilled && (
          <p className="text-[11px] text-muted-foreground mb-2">
            Сначала укажите желаемую должность — после этого можно выбрать навыки.
          </p>
        )}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-foreground">
            2. Профессиональные навыки
          </span>
          <span className="text-[11px] text-muted-foreground">
            {skills.length} / {MAX_SKILLS}
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Выберите навык из предложенных, или напишите свой собственный"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKey}
          />
          <Button
            type="button"
            onClick={() => addSkill(skillInput)}
            disabled={!positionFilled || !skillInput.trim()}
          >
            Добавить
          </Button>
        </div>

        {/* Active skills tags */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
            {skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="h-7 gap-1 pl-2.5 pr-1 text-xs font-medium">
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  aria-label={`Удалить ${skill}`}
                  className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/50 outline-none"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Generated and recommended skills pills */}
        <div className="mt-3.5 pt-2.5 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              {personal.targetPosition
                ? `Рекомендованные навыки для «${personal.targetPosition}»:`
                : 'Популярные навыки (нажмите, чтобы добавить):'}
            </p>
            {isGeneratingSkills && (
              <span className="text-[10px] text-[var(--ui-semantic-info)] animate-pulse">
                Генерация ИИ...
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {allSuggested.map((s) => {
              const alreadyAdded = skills.includes(s);
              return (
                <Button
                  key={s}
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={alreadyAdded}
                  onClick={() => addSkill(s)}
                  className="h-7 px-2.5 text-xs font-normal"
                >
                  <Plus /> {s}
                </Button>
              );
            })}
          </div>
        </div>
      </fieldset>

      {/* No experience flag (phone: lives on the position page) */}
      <div className={cn('border border-border rounded-xl p-4 bg-card', onlyOn('position'))}>
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <Checkbox
            checked={hasNoExperience}
            onCheckedChange={(v) => setHasNoExperience(v === true)}
            className="size-[18px]"
          />
          <div>
            <span className="text-sm font-medium text-foreground block">
              У меня нет официального опыта работы
            </span>
            <span className="text-xs text-muted-foreground">
              ИИ сделает основной упор на образование, пет-проекты, курсы и софт-скиллы
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
