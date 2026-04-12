import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { pushSubscriptionSchema } from '@/lib/validation';
import { encryptValue, hashValue } from '@/lib/server/secret-box';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonWithRequestId({ message: 'Invalid subscription' }, requestId, { status: 400 });
  }

  const endpointHash = hashValue(parsed.data.endpoint);

  await prisma.pushSubscription.upsert({
    where: {
      userId_endpointHash: {
        userId: session.user.id,
        endpointHash
      }
    },
    update: {
      endpoint: encryptValue(parsed.data.endpoint) ?? '',
      endpointHash,
      p256dh: encryptValue(parsed.data.keys.p256dh) ?? '',
      auth: encryptValue(parsed.data.keys.auth) ?? ''
    },
    create: {
      userId: session.user.id,
      endpoint: encryptValue(parsed.data.endpoint) ?? '',
      endpointHash,
      p256dh: encryptValue(parsed.data.keys.p256dh) ?? '',
      auth: encryptValue(parsed.data.keys.auth) ?? ''
    }
  });

  return jsonWithRequestId({ ok: true }, requestId);
}
