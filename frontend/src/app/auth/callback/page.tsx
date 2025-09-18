"use client";
import { useEffect,useState } from "react";
import { useRouter,useSearchParams } from "next/navigation";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Missing token in callback");
      return;
    }
    try {
      localStorage.setItem("token", token);
      router.replace("/dashboard");
    } catch (e) {
      setError("Failed to persist session");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {!error ? (
        <p className="text-sm text-gray-600">Finalizing sign-in…</p>
      ) : (
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button className="underline" onClick={() => router.replace("/login")}>
            Go to login
          </button>
        </div>
      )}
    </div>
  );
}
