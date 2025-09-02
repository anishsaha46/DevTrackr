"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Item = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link href={href} className={`px-4 py-2 rounded-md text-sm ${active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}>
      {label}
    </Link>
  );
};

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:flex-col gap-2 p-4 w-56 border-r h-[calc(100vh-64px)] sticky top-16">
      <Item href="/" label="Dashboard" />
      <Item href="/projects" label="Projects" />
      <Item href="/activities" label="Activities" />
      <Item href="/timeline" label="Timeline" />
      <Item href="/heatmap" label="Heatmap" />
    </aside>
  );
}
