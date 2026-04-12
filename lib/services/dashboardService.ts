import { prisma } from '@/lib/prisma';
import { getOrCreateMonthByYearMonth } from '@/lib/queries/monthQueries';
import { calcMonthTotals } from '@/lib/services/calcService';
import { formatMoney } from '@/lib/services/moneyService';
import { formatYearMonthLabel, getMonthDateRange } from '@/lib/services/monthService';
import { normalizeCategory } from '@/lib/services/textService';
import { getUserAchievements } from '@/lib/services/achievementService';
import { generateCoachInsights } from './coachService';

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData(userId: string, yearMonthInput?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true, timezone: true }
  });

  const rule = await prisma.savingsRule.findUnique({
    where: { userId }
  });

  const savingsPct = rule?.savingsPct ?? 10;
  const investPct = rule?.investPct ?? 10;
  const currency = user?.currency ?? 'EUR';
  const timezone = user?.timezone ?? 'Europe/Madrid';

  const month = await getOrCreateMonthByYearMonth(userId, timezone, yearMonthInput);

  const [fixed, expenses, fixedBudgets, fixedExpenses] = await Promise.all([
    prisma.monthFixedExpense.findMany({ where: { monthId: month.id } }),
    prisma.expense.findMany({ where: { monthId: month.id } }),
    prisma.fixedBudget.findMany({ where: { userId, active: true } }),
    prisma.fixedExpense.findMany({ where: { userId, active: true } })
  ]);

  const { start, end } = getMonthDateRange(month.yearMonth);
  const now = new Date(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date())
  );

  const monthStart = new Date(start);
  const monthEnd = new Date(end);
  const daysInMonth = Math.round((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
  const dayOfMonth = Math.max(1, Math.min(daysInMonth, now.getDate()));
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth + 1);

  const [savingsTx, investTx, goalContribs] = await Promise.all([
    prisma.savingsTransaction.findMany({
      where: { userId, date: { gte: start, lt: end } }
    }),
    prisma.investmentContribution.findMany({
      where: { userId, date: { gte: start, lt: end } }
    }),
    prisma.goalContribution.findMany({
      where: { date: { gte: start, lt: end }, goal: { userId } }
    })
  ]);

  const threeMonthsAgo = new Date(monthStart);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const historyExpenses = await prisma.expense.findMany({
    where: {
      userId,
      date: { gte: threeMonthsAgo, lt: monthStart }
    }
  });

  const coachInsights = generateCoachInsights({
    currentExpenses: expenses,
    currentMonth: month,
    historyExpenses,
    currency
  });

  const totals = calcMonthTotals(month, fixed, expenses);
  const base = Math.max(month.income, month.budget) + month.carryOver;
  const targetBase = month.income > 0 ? month.income : month.budget;

  const savingsDeposits = savingsTx.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const savingsWithdrawals = savingsTx
    .filter((t) => t.amount < 0)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  const investDeposits = investTx.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);

  const goalDepositsAvailable = goalContribs
    .filter((g) => g.amount > 0 && g.source === 'available')
    .reduce((acc, g) => acc + g.amount, 0);
  const goalWithdrawals = goalContribs
    .filter((g) => g.amount < 0)
    .reduce((acc, g) => acc + Math.abs(g.amount), 0);

  const remainingAdjusted =
    base -
    totals.spent -
    savingsDeposits -
    investDeposits -
    goalDepositsAvailable +
    savingsWithdrawals +
    goalWithdrawals;

  const savingsTarget = Math.round((targetBase * savingsPct) / 100);
  const investTarget = Math.round((targetBase * investPct) / 100);
  const savingsActual = savingsDeposits + goalDepositsAvailable;
  const investActual = investDeposits;
  const needsSavings = savingsActual < savingsTarget;
  const needsInvest = investActual < investTarget;

  const idealDaily = daysInMonth > 0 ? base / daysInMonth : 0;
  const remainingDaily = remainingAdjusted / daysLeft;
  const usedSoFar = Math.max(0, base - remainingAdjusted);
  const avgDailyUse = dayOfMonth > 0 ? usedSoFar / dayOfMonth : 0;

  const confidenceFactor = dayOfMonth < 5 ? 0.35 : dayOfMonth < 10 ? 0.55 : 0.75;
  const maxMultiplier = dayOfMonth < 7 ? 1.3 : dayOfMonth < 14 ? 1.5 : 1.8;
  const cappedDaily = Math.min(avgDailyUse, idealDaily * maxMultiplier);
  const blendedDaily = cappedDaily * confidenceFactor + idealDaily * (1 - confidenceFactor);
  const projectedRemaining = base - blendedDaily * daysInMonth;
  const healthPercent = base > 0 ? Math.min(100, Math.max(0, Math.round(((base - remainingAdjusted) / base) * 100))) : 0;
  const healthDisplayPercent = base > 0
    ? Math.min(100, Math.max(0, Math.round((remainingAdjusted / base) * 100)))
    : 0;
  const spentPercent = base > 0 ? Math.min(100, Math.max(0, Math.round((usedSoFar / base) * 100))) : 0;
  const remainingDailySafe = remainingAdjusted > 0 ? Math.round(remainingAdjusted / daysLeft) : 0;

  const isCritical = remainingAdjusted < 0 || remainingDaily < idealDaily * 0.5;
  const isWarning = remainingDaily < idealDaily * 0.75 || healthPercent > 80;
  const alertLevel = isCritical ? 'critico' : isWarning ? 'alerta' : 'ok';

  const alertTitle =
    alertLevel === 'critico'
      ? 'Alerta máxima'
      : alertLevel === 'alerta'
        ? 'Alerta de ritmo'
        : 'Ritmo estable';

  const alertMessage =
    alertLevel === 'critico'
      ? `Con ${formatMoney(remainingAdjusted, currency)} para ${daysLeft} días, no llegas a fin de mes.`
      : alertLevel === 'alerta'
        ? `Vas justo: quedan ${formatMoney(remainingAdjusted, currency)} para ${daysLeft} días.`
        : `Vas en linea: quedan ${formatMoney(remainingAdjusted, currency)} para ${daysLeft} días.`;

  const budgetKeys = new Set(fixedBudgets.map((b) => normalizeCategory(b.category)));
  const unassignedFixedCount = fixedExpenses.filter(
    (item) => !budgetKeys.has(normalizeCategory(item.category))
  ).length;

  const goals = await prisma.goal.findMany({
    where: { userId }
  });

  const goalTotals = goals.length
    ? await prisma.goalContribution.groupBy({
      by: ['goalId'],
      where: { goalId: { in: goals.map((g) => g.id) } },
      _sum: { amount: true }
    })
    : [];
  const goalTotalsMap = new Map(goalTotals.map((g) => [g.goalId, g._sum.amount ?? 0]));
  const hasGoalComplete = goals.some((g) => (goalTotalsMap.get(g.id) ?? 0) >= g.targetAmount);

  const achievements = await getUserAchievements(userId);
  const hasRecentUnlock = achievements.some((item) => {
    if (!item.unlockedAt) return false;
    const ts =
      typeof item.unlockedAt === 'string'
        ? Date.parse(item.unlockedAt)
        : item.unlockedAt.getTime();
    return Date.now() - ts < 1000 * 60 * 60 * 24;
  });

  const statusMessage =
    alertLevel === 'critico'
      ? `Ahora toca cuidar el ritmo. Quedan ${formatMoney(remainingAdjusted, currency)} para ${daysLeft} días.`
      : alertLevel === 'alerta'
        ? `Vamos justos, pero podemos ajustar. Quedan ${formatMoney(remainingAdjusted, currency)}.`
        : `Vas en linea. Te quedan ${formatMoney(remainingAdjusted, currency)} para este mes.`;

  const categoryMap = new Map<string, { label: string; amount: number }>();

  expenses.forEach((item) => {
    const label = item.category?.trim() || 'Sin categoria';
    const key = normalizeCategory(label);
    const current = categoryMap.get(key) ?? { label, amount: 0 };
    categoryMap.set(key, { label: current.label, amount: current.amount + item.amount });
  });

  fixed.filter((f) => f.active).forEach((item) => {
    const label = item.category?.trim() || 'Fijos';
    const key = normalizeCategory(label);
    const current = categoryMap.get(key) ?? { label, amount: 0 };
    categoryMap.set(key, { label: current.label, amount: current.amount + item.amount });
  });

  const categoryTotals = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);

  const rawDailyAdjustment =
    projectedRemaining < 0 ? Math.ceil(Math.abs(projectedRemaining) / Math.max(daysLeft, 1)) : 0;
  const dailyAdjustment = Math.min(rawDailyAdjustment, Math.ceil(idealDaily * 0.6));
  const adjustmentIsExtreme = dailyAdjustment > base / 5;
  const insightMessage = adjustmentIsExtreme
    ? 'El ritmo actual es muy alto. Prioriza variables esta semana y revisa objetivos.'
    : dailyAdjustment > 0
      ? `Si reduces ${formatMoney(dailyAdjustment, currency)} diarios, recuperas ${formatMoney(dailyAdjustment * daysLeft, currency)} este mes.`
      : 'Si mantienes el ritmo actual, cierras en positivo.';

  const activeGoal = goals[0];
  const activeGoalProgress = activeGoal ? Math.max(0, goalTotalsMap.get(activeGoal.id) ?? 0) : 0;
  const activeGoalPct = activeGoal
    ? Math.min(100, Math.round((activeGoalProgress / activeGoal.targetAmount) * 100))
    : 0;

  const savingsRate = targetBase > 0 ? Math.round((savingsActual / targetBase) * 100) : 0;
  const investRate = targetBase > 0 ? Math.round((investActual / targetBase) * 100) : 0;
  const spendRate = base > 0 ? Math.round((totals.spent / base) * 100) : 0;
  const runwayDays = avgDailyUse > 0 ? Math.max(0, Math.floor(remainingAdjusted / avgDailyUse)) : daysLeft;
  const netFlow = month.income - totals.spent - savingsActual - investActual;

  const donutData = categoryTotals.map((item) => ({
    name: item.label,
    value: item.amount
  }));

  const historyMonths = await prisma.month.findMany({
    where: { userId },
    orderBy: { yearMonth: 'desc' },
    take: 6
  });

  const historyDataRaw = await Promise.all(
    historyMonths.map(async (historyMonth) => {
      const [fx, ex] = await Promise.all([
        prisma.monthFixedExpense.findMany({ where: { monthId: historyMonth.id } }),
        prisma.expense.findMany({ where: { monthId: historyMonth.id } })
      ]);
      const totalsLocal = calcMonthTotals(historyMonth, fx, ex);
      return {
        label: formatYearMonthLabel(historyMonth.yearMonth).slice(0, 3),
        budget: historyMonth.budget,
        spent: totalsLocal.spent,
        diff: historyMonth.budget + historyMonth.carryOver - totalsLocal.spent
      };
    })
  );
  const historyData = historyDataRaw.reverse();

  const toKey = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);

  const expenseMap = new Map<string, number>();
  expenses.forEach((item) => {
    const key = toKey(new Date(item.date));
    expenseMap.set(key, (expenseMap.get(key) ?? 0) + item.amount);
  });

  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - idx));
    const key = toKey(date);
    const label = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(date);
    return { label, value: expenseMap.get(key) ?? 0 };
  });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  const userRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });

  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .map((expense) => ({
      id: expense.id,
      name: expense.name,
      amount: expense.amount,
      category: expense.category || 'Variable',
      date: expense.date.toISOString()
    }));

  const coachInsight = coachInsights.length > 0 ? coachInsights[0] : 'Todo va bien este mes.';

  return {
    month,
    currency,
    daysLeft,
    daysInMonth,
    dayOfMonth,
    totals,
    base,
    targetBase,
    targetBaseLabel: month.income > 0 ? 'ingresos' : 'presupuesto',
    remainingAdjusted,
    balance: remainingAdjusted,
    income: month.income,
    expenses: totals.spent,
    savingsTarget,
    savingsActual,
    investTarget,
    investActual,
    needsSavings,
    needsInvest,
    savingsRate,
    investRate,
    spendRate,
    netFlow,
    runwayDays,
    alertLevel,
    alertTitle,
    alertMessage,
    statusMessage,
    healthPercent,
    healthDisplayPercent,
    spentPercent,
    idealDaily,
    avgDailyUse,
    remainingDailySafe,
    projectedRemaining,
    hasGoalComplete,
    unassignedFixedCount,
    dailyAdjustment,
    insightMessage,
    hasRecentUnlock,
    activeGoal,
    activeGoalProgress,
    activeGoalPct,
    donutData,
    historyData,
    last7Days,
    coachInsights,
    coachInsight,
    monthLabel: formatYearMonthLabel(month.yearMonth),
    userName: userRecord?.name || null,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      severity: notification.severity,
      type: notification.type,
      readAt: notification.readAt ? notification.readAt.toISOString() : null,
      createdAt: notification.createdAt.toISOString()
    })),
    unreadCount,
    recentExpenses
  };
}
