'use client';

import { useMemo, useState, useTransition } from 'react';
import { Money } from '@/components/ui/money';
import { Button } from '@/components/ui/button';
import { CategorySelector } from '@/components/app/category-selector';
import { PREDEFINED_CATEGORIES } from '@/lib/catalogs/categories';
import { acceptSuggestion, rejectSuggestion } from '@/lib/actions/suggestionActions';
import { suggestClassification } from '@/lib/services/classifierService';

type ExpenseType = 'variable' | 'fijo';

type SuggestionItem = {
  id: string;
  date: string | Date;
  name: string;
  amount: number;
  category: string;
  importance: 'VITAL' | 'NEUTRO' | 'SUPERFLUO';
  notes: string | null;
  source: string;
};

export function SuggestionRow({
  item,
  currency,
  defaultIsFixed
}: {
  item: SuggestionItem;
  currency?: string;
  defaultIsFixed?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const auto = useMemo(() => suggestClassification(item.name), [item.name]);
  const initialType: ExpenseType = (defaultIsFixed ?? auto?.isFixed) ? 'fijo' : 'variable';
  const [expenseType, setExpenseType] = useState<ExpenseType>(initialType);
  const [category, setCategory] = useState(item.category || 'Variable');

  const accept = () => {
    startTransition(async () => {
      await acceptSuggestion(item.id, {
        category,
        isFixed: expenseType === 'fijo'
      });
    });
  };

  const reject = () => {
    startTransition(async () => {
      await rejectSuggestion(item.id);
    });
  };

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{item.name}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(item.date).toLocaleDateString('es-ES')} · {category || 'Variable'}
          </div>
          {item.notes && <div className="text-xs text-muted-foreground">{item.notes}</div>}
        </div>
        <div className="text-sm font-semibold">
          <Money amount={item.amount} currency={currency} />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_140px]">
        <CategorySelector
          categories={PREDEFINED_CATEGORIES as any}
          value={category}
          onChange={setCategory}
          className="w-full"
        />
        <select
          className="h-11 rounded-2xl border border-border bg-white/70 px-4 text-sm shadow-sm dark:bg-white/5"
          value={expenseType}
          onChange={(e) => setExpenseType(e.target.value as ExpenseType)}
        >
          <option value="variable">Variable</option>
          <option value="fijo">Fijo</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={accept} disabled={isPending}>
          Aceptar
        </Button>
        <Button type="button" variant="outline" onClick={reject} disabled={isPending}>
          Ignorar
        </Button>
      </div>
    </div>
  );
}

export default SuggestionRow;
