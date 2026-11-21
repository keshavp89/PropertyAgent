import Link from "next/link";
import { loadDesk } from "@/lib/desk";
import { INTENTS, PROPERTY_TYPES, STATUSES, label, priceLabel } from "@/lib/labels";
import { listQuery } from "@/lib/schemas";
import { listProperties } from "@/lib/services/properties";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const desk = await loadDesk();
  if (!desk.ctx) return null;
  const params = await searchParams;
  const one = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value ? value : undefined;
  };
  const parsed = listQuery.safeParse({
    q: one("q"),
    intent: one("intent"),
    status: one("status"),
    propertyType: one("propertyType"),
    city: one("city"),
  });
  const filters = parsed.success ? parsed.data : {};
  const properties = await listProperties(desk.ctx, filters);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">Stock</p>
          <h1 className="mt-2 text-5xl">Properties</h1>
        </div>
        <Link href="/desk/properties/new" className="rounded-full bg-pine px-4 py-2 text-sm text-paper">
          Add listing
        </Link>
      </div>
      <form className="mt-6 grid gap-3 rounded-3xl border border-line bg-card p-4 md:grid-cols-5">
        <input name="q" defaultValue={filters.q} placeholder="Search" className="field md:col-span-2" />
        <select name="intent" defaultValue={filters.intent ?? ""} className="field">
          <option value="">Sale and rent</option>
          {INTENTS.map((item) => (
            <option key={item} value={item}>
              {label(item)}
            </option>
          ))}
        </select>
        <select name="propertyType" defaultValue={filters.propertyType ?? ""} className="field">
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((item) => (
            <option key={item} value={item}>
              {label(item)}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status ?? ""} className="field">
          <option value="">Any status</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {label(item)}
            </option>
          ))}
        </select>
        <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper md:col-span-5 md:w-fit">Filter</button>
      </form>
      <ul className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-card">
        {properties.length === 0 ? <li className="p-6 text-sm text-muted">No listings match this filter.</li> : null}
        {properties.map((property) => (
          <li key={property.id}>
            <Link href={`/desk/properties/${property.id}`} className="grid gap-2 px-5 py-4 hover:bg-paper-deep/40 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-lg">{property.title}</p>
                <p className="text-sm text-muted">
                  {label(property.propertyType)} · {property.locality}, {property.city}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p>{priceLabel(property.intent, property.priceInr)}</p>
                <p className="text-sm text-moss">{label(property.status)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
