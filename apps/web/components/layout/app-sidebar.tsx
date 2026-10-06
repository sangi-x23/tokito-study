import Link from 'next/link';
import type { ReactNode } from 'react';
import { APP_SECTIONS } from '@/lib/sections';
import { SectionIcon } from './section-icon';
import { SidebarFrame } from './sidebar-frame';
import { SidebarLink } from './sidebar-link';

function Brand(): ReactNode {
  return (
    <Link href="/" className="text-lg font-semibold tracking-tight">
      Tokito <span lang="ja" className="text-slate-400">ときと</span>
    </Link>
  );
}

/** La navegación principal de la app: una entrada por sección. */
export function AppSidebar(): ReactNode {
  return (
    <SidebarFrame brand={<Brand />}>
      <div className="px-5 py-4">
        <Brand />
      </div>
      <nav aria-label="Secciones" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-1">
          {APP_SECTIONS.map((section) => (
            <li key={section.href}>
              <SidebarLink href={section.href}>
                <SectionIcon name={section.icon} className="size-5 shrink-0" />
                {section.label}
              </SidebarLink>
            </li>
          ))}
        </ul>
      </nav>
      <p className="px-5 py-4 text-xs text-slate-400">Material de estudio de japonés</p>
    </SidebarFrame>
  );
}
