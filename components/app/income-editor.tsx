'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';
import { updateMonthIncome } from '@/lib/actions/monthActions';

export function IncomeEditor({ monthId, income }: { monthId: string; income: number }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(income ? (income / 100).toFixed(2) : '');

  const save = () => {
    const cents = parseMoney(value);
    startTransition(async () => {
      await updateMonthIncome(monthId, cents);
    });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="income">Ingresos del mes</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="income"
          value={value}
          placeholder="0,00"
          onChange={(e) => setValue(e.target.value)}
        />
        <Button type="button" variant="outline" onClick={save} disabled={isPending}>
          Guardar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Se usa para calcular tu ahorro e inversion recomendados.
      </p>
    </div>
  );
}
