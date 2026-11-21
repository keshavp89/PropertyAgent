"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { send } from "@/lib/client-api";
import {
  CUSTOMER_KINDS,
  ENQUIRY_STATUSES,
  FOLLOW_UP_KINDS,
  FURNISHINGS,
  INTENTS,
  PROPERTY_TYPES,
  STATUSES,
  label,
} from "@/lib/labels";

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  return Number(text);
}

export function PropertyForm({
  mode,
  propertyId,
  initial,
}: {
  mode: "create" | "edit";
  propertyId?: string;
  initial?: Record<string, string | number | null | string[]>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const value = (key: string) => {
    const current = initial?.[key];
    if (Array.isArray(current)) return current.join(", ");
    return current ?? "";
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      propertyType: String(form.get("propertyType") ?? ""),
      intent: String(form.get("intent") ?? ""),
      status: String(form.get("status") ?? "AVAILABLE"),
      priceInr: numberOrNull(form.get("priceInr")),
      depositInr: numberOrNull(form.get("depositInr")),
      maintenanceInr: numberOrNull(form.get("maintenanceInr")),
      bedrooms: numberOrNull(form.get("bedrooms")),
      bathrooms: numberOrNull(form.get("bathrooms")),
      areaSqft: numberOrNull(form.get("areaSqft")),
      floor: numberOrNull(form.get("floor")),
      totalFloors: numberOrNull(form.get("totalFloors")),
      city: String(form.get("city") ?? ""),
      locality: String(form.get("locality") ?? ""),
      addressLine: String(form.get("addressLine") ?? "") || null,
      furnishing: String(form.get("furnishing") ?? "UNFURNISHED"),
      amenities: splitList(String(form.get("amenities") ?? "")),
      description: String(form.get("description") ?? ""),
    };
    setPending(true);
    setError(null);
    try {
      const result = await send<{ property: { id: string } }>(mode === "create" ? "/api/properties" : `/api/properties/${propertyId}`, {
        method: mode === "create" ? "POST" : "PUT",
        body: JSON.stringify(payload),
      });
      router.push(`/desk/properties/${result.property.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the listing.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-line bg-card p-6 md:grid-cols-2">
      <Field label="Title" className="md:col-span-2">
        <input name="title" required defaultValue={String(value("title"))} className="field" />
      </Field>
      <Field label="Type">
        <Select name="propertyType" options={PROPERTY_TYPES} defaultValue={String(value("propertyType") || "APARTMENT")} />
      </Field>
      <Field label="Sale or rent">
        <Select name="intent" options={INTENTS} defaultValue={String(value("intent") || "SALE")} />
      </Field>
      <Field label="Status">
        <Select name="status" options={STATUSES} defaultValue={String(value("status") || "AVAILABLE")} />
      </Field>
      <Field label="Furnishing">
        <Select name="furnishing" options={FURNISHINGS} defaultValue={String(value("furnishing") || "UNFURNISHED")} />
      </Field>
      <Field label="Price (INR)">
        <input name="priceInr" type="number" required min={1} defaultValue={String(value("priceInr"))} className="field" />
      </Field>
      <Field label="Deposit (INR)">
        <input name="depositInr" type="number" min={1} defaultValue={String(value("depositInr"))} className="field" />
      </Field>
      <Field label="Maintenance (INR)">
        <input name="maintenanceInr" type="number" min={1} defaultValue={String(value("maintenanceInr"))} className="field" />
      </Field>
      <Field label="Bedrooms">
        <input name="bedrooms" type="number" min={0} defaultValue={String(value("bedrooms"))} className="field" />
      </Field>
      <Field label="Bathrooms">
        <input name="bathrooms" type="number" min={0} defaultValue={String(value("bathrooms"))} className="field" />
      </Field>
      <Field label="Area (sq ft)">
        <input name="areaSqft" type="number" min={1} defaultValue={String(value("areaSqft"))} className="field" />
      </Field>
      <Field label="Floor">
        <input name="floor" type="number" min={0} defaultValue={String(value("floor"))} className="field" />
      </Field>
      <Field label="Total floors">
        <input name="totalFloors" type="number" min={0} defaultValue={String(value("totalFloors"))} className="field" />
      </Field>
      <Field label="City">
        <input name="city" required defaultValue={String(value("city"))} className="field" />
      </Field>
      <Field label="Locality">
        <input name="locality" required defaultValue={String(value("locality"))} className="field" />
      </Field>
      <Field label="Address" className="md:col-span-2">
        <input name="addressLine" defaultValue={String(value("addressLine"))} className="field" />
      </Field>
      <Field label="Amenities, comma separated" className="md:col-span-2">
        <input name="amenities" defaultValue={String(value("amenities"))} className="field" placeholder="parking, lift" />
      </Field>
      <Field label="Description" className="md:col-span-2">
        <textarea name="description" required minLength={10} rows={5} defaultValue={String(value("description"))} className="field" />
      </Field>
      {error ? <p className="text-sm text-clay md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <button disabled={pending} className="rounded-full bg-pine px-5 py-2.5 text-sm text-paper disabled:opacity-60">
          {pending ? "Saving…" : mode === "create" ? "Add listing" : "Save listing"}
        </button>
      </div>
    </form>
  );
}

export function DeletePropertyButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        className="text-sm text-clay"
        onClick={async () => {
          if (!window.confirm("Remove this listing from the brokerage?")) return;
          try {
            await send(`/api/properties/${id}`, { method: "DELETE" });
            router.push("/desk/properties");
            router.refresh();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not remove the listing.");
          }
        }}
      >
        Remove listing
      </button>
      {error ? <p className="mt-1 text-sm text-clay">{error}</p> : null}
    </div>
  );
}

export function CustomerCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const result = await send<{ customer: { id: string } }>("/api/customers", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          email: String(form.get("email") ?? "") || null,
          kind: String(form.get("kind") ?? "BUYER"),
          notes: String(form.get("notes") ?? "") || null,
          requirement: requirementFrom(form),
        }),
      });
      router.push(`/desk/customers/${result.customer.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the customer.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl border border-line bg-card p-6 md:grid-cols-2">
      <Field label="Name">
        <input name="name" required className="field" />
      </Field>
      <Field label="Phone">
        <input name="phone" required className="field" />
      </Field>
      <Field label="Email">
        <input name="email" type="email" className="field" />
      </Field>
      <Field label="They are a">
        <Select name="kind" options={CUSTOMER_KINDS} defaultValue="BUYER" />
      </Field>
      <Field label="Notes" className="md:col-span-2">
        <textarea name="notes" rows={3} className="field" />
      </Field>
      <h2 className="text-2xl md:col-span-2">Opening brief</h2>
      <RequirementFields />
      {error ? <p className="text-sm text-clay md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <button disabled={pending} className="rounded-full bg-pine px-5 py-2.5 text-sm text-paper disabled:opacity-60">
          {pending ? "Saving…" : "Save customer"}
        </button>
      </div>
    </form>
  );
}

export function RequirementChangeForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError(null);
        try {
          await send(`/api/customers/${customerId}/requirements`, {
            method: "POST",
            body: JSON.stringify({
              ...requirementFrom(form),
              notes: String(form.get("changeNotes") ?? ""),
            }),
          });
          event.currentTarget.reset();
          router.refresh();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Could not update the brief.");
        } finally {
          setPending(false);
        }
      }}
    >
      <RequirementFields />
      <Field label="What changed" className="md:col-span-2">
        <textarea name="changeNotes" required minLength={2} rows={3} className="field" placeholder="Budget rose to 1.1 crore after the family visit." />
      </Field>
      {error ? <p className="text-sm text-clay md:col-span-2">{error}</p> : null}
      <div className="md:col-span-2">
        <button disabled={pending} className="rounded-full bg-pine px-4 py-2 text-sm text-paper disabled:opacity-60">
          {pending ? "Saving…" : "Save new brief"}
        </button>
      </div>
    </form>
  );
}

