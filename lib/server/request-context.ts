import { NextResponse } from 'next/server';

export function getRequestId(request: Request) {
  return request.headers.get('x-request-id')?.trim() || crypto.randomUUID();
}

export function jsonWithRequestId(
  payload: unknown,
  requestId: string,
  init?: ResponseInit
) {
  const response = NextResponse.json(payload, init);
  response.headers.set('x-request-id', requestId);
  return response;
}
