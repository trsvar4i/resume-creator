import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { STEP_PAGES } from '@/data/flow';
import type {
  ResumeDocument, ExperienceItem, EducationItem,
  AppearanceConfig, AIContent, PersonalInfo
} from '@/types/resume';

/** Fresh document. A factory (not a module constant) so id/date are never shared or frozen at import time. */
export function createEmptyResume(): ResumeDocument {
  return {
    id: uuidv4(),
    updatedAt: new Date().toISOString(),
    personal: {
      lastName: '',
      firstName: '',
      showAge: false,
      showPhoto: true,
      targetPosition: '',
      contacts: {},
    },
    hasNoExperience: false,
    experience: [],
    education: [],
    skills: [],
    aiContent: {
      summary: '',
      highlights: [],
      tone: 'dynamic',
    },
    appearance: {
      templateId: 'modern',
      themeId: 'navy',
      density: 'standard',
    },
  };
}

/** Fill any missing fields of a stored draft (older versions, manual edits, partial data). */
function sanitizeResume(stored: Partial<ResumeDocument> | undefined): ResumeDocument {
  const base = createEmptyResume();
  if (!stored || typeof stored !== 'object') return base;
  return {
    ...base,
    ...stored,
    personal: {
      ...base.personal,
      ...stored.personal,
      contacts: { ...base.personal.contacts, ...stored.personal?.contacts },
    },
    experience: Array.isArray(stored.experience)
      ? stored.experience.map((e) => ({ ...e, aiBullets: Array.isArray(e.aiBullets) ? e.aiBullets : [] }))
      : [],
    education: Array.isArray(stored.education) ? stored.education : [],
    skills: Array.isArray(stored.skills) ? stored.skills : [],
    aiContent: {
      ...base.aiContent,
      ...stored.aiContent,
      highlights: Array.isArray(stored.aiContent?.highlights) ? stored.aiContent.highlights : [],
    },
    appearance: { ...base.appearance, ...stored.appearance },
  };
}

/**
 * localStorage wrapper that never throws. The photo is stored as a base64 data URL and can blow
 * the ~5MB quota; in that case we retry without the photo instead of silently losing the whole draft.
 */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      try {
        const parsed = JSON.parse(value);
        if (parsed?.state?.resume?.personal) {
          delete parsed.state.resume.personal.photoUrl;
          localStorage.setItem(name, JSON.stringify(parsed));
        }
      } catch {
        /* storage unavailable (private mode / quota) — the in-memory draft keeps working */
      }
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

/** One atomic state update per edit: patch the document and bump updatedAt/lastSaved together. */
function commit(
  s: { resume: ResumeDocument },
  patch: Partial<ResumeDocument>
): { resume: ResumeDocument; lastSaved: string } {
  const now = new Date().toISOString();
  return { resume: { ...s.resume, ...patch, updatedAt: now }, lastSaved: now };
}

interface ResumeStore {
  resume: ResumeDocument;
  currentStep: number;
  /** page within the step; only used on phones (see data/flow.ts) */
  subStep: number;
  isPreviewOpen: boolean;
  previewMode: 'pc' | 'mobile';
  isGenerating: boolean;
  lastSaved: string | null;

