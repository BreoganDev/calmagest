'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { registerSchema } from '@/lib/validation';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      currency: 'EUR',
      timezone: 'Europe/Madrid'
    }
  });

  const onSubmit = (values: RegisterValues) => {
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? 'No se pudo crear la cuenta.');
        return;
      }

      await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false
      });

      router.push('/app');
    });
  };

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre (opcional)</Label>
        <Input id="name" type="text" {...form.register('name')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register('email')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Contrasena</Label>
        <Input id="password" type="password" {...form.register('password')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="currency">Moneda</Label>
        <Input id="currency" type="text" {...form.register('currency')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="timezone">Zona horaria</Label>
        <Input id="timezone" type="text" {...form.register('timezone')} />
      </div>
      {error && <p className="text-xs text-rd-rose-deep">{error}</p>}
      <Button type="submit" disabled={isPending}>
        Crear cuenta
      </Button>
    </form>
  );
}
