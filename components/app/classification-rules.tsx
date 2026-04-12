'use client';

import { useState, useTransition } from 'react';
import type { ClassificationRule } from '@prisma/client';
import { addClassificationRule, deleteClassificationRule } from '@/lib/actions/classificationActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const importanceOptions: Array<ClassificationRule['importance']> = ['VITAL', 'NEUTRO', 'SUPERFLUO'];

export function ClassificationRules({ rules }: { rules: ClassificationRule[] }) {
  const [isPending, startTransition] = useTransition();
  const [pattern, setPattern] = useState('');
  const [category, setCategory] = useState('Alimentacion');
  const [isFixed, setIsFixed] = useState(true);
  const [importance, setImportance] = useState<ClassificationRule['importance']>('NEUTRO');

  const save = () => {
    if (!pattern.trim()) return;
    startTransition(async () => {
      await addClassificationRule({
        pattern,
        category,
        isFixed,
        importance
      });
      setPattern('');
    });
  };

  const removeRule = (id: string) => {
    startTransition(async () => {
      await deleteClassificationRule(id);
    });
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="pattern">Texto o palabra clave</Label>
          <Input
            id="pattern"
            placeholder="Ej: hiperdino, uber, seguro"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            placeholder="Ej: Alimentacion"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            className="h-10 rounded-2xl border border-border bg-background px-3 text-sm"
            value={isFixed ? 'fixed' : 'variable'}
            onChange={(e) => setIsFixed(e.target.value === 'fixed')}
          >
            <option value="fixed">Fijo</option>
            <option value="variable">Variable</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="importance">Importancia</Label>
          <select
            id="importance"
            className="h-10 rounded-2xl border border-border bg-background px-3 text-sm"
            value={importance}
            onChange={(e) => setImportance(e.target.value as ClassificationRule['importance'])}
          >
            {importanceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="outline" onClick={save} disabled={isPending || !pattern.trim()}>
          Guardar regla
        </Button>
        <p className="text-xs text-muted-foreground">
          Se aplica primero tu regla y despues las reglas base. Usa palabras clave cortas.
        </p>
      </div>

      <div className="grid gap-2">
        {rules.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Aun no tienes reglas personalizadas.
          </div>
        )}
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
          >
            <div className="text-sm">
              <div className="font-medium">{rule.pattern}</div>
              <div className="text-xs text-muted-foreground">
                {rule.category} · {rule.isFixed ? 'Fijo' : 'Variable'} · {rule.importance}
              </div>
            </div>
            <Button type="button" variant="ghost" onClick={() => removeRule(rule.id)} disabled={isPending}>
              Eliminar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
