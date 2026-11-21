import Link from "next/link";
import { EnquiryStatusSelect } from "@/components/record-forms";
import { loadDesk } from "@/lib/desk";
import { ENQUIRY_STATUSES, formatWhen, label } from "@/lib/labels";
import { listQuery } from "@/lib/schemas";
import { listEnquiries } from "@/lib/services/enquiries";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const desk = await loadDesk();
  if (!desk.ctx) return null;
  const params = await searchParams;
  const parsed = listQuery.safeParse({
    enquiryStatus: typeof params.status === "string" ? params.status : undefined,
  });
  const status = parsed.success ? parsed.data.enquiryStatus : undefined;
  const enquiries = await listEnquiries(desk.ctx, status);

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">Pipeline</p>
      <h1 className="mt-2 text-5xl">Enquiries</h1>
      <form className="mt-6 flex gap-3">
        <select name="status" defaultValue={status ?? ""} className="field max-w-xs">
          <option value="">Every status</option>
          {ENQUIRY_STATUSES.map((item) => (
            <option key={item} value={item}>
              {label(item)}
            </option>
          ))}
        </select>
        <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper">Filter</button>
      </form>
      <ul className="mt-6 space-y-3">
        {enquiries.length === 0 ? <li className="text-sm text-muted">No enquiries in this view.</li> : null}
        {enquiries.map((enquiry) => (
          <li key={enquiry.id} className="grid gap-3 rounded-3xl border border-line bg-card p-5 md:grid-cols-[1fr_180px]">
            <div>
              <Link href={`/desk/customers/${enquiry.customer.id}`} className="text-lg">
                {enquiry.customer.name}
              </Link>
              <p className="text-sm text-muted">
                {enquiry.source} · {formatWhen(enquiry.createdAt)}
                {enquiry.property ? ` · ${enquiry.property.title}` : ""}
              </p>
              <p className="mt-2 text-sm">{enquiry.message}</p>
            </div>
            <EnquiryStatusSelect id={enquiry.id} status={enquiry.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
