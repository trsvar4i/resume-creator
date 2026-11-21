'use client';

import { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useResumeStore } from '@/store/resumeStore';
import type { EducationItem } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from './FormField';

const LEVEL_LABELS: Record<EducationItem['level'], string> = {
  higher: 'Высшее',
  secondary: 'Среднее профессиональное',
  courses: 'Курсы / сертификаты',
};

const MIN_YEAR = 1950;
const MAX_YEAR = new Date().getFullYear() + 6; // still studying: expected graduation year

function EducationCard({ item, open, onToggle }: { item: EducationItem; open: boolean; onToggle: () => void }) {
  const { updateEducation, removeEducation } = useResumeStore();
  const update = (data: Partial<EducationItem>) => updateEducation(item.id, data);
  const yearInvalid =
    String(item.graduationYear).length === 4 &&
    (item.graduationYear < MIN_YEAR || item.graduationYear > MAX_YEAR);

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
            Образование
          </span>
          <span className="truncate text-sm font-medium text-foreground sm:hidden">
            {item.institution || 'Без названия'}
          </span>
          <ChevronDown
            className={cn('ml-auto size-4 shrink-0 text-muted-foreground transition-transform sm:hidden', open && 'rotate-180')}
          />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => removeEducation(item.id)}
          aria-label="Удалить"
          className="text-muted-foreground hover:text-destructive"
        >
          <X />
        </Button>
      </div>

      <div className={cn('flex flex-col gap-4', !open && 'max-sm:hidden')}>
      <FormField label="Учебное заведение" htmlFor={`inst-${item.id}`}>
        <Input
          id={`inst-${item.id}`}
          placeholder="МГУ им. М. В. Ломоносова"
          value={item.institution}
          onChange={(e) => update({ institution: e.target.value })}
        />
      </FormField>

      <FormField label="Факультет / специальность" htmlFor={`fac-${item.id}`}>
        <Input
          id={`fac-${item.id}`}
          placeholder="Прикладная математика и информатика"
          value={item.faculty}
          onChange={(e) => update({ faculty: e.target.value })}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Уровень" htmlFor={`level-${item.id}`}>
          <Select value={item.level} onValueChange={(v) => update({ level: v as EducationItem['level'] })}>
            <SelectTrigger id={`level-${item.id}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          label="Год окончания"
          htmlFor={`year-${item.id}`}
          error={yearInvalid ? `Укажите год от ${MIN_YEAR} до ${MAX_YEAR}` : null}
        >
          <Input
            id={`year-${item.id}`}
            type="number"
            min={MIN_YEAR}
            max={MAX_YEAR}
            placeholder="2020"
            value={item.graduationYear || ''}
            aria-invalid={yearInvalid || undefined}
            onChange={(e) => update({ graduationYear: parseInt(e.target.value.slice(0, 4), 10) || 0 })}
          />
        </FormField>
      </div>
      </div>
    </div>
  );
}

export function StepEducation() {
  const { resume, addEducation } = useResumeStore();
  const { education } = resume;
  const [openId, setOpenId] = useState<string | null>(() => education[0]?.id ?? null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="max-sm:hidden text-xl font-semibold tracking-tight text-foreground mb-1.5">Образование</h1>
        <p className="text-sm text-muted-foreground">
          {education.length === 0
            ? 'Добавьте учебные заведения, начиная с последнего.'
            : 'Начните с последнего места учёбы.'}
        </p>
      </div>

      {education.map((item) => (
        <EducationCard
          key={item.id}
          item={item}
          open={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
        />
      ))}

      <Button type="button" variant="outline" className="self-start" onClick={() => setOpenId(addEducation())}>
        <Plus /> Добавить образование
      </Button>
    </div>
  );
}
