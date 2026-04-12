import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { createAuthLink, generateState, truelayerConfig } from '@/lib/services/truelayerService';
import { getRequestId, jsonWithRequestId } from '@/lib/server/request-context';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const session = await auth();
  if (!session?.user?.id) {
    return jsonWithRequestId({ message: 'Unauthorized' }, requestId, { status: 401 });
  }

  if (!truelayerConfig.clientId || !truelayerConfig.clientSecret || !truelayerConfig.redirectUri) {
    return jsonWithRequestId(
      {
        message: 'TrueLayer config missing',
        details: {
          clientId: Boolean(truelayerConfig.clientId),
          clientSecret: Boolean(truelayerConfig.clientSecret),
          redirectUri: Boolean(truelayerConfig.redirectUri)
        }
      },
      requestId,
      { status: 500 }
    );
  }

  const state = generateState();
  await prisma.bankConnection.create({
    data: {
      userId: session.user.id,
      provider: 'truelayer',
      status: 'pending',
      state
    }
  });

  try {
    const authUri = await createAuthLink(state);
    const response = NextResponse.redirect(authUri);
    response.headers.set('x-request-id', requestId);
    return response;
  } catch (err) {
    return jsonWithRequestId(
      {
        message: 'Failed to create auth link',
        error: err instanceof Error ? err.message : String(err)
      },
      requestId,
      { status: 500 }
    );
  }
}
