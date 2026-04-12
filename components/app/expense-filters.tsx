'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isValidYearMonth } from '@/lib/services/monthService';
import { trackUxEvent } from '@/lib/client/ux-events';

export function ExpenseFilters({
  categories
}: {
  categories: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const query = params?.get('q') ?? '';
  const category = params?.get('cat') ?? '';
  const sort = params?.get('sort') ?? 'date_desc';
  const ymFromQuery = params?.get('ym') ?? '';
  const ym = isValidYearMonth(ymFromQuery) ? ymFromQuery : '';

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params?.toString() ?? '');
    if (value) next.set(key, value);
    else next.delete(key);
    if (ym) next.set('ym', ym);
    next.delete('page');
    trackUxEvent('filter_changed', { key, value, ym });
    router.push(`/app/expenses?${next.toString()}`);
  };

  const resetFilters = () => {
    const next = new URLSearchParams();
    if (ym) next.set('ym', ym);
    trackUxEvent('filter_changed', { key: 'reset', ym });
    router.push(`/app/expenses?${next.toString()}`);
  };

  const topCategories = categories.filter(Boolean).slice(0, 6);

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">
        <Input
          placeholder="Buscar por nombre, categoría o nota"
          defaultValue={query}
          onBlur={(e) => updateParam('q', e.target.value)}
          aria-label="Buscar gastos"
        />
        <Select value={category} onChange={(e) => updateParam('cat', e.target.value)} aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => updateParam('sort', e.target.value)} aria-label="Ordenar gastos">
          <option value="date_desc">Más recientes</option>
          <option value="date_asc">Más antiguos</option>
          <option value="amount_desc">Mayor cantidad</option>
          <option value="amount_asc">Menor cantidad</option>
        </Select>
        <Button type="button" variant="outline" onClick={resetFilters} className="md:justify-center">
          Limpiar
        </Button>
      </div>

      {topCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => updateParam('cat', '')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-all',
              !category ? 'border-rd-rose bg-rd-rose-soft text-rd-gray-800' : 'border-border bg-card text-muted-foreground'
            )}
          >
            Todas
          </button>
          {topCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => updateParam('cat', cat)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs transition-all',
                category === cat
                  ? 'border-rd-rose bg-rd-rose-soft text-rd-gray-800'
                  : 'border-border bg-card text-muted-foreground hover:bg-card/80'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
