import { prisma } from '@/lib/prisma';

export type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
};

export const achievementDefinitions: AchievementDefinition[] = [
  {
    key: 'savings-target',
    title: 'Ahorro cumplido',
    description: 'Has alcanzado tu objetivo de ahorro del mes.'
  },
  {
    key: 'invest-target',
    title: 'Inversion cumplida',
    description: 'Has alcanzado tu objetivo de inversion del mes.'
  },
  {
    key: 'goal-complete',
    title: 'Objetivo logrado',
    description: 'Completaste un objetivo de ahorro.'
  },
  {
    key: 'positive-month',
    title: 'Mes en positivo',
    description: 'Estas cerrando el mes en positivo.'
  }
];

export async function unlockAchievement(userId: string, key: string, meta?: Record<string, unknown>) {
  await prisma.userAchievement.upsert({
    where: { userId_key: { userId, key } },
    update: {},
    create: {
      userId,
      key,
      meta: meta as any
    }
  });
}

export async function getUserAchievements(userId: string) {
  const unlocked = await prisma.userAchievement.findMany({ where: { userId } });
  const map = new Map(unlocked.map((u) => [u.key, u]));
  return achievementDefinitions.map((def) => ({
    ...def,
    unlockedAt: map.get(def.key)?.unlockedAt ?? null
  }));
}
