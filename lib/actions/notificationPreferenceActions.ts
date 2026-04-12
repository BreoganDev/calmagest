'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function upsertNotificationPreference(input: {
  type: string;
  channel: string;
  enabled: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.notificationPreference.upsert({
    where: {
      userId_type_channel: {
        userId: session.user.id,
        type: input.type,
        channel: input.channel
      }
    },
    update: { enabled: input.enabled },
    create: {
      userId: session.user.id,
      type: input.type,
      channel: input.channel,
      enabled: input.enabled
    }
  });

  revalidatePath('/app/settings');
}
