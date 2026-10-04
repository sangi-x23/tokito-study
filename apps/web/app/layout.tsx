import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import Link from 'next/link';
import type { ReactNode } from 'react';
import './globals.css';

// Con la fuente servida por Next, el japonés se ve igual en cualquier equipo,
// tenga o no una fuente japonesa instalada.
const notoSansJp = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '500', '700'], display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Tokito', template: '%s · Tokito' },
  description: 'Material de estudio de japonés organizado por temas',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="es">
      <body
        className={`${notoSansJp.className} min-h-screen bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100`}
      >
        <header className="border-b border-slate-200 dark:border-slate-800">
          <div className="mx-auto flex max-w-4xl items-center px-4 py-3 sm:px-6">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Tokito <span lang="ja" className="text-slate-400">ときと</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
