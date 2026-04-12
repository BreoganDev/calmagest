'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';

export function BackupActions() {
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const downloadCsv = () => {
    window.location.href = '/api/export/month';
  };

  const downloadBackup = () => {
    window.location.href = '/api/export/backup';
  };

  const onImport = (file: File | null) => {
    if (!file) return;

    startTransition(async () => {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const res = await fetch('/api/import/backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });
        if (!res.ok) throw new Error('fail');
        setStatus('Importacion completada.');
      } catch (err) {
        setStatus('No se pudo importar.');
      }
    });
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={downloadCsv}>
          Exportar CSV del mes
        </Button>
        <Button type="button" onClick={downloadBackup}>
          Exportar backup JSON
        </Button>
      </div>
      <div className="grid gap-2 rounded-2xl border border-border bg-rd-nude p-4">
        <div className="text-sm font-medium">Importar backup (reemplaza todo)</div>
        <p className="text-xs text-muted-foreground">
          Esto reemplaza tus datos actuales. Te recomendamos exportar antes.
        </p>
        <input
          type="file"
          accept="application/json"
          disabled={isPending}
          onChange={(e) => onImport(e.target.files?.[0] ?? null)}
        />
      </div>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
