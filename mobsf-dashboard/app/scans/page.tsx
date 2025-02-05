'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Upload, Play, AlertCircle } from 'lucide-react';
import LogViewer from '@/components/LogViewer';

type LogEntry = {
  source: 'system' | 'mobsf-docker' | 'scan-script';
  timestamp: string;
  message: string;
};

export default function ScanPage() {
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFiles(Array.from(files));
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      const validFiles = files.filter(file => file.name.endsWith('.ipa'));
      
      if (validFiles.length === 0) {
        throw new Error('No valid IPA files selected');
      }
  
      // Log file details and append to FormData
      validFiles.forEach(file => {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`Processing ${file.name} (${fileSizeMB} MB)`);
        
        // Important: Use 'file' as the form field name to match API expectation
        formData.append('file', file);
        
        setLogs(prev => [...prev, {
          source: 'system',
          timestamp: new Date().toISOString(),
          message: `Processing ${file.name} (${fileSizeMB} MB)`
        }]);
      });
  
      console.log('FormData entries:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
  
      const response = await fetch('/api/upload-ipa', {
        method: 'POST',
        body: formData
      });
  
      const data = await response.json();
      console.log('Response data:', data);
  
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }
  
      setUploadedFiles(prev => [...prev, ...validFiles.map(f => f.name)]);
      setLogs(prev => [...prev, {
        source: 'system',
        timestamp: new Date().toISOString(),
        message: `Successfully uploaded: ${validFiles.map(f => f.name).join(', ')}`
      }]);
  
    } catch (error) {
      console.error('Upload error:', error);
      setLogs(prev => [...prev, {
        source: 'system',
        timestamp: new Date().toISOString(),
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
      alert(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const startScan = async () => {
    try {
      setScanning(true);
      const response = await fetch('/api/trigger-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanType: 'manual'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scan');
      }

      setLogs(prev => [...prev, {
        source: 'system',
        timestamp: new Date().toISOString(),
        message: 'Scan started successfully'
      }]);

    } catch (error) {
      console.error('Scan error:', error);
      setLogs(prev => [...prev, {
        source: 'system',
        timestamp: new Date().toISOString(),
        message: `Error starting scan: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
      alert(error instanceof Error ? error.message : 'Failed to start scan');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Scan Management</h1>
        <Button 
          onClick={startScan} 
          disabled={scanning}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {scanning ? 'Scanning...' : 'Start Scan'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* IPA Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload iOS Apps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`border-2 ${
                  dragActive ? 'border-primary border-solid' : 'border-dashed'
                } rounded-lg p-6 text-center transition-all`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <input
                  type="file"
                  accept=".ipa"
                  multiple
                  className="hidden"
                  id="ipa-upload"
                  onChange={onFileSelect}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  disabled={uploading}
                  className="w-full mb-2"
                  onClick={() => document.getElementById('ipa-upload')?.click()}
                >
                  {uploading ? 'Uploading...' : 'Select IPA Files'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading files...' : 'Drag and drop IPA files here or click to select'}
                </p>
              </div>

              {uploadedFiles.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Uploaded Files:</h3>
                  <ul className="space-y-1">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Android Apps Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Android Apps Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Android apps will be automatically downloaded from the Google Play Store
              when the scan starts. The following apps will be included:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Bank Hapoalim (com.ideomobile.hapoalim)</li>
              <li>bit (com.hapoalim.loyalty)</li>
              <li>Business+ (com.bnhp.businessapp)</li>
              <li>Trade (com.bnhp.openapp)</li>
              <li>Market (com.ideomobile.hmarket)</li>
              <li>Pass App (com.bnhp.passapp)</li>
              <li>Poalim Connect (com.mfoundry.mb.android.mb_beb101266)</li>
              <li>Web Portal (com.webtech.mobileportal)</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Log Viewer */}
      <LogViewer initialLogs={logs} onLogsChange={setLogs} />
    </div>
  );
}