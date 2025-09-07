import * as vscode from 'vscode';
import fetch from 'node-fetch';
import * as path from 'path';
import { scheduler } from 'timers/promises';

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



  // Get configuration settings from VS Code settings and secure storage
  private async getConfiguration() {
    const config = vscode.workspace.getConfiguration('activityTracker');
    
    // Try to get JWT token from secure storage first (recommended)
    let jwtToken = await this.context.secrets.get('activityTracker.jwtToken');
    if (!jwtToken) {
      // Fallback to old settings location
      jwtToken = config.get<string>('jwtToken', '');
      // If found in settings, migrate to secure storage for better security
      if (jwtToken) {
        await this.context.secrets.store('activityTracker.jwtToken', jwtToken);
        // Remove from settings to avoid storing sensitive data in plain text
        await config.update('jwtToken', undefined, vscode.ConfigurationTarget.Global);
      }
    }
    // Return configuration object with all needed settings
    return {
      apiEndpoint: config.get<string>('apiEndpoint', 'http://localhost:8080/api/activities'),
      projectId: this.detectProjectId(),
      syncInterval: config.get<number>('syncInterval', 60) * 1000, // Convert minutes to milliseconds
      jwtToken: jwtToken || ''
    };
  }

  // Determine the project ID based on the current workspace
  // Determine the project ID based on the current workspace
  private detectProjectId(document?: vscode.TextDocument): string {
    // If a specific document is provided, try to get its workspace folder
    if (document) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      if (workspaceFolder) {
        return workspaceFolder.name;
      }
    }
    
    // Fallback to the first available workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (workspaceFolder) {
      return workspaceFolder.name;
    }
    
    // Last resort: use configured project ID or default
    const config = vscode.workspace.getConfiguration('activityTracker');
    return config.get<string>('projectId', 'unknown-project');
  }

  // Update the status bar item display based on tracking state
  private updateStatusBar() {
    // Choose icon based on tracking state
    const icon = this.isTracking ? '$(pulse)' : '$(circle-outline)';
    // Set the text with icon and status
    this.statusBarItem.text = `${icon} Tracking: ${this.isTracking ? 'On' : 'Off'}`;
    // Set tooltip that appears on hover
    this.statusBarItem.tooltip = this.isTracking 
      ? 'Click to stop activity tracking' 
      : 'Click to start activity tracking';
  }

  // Detect programming language from VS Code document
  private getLanguageFromDocument(document: vscode.TextDocument): string | undefined {
    // Primary method: Use VS Code's built-in language detection
    if (document.languageId && document.languageId !== 'plaintext') {
      return document.languageId;
    }
    
    // Fallback method: Map file extension to language
    const fileName = document.fileName;
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    // Mapping of common file extensions to language names
    const extensionMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascriptreact',
      'ts': 'typescript',
      'tsx': 'typescriptreact',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'shellscript',
      'ps1': 'powershell',
      'sql': 'sql',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'vue': 'vue',
      'svelte': 'svelte'
    };
    
    // Return mapped language or the extension itself, or 'unknown' if no extension
    return extension ? (extensionMap[extension] || extension) : 'unknown';
  }

  // Extract file extension from document
  private getFileExtension(document: vscode.TextDocument): string {
    const fileName = document.fileName;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }


  // Get relative file path within the workspace
  private getRelativeFileName(document: vscode.TextDocument): string {
    // Try to get relative path from the document's workspace folder
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (workspaceFolder) {
      return vscode.workspace.asRelativePath(document.fileName, false);
    }
    
    // If no workspace folders, just return the file name
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      return path.basename(document.fileName);
    }
    
    // Default to VS Code's relative path calculation
    return vscode.workspace.asRelativePath(document.fileName, false);
  }

    // Generate a unique session ID for the current tracking session
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start tracking activity for a specific file
  private startFileActivity(document: vscode.TextDocument) {
    if (!this.isTracking) return;  // Don't start if tracking is disabled

    // Stop any currently tracked activity first
    this.stopCurrentActivity();

    // Create new activity tracking object
    this.currentActivity = {
      fileName: this.getRelativeFileName(document),
      language: this.getLanguageFromDocument(document) || 'unknown',
      startTime: Date.now(),  // Record when tracking started
      totalTime: 0            // Initialize accumulated time
    };

    // Update last activity time to current time
    this.lastActivityTime = Date.now();
  }

  // Stop tracking the current activity and queue it for sending
  private stopCurrentActivity() {
    if (this.currentActivity) {
      const now = Date.now();
      
      // Check if user has been inactive too long
      if (now - this.lastActivityTime > this.inactivityThreshold) {
        console.log('User was inactive, resetting current activity');
        this.currentActivity = null;  // Discard inactive session
        return;
      }
      
      // Calculate time spent on this activity
      const timeDiff = now - this.currentActivity.startTime;
      this.currentActivity.totalTime += timeDiff;
      
      // Only queue activities with meaningful duration (more than 5 seconds)
      if (this.currentActivity.totalTime > 5000) {
        this.queueActivity(this.currentActivity);
      }
    }
  }


    // Add completed activity to the queue for sending to server
  private async queueActivity(activity: FileActivity) {
    const activeEditor = vscode.window.activeTextEditor;
    const document = activeEditor?.document;
    const config = await this.getConfiguration();
    
    // Create queued activity object with all required data
    const queuedActivity: QueuedActivity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Unique ID
      projectId: document ? this.detectProjectId(document) : config.projectId,
      language: activity.language,
      file: activity.fileName,
      timeSpent: Math.round(activity.totalTime / 1000), // Convert milliseconds to seconds
      timestamp: new Date().toISOString(),              // Current timestamp in ISO format
      sessionId: this.currentSessionId,
      fileExtension: document ? this.getFileExtension(document) : undefined
    };

    // Add to queue and log for debugging
    this.activityQueue.push(queuedActivity);
    console.log('Queued activity:', queuedActivity);
  }

  // Handle user activity (typing, editing) to update timing
  private onDocumentChange() {
    this.lastActivityTime = Date.now();  // Update last activity timestamp
    
    // If currently tracking a file, update its timing
    if (this.currentActivity) {
      const now = Date.now();
      const timeDiff = now - this.currentActivity.startTime;
      this.currentActivity.totalTime += timeDiff;  // Add elapsed time
      this.currentActivity.startTime = now;        // Reset start time for next interval
    }
  }

  // Send batch of activities to the server
  private async sendActivityBatch(activities: QueuedActivity[]): Promise<boolean> {
    if (activities.length === 0) return true;  // Nothing to send
    
    try {
      const config = await this.getConfiguration();
      
      // Check if JWT token is configured
      if (!config.jwtToken) {
        console.warn('JWT token not configured for Activity Tracker');
        this.showErrorOnce('JWT token not configured. Please set up authentication.');
        return false;
      }

      // Try batch endpoint first (more efficient for multiple activities)
      const batchEndpoint = config.apiEndpoint.replace('/activities', '/activities/batch');
      
      try {
        // Attempt to send all activities in one batch request
        const batchResponse = await fetch(batchEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.jwtToken}`  // JWT authentication
          },
          body: JSON.stringify(activities)  // Send all activities as JSON array
        });

        // If batch request successful, we're done
        if (batchResponse.ok) {
          console.log(`Successfully sent ${activities.length} activities via batch API`);
          return true;
        } else if (batchResponse.status === 404) {
          // Batch endpoint doesn't exist, fall back to individual requests
          console.log('Batch endpoint not available, falling back to individual requests');
        } else {
          throw new Error(`Batch request failed: ${batchResponse.status}`);
        }
      } catch (batchError) {
        console.log('Batch send failed, trying individual requests:', batchError);
      }

      // Fallback: Send each activity individually
      const promises = activities.map(activity => 
        fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.jwtToken}`
          },
          body: JSON.stringify(activity)  // Send single activity
        })
      );

      // Wait for all individual requests to complete
      const responses = await Promise.allSettled(promises);
      const failures = responses.filter(r => r.status === 'rejected' || 
        (r.status === 'fulfilled' && !r.value.ok));

      // Check if all requests succeeded
      if (failures.length === 0) {
        console.log(`Successfully sent ${activities.length} activities individually`);
        return true;
      } else {
        console.error(`Failed to send ${failures.length}/${activities.length} activities`);
        return false;
      }

    } catch (error) {
      console.error('Failed to send activity batch:', error);
      this.showErrorOnce('Failed to sync activity data to server');
      return false;
    }
  }
  
  // Show error message with cooldown to prevent spam
  private showErrorOnce(message: string) {
    const now = Date.now();
    // Only show error if enough time has passed since last error
    if (now - this.lastErrorTime > this.errorCooldown) {
      vscode.window.showWarningMessage(message);
      this.lastErrorTime = now;
    }
  }
 

  // Periodic sync of activity data to server
  private async syncActivityData() {
    if (!this.isTracking) return;  // Don't sync if tracking is disabled

    const now = Date.now();
    
    // Handle current ongoing activity
    if (this.currentActivity) {
      // Check if user has been inactive too long
      if (now - this.lastActivityTime > this.inactivityThreshold) {
        console.log('User inactive, stopping current activity');
        this.currentActivity = null;  // Reset due to inactivity
      } else {
        // Update current activity timing
        this.currentActivity.totalTime += now - this.currentActivity.startTime;
        this.currentActivity.startTime = now;
        
        // Queue current activity if it has meaningful duration
        if (this.currentActivity.totalTime > 5000) {
          await this.queueActivity(this.currentActivity);
          this.currentActivity.totalTime = 0; // Reset after queuing
        }
      }
    }

    // Process any queued activities
    if (this.activityQueue.length > 0) {
      const activitiesToSend = [...this.activityQueue];  // Copy queue
      const success = await this.sendActivityBatch(activitiesToSend);
      
      if (success) {
        // Clear sent activities from queue
        this.activityQueue = [];
        // Also try to send any cached offline activities
        await this.processCachedActivities();
      } else {
        // Move failed activities to offline cache for later retry
        this.offlineCache.push(...activitiesToSend);
        this.activityQueue = [];
        this.saveOfflineCache();  // Persist to disk
      }
    }
  }

  // Try to send previously cached offline activities
  private async processCachedActivities() {
    if (this.offlineCache.length === 0) return;  // Nothing cached
    
    const success = await this.sendActivityBatch(this.offlineCache);
    if (success) {
      console.log(`Successfully sent ${this.offlineCache.length} cached activities`);
      this.offlineCache = [];    // Clear cache
      this.saveOfflineCache();   // Update persistent storage
    }
  }

  // Save offline cache to VS Code's persistent storage
  private saveOfflineCache() {
    this.context.globalState.update('activityTracker.offlineCache', this.offlineCache);
  }
  

  // Load offline cache from VS Code's persistent storage
  private loadOfflineCache() {
    const cached = this.context.globalState.get<QueuedActivity[]>('activityTracker.offlineCache', []);
    this.offlineCache = cached;
    console.log(`Loaded ${cached.length} cached activities from offline storage`);
  }



  // Public method to start activity tracking
  public async startTracking() {
    if (this.isTracking) return;  // Already tracking

    const config = await this.getConfiguration();
    // Check if JWT token is configured before starting
    if (!config.jwtToken) {
      const action = await vscode.window.showWarningMessage(
        'JWT token not configured. Please set up authentication first.',
        'Configure Token'
      );
      if (action === 'Configure Token') {
        await this.configureToken();  // Prompt user to configure token
      }
      return;
    }

    // Generate new session ID for this tracking session
    this.currentSessionId = this.generateSessionId();
    console.log(`Started new tracking session: ${this.currentSessionId}`);

    // Enable tracking and update UI
    this.isTracking = true;
    this.updateStatusBar();
    
    // Start tracking current active document if one exists
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      this.startFileActivity(activeEditor.document);
    }

    // Set up periodic sync timer
    this.syncTimer = setInterval(() => {
      this.syncActivityData();
    }, config.syncInterval);

    vscode.window.showInformationMessage('Activity tracking started');
    
    // Try to process any previously cached activities
    await this.processCachedActivities();
  }

  // Public method to stop activity tracking
  public async stopTracking() {
    if (!this.isTracking) return;  // Not currently tracking

    // Disable tracking and clean up
    this.isTracking = false;
    this.stopCurrentActivity();      // Stop tracking current file
    this.currentActivity = null;     // Clear current activity
    this.updateStatusBar();          // Update status bar display

    // Clear sync timer
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    // Perform final sync before stopping
    await this.syncActivityData();

    vscode.window.showInformationMessage('Activity tracking stopped');
  }

    // Public method to toggle tracking on/off
  public async toggleTracking() {
    if (this.isTracking) {
      await this.stopTracking();
    } else {
      await this.startTracking();
    }
  }


  // Private method to prompt user for JWT token configuration
  private async configureToken() {
    const token = await vscode.window.showInputBox({
      prompt: 'Enter your JWT token for activity tracking',
      password: true,  // Hide input for security
      placeHolder: 'JWT token...'
    });
    
    // Save token to secure storage if provided
    if (token) {
      await this.context.secrets.store('activityTracker.jwtToken', token);
      vscode.window.showInformationMessage('JWT token saved securely');
    }
  }


