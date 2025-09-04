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