export function EnquiryForm({ customerId, properties }: { customerId: string; properties: { id: string; title: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(null);
        try {
          await send("/api/enquiries", {
            method: "POST",
            body: JSON.stringify({
              customerId,
              propertyId: String(form.get("propertyId") ?? "") || null,
              source: String(form.get("source") ?? ""),
              message: String(form.get("message") ?? ""),
              status: "NEW",
            }),
          });
          event.currentTarget.reset();
          router.refresh();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Could not save the enquiry.");
        }
      }}
    >
      <Field label="Source">
        <input name="source" required className="field" placeholder="Phone, portal, walk-in" />
      </Field>
      <Field label="About a listing">
        <select name="propertyId" className="field" defaultValue="">
          <option value="">No specific listing</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="What they asked">
        <textarea name="message" required minLength={2} rows={3} className="field" />
      </Field>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <button className="rounded-full bg-pine px-4 py-2 text-sm text-paper">Log enquiry</button>
    </form>
  );
}

export function FollowUpForm({ customerId }: { customerId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const kinds = FOLLOW_UP_KINDS.filter((kind) => kind !== "REQUIREMENT_CHANGE");
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const due = String(form.get("dueAt") ?? "");
        setError(null);
        try {
          await send("/api/follow-ups", {
            method: "POST",
            body: JSON.stringify({
              customerId,
              kind: String(form.get("kind") ?? "CALL"),
              notes: String(form.get("notes") ?? ""),
              dueAt: due ? new Date(due).toISOString() : null,
            }),
          });
          event.currentTarget.reset();
          router.refresh();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Could not save the follow-up.");
        }
      }}
    >
      <Field label="Kind">
        <Select name="kind" options={kinds} defaultValue="CALL" />
      </Field>
      <Field label="Due">
        <input name="dueAt" type="datetime-local" className="field" />
      </Field>
      <Field label="Notes">
        <textarea name="notes" required minLength={2} rows={3} className="field" />
      </Field>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <button className="rounded-full bg-pine px-4 py-2 text-sm text-paper">Add follow-up</button>
    </form>
  );
}

