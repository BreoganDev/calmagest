import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackupActions } from '@/components/app/backup-actions';
import { DefaultBudgetForm } from '@/components/app/default-budget-form';
import { DefaultIncomeForm } from '@/components/app/default-income-form';
import { NormalizeAmounts } from '@/components/app/normalize-amounts';
import { SavingsRuleForm } from '@/components/app/savings-rule-form';
import { ClassificationRules } from '@/components/app/classification-rules';
import { NotificationPreferences } from '@/components/app/notification-preferences';
import { PushSettings } from '@/components/app/push-settings';
import { PageHeader } from '@/components/app/page-header';
import { UiState } from '@/components/app/ui-state';

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ bank?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const params = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultBudget: true, defaultIncome: true }
  });

  const connection = await prisma.bankConnection.findFirst({
    where: { userId: session.user.id, provider: 'truelayer' }
  });

  const rule = await prisma.savingsRule.findUnique({
    where: { userId: session.user.id }
  });

  const rules = await prisma.classificationRule.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  const preferences = await prisma.notificationPreference.findMany({
    where: { userId: session.user.id }
  });
  const pushKey = process.env.VAPID_PUBLIC_KEY ?? '';

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Configuración" title="Ajustes" subtitle="Preferencias, reglas y conexiones del sistema." />

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Reglas de ahorro e inversión</CardTitle>
        </CardHeader>
        <CardContent>
          <SavingsRuleForm savingsPct={rule?.savingsPct ?? 10} investPct={rule?.investPct ?? 10} />
        </CardContent>
      </Card>

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Presupuesto por defecto</CardTitle>
        </CardHeader>
        <CardContent>
          <DefaultBudgetForm value={user?.defaultBudget ?? 0} />
        </CardContent>
      </Card>

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Ingreso por defecto</CardTitle>
        </CardHeader>
        <CardContent>
          <DefaultIncomeForm value={user?.defaultIncome ?? 0} />
        </CardContent>
      </Card>

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Banco (solo lectura)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="text-sm text-muted-foreground">
              Conecta TrueLayer en modo sandbox para ver movimientos.
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href="/api/bank/truelayer/link"
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-rd-rose px-4 py-2 text-sm font-medium text-rd-text"
              >
                {connection?.status === 'active' ? 'Reconectar banco' : 'Conectar banco'}
              </a>
              {connection?.status === 'active' && (
                <a
                  href="/api/bank/truelayer/sync"
                  className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-4 py-2 text-sm"
                >
                  Sincronizar movimientos
                </a>
              )}
            </div>
            {params.bank === 'connected' && (
              <UiState title="Banco conectado." tone="info" />
            )}
            {params.bank === 'error' && (
              <UiState title="No se pudo conectar el banco." tone="error" />
            )}
            {connection?.status && (
              <div className="text-xs text-muted-foreground">Estado: {connection.status}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Normalizar importes</CardTitle>
        </CardHeader>
        <CardContent>
          <NormalizeAmounts />
        </CardContent>
      </Card>

      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Backups y exportaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <BackupActions />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reglas de clasificación</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassificationRules rules={rules} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPreferences items={preferences} />
          <div className="mt-4">
            <PushSettings publicKey={pushKey} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
