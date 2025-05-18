'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertCircleIcon, CheckCircleIcon, XCircleIcon, RefreshCwIcon } from 'lucide-react';
import websocketService, { ConnectionState } from '@/services/websocketService';
import logger from '@/utils/logger';

/**
 * WebSocket Tester Component
 * 
 * A comprehensive testing interface for WebSocket connections
 */
export default function WebSocketTester() {
  // Connection state
  const [url, setUrl] = useState<string>('');
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Disconnected');
  const [statusColor, setStatusColor] = useState<string>('bg-gray-500');
  
  // Message state
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<string>('message');
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  
  // Stats
  const [stats, setStats] = useState<any>({});
  const [lastPingLatency, setLastPingLatency] = useState<number | null>(null);
  
  // Initialize
  useEffect(() => {
    // Get current WebSocket URL
    setUrl(websocketService.getUrl ? websocketService.getUrl() : '');
    
    // Check WebSocket status endpoint
    fetch('/api/websocket-status')
      .then(response => response.json())
      .then(data => {
        if (data.available) {
          // If WebSocket is available, suggest the URL
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const suggestedUrl = `${protocol}//${data.host}:${data.port}/websocket`;
          setUrl(suggestedUrl);
        } else {
          setError(`WebSocket server unavailable: ${data.message}`);
        }
      })
      .catch(err => {
        setError('Failed to check WebSocket status');
        logger.error('Error checking WebSocket status', err);
      });
    
    // Set up event listeners
    const removeConnectListener = websocketService.onConnect(() => {
      setIsConnected(true);
      setError(null);
      setStatusMessage('Connected');
      setStatusColor('bg-green-500');
    });
    
    const removeDisconnectListener = websocketService.onDisconnect(() => {
      setIsConnected(false);
      setStatusMessage('Disconnected');
      setStatusColor('bg-gray-500');
    });
    
    const removeErrorListener = websocketService.onError(() => {
      setError('WebSocket connection error');
      setStatusMessage('Error');
      setStatusColor('bg-red-500');
    });
    
    const removeMessageListener = websocketService.onMessage((message) => {
      // Add received message to the list
      setReceivedMessages(prev => [message, ...prev].slice(0, 50));
      
      // Update ping latency if it's a pong message
      if (message.type === 'pong' && message.sentAt) {
        setLastPingLatency(Date.now() - message.sentAt);
      }
    });
    
    // Update connection state and stats periodically
    const interval = setInterval(() => {
      setConnectionState(websocketService.getConnectionState());
      setIsConnected(websocketService.isConnected());
      setStats(websocketService.getStats());
    }, 1000);
    
    // Clean up
    return () => {
      removeConnectListener();
      removeDisconnectListener();
      removeErrorListener();
      removeMessageListener();
      clearInterval(interval);
    };
  }, []);
  
  // Connect to WebSocket
  const handleConnect = () => {
    if (!url) {
      setError('Please enter a WebSocket URL');
      return;
    }
    
    setError(null);
    setStatusMessage('Connecting...');
    setStatusColor('bg-yellow-500');
    
    // Update the WebSocket URL and connect
    websocketService.setUrl(url);
    websocketService.connect()
      .catch(err => {
        setError(`Failed to connect: ${err.message}`);
        setStatusMessage('Connection Failed');
        setStatusColor('bg-red-500');
      });
  };
  
  // Disconnect from WebSocket
  const handleDisconnect = () => {
    websocketService.disconnect();
    setStatusMessage('Disconnected');
    setStatusColor('bg-gray-500');
  };
  
  // Send a message
  const handleSendMessage = () => {
    if (!message) {
      setError('Please enter a message to send');
      return;
    }
    
    if (!isConnected) {
      setError('Not connected to WebSocket');
      return;
    }
    
    try {
      // Prepare the message based on type
      let messageToSend: any = { type: messageType };
      
      if (messageType === 'json') {
        // Try to parse as JSON
        try {
          messageToSend = JSON.parse(message);
        } catch (err) {
          setError('Invalid JSON format');
          return;
        }
      } else {
        // Add message content based on type
        if (messageType === 'ping') {
          messageToSend.sentAt = Date.now();
        } else {
          messageToSend.content = message;
        }
      }
      
      // Send the message
      websocketService.sendMessage(messageToSend);
      
      // Clear the message input
      setMessage('');
      
      // Add sent message to the list
      setReceivedMessages(prev => [{
        ...messageToSend,
        _sent: true,
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, 50));
    } catch (err) {
      setError(`Failed to send message: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Send a ping
  const handleSendPing = () => {
    if (!isConnected) {
      setError('Not connected to WebSocket');
      return;
    }
    
    websocketService.sendMessage({
      type: 'ping',
      sentAt: Date.now()
    });
  };
  
  // Clear received messages
  const handleClearMessages = () => {
    setReceivedMessages([]);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">WebSocket Tester</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader>
            <CardTitle>Connection</CardTitle>
            <CardDescription>Configure and manage WebSocket connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">WebSocket URL</label>
                <div className="flex space-x-2">
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="ws://localhost:9001/websocket"
                    disabled={isConnected}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                <span>{statusMessage}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              onClick={handleConnect}
              disabled={isConnected}
              variant={isConnected ? "outline" : "default"}
            >
              Connect
            </Button>
            <Button
              onClick={handleDisconnect}
              disabled={!isConnected}
              variant="destructive"
            >
              Disconnect
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Send Message</CardTitle>
            <CardDescription>Send messages to the WebSocket server</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Message Type</label>
                <select
                  className="w-full p-2 border rounded"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                >
                  <option value="message">Message</option>
                  <option value="ping">Ping</option>
                  <option value="auth">Authentication</option>
                  <option value="json">Custom JSON</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Message Content</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={messageType === 'json' ? '{"type": "custom", "data": "value"}' : 'Enter message content'}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              onClick={handleSendMessage}
              disabled={!isConnected || !message}
            >
              Send Message
            </Button>
            <Button
              onClick={handleSendPing}
              disabled={!isConnected}
              variant="outline"
            >
              Send Ping
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Connection Stats</CardTitle>
            <CardDescription>WebSocket connection statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>State:</span>
                <Badge variant={isConnected ? "success" : "destructive"}>
                  {connectionState}
                </Badge>
              </div>
              
              <div className="flex justify-between">
                <span>Queued Messages:</span>
                <span>{stats.queuedMessages || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Reconnect Attempts:</span>
                <span>{stats.reconnectAttempts || 0}/{stats.maxReconnectAttempts || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Ping Latency:</span>
                <span>{lastPingLatency ? `${lastPingLatency}ms` : 'N/A'}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Client ID:</span>
                <span className="truncate max-w-[150px]">{stats.clientId || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Messages</CardTitle>
            <Button variant="outline" size="sm" onClick={handleClearMessages}>
              Clear
            </Button>
          </div>
          <CardDescription>Received and sent messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] overflow-y-auto border rounded p-2">
            {receivedMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No messages yet
              </div>
            ) : (
              <div className="space-y-2">
                {receivedMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${msg._sent ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} border`}
                  >
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{msg._sent ? 'Sent' : 'Received'}: {msg.type}</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(msg, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