export function EnquiryStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <select
        className="field"
        defaultValue={status}
        onChange={async (event) => {
          setError(null);
          try {
            await send(`/api/enquiries/${id}`, {
              method: "PATCH",
              body: JSON.stringify({ status: event.target.value }),
            });
            router.refresh();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not update the enquiry.");
          }
        }}
      >
        {ENQUIRY_STATUSES.map((item) => (
          <option key={item} value={item}>
            {label(item)}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-clay">{error}</p> : null}
    </div>
  );
}

export function CompleteFollowUp({ id, completed }: { id: string; completed: boolean }) {
  const router = useRouter();
  return (
    <button
      className="text-sm text-pine"
      onClick={async () => {
        await send(`/api/follow-ups/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ completed: !completed }),
        });
        router.refresh();
      }}
    >
      {completed ? "Reopen" : "Mark done"}
    </button>
  );
}

function RequirementFields() {
  return (
    <>
      <Field label="Looking to">
        <Select name="intent" options={INTENTS} defaultValue="SALE" />
      </Field>
      <Field label="Types, comma separated">
        <input name="propertyTypes" className="field" placeholder="APARTMENT, HOUSE" />
      </Field>
      <Field label="Minimum budget">
        <input name="minPriceInr" type="number" min={1} className="field" />
      </Field>
      <Field label="Maximum budget">
        <input name="maxPriceInr" type="number" min={1} className="field" />
      </Field>
      <Field label="Minimum bedrooms">
        <input name="minBedrooms" type="number" min={0} className="field" />
      </Field>
      <Field label="Maximum bedrooms">
        <input name="maxBedrooms" type="number" min={0} className="field" />
      </Field>
      <Field label="Minimum area (sq ft)">
        <input name="minAreaSqft" type="number" min={1} className="field" />
      </Field>
      <Field label="Cities">
        <input name="cities" className="field" placeholder="Bengaluru" />
      </Field>
      <Field label="Localities">
        <input name="localities" className="field" placeholder="Indiranagar, Koramangala" />
      </Field>
      <Field label="Must-have amenities">
        <input name="amenities" className="field" placeholder="parking, lift" />
      </Field>
    </>
  );
}

function requirementFrom(form: FormData) {
  const types = splitList(String(form.get("propertyTypes") ?? "")).map((item) => item.toUpperCase().replace(/[\s-]+/g, "_"));
  return {
    intent: String(form.get("intent") ?? "SALE"),
    propertyTypes: types,
    minPriceInr: numberOrNull(form.get("minPriceInr")),
    maxPriceInr: numberOrNull(form.get("maxPriceInr")),
    minBedrooms: numberOrNull(form.get("minBedrooms")),
    maxBedrooms: numberOrNull(form.get("maxBedrooms")),
    minAreaSqft: numberOrNull(form.get("minAreaSqft")),
    cities: splitList(String(form.get("cities") ?? "")),
    localities: splitList(String(form.get("localities") ?? "")),
    amenities: splitList(String(form.get("amenities") ?? "")),
    notes: null,
  };
}

function Field({ label: text, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="mb-1.5 block text-muted">{text}</span>
      {children}
    </label>
  );
}

function Select({ name, options, defaultValue }: { name: string; options: readonly string[]; defaultValue: string }) {
  return (
    <select name={name} defaultValue={defaultValue} className="field">
      {options.map((option) => (
        <option key={option} value={option}>
          {label(option)}
        </option>
      ))}
    </select>
  );
}
