import { PropertyForm } from "@/components/record-forms";
import { loadDesk } from "@/lib/desk";

export const dynamic = "force-dynamic";

export default async function NewPropertyPage() {
  const desk = await loadDesk();
  if (!desk.ctx) return null;
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-moss">New listing</p>
      <h1 className="mt-2 text-5xl">Add a property</h1>
      <p className="mt-3 mb-6 text-muted">Sale price or monthly rent, in rupees. The listing belongs to {desk.ctx.organizationName}.</p>
      <PropertyForm mode="create" />
    </div>
  );
}
