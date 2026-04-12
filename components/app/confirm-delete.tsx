'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ConfirmDelete({
  label = 'Eliminar',
  onConfirm
}: {
  label?: string;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={() => (armed ? onConfirm() : setArmed(true))}
      >
        {armed ? 'Confirmar' : label}
      </Button>
      {armed && (
        <Button type="button" variant="outline" onClick={() => setArmed(false)}>
          Cancelar
        </Button>
      )}
    </div>
  );
}
