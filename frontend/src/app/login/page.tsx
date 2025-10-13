"use client"
import {Card,CardContent,CardTitle,CardHeader,CardFooter} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "../lib/api";
import { setAuthToken } from "../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.token) {
        setAuthToken(data.token, rememberMe);
        
        // Check if there is a redirect parameter in the URL
        const redirectUrl = searchParams.get('redirect');
        
        // If there is, push to that URL. Otherwise, go to the dashboard.
        router.push(redirectUrl || "/dashboard");
      } else {
        setError("No token received");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration & Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-orange-100 to-pink-100 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-red-300 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-400 rounded-full opacity-50 animate-pulse delay-1000"></div>
          <div className="absolute bottom-40 left-20 w-20 h-20 bg-maroon-300 rounded-full opacity-70 animate-pulse delay-500"></div>
          <div className="absolute bottom-20 right-10 w-28 h-28 bg-orange-400 rounded-full opacity-60 animate-pulse delay-1500"></div>
          
          {/* Scattered Dots */}
          <div className="absolute top-32 left-32 w-3 h-3 bg-red-400 rounded-full"></div>
          <div className="absolute top-48 right-32 w-2 h-2 bg-purple-500 rounded-full"></div>
          <div className="absolute bottom-32 left-40 w-2 h-2 bg-maroon-400 rounded-full"></div>
          <div className="absolute bottom-48 right-40 w-3 h-3 bg-orange-500 rounded-full"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col justify-center items-center h-full p-12 text-center">
          {/* DevTrackr Logo */}
          <div className="absolute top-0 left-0 p-8">
            <Link href="/" className="text-2xl font-bold text-purple-900 hover:text-purple-700 transition-colors">
              DevTrackr
            </Link>
          </div>

          {/* Skeleton Illustration */}
          <div className="mb-8 relative">
            {/* Skeleton */}
            <div className="w-48 h-48 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
              <div className="w-32 h-32 bg-gray-300 rounded-full"></div>
            </div>
            
            {/* Laptop */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <div className="w-32 h-20 bg-gray-400 rounded-lg flex items-center justify-center">
                <div className="w-24 h-12 bg-gray-500 rounded flex items-center justify-center">
                  <div className="w-6 h-6 bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>

            {/* Speech Bubbles */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">...</span>
            </div>
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-purple-800 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">...</span>
            </div>

            {/* Foliage */}
            <div className="absolute -bottom-2 left-4 w-6 h-6 bg-red-400 rounded-full"></div>
            <div className="absolute -bottom-2 right-4 w-6 h-6 bg-orange-400 rounded-full"></div>
            <div className="absolute -bottom-4 left-8 w-4 h-4 bg-purple-400 rounded-full"></div>
          </div>

          {/* Marketing Text */}
          <h1 className="text-3xl font-bold text-purple-900 mb-4">
            Turn your ideas into reality
          </h1>
          <p className="text-lg text-purple-700 max-w-md">
            Start for free and get attractive offers from the community
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-purple-800 rounded-lg flex items-center justify-center">
              <div className="grid grid-cols-2 gap-1">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Login to your Account
            </h2>
            <p className="text-gray-600">
              See what is going on with your business
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3">
            {/* Use direct Google OAuth URL and compute redirect from current origin */}
            <a
              href={`https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "")}&redirect_uri=${encodeURIComponent((typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000') + '/auth/google/callback')}&response_type=code&scope=${encodeURIComponent("openid profile email")}&access_type=online&prompt=consent`}
              className="w-full"
            >
              <Button 
                variant="outline" 
                className="w-full h-12 text-base mb-6 border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] transform"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </a>
            
            <a href="http://localhost:8080/oauth2/authorization/github" className="w-full">
              <Button 
                variant="outline" 
                className="w-full h-12 text-base transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:bg-gray-50 active:scale-[0.98] transform"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </Button>
            </a>
          </div>

          {/* Separator */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or Sign in with Email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="mail@abc.com"
                required
                className="h-12 text-base border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 text-base border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-700">Remember Me</span>
              </label>
              <Link href="#" className="text-sm text-purple-600 hover:text-purple-700">
                Forgot Password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium bg-purple-800 hover:bg-purple-900 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] transform" 
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-8">
            <span className="text-gray-600">
              Not Registered Yet?{" "}
              <Link href="/register" className="text-purple-600 hover:text-purple-700 font-medium">
                Create an account
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}