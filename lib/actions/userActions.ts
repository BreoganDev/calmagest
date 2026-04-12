'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function updateDefaultBudget(value: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.user.update({
    where: { id: session.user.id },
    data: { defaultBudget: value }
  });

  revalidatePath('/app/settings');
}

export async function updateDefaultIncome(value: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.user.update({
    where: { id: session.user.id },
    data: { defaultIncome: value }
  });

  revalidatePath('/app/settings');
}
