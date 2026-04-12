'use server';

import { auth } from '@/auth';
import { markAllNotificationsRead, markNotificationRead } from '@/lib/services/notificationService';
import { revalidatePath } from 'next/cache';

export async function readNotification(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await markNotificationRead(session.user.id, id);
  revalidatePath('/app');
}

export async function readAllNotifications() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  await markAllNotificationsRead(session.user.id);
  revalidatePath('/app');
}
