'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import ExpenseForm from '@/app/app/expenses/expense-form';
import { cn } from '@/lib/utils';

export function ExpenseDrawer({ monthId }: { monthId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-28 right-5 z-[45] flex h-14 w-14 items-center justify-center rounded-full bg-rd-rose text-white shadow-[0_8px_30px_rgba(244,114,182,0.6)] md:hidden',
          'transition hover:bg-rd-rose-soft'
        )}
        aria-label="Nuevo gasto"
      >
        <Plus className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden flex items-end"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative z-[61] w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border border-border bg-card p-6 pb-24 shadow-2xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between sticky top-0 bg-card z-10 pb-2">
              <div className="text-lg font-bold font-app">Nuevo gasto</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border bg-rd-nude p-2"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ExpenseForm monthId={monthId} />
          </div>
        </div>
      )}
    </>
  );
}
