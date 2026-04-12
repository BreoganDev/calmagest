'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';
import { createGoal } from '@/lib/actions/goalActions';

export function GoalForm() {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const save = () => {
    const cents = parseMoney(amount);
    if (!name || !cents) return;
    startTransition(async () => {
      await createGoal({ name, targetAmount: cents, targetDate: date || undefined });
      setName('');
      setAmount('');
      setDate('');
    });
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <Label htmlFor="goalName">Nombre</Label>
        <Input id="goalName" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="goalAmount">Monto objetivo</Label>
        <Input id="goalAmount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="goalDate">Fecha meta (opcional)</Label>
        <Input id="goalDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button type="button" onClick={save} disabled={isPending}>
        Crear objetivo
      </Button>
    </div>
  );
}
