import React from 'react';

export const metadata = {
  title: 'WebSocket Tester',
  description: 'Test WebSocket connections and functionality',
};

export default function WebSocketTesterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto py-4 px-4">
          <h1 className="text-xl font-bold text-gray-900">WebSocket Tester</h1>
          <p className="text-gray-600">Test and debug WebSocket connections</p>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
