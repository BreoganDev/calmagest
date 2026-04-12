'use client';

import { useState, useTransition } from 'react';
import { ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseMoney } from '@/lib/services/moneyService';
import { addSavings, withdrawSavings, addInvestment } from '@/lib/actions/savingsActions';
import { cn } from '@/lib/utils';
import { trackUxEvent } from '@/lib/client/ux-events';

export function SavingsActions({
  type,
  compact
}: {
  type: 'savings' | 'investment';
  compact?: boolean;
}) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onDeposit = () => {
    const cents = parseMoney(amount);
    if (!cents) {
      setError('Introduce una cantidad válida.');
      return;
    }
    setError(null);
    trackUxEvent('form_submit_clicked', { form: type === 'investment' ? 'investment_deposit' : 'savings_deposit' });
    startTransition(async () => {
      if (type === 'investment') await addInvestment(cents);
      else await addSavings(cents);
      setAmount('');
    });
  };

  const onWithdraw = () => {
    const cents = parseMoney(amount);
    if (!cents) {
      setError('Introduce una cantidad válida.');
      return;
    }
    setError(null);
    trackUxEvent('form_submit_clicked', { form: 'savings_withdraw' });
    startTransition(async () => {
      await withdrawSavings(cents);
      setAmount('');
    });
  };

  return (
    <div className={cn('grid gap-2', compact ? 'sm:grid-cols-[180px_1fr]' : 'sm:grid-cols-[220px_1fr]')}>
      <div className="relative">
        <Input
          value={amount}
          error={!!error}
          onChange={(e) => {
            setAmount(e.target.value);
            if (error) setError(null);
          }}
          placeholder="0,00"
          inputMode="decimal"
          className={cn('pr-10', compact ? 'h-10' : '')}
        />
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-rd-gray-400">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="success" onClick={onDeposit} disabled={isPending} className="gap-2">
          <ArrowUpRight className="h-4 w-4" />
          Depositar
        </Button>
        {type === 'savings' && (
          <Button type="button" variant="outline" onClick={onWithdraw} disabled={isPending} className="gap-2">
            <ArrowDownLeft className="h-4 w-4" />
            Retirar
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-rd-danger sm:col-span-2">{error}</p>}
    </div>
  );
}
