'use client';

import { useId, useRef, useState, ChangeEvent } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { COUNTRIES, getPhonePlaceholder } from '@/data/countries';
import {
  validateBirthDate,
  formatAge,
  formatAndClampDateInput,
  DateValidationResult,
} from '@/utils/dateValidator';
import { formatPhoneNumber } from '@/utils/phoneFormatter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from './FormField';
import { cn } from '@/lib/utils';
import { STEP_PAGES } from '@/data/flow';

const OTHER_CITY = '__other__';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="max-sm:hidden text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-8 mb-3">
      {children}
    </h2>
  );
}

function SwitchRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-2.5">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id} className="text-sm text-muted-foreground cursor-pointer select-none">
        {label}
      </label>
    </div>
  );
}

function detectCountryCode(phone?: string, city?: string): string {
  if (phone) {
    // Longest dial code first so "+375" isn't mistaken for a shorter one
    const byDial = [...COUNTRIES]
      .sort((a, b) => b.dialCode.length - a.dialCode.length)
      .filter((c) => phone.startsWith(c.dialCode + ' ') || phone === c.dialCode);
    // +7 is shared (RU/KZ): prefer the country whose city list contains the saved city
    const match = byDial.find((c) => city && c.cities.includes(city)) ?? byDial[0];
    if (match) return match.code;
  }
  if (city) {
    const byCity = COUNTRIES.find((c) => c.cities.includes(city));
    if (byCity) return byCity.code;
  }
  return 'RU';
}

function validateEmail(emailStr?: string): string | null {
  if (!emailStr || emailStr.trim() === '') return null;
  // Any normal address: name@domain.tld (.ru, .com, .org, .рф, subdomains...)
  const emailRegex = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/u;
  return emailRegex.test(emailStr.trim()) ? null : 'Некорректный формат email (например, name@mail.ru)';
}

