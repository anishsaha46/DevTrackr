"use client"
import {Card,CardContent,CardHeader,CardTitle,CardDescription,CardFooter} from "@/app/components/ui/card";
import { Button } from "../components/ui/button";
import {Tabs,TabsContent,TabsList,TabsTrigger} from "@/app/components/ui/tabs";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser,getUserProjects,getUserActivities,getActivitySummary,getActivityHeatmap,getActivityTimeline } from "../lib/api";
import { Skeleton } from "../components/ui/skeleton";
import { Avatar,AvatarFallback,AvatarImage } from "../components/ui/avatar";
import { CalendarIcon, ClockIcon, CodeIcon, FolderIcon, GitBranchIcon, UserIcon, Monitor } from "lucide-react";
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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [timeline, setTimeline] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window !== "undefined") {
        let token = localStorage.getItem("token");
        if (!token) {
          token = sessionStorage.getItem("token");
          if (!token) {
            router.replace("/login");
            return;
          }
        }

        try {
          setLoading(true);
          // Fetch user data
          const userData = await getCurrentUser();
          if (!userData) {
            router.replace("/login");
            return;
          }
          setUser(userData);

          try {
            // Fetch projects
            const projectsData = await getUserProjects();
            setProjects(projectsData || []);

            // Fetch activities
            const activitiesData = await getUserActivities();
            setActivities(activitiesData || []);

            // Fetch summary
            const summaryData = await getActivitySummary();
            setSummary(summaryData || null);

            // Fetch heatmap
            const heatmapData = await getActivityHeatmap();
            setHeatmap(heatmapData || []);
          } catch (error) {
            console.error("Error fetching dashboard data:", error);
            if (error instanceof Error && error.message.includes("Unauthorized")) {
              router.replace("/login");
            }
          }

          // Fetch timeline
          const timelineData = await getActivityTimeline();
          setTimeline(timelineData?.content || []);
        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, [router]);

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

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with user info and logout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary">
            <AvatarImage src={user?.provider === "google" ? `https://www.gravatar.com/avatar/${user?.email}?d=mp` : ""} />
            <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name || user?.username || user?.email?.split("@")[0]}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
          <Badge>Beta</Badge>
        </div>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>

      {/* Main dashboard content */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Coding Time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Coding Time</CardTitle>
                <CardDescription>This week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {summary?.totalTime ? formatTime(summary.totalTime) : "No data"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Projects Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
                <CardDescription>Total projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FolderIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{projects?.length || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Activities Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Activities</CardTitle>
                <CardDescription>Total sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CodeIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{activities?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Projects</CardTitle>
              <CardDescription>Your most recent projects</CardDescription>
            </CardHeader>
            <CardContent>
              {projects && projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{project.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No projects found. Start creating projects to track your coding activities.
                </div>
              )}
            </CardContent>
            {projects && projects.length > 0 && (
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("projects")}>
                  View All Projects
                </Button>
              </CardFooter>
            )}
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your most recent coding sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{activity.projectName}</div>
                        <div className="text-sm text-muted-foreground">{activity.language}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {new Date(activity.startTime).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(
                            new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No activities found. Start coding to track your activities.
                </div>
              )}
            </CardContent>
            {activities && activities.length > 0 && (
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => setActiveTab("activities")}>
                  View All Activities
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>All your coding projects</CardDescription>
            </CardHeader>
            <CardContent>
              {projects && projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <FolderIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Created on {new Date(project.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No projects found. Start creating projects to track your coding activities.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Activities</CardTitle>
              <CardDescription>All your coding sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-2">
                      <div>
                        <div className="font-medium">{activity.projectName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <CodeIcon className="h-3 w-3" /> {activity.language}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm">
                          {new Date(activity.startTime).toLocaleString()} - {new Date(activity.endTime).toLocaleTimeString()}
                        </div>
                        <div className="text-sm text-muted-foreground text-right">
                          Duration: {formatTime(
                            new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No activities found. Start coding to track your activities.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>Your coding activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              {timeline && timeline.length > 0 ? (
                <div className="relative space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border"></div>
                  
                  {timeline.map((activity, index) => (
                    <div key={activity.id} className="flex gap-4 relative">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center z-10 mt-1">
                        <CalendarIcon className="h-3 w-3 text-primary-foreground" />
                      </div>
                      <div className="flex-1 bg-card border rounded-lg p-3">
                        <div className="font-medium">{activity.projectName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                          <CodeIcon className="h-3 w-3" /> {activity.language}
                        </div>
                        <div className="text-sm">
                          {new Date(activity.startTime).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Duration: {formatTime(
                            new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No timeline data available. Start coding to see your activity timeline.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Heatmap</CardTitle>
              <CardDescription>Your coding frequency</CardDescription>
            </CardHeader>
            <CardContent>
              {heatmap && heatmap.length > 0 ? (
                <div className="py-4">
                  <div className="text-center text-muted-foreground mb-6">
                    This is a simplified representation of your activity frequency.
                    Each entry represents a day with coding activity.
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div key={i} className="text-center text-xs text-muted-foreground">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2 mt-1">
                    {Array.from({ length: 52 * 7 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (52 * 7 - i));
                      const dateStr = date.toISOString().split('T')[0];
                      const entry = heatmap.find(h => h.date === dateStr);
                      const count = entry ? entry.count : 0;
                      let bgClass = 'bg-gray-100 dark:bg-gray-800';
                      if (count > 0) bgClass = 'bg-green-300 dark:bg-green-700';
                      if (count > 2) bgClass = 'bg-green-500 dark:bg-green-600';
                      if (count > 5) bgClass = 'bg-green-700 dark:bg-green-500';
                      
                      return (
                        <div 
                          key={i} 
                          className={`h-3 w-3 rounded-sm ${bgClass}`}
                          title={`${dateStr}: ${count} activities`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-end items-center gap-2 mt-4">
                    <div className="text-xs text-muted-foreground">Less</div>
                    <div className="h-3 w-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
                    <div className="h-3 w-3 rounded-sm bg-green-300 dark:bg-green-700" />
                    <div className="h-3 w-3 rounded-sm bg-green-500 dark:bg-green-600" />
                    <div className="h-3 w-3 rounded-sm bg-green-700 dark:bg-green-500" />
                    <div className="text-xs text-muted-foreground">More</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No heatmap data available. Start coding to see your activity heatmap.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Devices</CardTitle>
              <CardDescription>Manage devices that can track your coding activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Device Management</h3>
                <p className="text-muted-foreground mb-4">
                  View and manage all your connected devices from the dedicated devices page.
                </p>
                <Button onClick={() => window.open('/devices', '_blank')}>
                  Open Device Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
