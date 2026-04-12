'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { updateSavingsRule } from '@/lib/actions/goalActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SavingsRuleForm({
  savingsPct,
  investPct
}: {
  savingsPct: number;
  investPct: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [savings, setSavings] = useState(String(savingsPct));
  const [invest, setInvest] = useState(String(investPct));

  const save = () => {
    startTransition(async () => {
      await updateSavingsRule(Number(savings), Number(invest));
    });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="savingsPct">Ahorro mensual (%)</Label>
          <div className="relative">
            <Input
              id="savingsPct"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
              inputMode="decimal"
              className="pr-10"
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-rd-gray-400">
              %
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="investPct">Inversion mensual (%)</Label>
          <div className="relative">
            <Input
              id="investPct"
              value={invest}
              onChange={(e) => setInvest(e.target.value)}
              inputMode="decimal"
              className="pr-10"
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-rd-gray-400">
              %
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Recomendado: 10% ahorro y 10% inversion. Ajusta segun tu realidad.
        </p>
        <Button type="button" variant="outline" onClick={save} disabled={isPending} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Guardar reglas
        </Button>
      </div>
    </div>
  );
}

