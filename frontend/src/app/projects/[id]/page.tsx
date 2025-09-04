"use client"
import { Card, CardContent, CardTitle, CardHeader, CardFooter } from "@/app/components/ui/card";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/app/lib/api-client";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [project, setProject] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const p = await apiFetch<any>(`/projects/${id}`);
      setProject(p);
      // fetch activities by project name
      if (p?.name) {
        const acts = await apiFetch<any[]>(`/activities/by-project/${encodeURIComponent(p.name)}`);
        setActivities(acts ?? []);
      }
    };
    load();
  }, [id]);

  if (!project) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader><CardTitle>{project.name}</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div>Project ID: {project.id}</div>
          <div>Created: {new Date(project.createdAt).toLocaleString()}</div>
          <div>Updated: {new Date(project.updatedAt).toLocaleString()}</div>
          <div>Activities: {project.activityCount ?? 0}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Activities</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Date</th><th>Language</th><th>Duration</th></tr>
              </thead>
              <tbody>
                {activities.map((a:any) => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2">{new Date(a.startTime).toLocaleString()}</td>
                    <td>{a.language}</td>
                    <td>{Math.max(0, (new Date(a.endTime).getTime()-new Date(a.startTime).getTime())/3600000).toFixed(2)} h</td>
                  </tr>
                ))}
                {activities.length === 0 && <tr><td className="py-4 text-muted-foreground" colSpan={3}>No activities yet</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
