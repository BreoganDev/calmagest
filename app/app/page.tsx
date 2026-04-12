import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getDashboardData } from '@/lib/services/dashboardService';
import { AchievementCelebration } from '@/components/app/achievement-celebration';
import { HeroBalanceCard } from '@/components/app/dashboard/hero-balance-card';
import { QuickActionBar } from '@/components/app/dashboard/quick-action-bar';
import { CoachWidget } from '@/components/app/dashboard/coach-widget';
import { CategoryDonutChart } from '@/components/app/dashboard/category-donut-chart';
import { RecentActivityList } from '@/components/app/dashboard/recent-activity-list';

export const dynamic = 'force-dynamic';

export default async function AppHome({
  searchParams
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const params = await searchParams;
  const data = await getDashboardData(session.user.id, params.ym);
  const {
    hasRecentUnlock,
    balance,
    income,
    expenses,
    donutData,
    recentExpenses,
    monthLabel,
    savingsActual,
    investActual
  } = data;

  const changePercent = balance > 0 ? 5.2 : -2.1;

  return (
    <div className="grid w-full gap-4 sm:gap-6">
      <AchievementCelebration active={hasRecentUnlock} />

      <div className="grid w-full gap-4 sm:gap-6 lg:grid-cols-12 min-w-0">
        {/* Hero Balance Card */}
        <div className="order-1 w-full lg:order-none lg:col-span-7 min-w-0">
          <HeroBalanceCard
            balance={balance}
            income={income}
            expenses={expenses}
            savings={savingsActual}
            investment={investActual}
            changePercent={changePercent}
            monthLabel={monthLabel}
          />
        </div>

        {/* Quick Actions */}
        <div className="order-2 w-full lg:order-none lg:col-span-5 min-w-0">
          <h2 className="mb-3 sm:mb-4 text-sm font-semibold text-slate-600">Acciones rápidas</h2>
          <QuickActionBar />
        </div>

        {/* Coach IA */}
        <div className="order-3 w-full lg:order-none lg:col-span-12 min-w-0">
          <CoachWidget data={data} />
        </div>

        {/* Charts and Activity */}
        <div className="order-4 w-full lg:order-none lg:col-span-7 min-w-0">
          <CategoryDonutChart
            data={donutData.map((item) => ({
              name: item.name,
              value: item.value
            }))}
          />
        </div>

        <div className="order-5 w-full lg:order-none lg:col-span-5 min-w-0">
          <RecentActivityList
            yearMonth={data.month.yearMonth}
            transactions={recentExpenses.map((exp) => ({
              id: exp.id,
              name: exp.name,
              amount: exp.amount,
              category: exp.category,
              date: exp.date
            }))}
          />
        </div>
      </div>
    </div>
  );
}
