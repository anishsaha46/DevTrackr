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
