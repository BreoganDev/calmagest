'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { expenseCreateSchema } from '@/lib/validation';
import { createExpense } from '@/lib/actions/expenseActions';
import { createFixedExpenseForMonth } from '@/lib/actions/fixedActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';
import { suggestClassification } from '@/lib/services/classifierService';
import { CategorySelector } from '@/components/app/category-selector';
import { PREDEFINED_CATEGORIES } from '@/lib/catalogs/categories';
import { trackUxEvent } from '@/lib/client/ux-events';

const importanceLabels: Record<string, string> = {
  VITAL: 'Vital',
  NEUTRO: 'Neutro',
  SUPERFLUO: 'Superfluo'
};

type ExpenseValues = z.infer<typeof expenseCreateSchema>;

type ExpenseType = 'variable' | 'fijo';

export default function ExpenseForm({ monthId }: { monthId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [amountTouched, setAmountTouched] = useState(false);
  const [expenseType, setExpenseType] = useState<ExpenseType>('variable');
  const [manualOverride, setManualOverride] = useState(false);

  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseCreateSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      name: '',
      amount: 0,
      category: 'Variable',
      notes: '',
      importance: 'NEUTRO'
    }
  });

  const name = form.watch('name');
  const suggestion = useMemo(() => suggestClassification(name), [name]);
  const amountCents = parseMoney(amountInput);
  const amountError = amountTouched && !amountCents ? 'Introduce una cantidad válida.' : null;

  useEffect(() => {
    if (!suggestion || manualOverride) return;
    form.setValue('category', suggestion.category);
    form.setValue('importance', suggestion.importance);
    setExpenseType(suggestion.isFixed ? 'fijo' : 'variable');
  }, [suggestion, manualOverride, form]);

  const onSubmit = (values: ExpenseValues) => {
    setError(null);
    startTransition(async () => {
      try {
        const cents = parseMoney(amountInput);
        if (!cents) {
          setAmountTouched(true);
          setError('Introduce una cantidad válida.');
          return;
        }
        trackUxEvent('form_submit_clicked', { form: 'expense', type: expenseType });
        if (expenseType === 'fijo') {
          await createFixedExpenseForMonth(monthId, {
            name: values.name,
            amount: cents,
            category: values.category,
            active: true
          });
        } else {
          await createExpense(monthId, {
            ...values,
            amount: cents
          });
        }
        setAmountInput('');
        setAmountTouched(false);
        setManualOverride(false);
        form.reset({ ...values, name: '', amount: 0, notes: '' });
      } catch (err) {
        setError('No se pudo guardar.');
      }
    });
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    setManualOverride(false);
    form.setValue('category', suggestion.category);
    form.setValue('importance', suggestion.importance);
    setExpenseType(suggestion.isFixed ? 'fijo' : 'variable');
  };

  const createAsFixed = () => {
    if (!suggestion?.isFixed) return;
    const cents = parseMoney(amountInput);
    if (!cents) {
      setError('Primero ingresa una cantidad.');
      return;
    }
    startTransition(async () => {
      try {
        await createFixedExpenseForMonth(monthId, {
          name: name || 'Gasto fijo',
          amount: cents,
          category: suggestion.category,
          active: true
        });
        setError(null);
      } catch {
        setError('No se pudo crear el fijo.');
      }
    });
  };

  return (
    <form className="grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="date">Fecha</Label>
        <Input id="date" type="date" {...form.register('date')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" placeholder="Super" {...form.register('name')} />
      </div>
      {suggestion && (
        <div className="rounded-2xl border border-border bg-rd-nude px-3 py-2 text-xs text-muted-foreground">
          Sugerencia: {suggestion.category} · {suggestion.isFixed ? 'Fijo' : 'Variable'} ·{' '}
          {importanceLabels[suggestion.importance]} ({suggestion.reason}).
          <div className="mt-2 flex flex-wrap gap-2">
            {manualOverride && (
              <Button type="button" variant="outline" onClick={applySuggestion}>
                Volver a IA
              </Button>
            )}
            {suggestion.isFixed && (
              <Button type="button" variant="outline" onClick={createAsFixed}>
                Crear como fijo
              </Button>
            )}
          </div>
        </div>
      )}
      <div className="grid gap-2">
        <Label htmlFor="amount">Cantidad</Label>
        <Input
          id="amount"
          placeholder="9,00"
          value={amountInput}
          error={!!amountError}
          onChange={(e) => {
            setAmountTouched(true);
            setAmountInput(e.target.value);
          }}
        />
        {amountError && <p className="text-xs text-rd-rose-deep">{amountError}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="expenseType">Tipo</Label>
        <Select
          id="expenseType"
          value={expenseType}
          onChange={(e) => {
            setExpenseType(e.target.value as ExpenseType);
            setManualOverride(true);
          }}
        >
          <option value="variable">Variable</option>
          <option value="fijo">Fijo</option>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="category">Categoría</Label>
        <CategorySelector
          categories={PREDEFINED_CATEGORIES as any}
          value={form.watch('category') || ''}
          onChange={(val) => {
            setManualOverride(true);
            form.setValue('category', val);
          }}
          className="w-full"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="importance">Importancia</Label>
        <Select
          id="importance"
          {...form.register('importance')}
        >
          <option value="NEUTRO">Neutro</option>
          <option value="VITAL">Vital</option>
          <option value="SUPERFLUO">Superfluo</option>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Input id="notes" placeholder="Algo breve" {...form.register('notes')} />
      </div>
      {error && <p className="text-xs text-rd-rose-deep">{error}</p>}
      <Button type="submit" disabled={isPending}>
        Guardar gasto
      </Button>
    </form>
  );
}
