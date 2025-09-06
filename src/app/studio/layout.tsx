import StudioNavbar from "@/components/StudioNavbar";
import StudioSidebar from "@/components/StudioSidebar";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="drawer lg:drawer-open">
      <input id="studio-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        <StudioNavbar drawerId="studio-drawer" title="Studio" />
        <main className="flex-1 flex items-start justify-center p-6">{children}</main>
      </div>

      <StudioSidebar drawerId="studio-drawer" />
    </div>
  );
}