export function StepPersonal() {
  const { resume, updatePersonal, subStep } = useResumeStore();
  const { personal } = resume;
  // Phone flow: only the current page is visible (on wider screens everything is shown at once)
  const activePage = STEP_PAGES[0][subStep]?.id;
  const onlyOn = (id: string) => activePage !== id && 'max-sm:hidden';
  const fileRef = useRef<HTMLInputElement>(null);

  // Selected country: restored from the saved phone/city, so coming back to this step doesn't reset it to RU
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(() =>
    detectCountryCode(personal.contacts.phone, personal.contacts.city)
  );
  const country = COUNTRIES.find((c) => c.code === selectedCountryCode) || COUNTRIES[0];

  // City lives in the store. "Другой город" mode = free text for cities missing from the list.
  const cityValue = personal.contacts.city ?? '';
  const [customCity, setCustomCity] = useState<boolean>(
    () => Boolean(personal.contacts.city) && !country.cities.includes(personal.contacts.city as string)
  );

  // Derived from the stored value, so it can never go stale
  const birthDate = personal.birthDate ?? '';
  const dateValidation: DateValidationResult =
    birthDate.length === 0
      ? { isValid: true }
      : birthDate.length < 10
      ? { isValid: false, error: 'Введите дату полностью (ДД.ММ.ГГГГ)' }
      : validateBirthDate(birthDate);
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = emailTouched ? validateEmail(personal.contacts.email) : null;

  // ---- photo ----
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    // Reset so picking the same file again (e.g. after deleting the photo) still fires onChange
    const resetInput = () => {
      input.value = '';
    };
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      alert('Поддерживаются только JPG, PNG и WEBP.');
      resetInput();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5 МБ.');
      resetInput();
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      alert('Не удалось прочитать файл.');
      resetInput();
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        alert('Не удалось открыть изображение. Попробуйте другой файл.');
        resetInput();
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 600;
        const maxH = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // JPEG has no alpha: without a white base, transparent PNGs turn black
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          updatePersonal({ photoUrl: canvas.toDataURL('image/jpeg', 0.85) });
        }
        resetInput();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ---- phone ----
  // National part of the stored phone, for display inside the input
  const phoneDisplayValue = (() => {
    const current = personal.contacts.phone || '';
    return current.startsWith(country.dialCode) ? current.slice(country.dialCode.length).trim() : current;
  })();

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { fullPhone } = formatPhoneNumber(e.target.value, country.dialCode);
    updatePersonal({ contacts: { ...personal.contacts, phone: fullPhone || undefined } });
  };

  // ---- country / city ----
  const applyCountry = (newCode: string) => {
    const newCountry = COUNTRIES.find((c) => c.code === newCode);
    if (!newCountry || newCode === selectedCountryCode) return;
    setSelectedCountryCode(newCode);

    // Keep the digits the user already typed, just re-label them with the new country code
    const { nationalDigits } = formatPhoneNumber(phoneDisplayValue, country.dialCode);
    const { fullPhone } = formatPhoneNumber(nationalDigits, newCountry.dialCode);

    updatePersonal({
      contacts: {
        ...personal.contacts,
        phone: fullPhone || undefined,
        city: undefined, // the old country's city makes no sense in the new country
      },
    });
    setCustomCity(false);
  };

  const applyCity = (value: string) => {
    if (value === OTHER_CITY) {
      setCustomCity(true);
      updatePersonal({ contacts: { ...personal.contacts, city: undefined } });
    } else {
      setCustomCity(false);
      updatePersonal({ contacts: { ...personal.contacts, city: value || undefined } });
    }
  };

  return (
    <div className="flex flex-col gap-0">
      <h1 className="max-sm:hidden text-xl font-semibold tracking-tight text-foreground mb-1.5">Личная информация и фото</h1>
      <p className="max-sm:hidden text-sm text-muted-foreground">Эти данные попадут в шапку резюме.</p>

      {/* Photo */}
      <div className={cn(onlyOn('photo'))}>
      <SectionTitle>Фото</SectionTitle>
      <div className="flex items-center gap-4 max-sm:flex-col max-sm:items-start max-sm:gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label="Загрузить фото"
          className="group size-[84px] shrink-0 overflow-hidden rounded-lg border border-dashed border-input bg-muted flex items-center justify-center transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
        >
          {personal.photoUrl ? (
            <img src={personal.photoUrl} alt="Фото" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground transition-colors group-hover:text-foreground" />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="flex flex-col gap-2.5">
          <SwitchRow
            checked={personal.showPhoto}
            onChange={(v) => updatePersonal({ showPhoto: v })}
            label="Показывать фото в резюме"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              {personal.photoUrl ? 'Заменить' : 'Загрузить'}
            </Button>
            {personal.photoUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => updatePersonal({ photoUrl: undefined })}
              >
                <Trash2 /> Удалить
              </Button>
            )}
            <span className="text-xs text-muted-foreground">JPG, PNG, WEBP · до 5 МБ</span>
          </div>
        </div>
      </div>
      </div>

      {/* Full name + birth date */}
      <div className={cn(onlyOn('name'))}>
      <SectionTitle>ФИО</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FormField label="Фамилия" htmlFor="lastName" required>
          <Input
            id="lastName"
            placeholder="Иванов"
            value={personal.lastName}
            onChange={(e) => updatePersonal({ lastName: e.target.value })}
          />
        </FormField>
        <FormField label="Имя" htmlFor="firstName" required>
          <Input
            id="firstName"
            placeholder="Иван"
            value={personal.firstName}
            onChange={(e) => updatePersonal({ firstName: e.target.value })}
          />
        </FormField>
        <FormField label="Отчество" htmlFor="middleName">
          <Input
            id="middleName"
            placeholder="Иванович"
            value={personal.middleName ?? ''}
            onChange={(e) => updatePersonal({ middleName: e.target.value })}
          />
        </FormField>
      </div>

      {/* Birth date */}
      <SectionTitle>Дата рождения</SectionTitle>
      <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
        <FormField label="Дата" htmlFor="birthDate" error={dateValidation.error} className="w-44">
          <Input
            id="birthDate"
            placeholder="ДД.ММ.ГГГГ"
            inputMode="numeric"
            value={birthDate}
            aria-invalid={!dateValidation.isValid || undefined}
            onChange={(e) => updatePersonal({ birthDate: formatAndClampDateInput(e.target.value) })}
          />
        </FormField>
        <div className="flex items-center gap-4 pt-[26px]">
          {dateValidation.isValid && dateValidation.age !== undefined && (
            <Badge variant="secondary">{formatAge(dateValidation.age)}</Badge>
          )}
          <SwitchRow
            checked={personal.showAge}
            onChange={(v) => updatePersonal({ showAge: v })}
            label="Показывать возраст в резюме"
          />
        </div>
      </div>

      </div>

      {/* Contacts */}
      <SectionTitle>Страна и контакты</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-4">
        <FormField label="Страна" htmlFor="country" className={cn(onlyOn('location'))}>
          <Select value={selectedCountryCode} onValueChange={applyCountry}>
            <SelectTrigger id="country" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag} {c.name} ({c.dialCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={`Город проживания (${country.name})`} htmlFor="city" className={cn(onlyOn('location'))}>
          <Select
            // key: reset the trigger when the country changes
            key={selectedCountryCode}
            value={customCity ? OTHER_CITY : cityValue}
            onValueChange={applyCity}
          >
            <SelectTrigger id="city" className="w-full">
              <SelectValue placeholder="Выберите город" />
            </SelectTrigger>
            <SelectContent position="popper" className="max-h-72">
              {country.cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value={OTHER_CITY}>Другой город…</SelectItem>
            </SelectContent>
          </Select>
          {customCity && (
            <Input
              autoFocus
              aria-label="Название города"
              placeholder="Введите название города"
              value={cityValue}
              maxLength={60}
              onChange={(e) =>
                updatePersonal({ contacts: { ...personal.contacts, city: e.target.value || undefined } })
              }
            />
          )}
        </FormField>

        <FormField
          label="Телефон"
          htmlFor="phone"
          className={cn(onlyOn('location'))}
          hint="Вводите цифры — код оператора выделится скобками, лишние цифры отсекаются"
        >
          <div className="flex">
            <span className="flex shrink-0 items-center whitespace-nowrap rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm font-medium text-muted-foreground select-none">
              {country.flag} {country.dialCode}
            </span>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              className="rounded-l-none font-mono"
              placeholder={getPhonePlaceholder(country)}
              value={phoneDisplayValue}
              onChange={handlePhoneChange}
            />
          </div>
        </FormField>

        <FormField label="Email" htmlFor="email" error={emailError} className={cn(onlyOn('contacts'))}>
          <Input
            id="email"
            type="email"
            placeholder="name@mail.ru"
            value={personal.contacts.email ?? ''}
            aria-invalid={emailError ? true : undefined}
            onBlur={() => setEmailTouched(true)}
            onChange={(e) =>
              updatePersonal({ contacts: { ...personal.contacts, email: e.target.value || undefined } })
            }
          />
        </FormField>

        <FormField label="Telegram" htmlFor="telegram" className={cn(onlyOn('contacts'))}>
          <div className="flex">
            <span className="flex shrink-0 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
              @
            </span>
            <Input
              id="telegram"
              className="rounded-l-none"
              placeholder="username"
              value={(personal.contacts.telegram ?? '').replace(/^@/, '')}
              onChange={(e) => {
                const username = e.target.value.replace(/[^A-Za-z0-9_]/g, '').slice(0, 32);
                updatePersonal({
                  contacts: { ...personal.contacts, telegram: username ? '@' + username : undefined },
                });
              }}
            />
          </div>
        </FormField>

        <FormField label="Портфолио / GitHub / LinkedIn" htmlFor="portfolio" className={cn(onlyOn('contacts'))}>
          <Input
            id="portfolio"
            type="url"
            placeholder="https://github.com/username"
            value={personal.contacts.portfolioUrl ?? ''}
            onChange={(e) =>
              updatePersonal({ contacts: { ...personal.contacts, portfolioUrl: e.target.value } })
            }
          />
        </FormField>
      </div>
    </div>
  );
}
