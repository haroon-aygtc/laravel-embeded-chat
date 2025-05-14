import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WebSocketTester = () => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [wsUrl, setWsUrl] = useState(`ws://${window.location.hostname}:6001/app/laravel-app-key`);
    const [clientId, setClientId] = useState<string | null>(null);
    const [channel, setChannel] = useState("public-channel");

    // Connect to WebSocket
    const connect = () => {
        try {
            const newSocket = new WebSocket(wsUrl);

            newSocket.onopen = () => {
                setIsConnected(true);
                setMessages(prev => [...prev, "✅ Connected to Laravel Reverb WebSocket server"]);

                // Generate random client ID for demo purposes
                const randomId = Math.random().toString(36).substring(2, 10);
                setClientId(randomId);
                setMessages(prev => [...prev, `📩 Your client ID is: ${randomId}`]);
            };

            newSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Format and display the message nicely
                    const formattedJson = JSON.stringify(data, null, 2);
                    setMessages(prev => [...prev, `📩 Received: ${formattedJson}`]);

                    // Handle Laravel Reverb event message
                    if (data.event) {
                        setMessages(prev => [...prev, `📩 Event received: ${data.event}`]);
                        if (data.data) {
                            setMessages(prev => [...prev, `📩 Event data: ${JSON.stringify(data.data, null, 2)}`]);
                        }
                    }
                } catch (error) {
                    // If not JSON, just show as string
                    setMessages(prev => [...prev, `📩 Received: ${event.data}`]);
                }
            };

            newSocket.onerror = (error) => {
                console.error("WebSocket error:", error);
                setMessages(prev => [...prev, "❌ WebSocket error occurred"]);
            };

            newSocket.onclose = () => {
                setIsConnected(false);
                setMessages(prev => [...prev, "🔌 Disconnected from WebSocket server"]);
                setClientId(null);
            };

            setSocket(newSocket);
        } catch (error) {
            console.error("Failed to create WebSocket connection:", error);
            setMessages(prev => [...prev, `❌ Connection error: ${error}`]);
        }
    };

    // Disconnect WebSocket
    const disconnect = () => {
        if (socket) {
            socket.close();
            setSocket(null);
        }
    };

    // Subscribe to a channel
    const subscribeToChannel = () => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            // Laravel Reverb subscription format
            const subscriptionMessage = JSON.stringify({
                event: 'pusher:subscribe',
                data: {
                    channel: channel
                }
            });

            socket.send(subscriptionMessage);
            setMessages(prev => [...prev, `📤 Sent subscription request to channel: ${channel}`]);
        }
    };

    // Send a message
    const sendMessage = () => {
        if (socket && socket.readyState === WebSocket.OPEN && inputMessage) {
            // For demo purposes, we'll send a request to the backend API
            // which will broadcast via the event system
            fetch('/api/websocket/notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: inputMessage,
                    channel: channel
                })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        setMessages(prev => [...prev, `📤 Sent message via API: ${inputMessage}`]);
                    } else {
                        setMessages(prev => [...prev, `❌ Error sending message: ${data.message}`]);
                    }
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                    setMessages(prev => [...prev, `❌ Error sending message: ${error.message}`]);
                });

            setInputMessage("");
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [socket]);

    // Handle Enter key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Laravel Reverb WebSocket Tester</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex space-x-2">
                    <Input
                        value={wsUrl}
                        onChange={(e) => setWsUrl(e.target.value)}
                        placeholder="WebSocket URL (e.g., ws://localhost:6001/app/laravel-app-key)"
                        className="flex-1"
                    />
                    {!isConnected ? (
                        <Button onClick={connect}>Connect</Button>
                    ) : (
                        <Button variant="destructive" onClick={disconnect}>
                            Disconnect
                        </Button>
                    )}
                </div>

                {isConnected && (
                    <div className="flex space-x-2 items-center">
                        <Label className="whitespace-nowrap">Channel:</Label>
                        <Select
                            value={channel}
                            onValueChange={setChannel}
                            disabled={!isConnected}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a channel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="public-channel">Public Channel</SelectItem>
                                <SelectItem value="public-chat">Public Chat</SelectItem>
                                {clientId && (
                                    <SelectItem value={`private-user.${clientId}`}>Private (Your User)</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={subscribeToChannel}
                            disabled={!isConnected}
                        >
                            Subscribe
                        </Button>
                    </div>
                )}

                <div className="h-60 overflow-y-auto border rounded p-2 bg-gray-50 font-mono text-sm">
                    {messages.map((msg, index) => (
                        <div key={index} className="my-1 whitespace-pre-wrap">
                            {msg}
                        </div>
                    ))}
                </div>

                <div className="flex space-x-2">
                    <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type a message..."
                        disabled={!isConnected}
                        className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!isConnected}>
                        Send
                    </Button>
                </div>

                <div className="text-sm text-gray-500">
                    <p>Status: {isConnected ? `Connected ✅ (Client ID: ${clientId})` : "Disconnected ❌"}</p>
                    <p className="mt-2">Instructions:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                        <li>Connect to the Laravel Reverb WebSocket server</li>
                        <li>Subscribe to a channel</li>
                        <li>Send messages to see them broadcast via Laravel events</li>
                    </ol>
                    <p className="mt-2 text-xs text-blue-500">Note: Laravel Reverb is handling WebSockets - no separate Node.js server needed!</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default WebSocketTester; 