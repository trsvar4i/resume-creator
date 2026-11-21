export type TemplateId = 'classic' | 'modern' | 'minimal';

export type ColorThemeId =
  | 'graphite'
  | 'navy'
  | 'emerald'
  | 'burgundy'
  | 'indigo'
  | 'olive';

export type ToneOfVoice = 'formal' | 'dynamic' | 'concise';

export interface Contacts {
  phone?: string;
  email?: string;
  telegram?: string;
  whatsapp?: string;
  portfolioUrl?: string;
  city?: string;
}

export interface PersonalInfo {
  lastName: string;
  firstName: string;
  middleName?: string;
  birthDate?: string;
  showAge: boolean;
  photoUrl?: string;
  showPhoto: boolean;
  targetPosition: string;
  contacts: Contacts;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  rawDescription: string;
  aiBullets: string[];
  /** After an accepted AI formulation the description text IS the bullet list: editing it updates aiBullets. */
  bulletsSynced?: boolean;
}

export interface EducationItem {
  id: string;
  institution: string;
  faculty: string;
  level: 'higher' | 'secondary' | 'courses';
  graduationYear: number;
}

export interface AIContent {
  summary: string;
  highlights: string[];
  tone: ToneOfVoice;
}

export interface AppearanceConfig {
  templateId: TemplateId;
  themeId: ColorThemeId;
  density: 'standard' | 'compact';
}

export interface ResumeDocument {
  id: string;
  updatedAt: string;
  personal: PersonalInfo;
  hasNoExperience: boolean;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  aiContent: AIContent;
  appearance: AppearanceConfig;
}
