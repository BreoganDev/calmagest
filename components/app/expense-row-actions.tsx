'use client';

import { useTransition } from 'react';
import { deleteExpense, convertExpenseToFixed } from '@/lib/actions/expenseActions';
import { Button } from '@/components/ui/button';
import { ConfirmDelete } from '@/components/app/confirm-delete';

export function ExpenseRowActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const remove = () => {
    startTransition(async () => {
      await deleteExpense(id);
    });
  };

  const convert = () => {
    startTransition(async () => {
      await convertExpenseToFixed(id);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" onClick={convert} disabled={isPending}>
        Pasar a fijo
      </Button>
      <ConfirmDelete onConfirm={remove} label={isPending ? '...' : 'Eliminar'} />
    </div>
  );
}
