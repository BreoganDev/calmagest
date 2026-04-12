import { prisma } from '@/lib/prisma';

type NotificationInput = {
  userId: string;
  type: string;
  severity?: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  dedupeKey: string;
  data?: Record<string, unknown>;
};

export async function upsertNotification(input: NotificationInput) {
  return prisma.notification.upsert({
    where: {
      userId_dedupeKey: {
        userId: input.userId,
        dedupeKey: input.dedupeKey
      }
    },
    update: {
      severity: input.severity ?? 'info',
      title: input.title,
      body: input.body,
      data: input.data as any
    },
    create: {
      userId: input.userId,
      type: input.type,
      severity: input.severity ?? 'info',
      title: input.title,
      body: input.body,
      dedupeKey: input.dedupeKey,
      data: input.data as any
    }
  });
}

export async function markNotificationRead(userId: string, id: string) {
  return prisma.notification.update({
    where: { id, userId },
    data: { readAt: new Date() }
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() }
  });
}
