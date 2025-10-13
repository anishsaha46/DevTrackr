"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Monitor, Smartphone, Laptop, Trash2, RefreshCw } from "lucide-react";
import { apiFetch } from "../lib/api-client";

type Device = {
  id: string;
  deviceName: string;
  deviceType: string;
  deviceId: string;
  status: string;
  isActive: boolean;
  lastSeen: string;
  createdAt: string;
};

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuthAndLoadDevices();
  }, []);

  const checkAuthAndLoadDevices = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      await loadDevices();
    } catch (error) {
      console.error("Error loading devices:", error);
      setError("Failed to load devices");
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const data = await apiFetch<Device[]>("/auth/device/devices");
      setDevices(data || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
      throw error;
    }
  };

  const revokeDevice = async (deviceId: string) => {
    if (!confirm("Are you sure you want to revoke this device? It will no longer be able to track activities.")) {
      return;
    }

    try {
      await apiFetch(`/auth/device/${deviceId}`, {
        method: 'DELETE'
      });
      
      // Reload devices
      await loadDevices();
    } catch (error) {
      console.error("Error revoking device:", error);
      setError("Failed to revoke device");
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'vscode-extension':
        return <Laptop className="h-5 w-5" />;
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Group by deviceId to avoid duplicate cards for same device
  const groupedDevices: Device[] = Object.values(
    devices.reduce<Record<string, Device>>((acc, d) => {
      const existing = acc[d.deviceId];
      if (!existing) {
        acc[d.deviceId] = d;
      } else {
        // Keep earliest connected, latest lastSeen, and latest status/active
        acc[d.deviceId] = {
          ...existing,
          id: d.id, // keep latest id for actions
          status: d.status || existing.status,
          isActive: d.isActive || existing.isActive,
          createdAt: new Date(existing.createdAt) < new Date(d.createdAt) ? existing.createdAt : d.createdAt,
          lastSeen: new Date(existing.lastSeen) > new Date(d.lastSeen) ? existing.lastSeen : d.lastSeen,
        };
      }
      return acc;
    }, {})
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Connected Devices</h1>
          <p className="text-muted-foreground">
            Manage devices that can track your coding activities
          </p>
        </div>
        <Button 
          onClick={loadDevices}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Devices Grid (deduped by deviceId) */}
      {groupedDevices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedDevices.map((device) => (
            <Card key={device.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getDeviceIcon(device.deviceType)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{device.deviceName}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {device.deviceType.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(device.status, device.isActive)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device ID:</span>
                    <span className="font-mono text-xs">{device.deviceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Seen:</span>
                    <span>{formatDate(device.lastSeen)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connected:</span>
                    <span>{formatDate(device.createdAt)}</span>
                  </div>
                </div>
                
                {device.isActive && (
                  <Button
                    onClick={() => revokeDevice(device.id)}
                    variant="destructive"
                    size="sm"
                    className="w-full flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Revoke Access
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Devices Connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect your VS Code extension to start tracking your coding activities.
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>How to Connect a Device</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">VS Code Extension:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Install the CodeTracker extension from the VS Code marketplace</li>
              <li>Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)</li>
              <li>Run "CodeTracker: Login" command</li>
              <li>Complete the login process in your browser</li>
              <li>The extension will automatically start tracking your activities</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
