import type { NextAuthConfig } from 'next-auth';

function envFlag(value: string | undefined) {
    if (!value) return false;
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
}

const trustHost =
    envFlag(process.env.AUTH_TRUST_HOST) ||
    Boolean(process.env.AUTH_URL || process.env.NEXTAUTH_URL) ||
    process.env.NODE_ENV !== 'production';

export const authConfig = {
    trustHost,
    pages: {
        signIn: '/login'
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user?.id) token.uid = user.id;
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.uid) {
                session.user.id = token.uid as string;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/app');
            const isOnLogin = nextUrl.pathname.startsWith('/login');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn && isOnLogin) {
                return Response.redirect(new URL('/app', nextUrl));
            }
            return true;
        },
    },
    providers: [], // Providers with dependencies are added in auth.ts
} satisfies NextAuthConfig;
