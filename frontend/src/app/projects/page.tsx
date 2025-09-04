"use client";
import {Card,CardContent,CardHeader,CardTitle} from "@/app/components/ui/card";
import {Button} from "@/app/components/ui/button";
import { Input } from "../components/ui/input";
import { useEffect,useState } from "react";
import { apiFetch } from "../lib/api-client";
import {toast} from "sonner";


export default function ProjectPage(){
    const [ projects,setProjects]=useState<any[]>([]);
    const [name,setName]=useState("");
    const [loading,setLoading]=useState(false);
    const [editingId,setEditingId]=useState<string | null>(null);
    const [editName,setEditName]=useState("");

    const load=async()=>{
        try{
            const list=await apiFetch<any[]>(`/projects`);
            setProjects(list || []);
        }catch(e:any){
            toast.error(e.message || "Failed to load projects");
        }
    };
    useEffect(()=>{
        load();
    },[]);
}

