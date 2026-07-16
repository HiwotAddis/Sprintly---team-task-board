export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            About TorqueWorks
          </h1>
          <p className="text-base leading-7 text-steel sm:text-lg">
            This demo site is designed to feel like a real local mechanic
            business: practical, dependable, and easy to scan on a phone.
          </p>
        </div>
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-semibold text-ink">
            What this layout is built to show
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-steel">
            <li>A clean service-driven homepage</li>
            <li>Easy navigation to common shop pages</li>
            <li>Mobile-first spacing and readable typography</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
