import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCode } from '@/lib/services/truelayerService';
import { encryptValue } from '@/lib/server/secret-box';
import { getRequestId } from '@/lib/server/request-context';

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    const response = NextResponse.redirect(new URL('/app/settings?bank=error', request.url));
    response.headers.set('x-request-id', requestId);
    return response;
  }

  const connection = await prisma.bankConnection.findFirst({
    where: { state, provider: 'truelayer' }
  });

  if (!connection) {
    const response = NextResponse.redirect(new URL('/app/settings?bank=error', request.url));
    response.headers.set('x-request-id', requestId);
    return response;
  }

  try {
    const token = await exchangeCode(code);
    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000)
      : undefined;

    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        status: 'active',
        accessToken: encryptValue(token.access_token),
        refreshToken: encryptValue(token.refresh_token),
        scope: token.scope,
        expiresAt
      }
    });

    const response = NextResponse.redirect(new URL('/app/settings?bank=connected', request.url));
    response.headers.set('x-request-id', requestId);
    return response;
  } catch {
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: { status: 'error' }
    });
    const response = NextResponse.redirect(new URL('/app/settings?bank=error', request.url));
    response.headers.set('x-request-id', requestId);
    return response;
  }
}
