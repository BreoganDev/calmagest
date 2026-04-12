'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createWorker } from 'tesseract.js';
import {
  Camera,
  Loader2,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  UploadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createReceiptSuggestion } from '@/lib/actions/suggestionActions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseMoney } from '@/lib/services/moneyService';
import { cn } from '@/lib/utils';

type Extracted = {
  name: string;
  amountCents: number;
  date?: string;
};

type MediaVideoElement = HTMLVideoElement & {
  srcObject: MediaStream | null;
};

const MERCHANT_KEYWORDS: Array<{ keyword: string; name: string }> = [
  { keyword: 'zara', name: 'Zara' },
  { keyword: 'pull&bear', name: 'Pull&Bear' },
  { keyword: 'pull bear', name: 'Pull&Bear' },
  { keyword: 'pullandbear', name: 'Pull&Bear' },
  { keyword: 'bershka', name: 'Bershka' },
  { keyword: 'mango', name: 'Mango' },
  { keyword: 'h&m', name: 'H&M' },
  { keyword: 'hm', name: 'H&M' }
];

function parseAmountString(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const parts = cleaned.split('.');
  if (parts.length === 1) return Math.round(Number(parts[0]) * 100);
  const decimals = parts.pop() ?? '00';
  const intPart = parts.join('');
  return Math.round(Number(`${intPart}.${decimals.padEnd(2, '0').slice(0, 2)}`) * 100);
}

function extractAmount(text: string): number | null {
  const normalized = text.replace(/\r/g, '').replace(/,/g, '.').toLowerCase();
  const lines = normalized
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  let best: { value: number; score: number } | null = null;
  let subtotal: number | null = null;
  let tax: number | null = null;
  let totalLine: number | null = null;
  let lastSubOrTaxIndex: number | null = null;

  const isNoiseLine = (line: string) => {
    const noise = [
      'local',
      'centro',
      'av.',
      'avenida',
      'calle',
      'c/',
      'cp',
      'codigo',
      'postal',
      'telefono',
      'tel',
      'fax',
      'caja'
    ];
    return noise.some((w) => line.includes(w));
  };

  const isTotalLine = (line: string) => {
    const simplified = line.replace(/[^a-z0-9]/g, '');
    return (
      /t[o0]t[a4][l1i]/.test(simplified) ||
      simplified.includes('importetotal') ||
      simplified.includes('totalapagar')
    );
  };

  for (let idx = 0; idx < lines.length; idx += 1) {
    const line = lines[idx];
    if (isNoiseLine(line)) continue;

    const amounts = line.match(/(\d{1,3}(?:\.\d{3})*|\d+)\.(\d{2})/g);
    if (!amounts?.length) continue;

    const value = parseAmountString(amounts[amounts.length - 1]);
    if (value === null) continue;

    let score = 0;
    if (isTotalLine(line) && !line.includes('subtotal')) {
      score += 12;
      totalLine = value;
    }
    if (line.includes('importe')) score += 8;
    if (line.includes('a pagar') || line.includes('pagado')) score += 6;
    if (line.includes('subtotal')) score += 3;
    if (line.includes('iva')) score -= 2;
    if (line.includes('tarjeta') || line.includes('pago')) score += 1;

    if (line.includes('subtotal')) {
      subtotal = value;
      lastSubOrTaxIndex = idx;
    }
    if (line.includes('iva') || line.includes('igic')) {
      tax = value;
      lastSubOrTaxIndex = idx;
    }

    if (!best || score > best.score || (score === best.score && value > best.value)) {
      best = { value, score };
    }
  }

  if (subtotal !== null && tax !== null) {
    const computed = subtotal + tax;
    if (totalLine !== null && Math.abs(totalLine - computed) <= 1) return totalLine;
    return computed;
  }

  if (lastSubOrTaxIndex !== null) {
    for (let i = lastSubOrTaxIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (isNoiseLine(line)) continue;
      const amounts = line.match(/(\d{1,3}(?:\.\d{3})*|\d+)\.(\d{2})/g);
      if (!amounts?.length) continue;
      const value = parseAmountString(amounts[amounts.length - 1]);
      if (value === null) continue;
      return value;
    }
  }

  if (totalLine !== null) return totalLine;
  if (best) return best.value;

  const anyAmount = normalized.match(/(\d{1,3}(?:\.\d{3})*|\d+)\.(\d{2})/g);
  if (anyAmount?.length) return parseAmountString(anyAmount[anyAmount.length - 1]);

  return null;
}

