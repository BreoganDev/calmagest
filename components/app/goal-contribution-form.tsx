'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseMoney } from '@/lib/services/moneyService';
import { addGoalContributionWithSource } from '@/lib/actions/savingsActions';

export function GoalContributionForm({ goalId }: { goalId: string }) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState<'available' | 'savings'>('available');
  const [type, setType] = useState<'deposit' | 'withdraw'>('deposit');

  const save = () => {
    const cents = parseMoney(amount);
    if (!cents) return;
    startTransition(async () => {
      await addGoalContributionWithSource(goalId, cents, source, type);
      setAmount('');
    });
  };

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        <Button type="button" variant="outline" onClick={save} disabled={isPending}>
          {type === 'deposit' ? 'Aportar' : 'Retirar'}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={type === 'deposit'}
            onChange={() => setType('deposit')}
          />
          Aportar
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={type === 'withdraw'}
            onChange={() => setType('withdraw')}
          />
          Retirar
        </label>
        <select
          className="h-9 rounded-2xl border border-border bg-white/70 px-3 text-xs shadow-sm dark:bg-white/5"
          value={source}
          onChange={(e) => setSource(e.target.value as 'available' | 'savings')}
          disabled={type === 'withdraw'}
        >
          <option value="available">Disponible</option>
          <option value="savings">Ahorro</option>
        </select>
      </div>
    </div>
  );
}
