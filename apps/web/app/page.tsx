import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';

// Mientras el diario sea la única sección, el inicio es el diario.
export default function HomePage(): never {
  redirect(routes.diary);
}
