import Link from "next/link";

type StudioNavbarProps = {
  drawerId: string;
  title?: string;
};

export default function StudioNavbar({
  drawerId,
  title = "Studio",
}: StudioNavbarProps) {
  return (
    <div className="navbar bg-base-300 w-full">
      <div className="flex-none lg:hidden">
        <label
          htmlFor={drawerId}
          aria-label="open sidebar"
          className="btn btn-square btn-ghost"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block h-6 w-6 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </label>
      </div>
      <div className="mx-2 flex-1 px-2">{title}</div>
      <div className="hidden flex-none lg:block">
        <ul className="menu menu-horizontal">
          <li>
            <Link href="/">Help</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
