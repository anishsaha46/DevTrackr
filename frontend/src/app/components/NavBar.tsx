"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";

export default function NavBar() {
  const [isAuthed, setIsAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    setIsAuthed(Boolean(token));
    const onStorage = () => setIsAuthed(Boolean(localStorage.getItem("token")));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthed(false);
    router.replace("/login");
  };

  return (
    <nav className="w-full flex justify-between items-center px-8 py-4 border-b bg-background/80 sticky top-0 z-50">
      <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">CodeTracker</Link>
      {isAuthed ? (
        <div className="flex items-center gap-3">
          <Link href="/dashboard"><Button variant="outline">Dashboard</Button></Link>
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">U</div>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link href="/login"><Button>Login</Button></Link>
          <Link href="/register"><Button variant="secondary">Register</Button></Link>
          <Link href="/dashboard"><Button variant="outline">Dashboard</Button></Link>
        </div>
      )}
    </nav>
  );
}
