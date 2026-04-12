'use client';

import { useTransition } from 'react';
import { updateFixedExpense, deleteFixedExpense } from '@/lib/actions/fixedActions';
import { Button } from '@/components/ui/button';
import { ConfirmDelete } from '@/components/app/confirm-delete';

export function FixedRowActions({
  id,
  active
}: {
  id: string;
  active: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      await updateFixedExpense(id, { active: !active });
    });
  };

  const remove = () => {
    startTransition(async () => {
      await deleteFixedExpense(id);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" onClick={toggle} disabled={isPending}>
        {active ? 'Desactivar' : 'Activar'}
      </Button>
      <ConfirmDelete onConfirm={remove} />
    </div>
  );
}
