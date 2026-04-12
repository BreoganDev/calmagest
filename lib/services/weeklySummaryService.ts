import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/services/moneyService';
import { getMonthDateRange } from '@/lib/services/monthService';
import { calcMonthTotals } from '@/lib/services/calcService';

export async function buildWeeklySummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, timezone: true, currency: true }
  });
  if (!user?.email) throw new Error('User email missing');

  const now = new Date(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: user.timezone ?? 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date())
  );

  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = await prisma.month.findUnique({
    where: { userId_yearMonth: { userId, yearMonth } }
  });
  if (!month) {
    return {
      to: user.email,
      subject: 'Resumen semanal en Calma Eco',
      text: 'Aun no tienes datos este mes.',
      html: '<p>Aun no tienes datos este mes.</p>'
    };
  }

  const { start, end } = getMonthDateRange(month.yearMonth);
  const [fixed, expenses, savingsTx, investTx, goals] = await Promise.all([
    prisma.monthFixedExpense.findMany({ where: { monthId: month.id } }),
    prisma.expense.findMany({ where: { monthId: month.id } }),
    prisma.savingsTransaction.findMany({ where: { userId, date: { gte: start, lt: end } } }),
    prisma.investmentContribution.findMany({ where: { userId, date: { gte: start, lt: end } } }),
    prisma.goal.findMany({ where: { userId } })
  ]);
  const totals = calcMonthTotals(month, fixed, expenses);

  const savingsDeposits = savingsTx.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const investDeposits = investTx.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);

  const base = month.budget + month.carryOver;
  const remaining = base - totals.spent - savingsDeposits - investDeposits;
  const remainingText = formatMoney(remaining, user.currency ?? 'EUR');

  const goalContribs = goals.length
    ? await prisma.goalContribution.groupBy({
        by: ['goalId'],
        where: { goalId: { in: goals.map((g) => g.id) } },
        _sum: { amount: true }
      })
    : [];
  const goalMap = new Map(goalContribs.map((g) => [g.goalId, g._sum.amount ?? 0]));

  const goalLines = goals
    .slice(0, 3)
    .map((g) => {
      const progress = Math.min(100, Math.round(((goalMap.get(g.id) ?? 0) / g.targetAmount) * 100));
      return `- ${g.name}: ${progress}%`;
    })
    .join('\n');

  const text = `Resumen semanal\n\nRestante estimado: ${remainingText}\nGastado: ${formatMoney(totals.spent, user.currency ?? 'EUR')}\nAhorro aportado: ${formatMoney(savingsDeposits, user.currency ?? 'EUR')}\nInversion aportada: ${formatMoney(investDeposits, user.currency ?? 'EUR')}\n\nObjetivos:\n${goalLines || '- Sin objetivos activos'}\n`;

  const html = `<h2>Resumen semanal</h2>
<p>Restante estimado: <strong>${remainingText}</strong></p>
<p>Gastado: ${formatMoney(totals.spent, user.currency ?? 'EUR')}</p>
<p>Ahorro aportado: ${formatMoney(savingsDeposits, user.currency ?? 'EUR')}</p>
<p>Inversion aportada: ${formatMoney(investDeposits, user.currency ?? 'EUR')}</p>
<h3>Objetivos</h3>
<ul>${goalLines ? goalLines.split('\n').map((line) => `<li>${line.replace('- ', '')}</li>`).join('') : '<li>Sin objetivos activos</li>'}</ul>`;

  return {
    to: user.email,
    subject: 'Resumen semanal en Calma Eco',
    text,
    html
  };
}
