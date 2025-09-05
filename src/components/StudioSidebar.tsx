import Link from "next/link";

type StudioSidebarProps = {
  drawerId: string;
  active?: "home" | "studio";
};

export default function StudioSidebar({ drawerId, active = "studio" }: StudioSidebarProps) {
  return (
    <div className="drawer-side">
      <label htmlFor={drawerId} aria-label="close sidebar" className="drawer-overlay"></label>
      <ul className="menu bg-base-200 min-h-full w-80 p-4">
        <li className="menu-title">Navigation</li>
        <li>
          <Link href="/" className={active === "home" ? "active" : undefined}>
            Home
          </Link>
        </li>
        <li>
          <Link href="/studio" className={active === "studio" ? "active" : undefined}>
            Studio
          </Link>
        </li>
      </ul>
    </div>
  );
}

