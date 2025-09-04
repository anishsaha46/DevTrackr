"use client";
import {Card,CardContent,CardHeader,CardTitle} from "@/app/components/ui/card";
import {Button} from "@/app/components/ui/button";
import { Input } from "../components/ui/input";
import { useEffect,useState } from "react";
import { apiFetch } from "../lib/api-client";
import {toast} from "sonner";


export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    try {
      const list = await apiFetch<any[]>(`/projects`);
      setProjects(list || []);
    } catch (e:any) {
      toast.error(e.message || "Failed to load projects");
    }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await apiFetch(`/projects`, { method: "POST", body: JSON.stringify({ name }), headers: { "Content-Type": "application/json" } });
      toast.success("Project created");
      setName("");
      load();
    } catch (e:any) {
      toast.error(e.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    setLoading(true);
    try {
      await apiFetch(`/projects/${id}`, { method: "DELETE" });
      toast.success("Project deleted");
      load();
    } catch (e:any) {
      toast.error(e.message || "Failed to delete project");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p:any) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const saveEdit = async (id:string) => {
    if (!editName.trim()) return;
    setLoading(true);
    const old = projects.slice();
    setProjects(prev => prev.map(p => p.id===id? { ...p, name: editName }: p));
    try {
      await apiFetch(`/projects/${id}`, { method: "PUT", body: JSON.stringify({ name: editName }), headers: { "Content-Type": "application/json" } });
      toast.success("Project updated");
      setEditingId(null);
    } catch (e:any) {
      toast.error(e.message || "Failed to update project");
      setProjects(old);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Projects</CardTitle>
          <div className="flex gap-2">
            <Input placeholder="New project name" value={name} onChange={e => setName(e.target.value)} />
            <Button onClick={add} disabled={loading}>Add</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr><th className="py-2">Name</th><th>Created</th><th>Updated</th><th>Activities</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {projects.map((p:any) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-2 font-medium">
                      {editingId === p.id ? (
                        <Input value={editName} onChange={e=>setEditName(e.target.value)} />
                      ) : (
                        p.name
                      )}
                    </td>
                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                    <td>{new Date(p.updatedAt).toLocaleString()}</td>
                    <td>{p.activityCount ?? 0}</td>
                    <td>
                      <div className="flex gap-2">
                        {editingId === p.id ? (
                          <>
                            <Button variant="outline" onClick={() => saveEdit(p.id)} disabled={loading}>Save</Button>
                            <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" onClick={() => location.assign(`/projects/${p.id}`)}>View</Button>
                            <Button variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                            <Button variant="destructive" onClick={() => del(p.id)} disabled={loading}>Delete</Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && <tr><td className="py-4 text-muted-foreground" colSpan={5}>No projects yet</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
