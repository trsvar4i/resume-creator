import type { Metadata } from 'next';
import { Inter, PT_Serif, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { BASE_PATH } from '@/lib/basePath';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const ptSerif = PT_Serif({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '700'],
  variable: '--font-pt-serif',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

/** Resume fonts. The PDF export embeds the very same files, so page and PDF match. URLs carry the base path. */
const RESUME_FONT_FACES = [
  ['ResumeSans', 'Inter-Regular.ttf', '400 500'],
  ['ResumeSans', 'Inter-SemiBold.ttf', '600'],
  ['ResumeSans', 'Inter-Bold.ttf', '700 900'],
  ['ResumeSerif', 'PTSerif-Regular.ttf', '400 500'],
  ['ResumeSerif', 'PTSerif-Bold.ttf', '600 900'],
]
  .map(
    ([family, file, weight]) =>
      `@font-face{font-family:'${family}';src:url('${BASE_PATH}/fonts/${file}') format('truetype');font-weight:${weight};font-display:swap}`
  )
  .join('');

export const metadata: Metadata = {
  title: 'Конструктор резюме с ИИ',
  description: 'Создайте профессиональное резюме за 7 минут с помощью ИИ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-ui-theme="light" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: RESUME_FONT_FACES }} />
      </head>
      <body className={`${inter.variable} ${ptSerif.variable} ${jetbrainsMono.variable} antialiased`}>
        <Script id="ui-theme-init" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('ui-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-ui-theme',t)}catch(e){}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
