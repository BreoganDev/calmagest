'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';
import { updateDefaultBudget } from '@/lib/actions/userActions';

export function DefaultBudgetForm({ value }: { value: number }) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(value ? (value / 100).toFixed(2) : '');

  const save = () => {
    const cents = parseMoney(amount);
    startTransition(async () => {
      await updateDefaultBudget(cents);
    });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="defaultBudget">Presupuesto por defecto</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="defaultBudget"
          value={amount}
          placeholder="0,00"
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button type="button" variant="outline" onClick={save} disabled={isPending}>
          Guardar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Se aplicara cuando crees un mes nuevo si no ajustas el presupuesto.
      </p>
    </div>
  );
}
