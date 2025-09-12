"use client";
import {
    FileSpreadsheet,
    FileUp,
    Home,
    LineChart,
    PencilRuler,
    PlayCircle,
    Sliders,
} from "lucide-react";
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
  const currentDatasetId = (() => {
    const m = pathname?.match(/^\/studio\/(preprocess|train|results)\/([^/]+)/);
    return m?.[2];
  })();
  const linkFor = (base: string) => {
    if (currentDatasetId) return `${base}/${currentDatasetId}`;
    return base;
  };
  return (
    <div className="drawer-side">
      <label
        htmlFor={drawerId}
        aria-label="close sidebar"
        className="drawer-overlay"
      ></label>
      <ul className="menu bg-base-200 min-h-full w-56 p-4">
        <li className="menu-title">Navigation</li>
        <li>
          <Link
            href="/"
            className={isActive("/", true) ? "active text-accent" : undefined}
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </li>
        <li>
          <Link
            href="/studio"
            className={isActive("/studio") ? "active text-accent" : undefined}
          >
            <PencilRuler className="h-4 w-4" />
            Studio
          </Link>
        </li>
        <li className="menu-title">Resources</li>
        <li>
          <Link
            href="/studio"
            className={
              isActive("/studio", true) ? "active text-accent" : undefined
            }
          >
            <FileUp className="h-4 w-4" />
            Upload
          </Link>
        </li>
        <li>
          <Link
            href="/studio/datasets"
            className={
              isActive("/studio/datasets") ? "active text-accent" : undefined
            }
          >
            <FileSpreadsheet className="h-4 w-4" />
            Datasets
          </Link>
        </li>
        <li className="menu-title">Workflows</li>
        <li>
          <Link
            href={linkFor("/studio/preprocess")}
            className={
              isActive("/studio/preprocess") ? "active text-accent" : undefined
            }
          >
            <Sliders className="h-4 w-4" />
            Preprocess
          </Link>
        </li>
        <li>
          <Link
            href={linkFor("/studio/train")}
            className={
              isActive("/studio/train") ? "active text-accent" : undefined
            }
          >
            <PlayCircle className="h-4 w-4" />
            Training
          </Link>
        </li>
        <li>
          <Link
            href={linkFor("/studio/results")}
            className={
              isActive("/studio/results") ? "active text-accent" : undefined
            }
          >
            <LineChart className="h-4 w-4" />
            Results
          </Link>
        </li>
      </ul>
    </div>
  );
}
