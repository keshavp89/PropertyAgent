import Link from "next/link";
import { CompleteFollowUp, EnquiryForm, FollowUpForm, RequirementChangeForm } from "@/components/record-forms";
import { loadDesk } from "@/lib/desk";
import { formatWhen, label, priceLabel } from "@/lib/labels";
import { getCustomer } from "@/lib/services/customers";
import { matchCustomer } from "@/lib/services/matches";
import { listProperties } from "@/lib/services/properties";

export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const desk = await loadDesk();
  if (!desk.ctx) return null;
  const { id } = await params;
  const customer = await getCustomer(desk.ctx, id);
  const matched = await matchCustomer(desk.ctx, id);
  const properties = await listProperties(desk.ctx, {});
  const active = customer.requirements.find((requirement) => requirement.active);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/desk/customers" className="text-sm text-moss">
        All customers
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-moss">{label(customer.kind)}</p>
          <h1 className="mt-2 text-5xl">{customer.name}</h1>
          <p className="mt-2 text-muted">
            {customer.phone}
            {customer.email ? ` · ${customer.email}` : ""}
          </p>
        </div>
      </div>
      {customer.notes ? <p className="mt-4 max-w-2xl text-sm">{customer.notes}</p> : null}

      <section className="mt-8 rounded-3xl border border-line bg-card p-5">
        <h2 className="text-3xl">Best matches</h2>
        {active ? (
          <p className="mt-1 text-sm text-muted">
            Brief v{active.version}: {label(active.intent)}
            {active.cities.length ? ` in ${active.cities.join(", ")}` : ""}
            {active.maxPriceInr ? `, up to ${priceLabel(active.intent, active.maxPriceInr)}` : ""}.
          </p>
        ) : null}
        <ol className="mt-4 space-y-3">
          {matched.matches.length === 0 ? <li className="text-sm text-muted">Nothing in the book fits this brief yet.</li> : null}
          {matched.matches.slice(0, 8).map((match, index) => (
            <li key={match.propertyId} className="rounded-2xl border border-line bg-paper px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/desk/properties/${match.propertyId}`} className="text-lg">
                  {index + 1}. {match.property?.title}
                </Link>
                <span className="text-sm text-moss">
                  {label(match.band)} · {match.score}
                </span>
              </div>
              <p className="text-sm text-muted">
                {match.property ? `${match.property.locality}, ${match.property.city} · ${priceLabel(match.property.intent, match.property.priceInr)}` : ""}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-deep">
                <div className="h-full bg-pine" style={{ width: `${match.score}%` }} />
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {match.reasons.slice(0, 4).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-line bg-card p-5">
          <h2 className="text-3xl">Change the brief</h2>
          <p className="mt-1 mb-4 text-sm text-muted">This keeps the previous version and writes a follow-up.</p>
          <RequirementChangeForm customerId={customer.id} />
          <ol className="mt-6 space-y-2 text-sm">
            {customer.requirements.map((requirement) => (
              <li key={requirement.id} className="border-t border-line pt-2">
                <span className="text-moss">v{requirement.version}{requirement.active ? " · active" : ""}</span>
                <span className="text-muted"> · {formatWhen(requirement.createdAt)}</span>
                <p>
                  {label(requirement.intent)}
                  {requirement.propertyTypes.length ? ` · ${requirement.propertyTypes.map(label).join(", ")}` : ""}
                  {requirement.notes ? ` · ${requirement.notes}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </section>
        <div className="space-y-6">
          <section className="rounded-3xl border border-line bg-card p-5">
            <h2 className="mb-4 text-3xl">Enquiry</h2>
            <EnquiryForm customerId={customer.id} properties={properties.map((property) => ({ id: property.id, title: property.title }))} />
            <ul className="mt-4 space-y-2 text-sm">
              {customer.enquiries.map((enquiry) => (
                <li key={enquiry.id} className="border-t border-line pt-2">
                  <span className="text-moss">{label(enquiry.status)}</span> · {enquiry.source}
                  <p>{enquiry.message}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-3xl border border-line bg-card p-5">
            <h2 className="mb-4 text-3xl">Follow-up</h2>
            <FollowUpForm customerId={customer.id} />
            <ul className="mt-4 space-y-2 text-sm">
              {customer.followUps.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 border-t border-line pt-2">
                  <div>
                    <p>
                      {label(item.kind)}
                      {item.dueAt ? ` · due ${formatWhen(item.dueAt)}` : ""}
                    </p>
                    <p className="text-muted">{item.notes}</p>
                  </div>
                  <CompleteFollowUp id={item.id} completed={Boolean(item.completedAt)} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
