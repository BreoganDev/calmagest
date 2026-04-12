import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Pagination({
  current,
  total,
  basePath
}: {
  current: number;
  total: number;
  basePath: string;
}) {
  if (total <= 1) return null;

  const pages = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap gap-2">
      {pages.map((page) => (
        <Link
          key={page}
          href={`${basePath}${basePath.includes('?') ? '&' : '?'}page=${page}`}
          className={cn(
            'rounded-2xl border border-border px-3 py-1 text-xs',
            page === current ? 'bg-rd-rose-soft text-rd-text' : 'bg-card'
          )}
        >
          {page}
        </Link>
      ))}
    </div>
  );
}
