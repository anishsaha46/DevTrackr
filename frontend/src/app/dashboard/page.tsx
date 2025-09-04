"use client"
import {Card,CardContent,CardHeader,CardTitle,CardDescription,CardFooter} from "@/app/components/ui/card";
import { Button } from "../components/ui/button";
import {Tabs,TabsContent,TabsList,TabsTrigger} from "@/app/components/ui/tabs";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser,getUserProjects,getUserActivities,getActivitySummary,getActivityHeatmap,getActivityTimeline } from "../lib/api";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar,AvatarFallback,AvatarImage } from "../components/ui/avatar";
import { CalendarIcon, ClockIcon, CodeIcon, FolderIcon, GitBranchIcon, UserIcon } from "lucide-react";
import { Badge } from "../components/ui/badge";


// Types for our data
type User = {
  id: string;
  email: string;
  name: string;
  username: string;
  provider: string;
};

type Project = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type Activity = {
  id: string;
  userId: string;
  projectName: string;
  language: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
};

type Summary = {
  totalTime: number;
  byLanguage: Record<string, number>;
  byProject: Record<string, number>;
};

type HeatmapEntry = {
  date: string;
  count: number;
};

export default function DashboardPage(){
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [timeline, setTimeline] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(()=>{
    const checkAuth = async()=>{
        if(typeof window !== "undefined"){
            let token=localStorage.getItem("token");
            if(!token){
                token=sessionStorage.getItem("token");
                if(!token){
                    router.replace("/login");
                    return;
                }
            }

            try{
                const userData=await getCurrentUser();
                if(!userData){
                    router.replace("/login");
                    return;
                }
                setUser(userData);

                const projectData= await getUserProjects();
                setProjects(projectData || []);

                const activitiesData= await getUserActivities();
                setActivities(activitiesData || []);

                const summaryData= await getActivitySummary();
                setSummary(summaryData || null);

                const heatmapData= await getActivityHeatmap();
                setHeatmap(heatmapData || []);

                const timelineData= await getActivityTimeline();
                setTimeline(timelineData?.content || []);
            }catch(error){
                console.log("Error fetching dashboard data",error);
            }finally{
                setLoading(false);
            }
        }
    }
    checkAuth();
  }),[router]}

    const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  // Format milliseconds to hours and minutes
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };