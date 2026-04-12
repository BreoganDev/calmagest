import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/password';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return jsonWithRequestId({ message: 'Datos invalidos.' }, requestId, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonWithRequestId({ message: 'Este email ya esta registrado.' }, requestId, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.user.create({
    data: {
      name: parsed.data.name || null,
      email,
      passwordHash,
      currency: parsed.data.currency,
      timezone: parsed.data.timezone
    }
  });

  return jsonWithRequestId({ ok: true }, requestId);
}
