import { NextResponse } from 'next/server';
export default function middleware(request: Request) {
  const requestId = request.headers.get('x-request-id')?.trim() || crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: {
      headers
    }
  });

  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/app/:path*', '/api/:path*'],
};
