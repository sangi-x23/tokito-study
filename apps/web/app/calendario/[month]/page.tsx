import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { today } from '@/modules/calendar/calendar-dates';
import { findMonthBySlug } from '@/modules/calendar/japanese-dates';
import { MonthView } from '@/sections/calendar/views/month-view';

// El día resaltado y el año dependen de hoy.
export const dynamic = 'force-dynamic';

interface MonthPageProps {
  params: Promise<{ month: string }>;
}

export async function generateMetadata({ params }: MonthPageProps): Promise<Metadata> {
  const month = findMonthBySlug((await params).month);
  return {
    title: month ? `Calendario · ${month.spanish}` : 'Mes no encontrado',
  };
}

export default async function MonthPage({ params }: MonthPageProps): Promise<ReactNode> {
  const month = findMonthBySlug((await params).month);
  if (!month) {
    notFound();
  }
  return <MonthView month={month} today={today()} />;
}
