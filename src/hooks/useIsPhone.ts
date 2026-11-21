import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 639px)'; // Tailwind's `sm` breakpoint is 640px

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/** True on phone-sized screens. Server snapshot is false, so SSR markup matches the desktop layout. */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
