"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { CalendarIcon, Clock, Code2 } from "lucide-react"
import { cn } from "@/app/lib/utils"

interface Activity {
  id: string
  projectName: string
  language: string
  startTime: string
  endTime: string
  duration?: number
}

interface ActivityTimelineProps {
  activities: Activity[]
  title?: string
  showProject?: boolean
}

export function ActivityTimeline({
  activities,
  title = "Activity Timeline",
  showProject = true,
}: ActivityTimelineProps) {
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      JavaScript: "bg-yellow-100 text-yellow-800 border-yellow-200",
      TypeScript: "bg-blue-100 text-blue-800 border-blue-200",
      Python: "bg-green-100 text-green-800 border-green-200",
      Java: "bg-red-100 text-red-800 border-red-200",
      "C++": "bg-purple-100 text-purple-800 border-purple-200",
      Go: "bg-cyan-100 text-cyan-800 border-cyan-200",
      Rust: "bg-orange-100 text-orange-800 border-orange-200",
    }
    return colors[language] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">No activities yet</p>
            <p className="text-sm">Start coding to see your timeline</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>

          {activities.map((activity, index) => {
            const duration =
              activity.duration || new Date(activity.endTime).getTime() - new Date(activity.startTime).getTime()

            return (
              <div key={activity.id} className="flex gap-4 relative">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center z-10 shrink-0">
                  <Code2 className="h-4 w-4 text-primary-foreground" />
                </div>

                <div className="flex-1 bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      {showProject && (
                        <div className="font-semibold text-card-foreground mb-1">{activity.projectName}</div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("secondary", getLanguageColor(activity.language))}>
                          {activity.language}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{new Date(activity.startTime).toLocaleString()}</span>
                    </div>
                    <div className="text-xs">Ended at {new Date(activity.endTime).toLocaleTimeString()}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
