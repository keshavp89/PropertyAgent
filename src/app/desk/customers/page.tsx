import Link from "next/link";
import { loadDesk } from "@/lib/desk";
import { label, priceLabel } from "@/lib/labels";
import { listCustomers } from "@/lib/services/customers";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const desk = await loadDesk();
  if (!desk.ctx) return null;
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : undefined;
  const customers = await listCustomers(desk.ctx, q);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">People</p>
          <h1 className="mt-2 text-5xl">Customers</h1>
        </div>
        <Link href="/desk/customers/new" className="rounded-full bg-pine px-4 py-2 text-sm text-paper">
          Add customer
        </Link>
      </div>
      <form className="mt-6 flex gap-3">
        <input name="q" defaultValue={q} placeholder="Name, phone, or email" className="field max-w-sm" />
        <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper">Search</button>
      </form>
      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
        {customers.length === 0 ? <li className="p-6 text-sm text-muted">No customers in your book yet.</li> : null}
        {customers.map((customer) => {
          const brief = customer.requirements[0];
          return (
            <li key={customer.id}>
              <Link href={`/desk/customers/${customer.id}`} className="block px-5 py-4 hover:bg-paper-deep/40">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-lg">{customer.name}</p>
                  <p className="text-sm text-moss">{label(customer.kind)}</p>
                </div>
                <p className="text-sm text-muted">
                  {customer.phone}
                  {brief
                    ? ` · ${label(brief.intent)} ${brief.maxPriceInr ? `up to ${priceLabel(brief.intent, brief.maxPriceInr)}` : ""}`
                    : ""}
                  {customer.enquiries.length ? ` · ${customer.enquiries.length} open` : ""}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
