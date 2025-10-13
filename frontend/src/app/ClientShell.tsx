"use client";
import Sidebar from "./components/Sidebar";
import NavBar from "./components/NavBar";
import { usePathname } from "next/navigation";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/login")
    || pathname?.startsWith("/register")
    || pathname?.startsWith("/auth/");

  return (
    <>
      {!isAuthRoute && <NavBar />}
      <div className="w-full flex">
        {!isAuthRoute && <Sidebar />}
        <main className="flex-1 p-6 max-w-[1200px] mx-auto">{children}</main>
      </div>
    </>
  );
}


