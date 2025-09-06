"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type StudioSidebarProps = {
  drawerId: string;
};

export default function StudioSidebar({ drawerId }: StudioSidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  };
  return (
    <div className="drawer-side">
      <label
        htmlFor={drawerId}
        aria-label="close sidebar"
        className="drawer-overlay"
      ></label>
      <ul className="menu bg-base-200 min-h-full w-80 p-4">
        <li className="menu-title">Navigation</li>
        <li>
          <Link href="/" className={isActive("/", true) ? "active" : undefined}>
            Home
          </Link>
        </li>
        <li>
          <Link
            href="/studio"
            className={isActive("/studio", true) ? "active" : undefined}
          >
            Studio
          </Link>
        </li>
        <li>
          <Link
            href="/studio/datasets"
            className={isActive("/studio/datasets") ? "active" : undefined}
          >
            Datasets
          </Link>
        </li>
      </ul>
    </div>
  );
}
