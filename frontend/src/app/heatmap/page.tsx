"use client"
import {Card,CardContent,CardTitle,CardHeader,CardFooter} from "@/app/components/ui/card";
import { useState,useEffect,useMemo} from "react";
import { apiFetch } from "../lib/api-client";

export default function HeatmapPage() {
  const [data, setData] = useState<{date:string; activityLevel:number}[]>([]);
  const year = new Date().getFullYear();

  useEffect(() => {
    apiFetch<{date:string; activityLevel:number}[]>(`/reports/heatmap?year=${year}`)
      .then(response => response ? setData(response) : setData([]))
      .catch(()=>setData([]));
  }, [year]);

  const map = useMemo(() => {
    const m: Record<string, number> = {};
    data.forEach(d => { m[d.date] = d.activityLevel; });
    return m;
  }, [data]);

  const days = 365;
  const start = new Date(year,0,1).getTime();

  return (
    <Card>
      <CardHeader><CardTitle>Heatmap {year}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid" style={{ gridTemplateColumns: `repeat(53, 12px)` }}>
          {Array.from({length: days}).map((_,i)=>{
            const d = new Date(start + i*86400000);
            const key = d.toISOString().slice(0,10);
            const c = map[key] || 0;
            const bg = c === 0 ? "bg-gray-100" : c < 2 ? "bg-green-200" : c < 5 ? "bg-green-400" : "bg-green-600";
            return <div key={key} className={`w-3 h-3 ${bg} m-[2px] rounded-sm`} title={`${key}: ${c}`}/>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
