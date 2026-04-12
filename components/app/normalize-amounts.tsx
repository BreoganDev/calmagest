'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';

export function NormalizeAmounts() {
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      const res = await fetch('/api/admin/normalize-amounts', { method: 'POST' });
      setStatus(res.ok ? 'Importes normalizados.' : 'No se pudo normalizar.');
    });
  };

  return (
    <div className="grid gap-2">
      <Button type="button" variant="outline" onClick={run} disabled={isPending}>
        Normalizar importes negativos
      </Button>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
