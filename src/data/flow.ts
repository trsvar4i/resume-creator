/**
 * Phone flow: every wizard step is split into short pages that fit one screen without scrolling.
 * On wider screens all pages of a step are shown together (the pages only matter below the `sm` breakpoint).
 */
export interface FlowPage {
  id: string;
  title: string;
}

export const STEP_PAGES: FlowPage[][] = [
  [
    { id: 'photo', title: 'Ваше фото' },
    { id: 'name', title: 'Как вас зовут?' },
    { id: 'location', title: 'Где вы живёте?' },
    { id: 'contacts', title: 'Как с вами связаться?' },
  ],
  [
    { id: 'position', title: 'Кем вы хотите работать?' },
    { id: 'skills', title: 'Ваши навыки' },
  ],
  [{ id: 'experience', title: 'Опыт работы' }],
  [{ id: 'education', title: 'Образование' }],
  [{ id: 'assemble', title: 'Сборка резюме' }],
];

export const TOTAL_PAGES = STEP_PAGES.reduce((sum, pages) => sum + pages.length, 0);

/** Index of the current page across the whole flow (0-based). */
export function globalPageIndex(step: number, subStep: number): number {
  let index = 0;
  for (let i = 0; i < step; i++) index += STEP_PAGES[i].length;
  return index + subStep;
}
