// app/components/charts/StyledAreaChart.tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const defaultTooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '8px'
};

interface AreaConfig {
  dataKey: string;
  color: string;
  name: string;
  stackId?: string;
}

interface StyledAreaChartProps {
  data: any[];
  areas: AreaConfig[];
  xAxisDataKey: string;
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipLabelFormatter?: (value: any) => string;
  height?: number;
  onClick?: (data: any) => void;
  stackOffset?: 'none' | 'expand' | 'diverging' | 'silhouette' | 'wiggle';
}

export function StyledAreaChart({
  data,
  areas,
  xAxisDataKey,
  xAxisFormatter,
  yAxisFormatter,
  tooltipLabelFormatter,
  height = 400,
  onClick,
  stackOffset
}: StyledAreaChartProps) {
  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <ResponsiveContainer>
        <AreaChart data={data} onClick={onClick} stackOffset={stackOffset}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xAxisDataKey}
            stroke="#6b7280"
            tickFormatter={xAxisFormatter}
          />
          <YAxis
            stroke="#6b7280"
            tickFormatter={yAxisFormatter}
          />
          <Tooltip
            labelFormatter={tooltipLabelFormatter}
            contentStyle={defaultTooltipStyle}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="square"
          />
          {areas.map((area) => (
            <Area
              key={area.dataKey}
              type="linear"
              dataKey={area.dataKey}
              stackId={area.stackId}
              stroke={area.color}
              fill={area.color}
              name={area.name}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}