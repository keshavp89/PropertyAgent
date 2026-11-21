"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message || "Could not sign in.");
      return;
    }
    router.push("/desk");
    router.refresh();
  }

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to the brokerage desk.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Label text="Email">
          <input name="email" type="email" required autoComplete="email" className="field" />
        </Label>
        <Label text="Password">
          <input name="password" type="password" required minLength={8} autoComplete="current-password" className="field" />
        </Label>
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        <button disabled={pending} className="w-full rounded-full bg-pine px-4 py-2.5 text-sm text-paper disabled:opacity-60">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted">
        New firm? <Link href="/auth/sign-up" className="text-pine">Create an account</Link>
      </p>
    </AuthCard>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await authClient.signUp.email({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message || "Could not create the account.");
      return;
    }
    router.push("/desk");
    router.refresh();
  }

  return (
    <AuthCard title="Create your seat" subtitle="You will name the brokerage on the next step.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Label text="Your name">
          <input name="name" required minLength={2} maxLength={80} autoComplete="name" className="field" />
        </Label>
        <Label text="Email">
          <input name="email" type="email" required autoComplete="email" className="field" />
        </Label>
        <Label text="Password">
          <input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="field" />
        </Label>
        {error ? <p className="text-sm text-clay">{error}</p> : null}
        <button disabled={pending} className="w-full rounded-full bg-pine px-4 py-2.5 text-sm text-paper disabled:opacity-60">
          {pending ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have a seat? <Link href="/auth/sign-in" className="text-pine">Sign in</Link>
      </p>
    </AuthCard>
  );
}

function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">PropertyAgent</p>
      <h1 className="mt-3 text-5xl">{title}</h1>
      <p className="mt-2 text-muted">{subtitle}</p>
      <div className="mt-8 rounded-3xl border border-line bg-card p-6">{children}</div>
    </main>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-muted">{text}</span>
      {children}
    </label>
  );
}
