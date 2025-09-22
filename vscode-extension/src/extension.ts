import * as vscode from 'vscode';
import * as path from 'path';
import fetch from 'node-fetch';
import { scheduler } from 'timers/promises';

// Interface defining the structure of activity data sent to the server
interface ActivityData {
  projectName: string;     // Project name (workspace folder name)
  language: string;       // Programming language of the file
  file: string;          // File name/path
  timeSpent: number;     // Time spent in seconds
  startTime: string;     // Activity start time ISO timestamp
  endTime: string;       // Activity end time ISO timestamp
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


export class DevTrackr{
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
    
    // Register workspace folder listener
    this.registerWorkspaceFolderListener();
    
    // Create status bar item on the right side with priority 100
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    // Set command to execute when status bar item is clicked
    this.statusBarItem.command = 'devtrackr.toggleTracking';
    // Update the status bar display and make it visible
    this.updateStatusBar();
    this.statusBarItem.show();
    
    // Load any previously cached offline activities on startup
    this.loadOfflineCache();
  }



// Get configuration settings from VS Code settings and secure storage
private async getConfiguration() {
  const config = vscode.workspace.getConfiguration('devtrackr');
  
  let jwtToken = await this.context.secrets.get('devtrackr.jwtToken');
  if (!jwtToken) {
    jwtToken = config.get<string>('jwtToken', '');
    if (jwtToken) {
      await this.context.secrets.store('devtrackr.jwtToken', jwtToken);
      await config.update('jwtToken', undefined, vscode.ConfigurationTarget.Global);
    }
  }
  
  return {
    apiEndpoint: config.get<string>('apiEndpoint', 'http://localhost:8080/api/activities'),
    authEndpoint: config.get<string>('authEndpoint', 'http://localhost:8080/api/auth'),
    projectId: this.detectProjectId(),
    syncInterval: config.get<number>('syncInterval', 60) * 1000,
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
    const config = vscode.workspace.getConfiguration('devtrackr');
    return config.get<string>('projectId', 'unknown-project');
  }

  // Register project with the backend
  private async registerProject(projectName: string) {
    try {
      const config = await this.getConfiguration();
      if (!config.jwtToken) {
        // Don't try to register if the user isn't logged in
        return;
      }

      const projectEndpoint = `${config.apiEndpoint.replace('/activities', '')}/projects`;

      const response = await fetch(projectEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.jwtToken}`
        },
        body: JSON.stringify({ name: projectName })
      });

      if (response.ok) {
        console.log(`Successfully registered project: ${projectName}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        // It might fail if the project already exists, which is fine
        console.log(`Failed to register project '${projectName}': ${errorData.message || response.status}`);
      }
    } catch (error) {
      console.error('Error registering project:', error);
    }
  }

  // Listen for workspace folder changes
  private registerWorkspaceFolderListener() {
    // When a folder is opened, immediately try to register it
    if (vscode.workspace.workspaceFolders) {
      for (const folder of vscode.workspace.workspaceFolders) {
        this.registerProject(folder.name);
      }
    }

    // Also listen for any future folders being added to the workspace
    vscode.workspace.onDidChangeWorkspaceFolders(event => {
      for (const folder of event.added) {
        this.registerProject(folder.name);
      }
    });
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
    const now = new Date();
    const queuedActivity: QueuedActivity = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,  // Unique ID
      projectName: document ? this.detectProjectId(document) : config.projectId,
      language: activity.language,
      file: activity.fileName,
      timeSpent: Math.round(activity.totalTime / 1000), // Convert milliseconds to seconds
      startTime: new Date(now.getTime() - activity.totalTime).toISOString(), // Activity start time
      endTime: now.toISOString(),                                           // Activity end time
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
        console.warn('JWT token not configured for DevTrackr');
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
    this.context.globalState.update('devtrackr.offlineCache', this.offlineCache);
  }
  

  // Load offline cache from VS Code's persistent storage
  private loadOfflineCache() {
    const cached = this.context.globalState.get<QueuedActivity[]>('devtrackr.offlineCache', []);
    this.offlineCache = cached;
    console.log(`Loaded ${cached.length} cached activities from offline storage`);
  }



  // Public method to start activity tracking
public async startTracking() {
  if (this.isTracking) return;  // Already tracking

  let config = await this.getConfiguration();
  
  // Check if JWT token exists
  if (!config.jwtToken) {
    const action = await vscode.window.showWarningMessage(
      'Not logged in to DevTrackr. Please log in to start tracking.',
      'Login'
    );
    if (action === 'Login') {
      const success = await this.loginWithWeb();
      if (!success) {
        return; // Login failed, don't start tracking
      }
      config = await this.getConfiguration();
    } else {
      return; // User cancelled login
    }
  }

  // Validate the token only when needed
  try {
    const validationResponse = await fetch(`${config.authEndpoint}/validate`, {
      headers: {
        'Authorization': `Bearer ${config.jwtToken}`,
        'Accept': 'application/json'
      }
    });

    if (!validationResponse.ok) {
      await this.context.secrets.delete('devtrackr.jwtToken');
      const action = await vscode.window.showWarningMessage(
        'Your session has expired. Please log in again.',
        'Login'
      );
      if (action === 'Login') {
        const success = await this.loginWithWeb();
        if (!success) {
          return;
        }
        config = await this.getConfiguration();
      } else {
        return;
      }
    }
  } catch (error) {
    console.error('Token validation error:', error);
    vscode.window.showErrorMessage('Failed to validate authentication. Please check your connection.');
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


  // Public method to login with device authorization flow
  public async loginWithWeb() {
    try {
      const config = await this.getConfiguration();
      
      // Get device info
      const os = require('os');
      const deviceName = `${os.platform()} - ${os.hostname()}`;
      const deviceId = `${os.platform()}-${os.hostname()}-${Date.now()}`;
      
      // Step 1: Get device code
      // Enforce HTTPS in production-like usage
      const baseUrl = `${config.apiEndpoint.replace('/activities', '')}`;
      if (!baseUrl.startsWith('https://')) {
        this.showErrorOnce('Warning: Non-HTTPS endpoint detected. Use HTTPS in production.');
      }
      const deviceResponse = await fetch(`${baseUrl}/auth/device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceName,
          deviceType: 'vscode-extension',
          deviceId
        })
      });
      
      if (!deviceResponse.ok) {
        throw new Error(`Failed to initiate device auth: ${deviceResponse.status}`);
      }
      
      const responseData = await deviceResponse.json() as { deviceCode: string; verificationUrl: string; expiresIn: number; interval: number };
      const { deviceCode, verificationUrl, expiresIn, interval } = responseData;
      
      // Step 2: Show user the verification URL
      const action = await vscode.window.showInformationMessage(
        'Please complete login in your browser to connect this device',
        'Open Browser'
      );
      
      if (action === 'Open Browser') {
        vscode.env.openExternal(vscode.Uri.parse(verificationUrl));
      }
      
      // Step 3: Poll for confirmation with progress
      const token = await this.pollForTokenWithProgress(deviceCode, interval, expiresIn);
      
      if (token) {
        console.log('Device login: received token:', token);
        await this.context.secrets.store('devtrackr.jwtToken', token);
        vscode.window.showInformationMessage('✅ Successfully logged in to DevTrackr!');
        return true;
      }
      
      return false;
      
    } catch (error) {
      vscode.window.showErrorMessage('Login failed: ' + (error instanceof Error ? error.message : String(error)));
      return false;
    }
  }

  // Poll for token with progress indicator
private async pollForTokenWithProgress(deviceCode: string, interval: number, expiresIn: number): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const maxWaitTime = expiresIn * 1000;
  
      vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Waiting for login confirmation...",
        cancellable: true
      }, async (progress, cancellationToken) => {
        
        const poll = async () => {
          if (cancellationToken.isCancellationRequested) {
            reject(new Error('Login cancelled by user'));
            return;
          }
  
          if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('Device authorization expired. Please try again.'));
            return;
          }
  
          try {
            const config = await this.getConfiguration();
            const response = await fetch(`${config.apiEndpoint.replace('/activities', '')}/auth/device/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceCode })
            });
            
            // --- Start of Fix ---
            // Explicitly check for 200 OK for success
            if (response.status === 200) {
              const responseData = await response.json();
              const token = responseData.accessToken || responseData.token;
              if (token) {
                resolve(token); // Success! Resolve with the token.
                return;
              }
            }
  
            // Check for 202 Accepted to continue polling
            if (response.status === 202) {
              // This is the "pending" state, so we continue.
            } else if (!response.ok) {
              // For any other error (4xx, 5xx), stop and reject.
              const errorData = await response.json().catch(() => ({}));
              reject(new Error(errorData.error || `Polling failed with status: ${response.status}`));
              return;
            }
            // --- End of Fix ---
            
            // Update progress
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, expiresIn - elapsed);
            progress.report({ 
              message: `Waiting for confirmation... (${remaining}s remaining)`,
            });
            
            // Wait before next poll
            setTimeout(poll, interval * 1000);
            
          } catch (error) {
            console.error('Polling error:', error);
            // Don't reject on network errors, just keep trying
            setTimeout(poll, interval * 1000);
          }
        };
        
        poll();
      });
    });
  }

  // Public method to logout (clear stored token)
  public async logout() {
    await this.context.secrets.delete('devtrackr.jwtToken');
    vscode.window.showInformationMessage('Logged out from DevTrackr');
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
  console.log('DevTrackr extension is now active');

  // Create the main tracker instance
  const tracker = new DevTrackr(context);
  
  // Register event listeners for file activities
  tracker.registerEventListeners();

  // Register VS Code commands that users can execute
  const startCommand = vscode.commands.registerCommand('devtrackr.startTracking', () => {
    tracker.startTracking();
  });

  const stopCommand = vscode.commands.registerCommand('devtrackr.stopTracking', () => {
    tracker.stopTracking();
  });

  const toggleCommand = vscode.commands.registerCommand('devtrackr.toggleTracking', () => {
    tracker.toggleTracking();
  });

  // Command to login with device authorization
  const loginCommand = vscode.commands.registerCommand('devtrackr.login', async () => {
    await tracker.loginWithWeb();
  });

  // Command to logout
  const logoutCommand = vscode.commands.registerCommand('devtrackr.logout', async () => {
    await tracker.logout();
  });

  // Add all commands and tracker to subscriptions for proper cleanup
  context.subscriptions.push(startCommand, stopCommand, toggleCommand, loginCommand, logoutCommand, tracker);

  // Auto-start tracking if configured in settings
  const config = vscode.workspace.getConfiguration('devtrackr');
  const autoStart = config.get<boolean>('autoStart', false);
  
  if (autoStart) {
    tracker.startTracking();
  }
}

// Extension deactivation function - called when extension is unloaded
export async function deactivate() {
  console.log('DevTrackr extension is now deactivated');
  // Extension cleanup is handled by the dispose() method
}




