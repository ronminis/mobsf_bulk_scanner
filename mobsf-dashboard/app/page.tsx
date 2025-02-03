// app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StyledAreaChart } from '@/components/charts/StyledAreaChart';
import { StyledLineChart } from '@/components/charts/StyledLineChart';
import { StyledBarChart } from '@/components/charts/StyledBarChart';
import { ArrowRight } from 'lucide-react'; 

type DashboardData = {
  batchId: number;
  batchDate: string;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  avgScore: number;
  androidHighRisk: number;
  iosHighRisk: number;
};

export default function Home() {
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard-data');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedBatchId = data.activePayload[0].payload.batchId;
      router.push(`/batches?id=${clickedBatchId}`);
    }
  };

  const riskAreas = [
    {
      dataKey: "highRisk",
      color: "#dc2626",
      name: "High Risk",
      stackId: "1"
    },
    {
      dataKey: "mediumRisk",
      color: "#f59e0b",
      name: "Medium Risk",
      stackId: "1"
    },
    {
      dataKey: "lowRisk",
      color: "#10b981",
      name: "Low Risk",
      stackId: "1"
    }
  ];

  const trendLines = [
    {
      dataKey: "highRisk",
      color: "#dc2626",
      name: "High-Risk Findings",
      yAxisId: "left"
    },
    {
      dataKey: "avgScore",
      color: "#4f46e5",
      name: "Avg Security Score",
      yAxisId: "right"
    }
  ];

  const platformBars = [
    {
      dataKey: "androidHighRisk",
      color: "#22c55e",
      name: "Android High-Risk"
    },
    {
      dataKey: "iosHighRisk",
      color: "#3b82f6",
      name: "iOS High-Risk"
    }
  ];
  
  return (
    <main className="min-h-screen bg-background text-foreground p-6">
      <div className="mb-8 flex items-center gap-4">
        <h1 className="text-2xl font-bold">BNHP Mobile Apps Scanner Dashboard</h1>
        <Link 
          href="/batches" 
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          View Batches
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <StyledAreaChart
              data={dashboardData}
              areas={riskAreas}
              xAxisDataKey="batchDate"
              height={320}
              onClick={handleChartClick}
              stackOffset="expand"
              yAxisFormatter={(tick) => `${(tick * 100).toFixed(0)}%`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>High-Risk Findings vs Average Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <StyledLineChart
              data={dashboardData}
              lines={trendLines}
              xAxisDataKey="batchDate"
              height={320}
              onClick={handleChartClick}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Platform Comparison: High-Risk Findings</CardTitle>
        </CardHeader>
        <CardContent>
          <StyledBarChart
            data={dashboardData}
            bars={platformBars}
            xAxisDataKey="batchDate"
            height={320}
            onClick={handleChartClick}
          />
        </CardContent>
      </Card>
    </main>
  );
}