import { routes } from './routes';

export type SectionIcon = 'diary';

/** Una entrada del sidebar. Cada feature nueva agrega la suya aquí. */
export interface AppSection {
  readonly label: string;
  readonly href: string;
  readonly icon: SectionIcon;
}

export const APP_SECTIONS: readonly AppSection[] = [{ label: 'Diario de clase', href: routes.diary, icon: 'diary' }];
