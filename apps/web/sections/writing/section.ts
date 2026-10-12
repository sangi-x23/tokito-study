import { routes } from '@/lib/routes';
import type { AppSection } from '../types';
import { WritingIcon } from './icon';

export const writingSection: AppSection = {
  label: 'Escritura',
  href: routes.writing,
  Icon: WritingIcon,
};