// Register VS Code event listeners for file activity
  public registerEventListeners() {
    // Listen for when user switches to a different file
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && this.isTracking) {
        this.startFileActivity(editor.document);  // Start tracking new file
      }
    });

    // Listen for document changes (user typing/editing)
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (this.isTracking && event.document === vscode.window.activeTextEditor?.document) {
        this.onDocumentChange();  // Update activity timing
      }
    });

    // Listen for file save events
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (this.isTracking && document === vscode.window.activeTextEditor?.document) {
        this.onDocumentChange();  // Update activity timing
      }
    });

    // Listen for window focus changes to handle inactivity
    vscode.window.onDidChangeWindowState((state) => {
      if (state.focused && this.isTracking) {
        this.lastActivityTime = Date.now();  // Reset activity timer when window regains focus
      }
    });
  }


  // Clean up resources when extension is deactivated
  public async dispose() {
    // Perform final sync before disposal
    if (this.isTracking) {
      await this.syncActivityData();
      // Clean shutdown without calling stopTracking (avoid double sync)
      this.isTracking = false;
      if (this.syncTimer) {
        clearInterval(this.syncTimer);
        this.syncTimer = null;
      }
    } else {
      // Just ensure any remaining activities are synced
      await this.syncActivityData();
    }
    
    // Clean up VS Code resources
    this.statusBarItem.dispose();
    this.saveOfflineCache();  // Persist any remaining cached data
  }
}

