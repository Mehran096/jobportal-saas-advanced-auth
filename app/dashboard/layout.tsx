import DashboardHeader from "@/app/components/DashboardHeader";
import DashboardMobileNav from "@/app/components/DashboardMobileNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-[88px] md:pb-6">
        {children}
      </main>
      <DashboardMobileNav />
    </div>
  );
}