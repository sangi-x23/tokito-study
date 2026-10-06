import { diarySection } from './diary/section';
import type { AppSection } from './types';

export type { AppSection } from './types';

/**
 * Las secciones del sidebar, en el orden en que aparecen. Una sección nueva
 * crea su carpeta (`section.ts`, `icon.tsx` y `views/`) y se agrega aquí.
 */
export const APP_SECTIONS: readonly AppSection[] = [diarySection];