// Extension activation function - called when extension is loaded
export function activate(context: vscode.ExtensionContext) {
  console.log('Activity Tracker extension is now active');

  // Create the main tracker instance
  const tracker = new ActivityTracker(context);
  
  // Register event listeners for file activities
  tracker.registerEventListeners();

  // Register VS Code commands that users can execute
  const startCommand = vscode.commands.registerCommand('activity-tracker.startTracking', () => {
    tracker.startTracking();
  });

  const stopCommand = vscode.commands.registerCommand('activity-tracker.stopTracking', () => {
    tracker.stopTracking();
  });

  const toggleCommand = vscode.commands.registerCommand('activity-tracker.toggleTracking', () => {
    tracker.toggleTracking();
  });



    // Command to configure JWT token
  const configureTokenCommand = vscode.commands.registerCommand('activity-tracker.configureToken', async () => {
    const token = await vscode.window.showInputBox({
      prompt: 'Enter your JWT token for activity tracking',
      password: true,
      placeHolder: 'JWT token...'
    });
    
    if (token) {
      await context.secrets.store('activityTracker.jwtToken', token);
      vscode.window.showInformationMessage('JWT token saved securely');
    }
  });

  // Add all commands and tracker to subscriptions for proper cleanup
  context.subscriptions.push(startCommand, stopCommand, toggleCommand, configureTokenCommand, tracker);

  // Auto-start tracking if configured in settings
  const config = vscode.workspace.getConfiguration('activityTracker');
  const autoStart = config.get<boolean>('autoStart', false);
  
  if (autoStart) {
    tracker.startTracking();
  }
}



}




