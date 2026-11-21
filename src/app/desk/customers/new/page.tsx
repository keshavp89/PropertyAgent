import { CustomerCreateForm } from "@/components/record-forms";
import { loadDesk } from "@/lib/desk";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  const desk = await loadDesk();
  if (!desk.ctx) return null;
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">New customer</p>
      <h1 className="mt-2 text-5xl">Open a file</h1>
      <p className="mt-3 mb-6 text-muted">The first brief is what the desk matches against. Change it later and the older version stays on the timeline.</p>
      <CustomerCreateForm />
    </div>
  );
}
