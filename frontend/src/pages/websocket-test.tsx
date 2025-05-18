import React, { useState, useEffect } from "react";
import WebSocketTester from "@/components/websocket-demo/WebSocketTester";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Terminal, Code, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";

const WebSocketTestPage = () => {
    const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

    // Check if the WebSocket server is running
    const checkServerStatus = async () => {
        setServerStatus("checking");
        try {
            const response = await axios.get('/api/websocket/status');
            if (response.data.success) {
                setServerStatus("online");
            } else {
                setServerStatus("offline");
            }
        } catch (error) {
            setServerStatus("offline");
        }
    };

    // Check status when component mounts
    useEffect(() => {
        checkServerStatus();
    }, []);

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 text-center">WebSocket Testing</h1>

            <div className="flex justify-between items-center mb-6">
                <Alert className="flex-1 mr-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>WebSocket Server Status</AlertTitle>
                    <AlertDescription className="flex items-center">
                        {serverStatus === "checking" && "Checking server status..."}
                        {serverStatus === "online" && (
                            <span className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                Laravel Reverb is configured and running
                            </span>
                        )}
                        {serverStatus === "offline" && (
                            <span className="flex items-center">
                                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                                Laravel Reverb is not properly configured
                            </span>
                        )}
                    </AlertDescription>
                </Alert>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={checkServerStatus}
                    className="whitespace-nowrap"
                >
                    Refresh Status
                </Button>
            </div>

            <div className="grid gap-6 mb-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Terminal className="mr-2 h-5 w-5" />
                            About Laravel Reverb
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>This application uses <strong>Laravel Reverb</strong> for WebSocket functionality.</p>
                        <div className="bg-slate-950 text-white p-4 rounded-md overflow-x-auto">
                            <pre>
                                <code>php artisan reverb:start</code>
                            </pre>
                        </div>
                        <p>The Laravel Reverb server runs on port 9001 by default.</p>
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 my-2">
                            <p className="text-amber-700">Note: No separate Node.js server is needed with Laravel Reverb.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Code className="mr-2 h-5 w-5" />
                            WebSocket + Laravel Integration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="outline">Laravel API</Badge>
                            <Badge variant="outline">Laravel Reverb</Badge>
                            <Badge variant="outline">Real-time Communication</Badge>
                        </div>

                        <p>This demo shows how WebSockets work with Laravel Reverb:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong>Integrated Solution:</strong> Laravel Reverb provides native WebSocket support without requiring a separate Node.js server
                            </li>
                            <li>
                                <strong>Channel-based messaging:</strong> Messages can be sent to specific channels (public or private)
                            </li>
                            <li>
                                <strong>Broadcasting:</strong> When a message is sent to a channel using Laravel's event system, all clients subscribed to that channel receive it
                            </li>
                        </ul>

                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                            <h4 className="font-medium mb-2">API Endpoints Available:</h4>
                            <ul className="space-y-1">
                                <li><code className="text-xs bg-gray-100 p-1 rounded">POST /api/websocket/notification</code> - Send a notification via WebSockets</li>
                                <li><code className="text-xs bg-gray-100 p-1 rounded">GET /api/websocket/status</code> - Check if Reverb is configured</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <WebSocketTester />
        </div>
    );
};

export default WebSocketTestPage;