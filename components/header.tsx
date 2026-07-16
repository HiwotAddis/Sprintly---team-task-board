import Link from 'next/link';
import { navItems } from '@/lib/site-data';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-semibold tracking-[0.24em] text-ink uppercase">
            TorqueWorks
          </Link>
          <Link
            href="/contact"
            className="rounded-full bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-soft transition hover:bg-steel"
          >
            Book service
          </Link>
        </div>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-3 text-sm font-medium text-steel sm:gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-amber">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}