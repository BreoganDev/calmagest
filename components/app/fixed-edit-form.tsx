'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { fixedExpenseSchema } from '@/lib/validation';
import { updateFixedExpense } from '@/lib/actions/fixedActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';

type FixedValues = z.infer<typeof fixedExpenseSchema>;

type FixedItem = {
  id: string;
  name: string;
  amount: number;
  category: string;
  dayOfMonth: number | null;
  active: boolean;
};

export function FixedEditForm({ item }: { item: FixedItem }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState((item.amount / 100).toFixed(2));

  const form = useForm<FixedValues>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: {
      name: item.name,
      amount: item.amount,
      category: item.category,
      dayOfMonth: item.dayOfMonth ?? undefined,
      active: item.active
    }
  });

  const onSubmit = (values: FixedValues) => {
    setError(null);
    startTransition(async () => {
      try {
        const cents = parseMoney(amountInput);
        await updateFixedExpense(item.id, { ...values, amount: cents });
      } catch (err) {
        setError('No se pudo actualizar.');
      }
    });
  };

  return (
    <form className="grid gap-2" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-1">
        <Label htmlFor={`name-${item.id}`}>Nombre</Label>
        <Input id={`name-${item.id}`} {...form.register('name')} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`amount-${item.id}`}>Cantidad</Label>
        <Input
          id={`amount-${item.id}`}
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`category-${item.id}`}>Categoria</Label>
        <Input id={`category-${item.id}`} {...form.register('category')} />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`day-${item.id}`}>Dia del mes</Label>
        <Input id={`day-${item.id}`} type="number" {...form.register('dayOfMonth', { valueAsNumber: true })} />
      </div>
      {error && <p className="text-xs text-rd-rose-deep">{error}</p>}
      <Button type="submit" variant="outline" disabled={isPending}>
        Guardar cambios
      </Button>
    </form>
  );
}
