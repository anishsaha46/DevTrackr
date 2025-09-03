"use client";
import {Card,CardContent,CardTitle,CardHeader} from "@/app/components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useEffect,useState,useMemo} from "react";

import { apiFetch } from "../lib/api-client";
import {toast} from "sonner";


export default function ActivitiesPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [projectName, setProjectName] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPage = async (p:number, s:number) => {
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("size", String(s));
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (projectName) params.set("projectName", projectName);
    setLoading(true);
    try {
      const result = await apiFetch<{ content:any[]; totalPages?: number }>(`/activities/page2?${params.toString()}`);
      setRows(result?.content ?? []);
      setTotalPages(result?.totalPages ?? 1);
      setPage(p);
    } catch (e:any) {
      toast.error(e.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const apply = async () => {
    await fetchPage(0, size);
    toast.success("Filters applied");
  };

  useEffect(() => { fetchPage(0, size); }, []);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={e=>setTo(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted-foreground">Project</label>
            <Input placeholder="Project name" value={projectName} onChange={e=>setProjectName(e.target.value)} />
          </div>
          <Button onClick={apply} disabled={loading}>Apply</Button>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-muted-foreground">Rows</span>
            <Input type="number" min={5} max={50} value={size} onChange={e=>setSize(Math.max(5, Math.min(50, Number(e.target.value)||10)))} className="w-20" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Activities</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Date</th><th>Project</th><th>Language</th><th>Duration</th></tr>
              </thead>
              <tbody>
                {rows.map((a:any) => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2">{new Date(a.startTime).toLocaleString()}</td>
                    <td>{a.projectName}</td>
                    <td>{a.language}</td>
                    <td>{Math.max(0, (new Date(a.endTime).getTime()-new Date(a.startTime).getTime())/3600000).toFixed(2)} h</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td className="py-4 text-muted-foreground" colSpan={4}>No activities</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">Page {page+1} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fetchPage(Math.max(0, page-1), size)} disabled={page === 0 || loading}>Prev</Button>
              <Button variant="outline" onClick={() => fetchPage(Math.min(totalPages-1, page+1), size)} disabled={page >= totalPages-1 || loading}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
