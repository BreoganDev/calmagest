import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import type { Provider } from 'next-auth/providers';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validation';
import { verifyPassword } from '@/lib/password';
import { canAttemptLogin, resetLoginAttempts } from '@/lib/rate-limit';
import { EncryptedPrismaAdapter } from '@/lib/auth/encrypted-prisma-adapter';

const providers: Provider[] = [
  Credentials({
    name: 'Credenciales',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials, req) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      const email = parsed.data.email.toLowerCase();
      const ip =
        req?.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req?.headers?.get('x-real-ip') ||
        'local';
      const key = `${email}:${ip}`;
      if (!canAttemptLogin(key)) return null;

      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.passwordHash) {
        return null;
      }

      const ok = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!ok) {
        return null;
      }
      resetLoginAttempts(key);

      return {
        id: user.id,
        email: user.email,
        name: user.name
      };
    }
  })
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: EncryptedPrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers
});
