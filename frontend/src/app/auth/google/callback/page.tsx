"use client";
import { useState,useEffect } from "react";
import { useRouter,useSearchParams } from "next/navigation";
import { handleGoogleCallback } from "@/app/lib/api";

import { Card,CardContent,CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

export default function GoogleCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    
    if (!code) {
      setStatus("error");
      setError("No authorization code received from Google");
      return;
    }

    const processGoogleAuth = async () => {
      try {
        setStatus("loading");
        const result = await handleGoogleCallback(code);
        
        if (result.token) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("google_token", result.google_token);
          setStatus("success");
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          throw new Error("No token received");
        }
      } catch (err: any) {
        setStatus("error");
        setError(err.message || "Google authentication failed");
      }
    };

    processGoogleAuth();
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <CardTitle className="text-xl mb-2">Processing Google Authentication</CardTitle>
            <p className="text-gray-600">Please wait while we complete your login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-xl mb-2 text-green-600">Authentication Successful!</CardTitle>
            <p className="text-gray-600 mb-4">You have been successfully logged in with Google.</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <CardTitle className="text-xl mb-2 text-red-600">Authentication Failed</CardTitle>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/login")} className="w-full">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/")} className="w-full">
              Go to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
