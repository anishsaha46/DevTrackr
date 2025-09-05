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
}




