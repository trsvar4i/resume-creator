'use client';

import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { getResumeIssues } from '@/utils/resumeIssues';
import { Button } from '@/components/ui/button';

/** Shows what is still missing before the resume is downloaded, with a jump to the right step. */
export function ResumeChecklist() {
  const { resume, setStep, setSubStep } = useResumeStore();
  const issues = getResumeIssues(resume);

  if (issues.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-2.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-4 shrink-0" /> Резюме заполнено — можно скачивать
      </p>
    );
  }

  const required = issues.filter((i) => i.level === 'required');

  return (
    <div className="rounded-md border border-border bg-muted/40 p-2.5">
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
        {required.length > 0 ? (
          <AlertTriangle className="size-4 text-amber-500" />
        ) : (
          <Lightbulb className="size-4 text-muted-foreground" />
        )}
        {required.length > 0 ? 'Нужно заполнить' : 'Можно улучшить'}
      </p>
      <ul className="flex flex-col">
        {issues.map((issue) => (
          <li key={issue.id} className="flex items-center justify-between gap-2 py-0.5">
            <span className="text-xs text-muted-foreground">
              {issue.level === 'required' ? '• ' : '◦ '}
              {issue.text}
            </span>
            {issue.step !== 4 && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="shrink-0"
                onClick={() => {
                  setStep(issue.step);
                  setSubStep(issue.page);
                }}
              >
                Исправить
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
