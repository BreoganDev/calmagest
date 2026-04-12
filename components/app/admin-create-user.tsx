'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createUserAdmin } from '@/lib/actions/adminActions';

export function AdminCreateUser() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const create = () => {
    if (!email.trim() || !password.trim()) return;
    startTransition(async () => {
      await createUserAdmin({ email, password, name });
      setEmail('');
      setName('');
      setPassword('');
    });
  };

  return (
    <div className="grid gap-2">
      <div className="text-sm font-medium">Crear usuario</div>
      <div className="grid gap-2">
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="button" variant="outline" onClick={create} disabled={isPending}>
        Crear
      </Button>
    </div>
  );
}
