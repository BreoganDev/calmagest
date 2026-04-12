'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';
import { updateMonthBudget } from '@/lib/actions/monthActions';

export function BudgetEditor({ monthId, budget }: { monthId: string; budget: number }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(budget ? (budget / 100).toFixed(2) : '');

  const save = () => {
    const cents = parseMoney(value);
    startTransition(async () => {
      await updateMonthBudget(monthId, cents);
    });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="budget">Presupuesto del mes</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="budget"
          value={value}
          placeholder="0,00"
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="button" variant="outline" onClick={save} disabled={isPending}>
          Guardar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Puedes dejarlo fijo copiando el mes anterior o ajustarlo cuando lo necesites.
      </p>
    </div>
  );
}
