import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
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
        <div className="lg:flex">
          <AppSidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
