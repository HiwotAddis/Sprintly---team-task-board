import { contactDetails } from "@/lib/site-data";

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <section className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Contact
        </h1>
        <p className="text-base leading-7 text-steel sm:text-lg">
          Add your shop phone number, hours, and booking form here when the demo
          evolves into a live client project.
        </p>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">Business info</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-steel">
            {contactDetails.map((detail) => (
              <p key={detail.label}>
                {detail.label}: {detail.value}
              </p>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-dashed border-amber/40 bg-amber/5 p-6">
          <h2 className="text-2xl font-semibold text-ink">
            Placeholder form area
          </h2>
          <p className="mt-3 text-sm leading-6 text-steel">
            A future version can add a real form, location map, and online
            scheduling integration.
          </p>
          <form className="mt-6 grid gap-4">
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none ring-0 placeholder:text-steel/60 focus:border-amber"
              placeholder="Your name"
            />
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none ring-0 placeholder:text-steel/60 focus:border-amber"
              placeholder="Phone or email"
            />
            <textarea
              className="min-h-32 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-ink outline-none ring-0 placeholder:text-steel/60 focus:border-amber"
              placeholder="Tell us what your vehicle needs"
            />
            <button
              type="button"
              className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-steel"
            >
              Send inquiry
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
