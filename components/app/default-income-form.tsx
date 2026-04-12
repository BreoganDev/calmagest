'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';
import { updateDefaultIncome } from '@/lib/actions/userActions';

export function DefaultIncomeForm({ value }: { value: number }) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(value ? (value / 100).toFixed(2) : '');

  const save = () => {
    const cents = parseMoney(amount);
    startTransition(async () => {
      await updateDefaultIncome(cents);
    });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="defaultIncome">Ingreso mensual por defecto</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="defaultIncome"
          value={amount}
          placeholder="0,00"
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button type="button" variant="outline" onClick={save} disabled={isPending}>
          Guardar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Se usa al crear un mes nuevo si no lo ajustas manualmente.
      </p>
    </div>
  );
}
