import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';

// La app no tiene portada propia: el inicio es la primera sección del sidebar.
export default function HomePage(): never {
  redirect(routes.diary);
}
