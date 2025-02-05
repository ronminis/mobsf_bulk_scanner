// app/batches/components/BatchDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

// Type definitions
type App = {
  name: string;
  bundleId: string;
  icon: string;
  securityScore: number;
  highRiskFindings: number;
};

type PlatformStats = {
  apps: App[];
  totalApps: number;
  avgScore: number;
  highRiskApps: number;
};

type BatchData = {
  current: {
    android: PlatformStats;
    ios: PlatformStats;
  };
};

type Batch = {
  id: number;
  batch_date: string;
};

// Helper function
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  }).replace(/\//g, '.');
}

// Default App Icon component
const DefaultAppIcon = () => (
  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200">
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-gray-400"
    >
      <path
        d="M16.5 9.5L7.5 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 16V8C20.9996 7.28536 20.7071 6.6006 20.1785 6.07183C19.6499 5.54306 18.9652 5.25024 18.25 5.25H5.75C5.03481 5.25024 4.35014 5.54306 3.82153 6.07183C3.29293 6.6006 3.00036 7.28536 3 8V16C3.00036 16.7146 3.29293 17.3994 3.82153 17.9282C4.35014 18.4569 5.03481 18.7498 5.75 18.75H18.25C18.9652 18.7498 19.6499 18.4569 20.1785 17.9282C20.7071 17.3994 20.9996 16.7146 21 16Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 18.75V5.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12H3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

// App Card Component
const AppCard = ({ app, onAppClick, currentBatchId }: { 
  app: App; 
  onAppClick: (bundleId: string, batchId: number) => void;
  currentBatchId: number | null;
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col items-center group">
        <button 
          onClick={() => currentBatchId && onAppClick(app.bundleId, currentBatchId)}
          className="relative transform transition-all duration-200 ease-in-out group-hover:scale-105"
        >
          {app.icon ? (
            <img 
              src={`/api/files/${app.icon}`}
              alt={app.name}
              className="w-16 h-16 rounded-xl shadow-sm group-hover:shadow-lg transition-all"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement?.querySelector('.default-icon')?.classList.remove('hidden');
              }}
            />
          ) : (
            <DefaultAppIcon />
          )}
        </button>
      <div className="mt-2 text-center transition-colors duration-200 group-hover:text-blue-600">
        <div className="text-xs font-medium truncate w-24" title={app.name}>
          {app.name}
        </div>
        <div className={`text-xs ${getScoreColor(app.securityScore)}`}>
          Score: {app.securityScore}%
        </div>
        {app.highRiskFindings > 0 && (
          <div className="text-xs text-red-600 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {app.highRiskFindings}
          </div>
        )}
      </div>
    </div>
  );
};

