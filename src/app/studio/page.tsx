import FileUploadCard from "@/components/FileUploadCard";
import StudioNavbar from "@/components/StudioNavbar";
import StudioSidebar from "@/components/StudioSidebar";

export default function StudioPage() {
  return (
    <div className="drawer lg:drawer-open">
      <input id="studio-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col">
        {/* Top Navbar */}
        <StudioNavbar drawerId="studio-drawer" title="Studio" />

        {/* Centered content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <FileUploadCard />
        </main>
      </div>

      {/* Sidebar */}
      <StudioSidebar drawerId="studio-drawer" active="studio" />
    </div>
  );
}
