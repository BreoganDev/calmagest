'use client';

import { useState, useTransition } from 'react';

export function BankCsvImport() {
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onImport = (file: File | null) => {
    if (!file) return;
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
    startTransition(async () => {
      try {
        const res = await fetch(isXlsx ? '/api/import/bank-xlsx' : '/api/import/bank-csv', {
          method: 'POST',
          headers: { 'Content-Type': isXlsx ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv' },
          body: isXlsx ? await file.arrayBuffer() : await file.text()
        });
        if (!res.ok) throw new Error('fail');
        setStatus('Importacion completada.');
      } catch {
        setStatus('No se pudo importar.');
      }
    });
  };

  return (
    <div className="grid gap-3">
      <div className="text-sm text-muted-foreground">
        Importa CSV o Excel con columnas: Fecha valor, Fecha, Concepto, Movimiento, Importe, Divisa.
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={isPending}
          onChange={(e) => onImport(e.target.files?.[0] ?? null)}
        />
        <a
          href="/api/import/bank-csv/template"
          className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-4 py-2 text-sm"
        >
          Descargar ejemplo CSV
        </a>
      </div>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}