// Platform Grid Component
const PlatformGrid = ({ platform, stats, onAppClick, currentBatchId }: { 
  platform: 'android' | 'ios';
  stats: PlatformStats;
  onAppClick: (bundleId: string, batchId: number) => void;
  currentBatchId: number | null;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {platform === 'android' ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 505.145 505.145" className="h-5 w-5" fill="currentColor">
            <g>
              <path d="m68.541 164.715h-1.294c-16.588 0-30.113 13.568-30.113 30.113v131.107c0 16.61 13.525 30.134 30.113 30.134h1.316c16.588 0 30.113-13.568 30.113-30.134v-131.108c-0.022-16.544-13.568-30.112-30.135-30.112z"/>
              <path d="m113.085 376.54c0 15.229 12.446 27.632 27.675 27.632h29.574v70.817c0 16.631 13.568 30.156 30.113 30.156h1.294c16.61 0 30.156-13.546 30.156-30.156v-70.817h41.33v70.817c0 16.631 13.611 30.156 30.156 30.156h1.273c16.609 0 30.134-13.546 30.134-30.156v-70.817h29.595c15.207 0 27.654-12.403 27.654-27.632v-207.979h-278.954v207.979z"/>
              <path d="m322.041 43.983l23.491-36.26c1.51-2.287 0.841-5.414-1.467-6.903-2.286-1.51-5.414-0.884-6.903 1.467l-24.353 37.512c-18.27-7.485-38.676-11.691-60.226-11.691-21.571 0-41.934 4.206-60.247 11.691l-24.31-37.512c-1.489-2.351-4.638-2.977-6.946-1.467-2.308 1.488-2.977 4.616-1.467 6.903l23.512 36.26c-42.387 20.773-70.968 59.924-70.968 104.834 0 2.761 0.173 5.479 0.41 8.175h280.053c0.237-2.696 0.388-5.414 0.388-8.175 1e-3 -44.91-28.602-84.061-70.967-104.834zm-134.386 66.213c-7.442 0-13.482-5.997-13.482-13.46s6.04-13.439 13.482-13.439c7.485 0 13.482 5.975 13.482 13.439s-6.041 13.46-13.482 13.46zm129.835 0c-7.442 0-13.482-5.997-13.482-13.46s6.04-13.439 13.482-13.439c7.463 0 13.46 5.975 13.46 13.439s-5.997 13.46-13.46 13.46z"/>
              <path d="m437.876 164.715h-1.251c-16.588 0-30.156 13.568-30.156 30.113v131.107c0 16.61 13.59 30.134 30.156 30.134h1.273c16.609 0 30.113-13.568 30.113-30.134v-131.108c0-16.544-13.547-30.112-30.135-30.112z"/>
            </g>
          </svg>
        ) : (
          <svg viewBox="0 0 384 512" className="h-5 w-5" fill="currentColor">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
          </svg>
        )}
        {platform === 'android' ? 'Android' : 'iOS'} Apps
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.apps.map((app, index) => (
          <AppCard 
            key={index} 
            app={app} 
            onAppClick={onAppClick}
            currentBatchId={currentBatchId}
          />
        ))}
      </div>
    </CardContent>
  </Card>
);

// Main BatchDashboard Component
export default function BatchDashboard() {
  const [currentBatchId, setCurrentBatchId] = useState<number | null>(null);
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [batchStats, setBatchStats] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await fetch('/api/batches');
        const data = await response.json();
        setAvailableBatches(data);
        
        const batchIdFromUrl = searchParams.get('id');
        if (batchIdFromUrl) {
          setCurrentBatchId(Number(batchIdFromUrl));
        } else if (data.length > 0) {
          setCurrentBatchId(data[0].id);
          router.push(`/batches?id=${data[0].id}`);
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
      }
    };
    fetchBatches();
  }, [searchParams, router]);

  useEffect(() => {
    const fetchBatchData = async () => {
      if (!currentBatchId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/batches/${currentBatchId}`);
        const data = await response.json();
        setBatchStats(data);
      } catch (error) {
        console.error('Error fetching batch data:', error);
      }
      setLoading(false);
    };

    fetchBatchData();
  }, [currentBatchId]);

  const handleBatchChange = (value: string) => {
    setCurrentBatchId(Number(value));
    router.push(`/batches?id=${value}`);
  };

  const navigateBatch = (direction: 'next' | 'prev') => {
    const currentIndex = availableBatches.findIndex(batch => batch.id === currentBatchId);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < availableBatches.length) {
      const newBatchId = availableBatches[newIndex].id;
      setCurrentBatchId(newBatchId);
      router.push(`/batches?id=${newBatchId}`);
    }
  };

  const handleAppClick = (bundleId: string, batchId: number) => {
    router.push(`/apps/${bundleId}/${batchId}`);
  };

  if (loading || !batchStats) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Batch Security Scans</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateBatch('prev')}
            disabled={availableBatches.findIndex(b => b.id === currentBatchId) === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <select
            className="w-60 p-2 border rounded"
            value={currentBatchId?.toString() || ''}
            onChange={(e) => handleBatchChange(e.target.value)}
          >
            {availableBatches.map((batch) => (
              <option key={batch.id} value={batch.id.toString()}>
                Batch {batch.id} - {formatDate(batch.batch_date)}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateBatch('next')}
            disabled={availableBatches.findIndex(b => b.id === currentBatchId) === availableBatches.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlatformGrid 
          platform="android" 
          stats={batchStats.current.android} 
          onAppClick={handleAppClick}
          currentBatchId={currentBatchId}
        />
        <PlatformGrid 
          platform="ios" 
          stats={batchStats.current.ios} 
          onAppClick={handleAppClick}
          currentBatchId={currentBatchId}
        />
      </div>
    </div>
  );
}