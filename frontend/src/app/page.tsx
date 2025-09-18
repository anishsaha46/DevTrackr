
"use client";
import { CardContent,CardHeader,CardTitle,CardFooter,Card } from "./components/ui/card";
import { useEffect,useState,useMemo } from "react";
import { apiFetch } from "./lib/api-client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";


type Overview = {
  totalProjects: number;
  totalActivities: number;
  recentProject?: { id: string; name: string; createdAt: string } | null;
  recentActivity?: { id: string; name: string; createdAt: string } | null;
  weekActivityCount: number;
  monthActivityCount: number;
};

type Activity = { startTime: string; endTime: string; projectName: string; language: string; };

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [recent, setRecent] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const ov = await apiFetch<Overview>(`/overview`);
        setOverview(ov || null);
        const page = await apiFetch<{ content: Activity[] }>(`/activities/page?page=0&size=50`);
        setRecent(page?.content || []);
      } catch (e:any) {
        toast.error(e.message || "Failed to load dashboard");
      }
    };
    fetchAll();
  }, []);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    recent.forEach(a => {
      const day = new Date(a.startTime).toLocaleDateString();
      const dur = Math.max(0, (new Date(a.endTime).getTime()-new Date(a.startTime).getTime())/3600000);
      map.set(day, (map.get(day) || 0) + dur);
    });
    return Array.from(map.entries()).map(([day, hours]) => ({ day, hours }));
  }, [recent]);

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Total Projects</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{overview?.totalProjects ?? "–"}</CardContent></Card>
        <Card><CardHeader><CardTitle>Total Activities</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{overview?.totalActivities ?? "–"}</CardContent></Card>
        <Card><CardHeader><CardTitle>Active This Week</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{overview?.weekActivityCount ?? "–"}</CardContent></Card>
        <Card><CardHeader><CardTitle>Active This Month</CardTitle></CardHeader><CardContent className="text-3xl font-semibold">{overview?.monthActivityCount ?? "–"}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Activity (Hours by Day)</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="hours" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Activities</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Date</th><th>Project</th><th>Language</th><th>Duration</th></tr>
              </thead>
              <tbody>
                {recent.slice(0,5).map((a, idx) => (
                  <tr key={`${a.startTime}-${idx}`} className="border-t">
                    <td className="py-2">{new Date(a.startTime).toLocaleString()}</td>
                    <td>{a.projectName}</td>
                    <td>{a.language}</td>
                    <td>{Math.max(0, (new Date(a.endTime).getTime()-new Date(a.startTime).getTime())/3600000).toFixed(2)} h</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td className="py-4 text-muted-foreground" colSpan={4}>No recent activities</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

