'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';
import { upsertFixedBudget } from '@/lib/actions/fixedBudgetActions';

export function FixedBudgetForm() {
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  const save = () => {
    const cents = parseMoney(amount);
    if (!category.trim()) return;
    startTransition(async () => {
      await upsertFixedBudget({ category, limitAmount: cents, active: true });
      setCategory('');
      setAmount('');
    });
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="budgetCategory">Categoria</Label>
      <Input
        id="budgetCategory"
        placeholder="Alimentacion"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <Label htmlFor="budgetAmount">Tope mensual</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="budgetAmount"
          placeholder="0,00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button type="button" variant="outline" onClick={save} disabled={isPending}>
          Guardar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Sirve para saber cuanto consumen los fijos de esa categoria.
      </p>
    </div>
  );
}
