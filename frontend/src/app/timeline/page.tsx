"use client"
import {Card,CardContent,CardTitle,CardHeader,CardFooter} from "@/app/components/ui/card";
import { Button } from "../components/ui/button";
import { useState,useEffect } from "react";
import { apiFetch } from "../lib/api-client";
import {toast} from "sonner";


export default function TimelinePage() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async (p:number, s:number) => {
    setLoading(true);
    try {
      const json = await apiFetch<{ content: any[]; totalPages?: number }>(`/reports/timeline?page=${p}&size=${s}`);
      setItems(json?.content || []);
      setTotalPages(json?.totalPages ?? 1);
      setPage(p);
    } catch (e:any) {
      toast.error(e.message || "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0, size); }, []);

  // Merge adjacent entries with same project within a short window to avoid clutter
  const merged = items
    .slice()
    .sort((a:any,b:any)=> new Date(b.startTime).getTime()-new Date(a.startTime).getTime())
    .reduce<any[]>((acc, cur) => {
      const last = acc[acc.length-1];
      const curStart = new Date(cur.startTime).getTime();
      const curEnd = new Date(cur.endTime).getTime();
      if (last && last.projectName === cur.projectName && Math.abs(last.prevStart - curStart) <= 5*60*1000) {
        last.totalMs += Math.max(0, curEnd - curStart);
        last.prevStart = Math.max(last.prevStart, curStart);
      } else {
        acc.push({ projectName: cur.projectName, language: cur.language, totalMs: Math.max(0, curEnd-curStart), prevStart: curStart });
      }
      return acc;
    }, []);

  return (
    <Card>
      <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
      <CardContent>
        <ol className="relative border-s pl-6">
          {merged.map((a:any, idx:number) => (
            <li key={idx} className="mb-6 ms-4">
              <div className="absolute w-3 h-3 bg-primary rounded-full mt-2.5 -start-1.5"></div>
              <time className="text-xs text-muted-foreground">{new Date(a.prevStart).toLocaleString()}</time>
              <h3 className="text-sm font-medium">{a.projectName}</h3>
              <p className="text-sm text-muted-foreground">{a.language} • {(a.totalMs/3600000).toFixed(3)}h</p>
            </li>
          ))}
          {merged.length === 0 && <div className="text-muted-foreground">No timeline entries</div>}
        </ol>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Page {page+1} of {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => load(Math.max(0, page-1), size)} disabled={page === 0 || loading}>Prev</Button>
            <Button variant="outline" onClick={() => load(Math.min(totalPages-1, page+1), size)} disabled={page >= totalPages-1 || loading}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
