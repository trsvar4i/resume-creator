import { COUNTRIES } from '@/data/countries';

const DEFAULT_GROUPS = [3, 3, 2, 2];

function groupsFor(dialCode: string): number[] {
  return COUNTRIES.find((c) => c.dialCode === dialCode)?.phoneGroups ?? DEFAULT_GROUPS;
}

/**
 * Formats a national phone number per country convention: the operator / area code (first group)
 * goes in brackets, the rest is split into groups. Uzbekistan +998: "(90) 123-45-67" (Beeline = 90),
 * Russia +7: "(999) 123-45-67", Kyrgyzstan +996: "(700) 123-456".
 */
export function formatPhoneNumber(
  rawInput: string,
  dialCode: string
): { formatted: string; nationalDigits: string; fullPhone: string } {
  const groups = groupsFor(dialCode);
  const maxDigits = groups.reduce((a, b) => a + b, 0);

  // Strip dialcode if user typed or pasted it
  let clean = rawInput.trim();
  if (clean.startsWith(dialCode)) {
    clean = clean.slice(dialCode.length);
  } else if (clean.startsWith('+')) {
    clean = clean.replace(/^\+\d{1,4}/, '');
  }

  let digits = clean.replace(/\D/g, '');

  // Pasted "89991234567" / "998901234567": drop the trunk prefix or country code
  if (digits.length > maxDigits) {
    const dialDigits = dialCode.replace('+', '');
    if (digits.startsWith(dialDigits)) {
      digits = digits.slice(dialDigits.length);
    } else if (dialCode === '+7' && digits.startsWith('8')) {
      digits = digits.slice(1);
    }
  }

  const national = digits.slice(0, maxDigits);

  // Build "(AA) BBB-CC-DD". The closing bracket appears only once more digits follow,
  // so Backspace right after the code doesn't feel "stuck" on the bracket.
  let formatted = '';
  if (national.length > 0) {
    const first = groups[0];
    if (national.length <= first) {
      formatted = `(${national}`;
    } else {
      const rest: string[] = [];
      let pos = first;
      for (const size of groups.slice(1)) {
        if (pos >= national.length) break;
        rest.push(national.slice(pos, pos + size));
        pos += size;
      }
      formatted = `(${national.slice(0, first)}) ${rest.join('-')}`;
    }
  }

  return {
    formatted,
    nationalDigits: national,
    fullPhone: formatted ? `${dialCode} ${formatted}` : '',
  };
}
