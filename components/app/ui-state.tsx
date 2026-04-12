import type { ReactNode } from 'react';
import { AlertTriangle, CircleDashed, Info, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type Tone = 'neutral' | 'info' | 'warning' | 'error';

const toneClasses: Record<Tone, string> = {
  neutral: 'border-border bg-card/80 text-muted-foreground',
  info: 'border-sky-200 bg-sky-50/80 text-sky-800',
  warning: 'border-amber-200 bg-amber-50/80 text-amber-800',
  error: 'border-red-200 bg-red-50/80 text-red-800'
};

function toneIcon(tone: Tone) {
  if (tone === 'error') return <AlertTriangle className="h-4 w-4" />;
  if (tone === 'warning') return <Info className="h-4 w-4" />;
  if (tone === 'info') return <Info className="h-4 w-4" />;
  return <CircleDashed className="h-4 w-4" />;
}

export function UiState({
  title,
  body,
  tone = 'neutral',
  actionLabel,
  onAction,
  className
}: {
  title: string;
  body?: string;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border px-4 py-3 text-sm', toneClasses[tone], className)}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5">{toneIcon(tone)}</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{title}</p>
          {body ? <p className="mt-1 text-xs opacity-90">{body}</p> : null}
        </div>
        {actionLabel && onAction ? (
          <Button type="button" variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function LoadingState({ label = 'Cargando datos...' }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/70 px-4 py-6 text-center">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {body ? <p className="mt-1 text-xs text-muted-foreground">{body}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
