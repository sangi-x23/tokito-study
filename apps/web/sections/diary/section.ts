import { routes } from '@/lib/routes';
import type { AppSection } from '../types';
import { DiaryIcon } from './icon';

export const diarySection: AppSection = {
  label: 'Diario de clase',
  href: routes.diary,
  Icon: DiaryIcon,
};
