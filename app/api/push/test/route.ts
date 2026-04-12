import { auth } from '@/auth';
import { sendPushToUser } from '@/lib/services/pushService';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
    }

    const payload = {
      title: 'Calma Gest',
      body: 'Esto es una notificacion de prueba.',
      url: '/app'
    };

    const result = await sendPushToUser(session.user.id, payload);
    if ('skipped' in result) {
      return jsonWithRequestId({ message: 'No subscriptions' }, requestId, { status: 400 });
    }

    return jsonWithRequestId({ ok: true, results: result.results }, requestId);
  } catch (err) {
    return jsonWithRequestId(
      { ok: false, message: 'Push test failed', error: err instanceof Error ? err.message : String(err) },
      requestId,
      { status: 500 }
    );
  }
}
