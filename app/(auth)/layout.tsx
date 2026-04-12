import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-rd-nude">
      <header className="container-page py-8">
        <Link href="/">
          <Image src="/CalmaGest512.png" alt="Calma Gest" width={40} height={40} />
        </Link>
      </header>
      <main className="container-page pb-16">{children}</main>
    </div>
  );
}

