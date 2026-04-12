'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/services/adminService';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/services/emailService';
import { sendPushToUser } from '@/lib/services/pushService';
import { upsertNotification } from '@/lib/services/notificationService';
import { hashPassword } from '@/lib/password';

export async function createUserAdmin(input: {
  email: string;
  password: string;
  name?: string;
}) {
  await requireAdmin();
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) throw new Error('Datos invalidos');
  const passwordHash = await hashPassword(input.password);
  await prisma.user.create({
    data: {
      email,
      name: input.name?.trim() || null,
      passwordHash
    }
  });
  revalidatePath('/app/admin');
}

export async function resetPasswordAdmin(input: { userId: string; password: string }) {
  await requireAdmin();
  const passwordHash = await hashPassword(input.password);
  await prisma.user.update({
    where: { id: input.userId },
    data: { passwordHash }
  });
}

export async function sendInAppAdmin(input: { userId: string; title: string; body: string }) {
  await requireAdmin();
  await upsertNotification({
    userId: input.userId,
    type: 'admin',
    severity: 'info',
    title: input.title,
    body: input.body,
    dedupeKey: `admin-${input.userId}-${Date.now()}`
  });
}

export async function sendPushAdmin(input: { userId: string; title: string; body: string; url?: string }) {
  await requireAdmin();
  await sendPushToUser(input.userId, {
    title: input.title,
    body: input.body,
    url: input.url ?? '/app'
  });
}

export async function sendEmailAdmin(input: { userId: string; subject: string; body: string }) {
  await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user?.email) throw new Error('User email missing');
  await sendEmail({
    to: user.email,
    subject: input.subject,
    text: input.body,
    html: `<p>${input.body}</p>`
  });
}
