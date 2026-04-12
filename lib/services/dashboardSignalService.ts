import { getDashboardData } from '@/lib/services/dashboardService';
import { unlockAchievement } from '@/lib/services/achievementService';
import { upsertNotification } from '@/lib/services/notificationService';
import { sendPushToUser } from '@/lib/services/pushService';
import { formatMoney } from '@/lib/services/moneyService';
import { prisma } from '@/lib/prisma';

export async function refreshDashboardSignals(userId: string) {
  const data = await getDashboardData(userId);

  const preferences = await prisma.notificationPreference.findMany({
    where: { userId }
  });

  const prefMap = new Map(preferences.map((p) => [`${p.type}:${p.channel}`, p.enabled]));
  const isChannelEnabled = (type: string, channel: string) => {
    if (channel === 'in_app') return true;
    return prefMap.get(`${type}:${channel}`) ?? false;
  };

  if (data.alertLevel !== 'ok') {
    const dedupeKey = `health-${data.alertLevel}-${data.month.yearMonth}`;
    const existing = await prisma.notification.findUnique({
      where: { userId_dedupeKey: { userId, dedupeKey } }
    });

    await upsertNotification({
      userId,
      type: 'health',
      severity: data.alertLevel === 'critico' ? 'critical' : 'warning',
      title: data.alertTitle,
      body: data.alertMessage,
      dedupeKey,
      data: { remaining: data.remainingAdjusted, daysLeft: data.daysLeft }
    });

    if (!existing && data.alertLevel === 'critico' && isChannelEnabled('health', 'push')) {
      await sendPushToUser(userId, {
        title: 'Alerta máxima',
        body: data.alertMessage,
        url: '/app'
      });
    }
  }

  const milestone50 = data.healthPercent >= 50 && data.healthPercent < 75;
  const milestone25 = data.healthPercent >= 75;
  const milestoneTone =
    data.dayOfMonth <= 5 ? 'temprano' : data.dayOfMonth <= 15 ? 'medio' : 'tarde';

  if (milestone50) {
    const body =
      milestoneTone === 'temprano'
        ? 'Has usado el 50% muy pronto. Ajusta variables esta semana.'
        : milestoneTone === 'medio'
          ? '50% usado. Buen momento para revisar variables.'
          : '50% usado. Mantente en modo ligero para cerrar bien.';
    await upsertNotification({
      userId,
      type: 'health',
      severity: 'warning',
      title: 'Mitad del presupuesto',
      body,
      dedupeKey: `health-50-${data.month.yearMonth}`,
      data: { dayOfMonth: data.dayOfMonth, healthPercent: data.healthPercent }
    });
  }

  if (milestone25) {
    const body =
      milestoneTone === 'temprano'
        ? 'Ya queda 25%. Riesgo alto si no ajustas hoy.'
        : milestoneTone === 'medio'
          ? 'Queda 25%. Ajusta variables para llegar con calma.'
          : 'Queda 25%. Si mantienes el ritmo, llegas justo.';
    const dedupeKey = `health-25-${data.month.yearMonth}`;
    const existing = await prisma.notification.findUnique({
      where: { userId_dedupeKey: { userId, dedupeKey } }
    });

    await upsertNotification({
      userId,
      type: 'health',
      severity: 'critical',
      title: 'Solo queda el 25%',
      body,
      dedupeKey,
      data: { dayOfMonth: data.dayOfMonth, healthPercent: data.healthPercent }
    });

    if (!existing && isChannelEnabled('health', 'push')) {
      await sendPushToUser(userId, {
        title: 'Solo queda el 25%',
        body,
        url: '/app'
      });
    }
  }

  if (data.needsSavings) {
    await upsertNotification({
      userId,
      type: 'savings',
      severity: 'warning',
      title: 'Ahorro pendiente',
      body: `Te faltan ${formatMoney(data.savingsTarget - data.savingsActual, data.currency)} para tu ahorro del mes.`,
      dedupeKey: `savings-miss-${data.month.yearMonth}`
    });
  } else if (data.savingsTarget > 0) {
    await upsertNotification({
      userId,
      type: 'savings',
      severity: 'info',
      title: 'Ahorro cumplido',
      body: 'Has alcanzado tu objetivo de ahorro del mes.',
      dedupeKey: `savings-ok-${data.month.yearMonth}`
    });
  }

  if (data.needsInvest) {
    await upsertNotification({
      userId,
      type: 'investment',
      severity: 'warning',
      title: 'Inversión pendiente',
      body: `Te faltan ${formatMoney(data.investTarget - data.investActual, data.currency)} para tu inversión del mes.`,
      dedupeKey: `invest-miss-${data.month.yearMonth}`
    });
  } else if (data.investTarget > 0) {
    await upsertNotification({
      userId,
      type: 'investment',
      severity: 'info',
      title: 'Inversión cumplida',
      body: 'Has alcanzado tu objetivo de inversión del mes.',
      dedupeKey: `invest-ok-${data.month.yearMonth}`
    });
  }

  if (data.unassignedFixedCount > 0) {
    await upsertNotification({
      userId,
      type: 'fixed',
      severity: 'warning',
      title: 'Fijos sin asignar',
      body: `Tienes ${data.unassignedFixedCount} gasto(s) fijo(s) sin presupuesto por categoría.`,
      dedupeKey: `fixed-unassigned-${data.month.yearMonth}`,
      data: { count: data.unassignedFixedCount }
    });
  }

  const nearEnd = data.dayOfMonth >= Math.ceil(data.daysInMonth * 0.7);
  if (nearEnd && data.projectedRemaining >= 0) {
    await unlockAchievement(userId, 'positive-month', { projectedRemaining: data.projectedRemaining });
  }
  if (data.savingsTarget > 0 && !data.needsSavings) {
    await unlockAchievement(userId, 'savings-target');
  }
  if (data.investTarget > 0 && !data.needsInvest) {
    await unlockAchievement(userId, 'invest-target');
  }
  if (data.hasGoalComplete) {
    await unlockAchievement(userId, 'goal-complete');
  }
}
