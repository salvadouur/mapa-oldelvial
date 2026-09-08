"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", texto: "Contenidos" },
  { href: "/admin/carrusel", texto: "Carrusel" },
];

export default function NavAdmin() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {ITEMS.map((item) => {
        const activo =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activo ? "page" : undefined}
            className={`label-tech rounded px-3 py-2 transition-colors ${
              activo ? "bg-cyan/10 text-cyan" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {item.texto}
          </Link>
        );
      })}
    </nav>
  );
}
