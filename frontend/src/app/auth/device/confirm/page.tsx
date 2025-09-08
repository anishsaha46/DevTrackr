"use client"
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

type Status = 'loading' | 'success' | 'error' | 'expired';

export default function DeviceConfirmPage() {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceCode = searchParams.get('code');

  useEffect(() => {
    if (deviceCode) {
      confirmDevice(deviceCode);
    } else {
      setStatus('error');
      setMessage('No device code provided');
    }
  }, [deviceCode]);

  const confirmDevice = async (code: string) => {
    try {
      setStatus('loading');
      setMessage('Confirming device authorization...');

      const response = await fetch('http://localhost:8080/api/auth/device/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ deviceCode: code }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Extension connected successfully! You can close this tab and return to VS Code.');
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
      } else {
        const errorData = await response.json();
        setStatus('error');
        setMessage(errorData.error || 'Failed to confirm device authorization');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'expired':
        return <Clock className="h-12 w-12 text-yellow-500" />;
      default:
        return <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'expired':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-purple-800 rounded-lg flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Device Authorization
          </h2>
        </div>

        {/* Status Card */}
        <Card className={`${getStatusColor()} transition-all duration-300`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-xl">
              {status === 'loading' && 'Confirming Device...'}
              {status === 'success' && 'Device Connected!'}
              {status === 'error' && 'Authorization Failed'}
              {status === 'expired' && 'Code Expired'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{message}</p>
            
            {status === 'success' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  This window will close automatically in a few seconds.
                </p>
                <Button 
                  onClick={() => window.close()}
                  className="w-full"
                >
                  Close Window
                </Button>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Make sure you're logged in to the web app and try again.
                </p>
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => router.push('/login')}
                    className="flex-1"
                  >
                    Go to Login
                  </Button>
                </div>
              </div>
            )}
            
            {status === 'loading' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Please wait while we confirm your device authorization...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Make sure you're logged in to the web app first.
          </p>
        </div>
      </div>
    </div>
  );
}
