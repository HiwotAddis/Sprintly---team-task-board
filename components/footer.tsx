import { contactDetails } from '@/lib/site-data';

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-white/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {contactDetails.map((detail) => (
            <div key={detail.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">{detail.label}</p>
              <p className="mt-2 text-sm text-steel">{detail.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-steel">
          TorqueWorks Auto Repair demo site. Built to showcase a clean, mobile-first service business layout.
        </p>
      </div>
    </footer>
  );
}