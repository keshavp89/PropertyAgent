import Link from "next/link";

const points = [
  {
    title: "One book for the brokerage",
    copy: "Sale and rent listings stay with the firm. Buyers, tenants, and their changing briefs stay with the agent who owns the relationship.",
  },
  {
    title: "Follow-ups that remember",
    copy: "Calls, visits, and requirement changes are a timeline. A new budget or neighbourhood becomes the next version of the brief, not a lost note.",
  },
  {
    title: "Matches you can explain",
    copy: "The desk ranks available stock against the active brief and says why: budget, beds, area, locality, and amenities.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-16 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr]">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">PropertyAgent</p>
        <h1 className="mt-4 max-w-xl text-6xl leading-[0.95] text-ink">The desk where a brief meets the right door.</h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
          For agents who sell and let. Keep every listing, enquiry, and follow-up inside the brokerage, then see the stock that actually fits.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth/sign-up" className="rounded-full bg-pine px-5 py-2.5 text-sm text-paper">
            Open a brokerage
          </Link>
          <Link href="/auth/sign-in" className="rounded-full border border-line bg-card px-5 py-2.5 text-sm">
            Sign in
          </Link>
        </div>
      </section>
      <section className="space-y-4">
        {points.map((point) => (
          <article key={point.title} className="rounded-3xl border border-line bg-card p-6">
            <h2 className="text-2xl">{point.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{point.copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
