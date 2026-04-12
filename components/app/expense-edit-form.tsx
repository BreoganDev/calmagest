'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { expenseSchema } from '@/lib/validation';
import { updateExpense } from '@/lib/actions/expenseActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';
import { CategorySelector } from '@/components/app/category-selector';
import { PREDEFINED_CATEGORIES } from '@/lib/catalogs/categories';

type ExpenseValues = z.infer<typeof expenseSchema>;

type ExpenseItem = {
  id: string;
  name: string;
  amount: number;
  category: string;
  notes: string | null;
  date: Date;
  importance: 'VITAL' | 'NEUTRO' | 'SUPERFLUO' | null;
};

export function ExpenseEditForm({ item }: { item: ExpenseItem }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState((item.amount / 100).toFixed(2));

  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: item.name,
      amount: item.amount,
      category: item.category,
      notes: item.notes ?? '',
      date: item.date.toISOString().slice(0, 10),
      importance: item.importance ?? 'NEUTRO'
    }
  });

  const onSubmit = (values: ExpenseValues) => {
    setError(null);
    startTransition(async () => {
      try {
        const cents = parseMoney(amountInput);
        await updateExpense(item.id, { ...values, amount: cents });
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
        <Label htmlFor={`date-${item.id}`}>Fecha</Label>
        <Input id={`date-${item.id}`} type="date" {...form.register('date')} />
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
        <Label htmlFor={`category-${item.id}`}>Categoría</Label>
        <CategorySelector
          categories={PREDEFINED_CATEGORIES as any}
          value={form.watch('category') || ''}
          onChange={(val) => form.setValue('category', val)}
          className="w-full"
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`importance-${item.id}`}>Importancia</Label>
        <select
          id={`importance-${item.id}`}
          className="h-11 rounded-2xl border border-border bg-white/70 px-4 text-sm shadow-sm dark:bg-white/5"
          {...form.register('importance')}
        >
          <option value="NEUTRO">Neutro</option>
          <option value="VITAL">Vital</option>
          <option value="SUPERFLUO">Superfluo</option>
        </select>
      </div>
      <div className="grid gap-1">
        <Label htmlFor={`notes-${item.id}`}>Notas</Label>
        <Input id={`notes-${item.id}`} {...form.register('notes')} />
      </div>
      {error && <p className="text-xs text-rd-rose-deep">{error}</p>}
      <Button type="submit" variant="outline" disabled={isPending}>
        Guardar cambios
      </Button>
    </form>
  );
}
