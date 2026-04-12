'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SavingsActions } from '@/components/app/savings-actions';
import { trackUxEvent } from '@/lib/client/ux-events';

export function SavingsDrawer({
  type,
  label
}: {
  type: 'savings' | 'investment';
  label: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          trackUxEvent('drawer_opened', { drawer: `${type}_actions` });
        }}
        className={cn(
          'mt-3 inline-flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-3 py-2 text-xs shadow-soft md:hidden',
          'transition hover:bg-rd-rose-soft/40'
        )}
        aria-expanded={open}
      >
        <Plus className="h-3 w-3" />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => {
            setOpen(false);
            trackUxEvent('drawer_closed', { drawer: `${type}_actions` });
          }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-border bg-card p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium">{label}</div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  trackUxEvent('drawer_closed', { drawer: `${type}_actions` });
                }}
                className="rounded-full border border-border bg-rd-nude p-2"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SavingsActions type={type} />
          </div>
        </div>
      )}
    </>
  );
}
