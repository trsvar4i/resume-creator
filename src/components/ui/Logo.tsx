import Link from 'next/link';

/** Product mark: a résumé sheet with a spark (the AI part). Always the same, so it works as a constant anchor. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Резюме ИИ — на главную"
      className="inline-flex items-center gap-2 shrink-0 select-none rounded-[var(--radius-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-accent-primary)]"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <rect width="28" height="28" rx="7" fill="var(--ui-accent-primary)" />
        <path
          d="M9 7.5h7.2L20 11.3V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 8 20V9A1.5 1.5 0 0 1 9 7.5Z"
          fill="var(--ui-accent-fg)"
        />
        <path d="M16.2 7.5v3a.8.8 0 0 0 .8.8h3" stroke="var(--ui-accent-primary)" strokeWidth="1" opacity=".35" />
        <rect x="10.4" y="14" width="6.2" height="1.3" rx=".65" fill="var(--ui-accent-primary)" opacity=".55" />
        <rect x="10.4" y="16.8" width="4.4" height="1.3" rx=".65" fill="var(--ui-accent-primary)" opacity=".35" />
        {/* spark */}
        <path d="M21.5 3.2l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7z" fill="#F5B301" />
      </svg>
      {!compact && (
        <span className="hidden sm:inline text-[15px] font-semibold tracking-tight text-[var(--ui-text-primary)] leading-none">
          Резюме<span className="text-[var(--ui-text-muted)] font-medium"> ИИ</span>
        </span>
      )}
    </Link>
  );
}
