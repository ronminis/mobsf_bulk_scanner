'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { StyledLineChart } from '@/components/charts/StyledLineChart';

type ScanData = {
  app_name: string;
  bundle_id: string;
  security_score: number;
  high_findings: number;
  warning_findings: number;
  info_findings: number;
  pdf_path: string;
  batch_date: string;
  platform: string;
};

type HistoryData = {
  security_score: number;
  high_findings: number;
  warning_findings: number;
  info_findings: number;
  batch_date: string;
};

export default function AppDetails() {
  const params = useParams();
  const [currentScan, setCurrentScan] = useState<ScanData | null>(null);
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/apps/${params.bundleId}?batchId=${params.batchId}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setCurrentScan(data.currentScan);
        setHistory(data.history);
      } catch (error) {
        console.error('Error fetching app data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.bundleId, params.batchId]);

  const handleDownload = () => {
    if (currentScan?.pdf_path) {
      window.open(`/api/files/${currentScan.pdf_path}`, '_blank');
    }
  };

  const chartLines = [
    {
      dataKey: "security_score",
      color: "#4f46e5",
      name: "Security Score",
      yAxisId: "left"
    },
    {
      dataKey: "high_findings",
      color: "#dc2626",
      name: "High Risk Findings",
      yAxisId: "right"
    },
    {
      dataKey: "warning_findings",
      color: "#f59e0b",
      name: "Warning Findings",
      yAxisId: "right"
    }
  ];

  if (loading || !currentScan) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{currentScan.app_name}</h1>
        <p className="text-gray-600">{currentScan.bundle_id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              currentScan.security_score >= 90 ? 'text-green-600' :
              currentScan.security_score >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {currentScan.security_score}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              High Risk Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {currentScan.high_findings}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Warning Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {currentScan.warning_findings}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Info Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {currentScan.info_findings}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mb-6">
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>App Security Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <StyledLineChart
            data={history}
            lines={chartLines}
            xAxisDataKey="batch_date"
            xAxisFormatter={(date) => new Date(date).toLocaleDateString()}
            tooltipLabelFormatter={(date) => new Date(date).toLocaleDateString()}
            height={400}
          />
        </CardContent>
      </Card>
    </div>
  );
}