function extractDate(text: string): string | undefined {
  const match = text.match(/(\d{2})[\/\\-\\.](\d{2})[\/\\-\\.](\d{2,4})/);
  if (!match) return undefined;
  const day = match[1];
  const month = match[2];
  const yearRaw = match[3];
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year}-${month}-${day}`;
}

function extractName(text: string): string {
  const lowered = text.toLowerCase();
  for (const rule of MERCHANT_KEYWORDS) {
    if (lowered.includes(rule.keyword)) return rule.name;
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const banned = ['ticket', 'factura', 'total', 'subtotal', 'iva', 'caja', 'fecha', 'gracias'];
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.length < 3) continue;
    if (banned.some((w) => lower.includes(w))) continue;
    return line;
  }
  return lines[0] ?? 'Ticket';
}

export function ReceiptScan() {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isScanning, setIsScanning] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [canCapture, setCanCapture] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  const stopCamera = () => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        (videoRef.current as MediaVideoElement).srcObject = null;
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const reset = () => {
    stopCamera();
    setCameraMode(false);
    setCameraError(null);
    setCanCapture(false);
    setStatus(null);
    setProgress(null);
    setExtracted(null);
    setAmountInput('');
    setNameInput('');
    setDateInput('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setIsScanning(true);
    setProgress(null);
    setStatus('Preparando OCR...');
    setExtracted(null);

    const url = URL.createObjectURL(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);

    // Passing a logger function to the worker can cause DataCloneError in some browser/bundler combos.
    // We keep the UI informative without relying on worker progress callbacks.
    const worker = await createWorker('spa+eng', 1);

    try {
      setStatus('Leyendo texto...');
      const { data } = await worker.recognize(file);
      const text = data.text || '';

      const amountCents = extractAmount(text);
      const date = extractDate(text);
      const name = extractName(text);

      if (!amountCents) {
        setStatus('No pude detectar el importe. Ajusta la foto e intentalo otra vez.');
        return;
      }

      const payload: Extracted = { name, amountCents, date };
      setExtracted(payload);
      setNameInput(payload.name);
      setAmountInput((payload.amountCents / 100).toFixed(2).replace('.', ','));
      setDateInput(payload.date ?? new Date().toISOString().slice(0, 10));
      setStatus('Revisa los datos y confirma.');
    } catch {
      setStatus('No pude procesar el ticket. Prueba con otra foto.');
    } finally {
      await worker.terminate();
      setIsScanning(false);
    }
  };

  const confirm = () => {
    startTransition(async () => {
      const cents = parseMoney(amountInput);
      await createReceiptSuggestion({
        name: nameInput,
        amount: cents,
        date: dateInput,
        notes: 'Importado desde foto'
      });
      setStatus('Ticket importado. Revisalo en sugeridos.');
      setExtracted(null);
      setAmountInput('');
      setNameInput('');
      setDateInput('');
    });
  };

  const startCamera = async () => {
    setCameraError(null);
    setCanCapture(false);

    if (navigator.mediaDevices?.getUserMedia) {
      try {
        setCameraMode(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          (videoRef.current as MediaVideoElement).srcObject = stream;
          await videoRef.current.play();
        }
        return;
      } catch {
        setCameraMode(false);
        // On mobile over LAN (http://IP:PORT), getUserMedia often fails because the context is not secure.
        // Fall back to the file input with capture attribute, which opens the camera reliably.
        setCameraError("No pude abrir la camara. Permite el acceso o usa 'Subir'.");
        cameraInputRef.current?.click();
        return;
      }
    }

    cameraInputRef.current?.click();
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || !canCapture) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return;

    stopCamera();
    setCameraMode(false);

    const file = new File([blob], `ticket-${Date.now()}.jpg`, { type: 'image/jpeg' });
    void handleFile(file);
  };

  const inputDisabled = isPending || isScanning;

  return (
    <div className="grid gap-3">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <div className="grid gap-2">
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="primary" onClick={startCamera} disabled={inputDisabled} className="gap-2">
            <Camera className="h-4 w-4" />
            Usar camara
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={inputDisabled}
            className="gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            Subir
          </Button>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!cameraMode) fileInputRef.current?.click();
          }}
          onKeyDown={(e) => {
            if (cameraMode) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
          aria-disabled={inputDisabled}
          className={cn(
            'group relative overflow-hidden rounded-2xl border border-dashed',
            'bg-white/60 backdrop-blur-sm text-left shadow-soft transition-all duration-300',
            'hover:bg-white/80 hover:shadow-lg hover:-translate-y-0.5',
            'border-rd-gray-200 hover:border-rd-gray-300',
            inputDisabled && 'opacity-60 pointer-events-none'
          )}
        >
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-rd-rose-soft/50 via-transparent to-rd-nude/60" />
          <div className="relative p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/75 border border-border/60 shadow-sm">
                  {isScanning ? (
                    <Loader2 className="h-5 w-5 animate-spin text-rd-gray-700" />
                  ) : (
                    <ScanLine className="h-5 w-5 text-rd-gray-700" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {previewUrl ? 'Foto cargada' : 'Arrastra una foto o toca para escanear'}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Detecta comercio, fecha y total. Revisa antes de aceptar.
                  </div>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
                <div className="inline-flex items-center gap-1 rounded-full border border-border bg-white/70 px-2 py-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  OCR local
                </div>
              </div>
            </div>

            <div className="mt-3 h-40 w-full overflow-hidden rounded-2xl border border-border bg-card/70">
              {cameraMode ? (
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  onLoadedMetadata={() => setCanCapture(true)}
                  onCanPlay={() => setCanCapture(true)}
                />
              ) : previewUrl ? (
                <img src={previewUrl} alt="Preview ticket" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(232,176,168,0.22),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(107,168,158,0.20),transparent_55%)]" />
              )}
            </div>

            {cameraError && <div className="mt-2 text-[11px] text-rd-danger">{cameraError}</div>}

            {cameraMode && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    void captureFrame();
                  }}
                  disabled={isScanning || !canCapture}
                >
                  Capturar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    stopCamera();
                    setCameraMode(false);
                    setCanCapture(false);
                  }}
                  disabled={isScanning}
                >
                  Cerrar
                </Button>
              </div>
            )}

            {status && (
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{status}</span>
                  {progress !== null && <span>{progress}%</span>}
                </div>
                {progress !== null && (
                  <div className="h-1.5 w-full rounded-full bg-rd-gray-100 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-rd-secondary via-rd-rose to-rd-calm-green transition-all"
                      style={{ width: `${Math.max(2, Math.min(100, progress))}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {(previewUrl || extracted) && (
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] text-muted-foreground">Consejo: evita sombras y encuadra el total.</div>
            <Button type="button" variant="ghost" size="sm" onClick={reset} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar
            </Button>
          </div>
        )}
      </div>

      {extracted && (
        <div className="grid gap-3 rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-soft backdrop-blur-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1">
              <Label htmlFor="receipt-name">Concepto</Label>
              <Input id="receipt-name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="receipt-amount">Importe</Label>
              <Input id="receipt-amount" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="receipt-date">Fecha</Label>
              <Input id="receipt-date" type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
            </div>
          </div>
          <Button type="button" onClick={confirm} disabled={isPending || isScanning} className="w-full">
            Crear sugerencia
          </Button>
        </div>
      )}
    </div>
  );
}

export default ReceiptScan;
