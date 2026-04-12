import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoginForm from './login-form';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/app');

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex justify-center">
        <Image src="/CalmaGest512.png" alt="Calma Gest" width={64} height={64} />
      </div>
      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Bienvenida de vuelta</CardTitle>
          <CardDescription>Tu mes te espera, sin juicio.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-xs text-muted-foreground">
            ¿Aun no tienes cuenta?{' '}
            <Link className="underline" href="/register">
              Crear cuenta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
