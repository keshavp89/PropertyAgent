"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";
import { send } from "@/lib/client-api";
import type { Membership } from "@/lib/desk-types";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      className="text-sm text-sand/80 hover:text-sand"
      onClick={async () => {
        await send("/api/organizations/active", { method: "DELETE" }).catch(() => undefined);
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}

export function OrgSwitcher({ memberships, activeId }: { memberships: Membership[]; activeId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  if (memberships.length < 2) return null;
  return (
    <label className="block text-xs text-sand/70">
      Brokerage
      <select
        className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-2 py-1.5 text-sm text-paper"
        value={activeId}
        disabled={pending}
        onChange={async (event) => {
          setPending(true);
          await authClient.organization.setActive({ organizationId: event.target.value });
          await send("/api/organizations/active", {
            method: "POST",
            body: JSON.stringify({ organizationId: event.target.value }),
          });
          router.refresh();
          setPending(false);
        }}
      >
        {memberships.map((membership) => (
          <option key={membership.organizationId} value={membership.organizationId}>
            {membership.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function OrgGate({ userName }: { userName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("name") ?? "").trim();
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "brokerage";
    setPending(true);
    setError(null);
    let slug = base;
    let created = await authClient.organization.create({ name, slug });
    if (created.error) {
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
      created = await authClient.organization.create({ name, slug });
    }
    if (created.error || !created.data?.id) {
      setPending(false);
      setError(created.error?.message || "Could not create the brokerage.");
      return;
    }
    await authClient.organization.setActive({ organizationId: created.data.id });
    await send("/api/organizations/active", {
      method: "POST",
      body: JSON.stringify({ organizationId: created.data.id }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">Hello, {userName}</p>
      <h1 className="mt-3 text-5xl">Name the brokerage</h1>
      <p className="mt-3 text-muted">Listings, customers, and enquiries stay inside this firm. Other brokerages cannot see them.</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl border border-line bg-card p-6">
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Brokerage name</span>
          <input name="name" required minLength={2} maxLength={80} className="field" placeholder="Harbour & Co" />
        </label>
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        <button disabled={pending} className="rounded-full bg-pine px-5 py-2.5 text-sm text-paper disabled:opacity-60">
          {pending ? "Creating…" : "Create brokerage"}
        </button>
      </form>
    </main>
  );
}

export function SampleButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <div>
      <button
        disabled={pending}
        className="rounded-full border border-line bg-card px-4 py-2 text-sm disabled:opacity-60"
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await send("/api/sample", { method: "POST" });
            router.refresh();
          } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not add sample inventory.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Adding…" : "Add sample inventory"}
      </button>
      {error ? <p className="mt-2 text-sm text-clay">{error}</p> : null}
    </div>
  );
}

export function OrgPicker({ memberships }: { memberships: Membership[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-5xl">Choose a brokerage</h1>
      <div className="mt-8 space-y-3">
        {memberships.map((membership) => (
          <button
            key={membership.organizationId}
            className="block w-full rounded-2xl border border-line bg-card px-4 py-3 text-left"
            onClick={async () => {
              setError(null);
              try {
                await authClient.organization.setActive({ organizationId: membership.organizationId });
                await send("/api/organizations/active", {
                  method: "POST",
                  body: JSON.stringify({ organizationId: membership.organizationId }),
                });
                router.refresh();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Could not switch brokerage.");
              }
            }}
          >
            <span className="block text-lg">{membership.name}</span>
            <span className="text-sm text-muted">{membership.role}</span>
          </button>
        ))}
      </div>
      {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
    </main>
  );
}
