'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { acceptAllSuggestions } from '@/lib/actions/suggestionActions';

export function AcceptAllSuggestions({ source }: { source?: string }) {
  const [isPending, startTransition] = useTransition();

  const acceptAll = () => {
    startTransition(async () => {
      await acceptAllSuggestions(source);
    });
  };

  return (
    <Button type="button" variant="outline" onClick={acceptAll} disabled={isPending}>
      Aceptar todo
    </Button>
  );
}
