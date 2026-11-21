import Link from "next/link";
import { SampleButton } from "@/components/desk-controls";
import { CompleteFollowUp } from "@/components/record-forms";
import { loadDesk } from "@/lib/desk";
import { formatWhen, label } from "@/lib/labels";
import { isManager } from "@/lib/access";
import { dashboard } from "@/lib/services/dashboard";
import { getPrisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DeskHome() {
  const desk = await loadDesk();
  if (!desk.ctx) return null;
  const data = await dashboard(desk.ctx);
  const propertyCount = await getPrisma().property.count({ where: { organizationId: desk.ctx.organizationId } });
  const stats = [
    { label: "Available", value: data.available },
    { label: "Under offer", value: data.underOffer },
    { label: "Open enquiries", value: data.openEnquiries },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">Today</p>
      <h1 className="mt-2 text-5xl">Good to see you, {desk.user.name.split(" ")[0]}.</h1>
      <p className="mt-3 max-w-xl text-muted">Open enquiries and the follow-ups due in the next week, inside {desk.ctx.organizationName}.</p>
      {propertyCount === 0 && isManager(desk.ctx.role) ? (
        <div className="mt-6 rounded-3xl border border-dashed border-line bg-card p-5">
          <p className="text-sm text-muted">This brokerage has no listings yet. Add a few real ones, or start from a sample book.</p>
          <div className="mt-3">
            <SampleButton />
          </div>
        </div>
      ) : null}
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-line bg-card px-5 py-4">
            <p className="text-sm text-muted">{stat.label}</p>
            <p className="mt-1 font-serif text-4xl">{stat.value}</p>
          </article>
        ))}
      </section>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-card p-5">
          <h2 className="text-2xl">Due follow-ups</h2>
          <ul className="mt-4 space-y-3">
            {data.dueFollowUps.length === 0 ? <li className="text-sm text-muted">Nothing due this week.</li> : null}
            {data.dueFollowUps.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 border-t border-line pt-3">
                <div>
                  <Link href={`/desk/customers/${item.customer.id}`} className="font-medium">
                    {item.customer.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {label(item.kind)} · {item.dueAt ? formatWhen(item.dueAt) : "No time"}
                  </p>
                  <p className="text-sm">{item.notes}</p>
                </div>
                <CompleteFollowUp id={item.id} completed={false} />
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-line bg-card p-5">
          <h2 className="text-2xl">Recent enquiries</h2>
          <ul className="mt-4 space-y-3">
            {data.recentEnquiries.length === 0 ? <li className="text-sm text-muted">No enquiries yet.</li> : null}
            {data.recentEnquiries.map((item) => (
              <li key={item.id} className="border-t border-line pt-3">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href={`/desk/customers/${item.customer.id}`} className="font-medium">
                    {item.customer.name}
                  </Link>
                  <span className="text-xs uppercase tracking-wide text-moss">{label(item.status)}</span>
                </div>
                <p className="text-sm text-muted">{item.message}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
