<p align="center">
  <img src="images/logo.png" width="128" />
</p>

<h1 align="center">DevTrackr</h1>
<p align="center">🚀 A VS Code extension for developer activity tracking and analytics</p>

[![Version](https://img.shields.io/visual-studio-marketplace/v/devtrackr-io.devtrackr?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=devtrackr-io.devtrackr)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/devtrackr-io.devtrackr?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=devtrackr-io.devtrackr)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/devtrackr-io.devtrackr?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=devtrackr-io.devtrackr)

---


# DevTrackr Extension

A VS Code extension for comprehensive developer activity tracking and analytics.

## Features

- **Real-time Activity Tracking**: Monitors file opens, edits, and saves
- **Smart Idle Detection**: Automatically stops counting time during inactivity periods
- **Automatic Project Detection**: Uses workspace folder name as project ID
- **Language Detection**: Automatically detects programming languages
- **Time Tracking**: Accurately tracks time spent on each file
- **Activity Batching**: Queues and batches activity data for efficient API usage
- **API Integration**: Sends activity data to your backend via REST API
- **Secure JWT Storage**: Uses VS Code's encrypted SecretStorage for tokens
- **Offline Caching**: Stores activity data when backend is unavailable
- **Smart Error Handling**: Reduces notification noise with error cooldowns
- **Status Bar Integration**: Shows tracking status in VS Code status bar
- **Clickable Status Bar**: Toggle tracking by clicking the status bar item
- **Command Palette**: Multiple commands for easy control

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure the Extension

### Configuration

Open VS Code settings (`Ctrl+,` or `Cmd+,`) and search for "Activity Tracker":

- **API Endpoint**: Your backend API URL (default: `http://localhost:8080/api/activities`)
- **Project ID**: Identifier for your project (auto-detected from workspace folder)
- **Sync Interval**: How often to send data in seconds (default: `60`)
- **Auto Start**: Automatically start tracking when VS Code opens

Alternatively, add these to your `settings.json`:

```json
{
  "activityTracker.apiEndpoint": "http://localhost:8080/api/activities",
  "activityTracker.syncInterval": 60,
  "activityTracker.autoStart": true
}
```

**Note**: Authentication is now handled automatically through the device authorization flow. No manual token configuration is required!

### 3. Build and Package

```bash
# Compile TypeScript
npm run compile

# Package the extension
npm run package
```

### 4. Install the Extension

```bash
# Install the generated .vsix file
code --install-extension activity-tracker-1.0.0.vsix
```

## Usage

### Getting Started

1. **Login** (First time setup):
   - Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
   - Type "CodeTracker: Login to CodeTracker"
   - Complete the login process in your browser
   - The extension will automatically receive your authentication token

2. **Starting/Stopping Tracking**:
   - **Via Command Palette**: Type "Start Tracking", "Stop Tracking", or "Toggle Tracking"
   - **Via Status Bar**: Click the status bar item to toggle tracking on/off
   - Icons: `$(pulse)` when active, `$(circle-outline)` when inactive

3. **Logout**:
   - Use "CodeTracker: Logout" command to disconnect from your account

### Smart Features

- **Multi-Workspace Support**: Automatically detects the correct workspace for each file
- **Enhanced Language Detection**: Uses VS Code language detection with file extension fallback
- **Session Tracking**: Each tracking session gets a unique ID for correlation
- **Idle Time Handling**: Stops counting time after 30 seconds of inactivity
- **Activity Batching**: Queues activities and sends them efficiently to reduce API calls
- **Batch API Support**: Automatically uses `/batch` endpoint if available, falls back to individual requests
- **Offline Support**: Caches activities when your backend is unavailable and syncs when reconnected
- **Error Management**: Shows error notifications only once every 5 minutes to avoid spam
### Data Format

The extension sends activity data in the following JSON structure:

#### Individual Activity (POST /api/activities):
```json
{
  "id": "1640995200000-abc123def",
  "projectId": "my-workspace-name",
  "language": "TypeScript",
  "file": "src/extension.ts",
  "timeSpent": 60,
  "timestamp": "2025-08-22T14:00:00.000Z",
  "sessionId": "session-1640995200000-xyz789",
  "fileExtension": "ts"
}
```

#### Batch Activities (POST /api/activities/batch):
```json
[
  {
    "id": "1640995200000-abc123def",
    "projectId": "my-workspace-name",
    "language": "TypeScript",
    "file": "src/extension.ts",
    "timeSpent": 60,
    "timestamp": "2025-08-22T14:00:00.000Z",
    "sessionId": "session-1640995200000-xyz789",
    "fileExtension": "ts"
  },
  {
    "id": "1640995260000-def456ghi",
    "projectId": "my-workspace-name",
    "language": "JSON",
    "file": "package.json",
    "timeSpent": 30,
    "timestamp": "2025-08-22T14:01:00.000Z",
    "sessionId": "session-1640995200000-xyz789",
    "fileExtension": "json"
  }
]
```

### API Requirements

Your backend should support these endpoints:

#### Primary Endpoint (Individual):
- **URL**: `POST /api/activities`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your-jwt-token>`
- **Body**: Single activity object (see format above)

#### Batch Endpoint (Optional but Recommended):
- **URL**: `POST /api/activities/batch`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <your-jwt-token>`
- **Body**: Array of activity objects (see format above)

**Note**: The extension automatically tries the batch endpoint first. If it returns 404, it falls back to individual requests for backward compatibility.

## Development

### Running in Development

1. Open the project in VS Code
2. Press `F5` to launch a new Extension Development Host window
3. Test your extension in the new window

### Building for Production

```bash
# Install vsce globally if not already installed
npm install -g @vscode/vsce

# Package the extension
vsce package

# Publish to marketplace (optional)
vsce publish
```

## Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `activityTracker.apiEndpoint` | string | `http://localhost:8080/api/activities` | Backend API endpoint |
| `activityTracker.projectId` | string | `auto-detected` | Project identifier (auto-detected from workspace) |
| `activityTracker.syncInterval` | number | `60` | Sync interval in seconds |
| `activityTracker.jwtToken` | string | `""` | JWT token (migrated to secure storage) |
| `activityTracker.autoStart` | boolean | `false` | Auto-start tracking on VS Code launch |

## Privacy & Security

- **Secure Token Storage**: JWT tokens are stored in VS Code's encrypted SecretStorage
- **Privacy First**: Only file names and metadata (not contents) are transmitted
- **Smart Time Tracking**: Inactivity detection ensures accurate time measurement
- **Offline Caching**: Activities are cached locally when backend is unavailable
- All data transmission uses HTTPS (when configured)

## Troubleshooting

### Common Issues

1. **"Failed to sync activity data"**: Check your API endpoint and JWT token
2. **No tracking data**: Ensure tracking is started and you're actively editing files (check status bar)
3. **Extension not loading**: Check the VS Code output panel for error messages
4. **Token issues**: Use "Configure JWT Token" command for secure token setup
5. **Offline mode**: Activities are cached and will sync when backend is available

### Debug Mode

Enable debug logging by setting the log level in VS Code developer tools (`Help > Toggle Developer Tools`).

## License

MIT License - feel free to modify and distribute as needed.