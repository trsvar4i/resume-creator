export interface DateValidationResult {
  isValid: boolean;
  error?: string;
  age?: number;
  day?: number;
  month?: number;
  year?: number;
}

const MONTH_NAMES = [
  '',
  'январе',
  'феврале',
  'марте',
  'апреле',
  'мае',
  'июне',
  'июле',
  'августе',
  'сентябре',
  'октябре',
  'ноябре',
  'декабре',
];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getMaxDaysInMonth(month: number, year?: number): number {
  if (month < 1 || month > 12) return 31;
  switch (month) {
    case 2:
      if (!year) return 29; // Allow 29 until year is typed
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

export function validateBirthDate(dateStr: string): DateValidationResult {
  if (!dateStr || dateStr.trim() === '') {
    return { isValid: true }; // optional field when empty
  }

  const parts = dateStr.split('.');
  if (parts.length !== 3) {
    return { isValid: false, error: 'Введите дату в формате ДД.ММ.ГГГГ' };
  }

  const [dStr, mStr, yStr] = parts;
  if (dStr.length !== 2 || mStr.length !== 2 || yStr.length !== 4) {
    return { isValid: false, error: 'Заполните дату полностью: ДД.ММ.ГГГГ' };
  }

  const day = parseInt(dStr, 10);
  const month = parseInt(mStr, 10);
  const year = parseInt(yStr, 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return { isValid: false, error: 'Дата содержит недопустимые символы' };
  }

  if (month < 1 || month > 12) {
    return { isValid: false, error: 'Номер месяца должен быть от 01 до 12' };
  }

  const maxDays = getMaxDaysInMonth(month, year);
  if (day < 1 || day > maxDays) {
    const monthName = MONTH_NAMES[month] || 'этом месяце';
    if (month === 2 && !isLeapYear(year) && day === 29) {
      return {
        isValid: false,
        error: `${year} год не високосный — в феврале 28 дней`,
      };
    }
    return {
      isValid: false,
      error: `В ${monthName} не может быть ${day} дней (максимум ${maxDays})`,
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  if (year > currentYear) {
    return { isValid: false, error: 'Год рождения не может быть в будущем' };
  }

  if (year < 1920) {
    return { isValid: false, error: 'Укажите реальный год рождения (от 1920)' };
  }

  const birthDate = new Date(year, month - 1, day);
  if (birthDate > now) {
    return { isValid: false, error: 'Дата рождения не может быть в будущем' };
  }

  let age = now.getFullYear() - birthDate.getFullYear();
  const mDiff = now.getMonth() - birthDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 14) {
    return { isValid: false, error: 'Возраст соискателя должен быть от 14 лет' };
  }

  if (age > 100) {
    return { isValid: false, error: 'Проверьте правильность введенного года' };
  }

  return { isValid: true, age, day, month, year };
}

/**
 * Format string as user types, strictly preventing impossible days (>31) and months (>12)
 */
export function formatAndClampDateInput(raw: string): string {
  let digits = raw.replace(/\D/g, '').slice(0, 8);

  // Check first 2 digits (day)
  if (digits.length >= 2) {
    let day = parseInt(digits.slice(0, 2), 10);
    if (day > 31) day = 31;
    if (day === 0) day = 1;
    digits = String(day).padStart(2, '0') + digits.slice(2);
  }

  // Check digits 3-4 (month)
  if (digits.length >= 4) {
    let month = parseInt(digits.slice(2, 4), 10);
    if (month > 12) month = 12;
    if (month === 0) month = 1;
    digits = digits.slice(0, 2) + String(month).padStart(2, '0') + digits.slice(4);
  }

  let result = '';
  if (digits.length > 0) result += digits.slice(0, 2);
  if (digits.length > 2) result += '.' + digits.slice(2, 4);
  if (digits.length > 4) result += '.' + digits.slice(4, 8);

  return result;
}

/** Age in full years for a valid DD.MM.YYYY string, otherwise null. Single source of truth for all templates/exports. */
export function getAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const result = validateBirthDate(birthDate);
  return result.isValid && result.age !== undefined ? result.age : null;
}

/** Russian plural: 21 год, 22 года, 25 лет. */
export function formatAge(age: number): string {
  const mod10 = age % 10;
  const mod100 = age % 100;
  if (mod10 === 1 && mod100 !== 11) return `${age} год`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${age} года`;
  return `${age} лет`;
}
