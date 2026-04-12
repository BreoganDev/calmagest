'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { acceptSuggestion, rejectSuggestion } from '@/lib/actions/suggestionActions';

export function SuggestionActions({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const accept = () => {
    startTransition(async () => {
      await acceptSuggestion(id);
    });
  };

  const reject = () => {
    startTransition(async () => {
      await rejectSuggestion(id);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button type="button" onClick={accept} disabled={isPending}>
        Aceptar
      </Button>
      <Button type="button" variant="outline" onClick={reject} disabled={isPending}>
        Ignorar
      </Button>
    </div>
  );
}
