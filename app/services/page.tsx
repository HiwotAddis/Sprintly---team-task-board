import { services } from '@/lib/site-data';

export default function ServicesPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <section className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">Services</h1>
        <p className="text-base leading-7 text-steel sm:text-lg">
          A simple service list gives the client a clear starting point for their future offerings, pricing, and booking flow.
        </p>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.title} className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-semibold text-ink">{service.title}</h2>
            <p className="mt-3 text-sm leading-6 text-steel">{service.description}</p>
            {/* This spot is intentionally reserved for future pricing and package details. */}
          </article>
        ))}
      </section>
    </div>
  );
}