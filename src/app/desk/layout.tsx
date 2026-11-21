import Link from "next/link";
import { OrgGate, OrgPicker, OrgSwitcher, SignOutButton } from "@/components/desk-controls";
import { loadDesk } from "@/lib/desk";
import { label } from "@/lib/labels";

const links = [
  { href: "/desk", label: "Today" },
  { href: "/desk/properties", label: "Properties" },
  { href: "/desk/customers", label: "Customers" },
  { href: "/desk/enquiries", label: "Enquiries" },
];

export const dynamic = "force-dynamic";

export default async function DeskLayout({ children }: { children: React.ReactNode }) {
  const desk = await loadDesk();
  if (!desk.ctx && desk.memberships.length === 0) return <OrgGate userName={desk.user.name} />;
  if (!desk.ctx) return <OrgPicker memberships={desk.memberships} />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="flex flex-col bg-pine px-5 py-6 text-paper lg:min-h-screen">
        <Link href="/desk" className="font-serif text-3xl leading-none">
          PropertyAgent
        </Link>
        <p className="mt-2 text-sm text-sand/80">{desk.ctx.organizationName}</p>
        <p className="text-xs uppercase tracking-[0.16em] text-sand/60">{label(desk.ctx.role)}</p>
        <div className="mt-6">
          <OrgSwitcher memberships={desk.memberships} activeId={desk.ctx.organizationId} />
        </div>
        <nav className="mt-8 flex gap-4 lg:flex-col lg:gap-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-3 py-1.5 text-sm text-sand hover:bg-white/10">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 lg:mt-auto">
          <p className="text-sm">{desk.user.name}</p>
          <SignOutButton />
        </div>
      </aside>
      <div className="px-5 py-8 lg:px-10">{children}</div>
    </div>
  );
}
