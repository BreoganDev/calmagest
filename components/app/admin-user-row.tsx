'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  resetPasswordAdmin,
  sendEmailAdmin,
  sendInAppAdmin,
  sendPushAdmin
} from '@/lib/actions/adminActions';

export function AdminUserRow({
  id,
  email,
  name
}: {
  id: string;
  email: string;
  name: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('Aviso Calma Eco');
  const [body, setBody] = useState('Hola, esto es un mensaje importante.');
  const [subject, setSubject] = useState('Calma Eco');

  const reset = () => {
    if (!password.trim()) return;
    startTransition(async () => {
      await resetPasswordAdmin({ userId: id, password });
      setPassword('');
    });
  };

  const sendInApp = () => {
    if (!title.trim() || !body.trim()) return;
    startTransition(async () => {
      await sendInAppAdmin({ userId: id, title, body });
    });
  };

  const sendPush = () => {
    if (!title.trim() || !body.trim()) return;
    startTransition(async () => {
      await sendPushAdmin({ userId: id, title, body });
    });
  };

  const sendEmail = () => {
    if (!subject.trim() || !body.trim()) return;
    startTransition(async () => {
      await sendEmailAdmin({ userId: id, subject, body });
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{name ?? 'Sin nombre'}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nueva contraseña"
            type="password"
          />
          <Button type="button" variant="outline" onClick={reset} disabled={isPending}>
            Reset pass
          </Button>
        </div>
        <div className="grid gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titulo" />
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto" />
          <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mensaje" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={sendInApp} disabled={isPending}>
            Enviar in-app
          </Button>
          <Button type="button" variant="outline" onClick={sendPush} disabled={isPending}>
            Enviar push
          </Button>
          <Button type="button" variant="outline" onClick={sendEmail} disabled={isPending}>
            Enviar email
          </Button>
        </div>
      </div>
    </div>
  );
}
