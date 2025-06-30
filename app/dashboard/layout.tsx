// app/dashboard/layout.tsx
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Suspense } from "react"; // ✅ Importe Suspense
import Loading from "./loading";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8">
          {/* ✅ Envolve children com Suspense. O fallback será o componente Loading */}
          <Suspense fallback={<Loading />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}