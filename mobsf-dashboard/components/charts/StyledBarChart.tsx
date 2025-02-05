// app/components/charts/StyledBarChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const defaultTooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '8px'
};

interface BarConfig {
  dataKey: string;
  color: string;
  name: string;
}

interface StyledBarChartProps {
  data: any[];
  bars: BarConfig[];
  xAxisDataKey: string;
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipLabelFormatter?: (value: any) => string;
  height?: number;
  onClick?: (data: any) => void;
}

export function StyledBarChart({
  data,
  bars,
  xAxisDataKey,
  xAxisFormatter,
  yAxisFormatter,
  tooltipLabelFormatter,
  height = 400,
  onClick
}: StyledBarChartProps) {
  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <ResponsiveContainer>
        <BarChart data={data} onClick={onClick}>
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
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.color}
              name={bar.name}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}