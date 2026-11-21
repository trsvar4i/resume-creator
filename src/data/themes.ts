import type { ColorThemeId } from '@/types/resume';

/** Single source of truth for accent colors (keep in sync with [data-theme] in globals.css). */
export const COLOR_THEMES: { id: ColorThemeId; color: string; label: string }[] = [
  { id: 'graphite', color: '#18181B', label: 'Графит' },
  { id: 'navy', color: '#3F6592', label: 'Офисный синий' },
  { id: 'emerald', color: '#065F46', label: 'Изумруд' },
  { id: 'burgundy', color: '#881337', label: 'Бордо' },
  { id: 'indigo', color: '#3730A3', label: 'Индиго' },
  { id: 'olive', color: '#3F4E2C', label: 'Оливковый' },
];

export function getThemeHex(id: ColorThemeId): string {
  return (COLOR_THEMES.find((t) => t.id === id) ?? COLOR_THEMES[1]).color.replace('#', '');
}
