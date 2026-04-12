'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function addClassificationRule(input: {
  pattern: string;
  category: string;
  isFixed: boolean;
  importance: 'VITAL' | 'NEUTRO' | 'SUPERFLUO';
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.classificationRule.create({
    data: {
      userId: session.user.id,
      pattern: input.pattern.toLowerCase().trim(),
      category: input.category,
      isFixed: input.isFixed,
      importance: input.importance
    }
  });

  revalidatePath('/app/settings');
}

export async function deleteClassificationRule(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.classificationRule.delete({
    where: { id, userId: session.user.id }
  });

  revalidatePath('/app/settings');
}
