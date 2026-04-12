'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FabAdd({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-rd-rose text-rd-text shadow-soft md:hidden',
        'transition hover:bg-rd-rose-soft'
      )}
      aria-label={label}
    >
      <Plus className="h-5 w-5" />
    </Link>
  );
}
