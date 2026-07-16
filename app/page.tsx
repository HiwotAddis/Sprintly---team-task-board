import Link from 'next/link';
import { businessHighlights, services, siteStats } from '@/lib/site-data';

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <span className="inline-flex rounded-full border border-amber/30 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber shadow-soft">
            Reliable auto repair for busy drivers
          </span>
          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Keep your customers rolling with a clean, trustworthy mechanic brand.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-steel sm:text-lg">
              TorqueWorks is a portfolio-ready demo site for an auto repair shop. It highlights common services,
              mobile-first layouts, and clear calls to action for estimates, bookings, and inspections.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-steel">
              Request an estimate
            </Link>
            <Link href="/services" className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-amber hover:text-amber">
              View services
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-soft sm:grid-cols-2">
            {services.map((service) => (
              <article key={service.title} className="rounded-2xl border border-black/5 bg-sand p-4">
                <h2 className="text-lg font-semibold text-ink">{service.title}</h2>
                <p className="mt-2 text-sm leading-6 text-steel">{service.description}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {siteStats.map((stat) => (
              <article key={stat.label} className="rounded-3xl border border-black/10 bg-white p-5 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">{stat.label}</p>
                <p className="mt-3 text-2xl font-semibold text-ink">{stat.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {businessHighlights.map((highlight) => (
          <div key={highlight} className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft">
            <p className="text-sm leading-6 text-steel">{highlight}</p>
          </div>
        ))}
      </section>
    </div>
  );
}