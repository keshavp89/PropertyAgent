import Link from "next/link";
import { DeletePropertyButton, PropertyForm } from "@/components/record-forms";
import { canEditProperty } from "@/lib/access";
import { loadDesk } from "@/lib/desk";
import { label, priceLabel } from "@/lib/labels";
import { getProperty } from "@/lib/services/properties";

export const dynamic = "force-dynamic";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const desk = await loadDesk();
  if (!desk.ctx) return null;
  const { id } = await params;
  const property = await getProperty(desk.ctx, id);
  const editable = canEditProperty(desk.ctx.role, desk.ctx.user.id, property.listedByUserId);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/desk/properties" className="text-sm text-moss">
        All properties
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-moss">
            {label(property.intent)} · {label(property.status)}
          </p>
          <h1 className="mt-2 text-5xl">{property.title}</h1>
          <p className="mt-2 text-muted">
            {property.locality}, {property.city}
          </p>
        </div>
        <p className="font-serif text-3xl">{priceLabel(property.intent, property.priceInr)}</p>
      </div>
      <p className="mt-6 max-w-2xl leading-relaxed">{property.description}</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <Fact label="Type" value={label(property.propertyType)} />
        <Fact label="Beds" value={property.bedrooms?.toString() ?? "—"} />
        <Fact label="Baths" value={property.bathrooms?.toString() ?? "—"} />
        <Fact label="Area" value={property.areaSqft ? `${property.areaSqft} sq ft` : "—"} />
      </dl>
      {property.amenities.length > 0 ? <p className="mt-4 text-sm text-muted">{property.amenities.join(" · ")}</p> : null}
      {editable ? (
        <div className="mt-10">
          <h2 className="mb-4 text-3xl">Edit</h2>
          <PropertyForm
            mode="edit"
            propertyId={property.id}
            initial={{
              title: property.title,
              propertyType: property.propertyType,
              intent: property.intent,
              status: property.status,
              priceInr: property.priceInr,
              depositInr: property.depositInr,
              maintenanceInr: property.maintenanceInr,
              bedrooms: property.bedrooms,
              bathrooms: property.bathrooms,
              areaSqft: property.areaSqft,
              floor: property.floor,
              totalFloors: property.totalFloors,
              city: property.city,
              locality: property.locality,
              addressLine: property.addressLine,
              furnishing: property.furnishing,
              amenities: property.amenities,
              description: property.description,
            }}
          />
          <div className="mt-4">
            <DeletePropertyButton id={property.id} />
          </div>
        </div>
      ) : (
        <p className="mt-8 text-sm text-muted">You can read this listing. The agent who added it, or an owner or admin, can change it.</p>
      )}
    </div>
  );
}

function Fact({ label: name, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-3 py-2">
      <dt className="text-muted">{name}</dt>
      <dd>{value}</dd>
    </div>
  );
}
