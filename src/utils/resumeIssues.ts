import type { ResumeDocument } from '@/types/resume';
import { validateBirthDate } from '@/utils/dateValidator';

export interface ResumeIssue {
  id: string;
  text: string;
  /** "required": the resume is not usable without it. "tip": it works, but is weaker. */
  level: 'required' | 'tip';
  /** where to fix it: wizard step (0-based) and page within the step (phone flow) */
  step: number;
  page: number;
}

/** What is missing or wrong in the resume right now. Used to warn before download. */
export function getResumeIssues(resume: ResumeDocument): ResumeIssue[] {
  const { personal, experience, education, skills, aiContent, hasNoExperience } = resume;
  const issues: ResumeIssue[] = [];

  if (!personal.lastName.trim() || !personal.firstName.trim()) {
    issues.push({ id: 'name', text: 'Укажите фамилию и имя', level: 'required', step: 0, page: 1 });
  }
  if (personal.birthDate && !validateBirthDate(personal.birthDate).isValid) {
    issues.push({ id: 'birth', text: 'Дата рождения заполнена неверно', level: 'required', step: 0, page: 1 });
  }
  if (!personal.contacts.phone && !personal.contacts.email) {
    issues.push({ id: 'contacts', text: 'Добавьте телефон или email', level: 'required', step: 0, page: 2 });
  }
  if (!personal.targetPosition.trim()) {
    issues.push({ id: 'position', text: 'Укажите желаемую должность', level: 'required', step: 1, page: 0 });
  }
  if (!hasNoExperience) {
    if (experience.length === 0) {
      issues.push({
        id: 'experience',
        text: 'Добавьте опыт работы или отметьте «нет опыта»',
        level: 'required',
        step: 2,
        page: 0,
      });
    } else if (experience.some((e) => !e.company.trim() || !e.position.trim())) {
      issues.push({
        id: 'experience-fields',
        text: 'В опыте работы не заполнены компания или должность',
        level: 'required',
        step: 2,
        page: 0,
      });
    }
  }

  if (skills.length === 0) {
    issues.push({ id: 'skills', text: 'Выберите ключевые навыки', level: 'tip', step: 1, page: 1 });
  }
  if (education.length === 0) {
    issues.push({ id: 'education', text: 'Добавьте образование', level: 'tip', step: 3, page: 0 });
  }
  if (!aiContent.summary.trim()) {
    issues.push({ id: 'summary', text: 'Сформируйте раздел «О себе»', level: 'tip', step: 4, page: 0 });
  }
  return issues;
}
