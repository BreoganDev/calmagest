'use client';

import { useState, useTransition } from 'react';
import type { FixedExpense } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/services/moneyService';
import { Money } from '@/components/ui/money';
import { assignFixedToCategory } from '@/lib/actions/fixedActions';

export function UnassignedFixedList({
  items,
  categories,
  currency
}: {
  items: FixedExpense[];
  categories: string[];
  currency: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [selection, setSelection] = useState<Record<string, string>>(
    Object.fromEntries(items.map((item) => [item.id, categories[0] ?? '']))
  );

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Todo esta asignado a un presupuesto.</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.category}</div>
            </div>
            <div className="text-sm font-semibold"><Money amount={item.amount} currency={currency} /></div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              className="h-10 rounded-2xl border border-border bg-background px-3 text-sm"
              value={selection[item.id] ?? ''}
              onChange={(e) => setSelection((prev) => ({ ...prev, [item.id]: e.target.value }))}
              disabled={categories.length === 0}
            >
              {categories.length === 0 && <option value="">Crea un presupuesto arriba</option>}
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const chosen = selection[item.id];
                if (!chosen) return;
                startTransition(async () => {
                  await assignFixedToCategory(item.id, chosen);
                });
              }}
              disabled={isPending || categories.length === 0}
            >
              Asignar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
