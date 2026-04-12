'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GoalForm } from '@/components/app/goal-form';

export function GoalDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-rd-rose text-rd-text shadow-soft md:hidden',
          'transition hover:bg-rd-rose-soft'
        )}
        aria-label="Nuevo objetivo"
      >
        <Plus className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-border bg-card p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium">Nuevo objetivo</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border bg-rd-nude p-2"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <GoalForm />
          </div>
        </div>
      )}
    </>
  );
}
