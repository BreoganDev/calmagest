'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PREDEFINED_CATEGORIES } from '@/lib/catalogs/categories';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/app/page-header';
import { UiState } from '@/components/app/ui-state';
import { trackUxEvent } from '@/lib/client/ux-events';

interface BudgetEditClientProps {
  initialBudgets: Record<string, number>;
  yearMonth: string;
}

export function BudgetEditClient({ initialBudgets, yearMonth }: BudgetEditClientProps) {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Record<string, number>>(initialBudgets);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ tone: 'info' | 'error'; message: string } | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    trackUxEvent('form_submit_clicked', { form: 'category_budgets', ym: yearMonth });

    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgets, yearMonth })
      });

      if (response.ok) {
        router.push(`/app/fijos?ym=${encodeURIComponent(yearMonth)}`);
        router.refresh();
        return;
      }

      setStatus({ tone: 'error', message: 'No se pudieron guardar los presupuestos.' });
      trackUxEvent('ui_error_shown', { source: 'budget_edit_save_failed', ym: yearMonth });
    } catch {
      setStatus({ tone: 'error', message: 'Error de red al guardar presupuestos.' });
      trackUxEvent('ui_error_shown', { source: 'budget_edit_network_error', ym: yearMonth });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Edición"
        title="Editar presupuestos"
        monthLabel={yearMonth}
        subtitle="Define el presupuesto mensual para cada categoría."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/app/fijos?ym=${encodeURIComponent(yearMonth)}`}>
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </Button>
            <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      />

      {status && <UiState title={status.message} tone={status.tone} />}

      <div className="space-y-6">
        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Categorías vitales</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {PREDEFINED_CATEGORIES.filter((c) => c.importance === 'VITAL').map((category) => (
              <div key={category.name} className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
                </div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Presupuesto mensual (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(budgets[category.name] || 0) / 100}
                  onChange={(e) =>
                    setBudgets({
                      ...budgets,
                      [category.name]: Math.round(parseFloat(e.target.value || '0') * 100)
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Categorías neutras</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {PREDEFINED_CATEGORIES.filter((c) => c.importance === 'NEUTRO').map((category) => (
              <div key={category.name} className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
                </div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Presupuesto mensual (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(budgets[category.name] || 0) / 100}
                  onChange={(e) =>
                    setBudgets({
                      ...budgets,
                      [category.name]: Math.round(parseFloat(e.target.value || '0') * 100)
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Categorías superfluas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {PREDEFINED_CATEGORIES.filter((c) => c.importance === 'SUPERFLUO').map((category) => (
              <div key={category.name} className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
                </div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Presupuesto mensual (€)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(budgets[category.name] || 0) / 100}
                  onChange={(e) =>
                    setBudgets({
                      ...budgets,
                      [category.name]: Math.round(parseFloat(e.target.value || '0') * 100)
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
