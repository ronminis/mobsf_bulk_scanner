// app/inventory/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

type App = {
  app_name: string;
  bundle_id: string;
  platform: string;
  security_score: number;
  high_findings: number;
  warning_findings: number;
  info_findings: number;
  batch_id: number;
  batch_date: string;
  icon_path: string;
};

const DEFAULT_PLATFORM_ICONS = {
  android: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 505.145 505.145" className="h-5 w-5 ml-2 flex-shrink-0" fill="currentColor">
      <g>
        <path d="m68.541 164.715h-1.294c-16.588 0-30.113 13.568-30.113 30.113v131.107c0 16.61 13.525 30.134 30.113 30.134h1.316c16.588 0 30.113-13.568 30.113-30.134v-131.108c-0.022-16.544-13.568-30.112-30.135-30.112z"/>
        <path d="m113.085 376.54c0 15.229 12.446 27.632 27.675 27.632h29.574v70.817c0 16.631 13.568 30.156 30.113 30.156h1.294c16.61 0 30.156-13.546 30.156-30.156v-70.817h41.33v70.817c0 16.631 13.611 30.156 30.156 30.156h1.273c16.609 0 30.134-13.546 30.134-30.156v-70.817h29.595c15.207 0 27.654-12.403 27.654-27.632v-207.979h-278.954v207.979z"/>
        <path d="m322.041 43.983l23.491-36.26c1.51-2.287 0.841-5.414-1.467-6.903-2.286-1.51-5.414-0.884-6.903 1.467l-24.353 37.512c-18.27-7.485-38.676-11.691-60.226-11.691-21.571 0-41.934 4.206-60.247 11.691l-24.31-37.512c-1.489-2.351-4.638-2.977-6.946-1.467-2.308 1.488-2.977 4.616-1.467 6.903l23.512 36.26c-42.387 20.773-70.968 59.924-70.968 104.834 0 2.761 0.173 5.479 0.41 8.175h280.053c0.237-2.696 0.388-5.414 0.388-8.175 1e-3 -44.91-28.602-84.061-70.967-104.834zm-134.386 66.213c-7.442 0-13.482-5.997-13.482-13.46s6.04-13.439 13.482-13.439c7.485 0 13.482 5.975 13.482 13.439s-6.041 13.46-13.482 13.46zm129.835 0c-7.442 0-13.482-5.997-13.482-13.46s6.04-13.439 13.482-13.439c7.463 0 13.46 5.975 13.46 13.439s-5.997 13.46-13.46 13.46z"/>
        <path d="m437.876 164.715h-1.251c-16.588 0-30.156 13.568-30.156 30.113v131.107c0 16.61 13.59 30.134 30.156 30.134h1.273c16.609 0 30.113-13.568 30.113-30.134v-131.108c0-16.544-13.547-30.112-30.135-30.112z"/>
      </g>
    </svg>
  ),
  ios: (
    <svg viewBox="0 0 384 512" className="h-5 w-5 ml-2 flex-shrink-0" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  )
};

const AppCard = ({ app, onClick }: { app: App; onClick: () => void }) => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-600';
      if (score >= 70) return 'text-yellow-600';
      return 'text-red-600';
    };
  
    return (
      <Card 
        className="hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center group-hover:text-blue-600 transition-colors">
            <div className="flex items-center gap-2">
              {app.icon_path ? (
                <img 
                  src={`/api/files/${app.icon_path}`}
                  alt={`${app.app_name} icon`}
                  className="w-8 h-8 rounded"
                />
              ) : null}
              <div className="truncate" title={app.app_name}>{app.app_name}</div>
            </div>
            {DEFAULT_PLATFORM_ICONS[app.platform.toLowerCase() as keyof typeof DEFAULT_PLATFORM_ICONS]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 mb-2 truncate" title={app.bundle_id}>
            {app.bundle_id}
          </div>
          <div className="flex justify-between items-center">
            <div className={`font-bold ${getScoreColor(app.security_score)}`}>
              Score: {app.security_score}%
            </div>
            {app.high_findings > 0 && (
              <div className="text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                {app.high_findings}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
const PlatformSection = ({ title, icon, apps, onAppClick }: { 
  title: string;
  icon: React.ReactNode;
  apps: App[];
  onAppClick: (app: App) => void;
}) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-xl font-semibold">{title} Apps ({apps.length})</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {apps.map((app) => (
        <AppCard
          key={app.bundle_id}
          app={app}
          onClick={() => onAppClick(app)}
        />
      ))}
    </div>
  </div>
);

export default function AppInventory() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await fetch('/api/apps/inventory');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch apps');
        }
        
        setApps(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching apps:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch apps');
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, []);

  const handleAppClick = (app: App) => {
    router.push(`/apps/${app.bundle_id}/${app.batch_id}`);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  const androidApps = apps.filter(app => app.platform.toLowerCase() === 'android')
    .sort((a, b) => a.app_name.localeCompare(b.app_name));
  const iosApps = apps.filter(app => app.platform.toLowerCase() === 'ios')
    .sort((a, b) => a.app_name.localeCompare(b.app_name));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">App Inventory</h1>

      <PlatformSection
        title="Android"
        icon={DEFAULT_PLATFORM_ICONS.android}
        apps={androidApps}
        onAppClick={handleAppClick}
      />

      <PlatformSection
        title="iOS"
        icon={DEFAULT_PLATFORM_ICONS.ios}
        apps={iosApps}
        onAppClick={handleAppClick}
      />
    </div>
  );
}