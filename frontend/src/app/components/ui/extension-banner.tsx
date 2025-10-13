"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Download } from "lucide-react";

export function ExtensionDownloadBanner() {
  // GitHub release download URL
  const downloadUrl = "https://github.com/anishsaha46/DevTrackr/releases/download/v1.0.0/devtrackr-1.0.0.vsix";

  return (
    <Card className="mb-8 bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-2xl text-blue-900">
          Connect Your Editor to Start Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700 mb-6">
          To begin tracking your coding activity, you need to install the DevTrackr extension in Visual Studio Code.
        </p>

        <a href={downloadUrl} download>
          <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Download VS Code Extension
          </Button>
        </a>

        <div className="mt-8">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Installation Steps:</h3>
          <ol className="list-decimal list-inside space-y-4 text-gray-600">
            <li>
              <span className="font-semibold">Download:</span> Click the button above to download the extension file (.vsix)
            </li>
            <li>
              <span className="font-semibold">Install in VS Code:</span>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-2 bg-gray-50 p-4 rounded-md">
                <li>Open VS Code</li>
                <li>Press Ctrl+Shift+X to open the Extensions view</li>
                <li>Click the ⋯ (More Actions) button at the top</li>
                <li>Select "Install from VSIX..." and choose the downloaded file</li>
              </ul>
            </li>
            <li>
              <span className="font-semibold">Log In:</span>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-2 bg-gray-50 p-4 rounded-md">
                <li>Once installed, click the DevTrackr icon in the status bar</li>
                <li>Or use Command Palette (Ctrl+Shift+P) and type "DevTrackr: Login"</li>
                <li>Complete the login process in your browser</li>
              </ul>
            </li>
            <li>
              <span className="font-semibold">Start Coding:</span> The extension will automatically track your coding activity! 🚀
            </li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}