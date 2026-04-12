'use client';

import { useState, useTransition } from 'react';
import type { FixedBudget } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney, parseMoney } from '@/lib/services/moneyService';
import { Money } from '@/components/ui/money';
import { updateFixedBudget, deleteFixedBudget } from '@/lib/actions/fixedBudgetActions';

type BudgetRow = FixedBudget & { spent: number };

export function FixedBudgetList({
  budgets,
  currency
}: {
  budgets: BudgetRow[];
  currency: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(budgets.map((b) => [b.id, (b.limitAmount / 100).toFixed(2)]))
  );

  const save = (id: string) => {
    const cents = parseMoney(drafts[id] ?? '');
    startTransition(async () => {
      await updateFixedBudget(id, { limitAmount: cents });
    });
  };

  const toggle = (id: string, active: boolean) => {
    startTransition(async () => {
      await updateFixedBudget(id, { active: !active });
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      await deleteFixedBudget(id);
    });
  };

  if (budgets.length === 0) {
    return <p className="text-sm text-muted-foreground">Aun no tienes presupuestos fijos por categoria.</p>;
  }

  return (
    <div className="grid gap-3">
      {budgets.map((item) => {
        const remaining = item.limitAmount - item.spent;
        const percent = item.limitAmount > 0 ? Math.min(100, Math.round((item.spent / item.limitAmount) * 100)) : 0;
        const isUnassigned = item.id === 'unassigned';
        return (
          <div key={item.id} className="rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">{item.category}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  Consumido <Money amount={item.spent} currency={currency} /> · Restante <Money amount={remaining} currency={currency} />
                </div>
              </div>
              {!isUnassigned && (
                <div className="text-xs text-muted-foreground">
                  {item.active ? 'Activo' : 'Pausado'}
                </div>
              )}
            </div>
            <div className="mt-3 grid gap-2">
              <div className="h-2 rounded-full bg-rd-ui">
                <div className="h-2 rounded-full bg-rd-rose" style={{ width: `${percent}%` }} />
              </div>
              {!isUnassigned && (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={drafts[item.id] ?? ''}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  />
                  <Button type="button" variant="outline" onClick={() => save(item.id)} disabled={isPending}>
                    Guardar
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => toggle(item.id, item.active)} disabled={isPending}>
                    {item.active ? 'Pausar' : 'Activar'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => remove(item.id)} disabled={isPending}>
                    Eliminar
                  </Button>
                </div>
              )}
              {isUnassigned && (
                <div className="text-xs text-muted-foreground">
                  Estos fijos no tienen presupuesto asignado.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
