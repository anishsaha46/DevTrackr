import * as vscode from 'vscode';
import fetch from 'node-fetch';
import * as path from 'path';

// Interface defining the structure of activity data sent to the server
interface ActivityData {
  projectId: string;      // Unique identifier for the project
  language: string;       // Programming language of the file
  file: string;          // File name/path
  timeSpent: number;     // Time spent in seconds
  timestamp: string;     // ISO timestamp of the activity
  sessionId?: string;    // Optional session identifier
  fileExtension?: string; // Optional file extension
}

// Interface for tracking file activity locally before sending to server
interface FileActivity {
  fileName: string;   // Name of the file being tracked
  language: string;   // Programming language detected
  startTime: number;  // When tracking started (timestamp)
  totalTime: number;  // Total time accumulated so far
}

// Interface for queued activities waiting to be sent to server
interface QueuedActivity extends ActivityData {
  id: string;  // Unique identifier for queued item
}


export class ActivityTracker{
 // Private properties for managing tracking state
  private isTracking = false;                    // Whether tracking is currently active
  private currentActivity: FileActivity | null = null;  // Current file being tracked
  private statusBarItem: vscode.StatusBarItem;   // VS Code status bar indicator
  private syncTimer: NodeJS.Timeout | null = null;      // Timer for periodic sync to server
  private context: vscode.ExtensionContext;      // VS Code extension context
  private lastActivityTime = Date.now();         // Last time user was active
  private inactivityThreshold = 30000;           // 30 seconds - time before considering user inactive
  private activityQueue: QueuedActivity[] = [];  // Queue of activities to send to server
  private lastErrorTime = 0;                     // Last time an error was shown
  private errorCooldown = 300000;                // 5 minutes between error notifications
  private offlineCache: QueuedActivity[] = [];   // Cache for when server is unreachable
  private currentSessionId: string = '';         // Current tracking session identifier
  
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    
    // Create status bar item on the right side with priority 100
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    // Set command to execute when status bar item is clicked
    this.statusBarItem.command = 'activity-tracker.toggleTracking';
    // Update the status bar display and make it visible
    this.updateStatusBar();
    this.statusBarItem.show();
    
    // Load any previously cached offline activities on startup
    this.loadOfflineCache();
  }
}