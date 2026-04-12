'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fixedExpenseCreateSchema } from '@/lib/validation';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';
import { createFixedExpense } from '@/lib/actions/fixedActions';

type FixedValues = z.infer<typeof fixedExpenseCreateSchema>;

export default function FixedForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');

  const form = useForm<FixedValues>({
    resolver: zodResolver(fixedExpenseCreateSchema),
    defaultValues: {
      name: '',
      amount: 0,
      category: 'Hogar',
      dayOfMonth: undefined,
      active: true
    }
  });

  const onSubmit = (values: FixedValues) => {
    setError(null);
    startTransition(async () => {
      try {
        const cents = parseMoney(amountInput);
        await createFixedExpense({
          ...values,
          amount: cents
        });
        setAmountInput('');
        form.reset({ ...values, name: '', amount: 0 });
      } catch (err) {
        setError('No se pudo guardar.');
      }
    });
  };

  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" placeholder="Alquiler" {...form.register('name')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="amount">Cantidad</Label>
        <Input
          id="amount"
          placeholder="9,00"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="category">Categoria</Label>
        <Input id="category" placeholder="Hogar" {...form.register('category')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="dayOfMonth">Dia del mes (opcional)</Label>
        <Input
          id="dayOfMonth"
          type="number"
          min={1}
          max={31}
          {...form.register('dayOfMonth', { valueAsNumber: true })}
        />
      </div>
      {error && <p className="text-xs text-rd-rose-deep">{error}</p>}
      <Button type="submit" disabled={isPending}>
        Guardar fijo
      </Button>
    </form>
  );
}
