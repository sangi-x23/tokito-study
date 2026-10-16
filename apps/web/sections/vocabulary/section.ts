import { routes } from '@/lib/routes';
import type { AppSection } from '../types';
import { VocabularyIcon } from './icon';

export const vocabularySection: AppSection = {
  label: 'Vocabulario',
  href: routes.vocabulary,
  Icon: VocabularyIcon,
};
