import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RegisterForm from './register-form';

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex justify-center">
        <Image src="/CalmaGest512.png" alt="Calma Gest" width={64} height={64} />
      </div>
      <Card className="animate-rise">
        <CardHeader>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Esto es una foto del mes, no un examen.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-4 text-xs text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link className="underline" href="/login">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
