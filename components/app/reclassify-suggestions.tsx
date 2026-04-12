'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { reclassifySuggestions } from '@/lib/actions/suggestionActions';

export function ReclassifySuggestions({ source }: { source?: string }) {
  const [isPending, startTransition] = useTransition();

  const reclassify = () => {
    startTransition(async () => {
      await reclassifySuggestions(source);
    });
  };

  return (
    <Button type="button" variant="outline" onClick={reclassify} disabled={isPending}>
      Reclasificar
    </Button>
  );
}
