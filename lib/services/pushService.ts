import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { decryptValue } from '@/lib/server/secret-box';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? '';

export function configureWebPush() {
  if (!vapidPublicKey || !vapidPrivateKey) return false;
  webpush.setVapidDetails('mailto:no-reply@calmaeco.local', vapidPublicKey, vapidPrivateKey);
  return true;
}

export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: Record<string, unknown>
) {
  if (!configureWebPush()) return { skipped: true };
  await webpush.sendNotification(subscription, JSON.stringify(payload));
  return { sent: true };
}

export async function sendPushToUser(userId: string, payload: Record<string, unknown>) {
  if (!configureWebPush()) return { skipped: true };
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return { skipped: true };

  const results = [];
  for (const sub of subs) {
    const endpoint = decryptValue(sub.endpoint);
    const p256dh = decryptValue(sub.p256dh);
    const auth = decryptValue(sub.auth);
    if (!endpoint || !p256dh || !auth) continue;

    const res = await sendPushNotification(
      { endpoint, keys: { p256dh, auth } },
      payload
    );
    results.push(res);
  }
  return { sent: true, results };
}