  setStep: (step: number) => void;
  setSubStep: (page: number) => void;
  /** `paged` = phone flow (walk through the pages of a step); otherwise jump a whole step */
  goNext: (paged: boolean) => void;
  goBack: (paged: boolean) => void;
  togglePreview: () => void;
  setPreviewMode: (mode: 'pc' | 'mobile') => void;
  updatePersonal: (data: Partial<PersonalInfo>) => void;
  updateAppearance: (data: Partial<AppearanceConfig>) => void;
  updateAIContent: (data: Partial<AIContent>) => void;
  addExperience: () => string;
  updateExperience: (id: string, data: Partial<ExperienceItem>) => void;
  removeExperience: (id: string) => void;
  addEducation: () => string;
  updateEducation: (id: string, data: Partial<EducationItem>) => void;
  removeEducation: (id: string) => void;
  setSkills: (skills: string[]) => void;
  setHasNoExperience: (val: boolean) => void;
  setIsGenerating: (val: boolean) => void;
  loadExampleResume: () => void;
  resetResume: () => void;
  /** replace the draft with a résumé received through a transfer link */
  importResume: (data: Omit<ResumeDocument, 'id' | 'updatedAt'>) => void;
  touch: () => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set) => ({
      resume: createEmptyResume(),
      currentStep: 0,
      subStep: 0,
      isPreviewOpen: false,
      previewMode: 'pc',
      isGenerating: false,
      lastSaved: null,

      setStep: (step) => set({ currentStep: Math.min(Math.max(step, 0), 4), subStep: 0 }),
      setSubStep: (page) =>
        set((s) => ({ subStep: Math.min(Math.max(page, 0), STEP_PAGES[s.currentStep].length - 1) })),
      goNext: (paged) =>
        set((s) => {
          if (paged && s.subStep < STEP_PAGES[s.currentStep].length - 1) return { subStep: s.subStep + 1 };
          if (s.currentStep < 4) return { currentStep: s.currentStep + 1, subStep: 0 };
          return {};
        }),
      goBack: (paged) =>
        set((s) => {
          if (paged && s.subStep > 0) return { subStep: s.subStep - 1 };
          if (s.currentStep > 0) {
            const prev = s.currentStep - 1;
            return { currentStep: prev, subStep: paged ? STEP_PAGES[prev].length - 1 : 0 };
          }
          return {};
        }),
      togglePreview: () => set((s) => ({ isPreviewOpen: !s.isPreviewOpen })),
      setPreviewMode: (mode) => set({ previewMode: mode }),

      touch: () => {
        const now = new Date().toISOString();
        set((s) => ({ resume: { ...s.resume, updatedAt: now }, lastSaved: now }));
      },

      updatePersonal: (data) => set((s) => commit(s, { personal: { ...s.resume.personal, ...data } })),

      updateAppearance: (data) => set((s) => commit(s, { appearance: { ...s.resume.appearance, ...data } })),

      updateAIContent: (data) => set((s) => commit(s, { aiContent: { ...s.resume.aiContent, ...data } })),

      addExperience: () => {
        const item: ExperienceItem = {
          id: uuidv4(),
          company: '',
          position: '',
          startDate: '',
          isCurrent: false,
          rawDescription: '',
          aiBullets: [],
        };
        set((s) => commit(s, { experience: [...s.resume.experience, item] }));
        return item.id;
      },

      updateExperience: (id, data) =>
        set((s) =>
          commit(s, { experience: s.resume.experience.map((e) => (e.id === id ? { ...e, ...data } : e)) })
        ),

      removeExperience: (id) =>
        set((s) => commit(s, { experience: s.resume.experience.filter((e) => e.id !== id) })),

      addEducation: () => {
        const item: EducationItem = {
          id: uuidv4(),
          institution: '',
          faculty: '',
          level: 'higher',
          graduationYear: new Date().getFullYear(),
        };
        set((s) => commit(s, { education: [...s.resume.education, item] }));
        return item.id;
      },

      updateEducation: (id, data) =>
        set((s) =>
          commit(s, { education: s.resume.education.map((e) => (e.id === id ? { ...e, ...data } : e)) })
        ),

      removeEducation: (id) =>
        set((s) => commit(s, { education: s.resume.education.filter((e) => e.id !== id) })),

      setSkills: (skills) => set((s) => commit(s, { skills })),

      setHasNoExperience: (val) => set((s) => commit(s, { hasNoExperience: val })),

      setIsGenerating: (val) => set({ isGenerating: val }),

      loadExampleResume: () => {
        const example: ResumeDocument = {
          id: uuidv4(),
          updatedAt: new Date().toISOString(),
          personal: {
            lastName: 'Иванов',
            firstName: 'Иван',
            middleName: 'Алексеевич',
            birthDate: '15.04.1996',
            showAge: true,
            photoUrl: undefined,
            showPhoto: true,
            targetPosition: 'Product Manager',
            contacts: {
              phone: '+7 (999) 123-45-67',
              email: 'ivan.ivanov@example.com',
              telegram: '@ivanov_pm',
              city: 'Москва',
              portfolioUrl: 'https://github.com/ivanov-pm',
            },
          },
          hasNoExperience: false,
          experience: [
            {
              id: uuidv4(),
              company: 'ТехноСофт',
              position: 'Product Manager',
              startDate: '03/2022',
              endDate: undefined,
              isCurrent: true,
              rawDescription: 'Управление командой разработки из 6 человек, запуск нового финтех-модуля, рост метрик',
              aiBullets: [
                'Организовал работу кросс-функциональной команды из 6 специалистов, обеспечив соблюдение сроков релизов.',
                'Выстроил прозрачный процесс сбора требований и регулярной коммуникации со стейкхолдерами.',
                'Запустил новый модуль платежей, что привело к росту конверсии чекаута на 18%.',
              ],
            },
            {
              id: uuidv4(),
              company: 'Диджитал Лаб',
              position: 'Project Manager / Аналитик',
              startDate: '09/2020',
              endDate: '02/2022',
              isCurrent: false,
              rawDescription: 'Анализ пользовательских путей, проведение кастдевов, составление ТЗ',
              aiBullets: [
                'Провел серию из 40+ CustDev-интервью, выявив ключевые барьеры пользователей в мобильном приложении.',
                'Сформировал продуктовые бэклоги и спецификации требований для 3 крупных функциональных релизов.',
              ],
            },
          ],
          education: [
            {
              id: uuidv4(),
              institution: 'МГТУ им. Н. Э. Баумана',
              faculty: 'Информатика и системы управления',
              level: 'higher',
              graduationYear: 2020,
            },
          ],
          skills: [
            'Product Management',
            'Agile / Scrum',
            'CustDev',
            'SQL',
            'Jira',
            'Unit-экономика',
            'A/B-тестирование',
            'Figma',
          ],
          aiContent: {
            summary:
              'Product Manager с 4-летним опытом управления цифровыми продуктами и кросс-функциональными командами. Специализируюсь на data-driven подходе, исследовании пользовательского опыта и выстраивании прозрачных процессов разработки от идеи до масштабирования.',
            highlights: [
              'Управление полным циклом продуктовой разработки (End-to-End delivery)',
              'Выстраивание прозрачной коммуникации со стейкхолдерами и смежными командами',
              'Глубокая экспертиза в качественных и количественных исследованиях (CustDev, анализ воронок)',
              'Внедрение гибких процессов Agile/Scrum, сокративших Time-to-Market релизов',
            ],
            tone: 'dynamic',
          },
          appearance: {
            templateId: 'modern',
            themeId: 'navy',
            density: 'standard',
          },
        };
        set({ resume: example, lastSaved: example.updatedAt });
      },

      importResume: (data) => {
        const now = new Date().toISOString();
        set({ resume: { ...data, id: uuidv4(), updatedAt: now }, currentStep: 4, subStep: 0, lastSaved: now });
      },

      resetResume: () => {
        set({ resume: createEmptyResume(), currentStep: 0, lastSaved: null });
      },
    }),
    {
      name: 'resume-builder-draft',
      version: 1,
      // v0 drafts (saved before versioning) have the same shape; sanitizeResume in `merge` fills any gaps
      migrate: (persisted) => persisted as { resume?: Partial<ResumeDocument> },
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ resume: state.resume }),
      // Hydrated manually on the client (see useStoreHydrated) so server HTML and the first
      // client render match — otherwise a saved draft causes a React hydration mismatch.
      skipHydration: true,
      merge: (persisted, current) => ({
        ...current,
        resume: sanitizeResume((persisted as { resume?: Partial<ResumeDocument> } | undefined)?.resume),
      }),
    }
  )
);

/** Rehydrates the persisted draft after mount. Returns true once the real data is in the store. */
export function useStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useResumeStore.persist.onFinishHydration(() => setHydrated(true));
    Promise.resolve(useResumeStore.persist.rehydrate()).finally(() => setHydrated(true));
    return unsub;
  }, []);
  return hydrated;
}
