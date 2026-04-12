import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container-page py-4 flex items-center justify-between">
          <Image
            src="/CalmaGest512.png"
            alt="Calma Gest"
            width={50}
            height={50}
          />
          <div className="flex items-center gap-4">
            <Link className="text-sm font-medium text-slate-600 hover:text-slate-900 transition" href="/login">
              Entrar
            </Link>
            <Button asChild size="sm">
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-page py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col gap-8">
            {/* Badge */}
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full" />
              <p className="inline-flex rounded-full bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200/50">
                Economia domestica + vida en orden
              </p>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight text-slate-900">
                Tu economia y tu dia,{' '}
                <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                  en calma.
                </span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              Calma Gest te ayuda a ver el mes con claridad, sin juicio. Un gasto a la vez, con foco en lo que importa.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild size="lg" className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700">
                <Link href="/register">Crear cuenta gratis</Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="border-slate-300 hover:bg-slate-50">
                <Link href="/login">Ya tengo cuenta</Link>
              </Button>
            </div>

            {/* Quote */}
            <div className="pt-4">
              <p className="text-sm text-slate-500 italic border-l-2 border-slate-300 pl-4">
                &quot;Esto es una foto del mes, no un examen.&quot;
              </p>
            </div>
          </div>

          {/* Visual Preview */}
          <div className="hidden lg:block">
            <div className="relative h-96">
              {/* Main card */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden">
                <div className="h-full flex flex-col justify-between p-8">
                  <div className="space-y-2">
                    <div className="h-2 w-24 bg-slate-200 rounded-full" />
                    <div className="h-2 w-16 bg-slate-100 rounded-full" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="h-3 flex-1 bg-rose-200 rounded-full" />
                      <div className="h-3 w-16 bg-amber-200 rounded-full" />
                    </div>
                    <div className="flex gap-3">
                      <div className="h-3 flex-1 bg-slate-100 rounded-full" />
                      <div className="h-3 w-20 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating cards */}
              <div className="absolute -bottom-6 -right-6 w-40 h-28 bg-white rounded-xl shadow-lg border border-slate-200 p-4 transform rotate-3">
                <div className="space-y-2">
                  <div className="h-2 w-16 bg-slate-200 rounded-full" />
                  <div className="h-2 w-20 bg-slate-100 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container-page py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Diseñado para tu tranquilidad
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Funcionalidades que te dan claridad sin agregar complejidad
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: '💰',
              title: 'Presupuesto sin friccion',
              body: 'Ve tu dinero con calma. Presupuesto, gastos y saldo en un vistazo.'
            },
            {
              icon: '✓',
              title: 'Rutinas simples',
              body: 'Habitos pequenos que reducen carga mental y te devuelven foco.'
            },
            {
              icon: '🎯',
              title: 'Claridad sin culpa',
              body: 'Si un mes se complica, solo ajustas y sigues.'
            }
          ].map((item) => (
            <div key={item.title} className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 bg-white/50">
        <div className="container-page py-8 flex flex-col items-center gap-2 text-sm text-slate-600">
          <div className="font-medium">Calma Gest · 2026</div>
          <div className="text-slate-500">Claridad sin culpa.</div>
        </div>
      </footer>
    </main>
  );
}

