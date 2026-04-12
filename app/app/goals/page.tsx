import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/services/moneyService';
import { calcGoalProgress, calcMonthlySuggestion } from '@/lib/services/goalService';
import { Money } from '@/components/ui/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalForm } from '@/components/app/goal-form';
import { GoalContributionForm } from '@/components/app/goal-contribution-form';
import { GoalDrawer } from '@/components/app/goal-drawer';
import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/app/ui-state';

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { currency: true }
  });

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    include: { contributions: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="grid gap-6">
      <div>
        <PageHeader
          eyebrow="Objetivos"
          title="Ahorro con intención"
          subtitle="Tus metas se alimentan del ahorro y del carry over."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle>Mis objetivos</CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <EmptyState title="Aún no tienes objetivos." body="Crea tu primer objetivo para empezar a medir progreso." />
            ) : (
              <div className="grid gap-4">
                {goals.map((goal) => {
                  const progress = calcGoalProgress(goal, goal.contributions);
                  const monthly = calcMonthlySuggestion(goal, progress.total);
                  return (
                    <div key={goal.id} className="rounded-2xl border border-border bg-card/80 p-4 shadow-soft">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{goal.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Objetivo: <Money amount={goal.targetAmount} currency={user?.currency} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold">{progress.percent}%</div>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-rd-ui">
                        <div
                          className="h-2 rounded-full bg-rd-rose"
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Acumulado: <Money amount={progress.total} currency={user?.currency} /> · Restante:{' '}
                        <Money amount={progress.remaining} currency={user?.currency} />
                      </div>
                      {monthly && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Sugerido/mes: <Money amount={monthly} currency={user?.currency} />
                        </div>
                      )}
                      <div className="mt-3">
                        <GoalContributionForm goalId={goal.id} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="hidden md:block animate-rise">
          <CardHeader>
            <CardTitle>Nuevo objetivo</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalForm />
          </CardContent>
        </Card>
      </div>

      <GoalDrawer />
    </div>
  );
}
