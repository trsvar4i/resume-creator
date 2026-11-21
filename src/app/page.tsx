import Link from 'next/link';
import { ArrowRight, FileText, Sparkles, Download } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FEATURES = [
  { icon: FileText, title: 'Три шаблона', text: 'Классика, Модерн и Минимал с шестью акцентными цветами.' },
  { icon: Sparkles, title: 'ИИ-помощник', text: 'Формулирует достижения, раздел «О себе» и подбирает навыки.' },
  { icon: Download, title: 'PDF и Word', text: 'A4 для печати, Mobile PDF для телефона и DOCX для правок.' },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col bg-canvas">
      <header className="flex justify-end px-4 py-4 sm:px-6">
        <Logo />
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-24 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Конструктор резюме с ИИ
          </h1>
          <p className="mx-auto max-w-md text-base text-muted-foreground">
            Создайте профессиональное резюме за 7 минут: заполните пять коротких шагов, остальное сделает ИИ.
          </p>
        </div>

        <Link href="/builder" className={cn(buttonVariants({ size: 'lg' }), 'h-11 px-7 text-base')}>
          Создать резюме <ArrowRight />
        </Link>

        <ul className="mt-6 grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-xl border border-border bg-card p-4">
              <Icon className="mb-3 size-5 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
