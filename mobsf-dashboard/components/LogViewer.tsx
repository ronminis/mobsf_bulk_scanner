'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type LogEntry = {
  source: 'mobsf-docker' | 'scan-script' | 'system';
  timestamp: string;
  message: string;
};

interface LogViewerProps {
  initialLogs?: LogEntry[];
  onLogsChange?: (logs: LogEntry[]) => void;
}

export default function LogViewer({ initialLogs = [], onLogsChange }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showDocker, setShowDocker] = useState(true);
  const [showScan, setShowScan] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Update internal logs when initialLogs changes
  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  useEffect(() => {
    function connect() {
      const eventSource = new EventSource('/api/logs/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        const connectLog: LogEntry = {
          source: 'system',
          timestamp: new Date().toISOString(),
          message: 'Connected to log stream'
        };
        setLogs(prev => [...prev, connectLog]);
        if (onLogsChange) {
          setTimeout(() => onLogsChange([...logs, connectLog]), 0);
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const logEntry = JSON.parse(event.data);
          setLogs(prev => {
            const newLogs = [...prev, logEntry].slice(-1000);
            if (onLogsChange) {
              setTimeout(() => onLogsChange(newLogs), 0);
            }
            return newLogs;
          });
        } catch (error) {
          console.error('Error parsing log message:', error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        const disconnectLog: LogEntry = {
          source: 'system',
          timestamp: new Date().toISOString(),
          message: 'Disconnected from log stream. Attempting to reconnect...'
        };
        setLogs(prev => [...prev, disconnectLog]);
        if (onLogsChange) {
          setTimeout(() => onLogsChange([...logs, disconnectLog]), 0);
        }
        // Try to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => 
    (showDocker && log.source === 'mobsf-docker') || 
    (showScan && log.source === 'scan-script') ||
    log.source === 'system'
  );

  return (
    <Card className="w-full">
      <CardHeader>
      <div className="flex items-center justify-between">
  <CardTitle className="flex items-center gap-2">
    Scan Logs
    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
  </CardTitle>
  <div className="flex space-x-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => setShowDocker(!showDocker)}
      className={!showDocker ? 'opacity-50' : ''}
    >
      Docker Logs
    </Button>
    <Button
      size="sm"
      variant="outline"
      onClick={() => setShowScan(!showScan)}
      className={!showScan ? 'opacity-50' : ''}
    >
      Scan Logs
    </Button>
    <Button
      size="sm"
      variant="outline"
      onClick={() => setAutoScroll(!autoScroll)}
      className={!autoScroll ? 'opacity-50' : ''}
    >
      Auto-scroll
    </Button>
  </div>
</div>
      </CardHeader>
      <CardContent>
        <div
          ref={logContainerRef}
          className="bg-black text-green-400 p-4 rounded h-96 overflow-y-auto font-mono text-sm"
        >
          {filteredLogs.map((log, index) => (
            <div 
              key={index}
              className={`whitespace-pre-wrap ${
                log.source === 'mobsf-docker' ? 'text-blue-400' : 
                log.source === 'system' ? 'text-yellow-400' : 
                'text-green-400'
              }`}
            >
              [{new Date(log.timestamp).toLocaleTimeString()}] [{log.source}] {log.message}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}