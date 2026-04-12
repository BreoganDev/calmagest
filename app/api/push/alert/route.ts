import { auth } from '@/auth';
import { sendPushToUser } from '@/lib/services/pushService';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const payload = {
    title: body?.title ?? 'Calma Gest',
    body: body?.body ?? 'Alerta importante en tu economia.',
    url: body?.url ?? '/app'
  };

  const result = await sendPushToUser(session.user.id, payload);
  return jsonWithRequestId({ ok: true, result }, requestId);
}
