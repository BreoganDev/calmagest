'use client';

import { ShoppingBag, Home, Utensils, Car, Heart, Sparkles } from 'lucide-react';
import { Money } from '@/components/ui/money';
import Link from 'next/link';

interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
}

interface RecentActivityListProps {
  transactions: Transaction[];
  yearMonth?: string;
}

const categoryIcons: Record<string, any> = {
  alimentacion: Utensils,
  hogar: Home,
  transporte: Car,
  salud: Heart,
  variable: ShoppingBag
};

const categoryColors: Record<string, string> = {
  alimentacion: 'bg-green-100 text-green-700',
  hogar: 'bg-blue-100 text-blue-700',
  transporte: 'bg-purple-100 text-purple-700',
  salud: 'bg-red-100 text-red-700',
  variable: 'bg-amber-100 text-amber-700'
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z]/g, '');

export function RecentActivityList({ transactions, yearMonth }: RecentActivityListProps) {
  const historyHref = yearMonth ? `/app/history?ym=${yearMonth}` : '/app/history';
  return (
    <div className="w-full rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">Actividad reciente</h3>
        <Link href={historyHref} className="text-sm font-medium text-rose-600 hover:text-rose-700">
          Ver todo
        </Link>
      </div>

      <div className="grid gap-3">
        {transactions.slice(0, 6).map((transaction) => {
          const key = normalizeKey(transaction.category || 'Variable');
          const Icon = categoryIcons[key] || Sparkles;
          const colorClass = categoryColors[key] || 'bg-slate-100 text-slate-700';

          return (
            <div
              key={transaction.id}
              className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition-all hover:border-slate-200 hover:bg-white hover:shadow-md sm:grid-cols-[auto_1fr_auto]"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{transaction.name}</p>
                <p className="text-xs text-slate-500">{transaction.category}</p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-sm font-bold text-red-600">
                  -<Money amount={transaction.amount} />
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(transaction.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
