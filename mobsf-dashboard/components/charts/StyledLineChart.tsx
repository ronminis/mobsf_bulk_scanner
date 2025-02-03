// app/components/charts/StyledLineChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const defaultTooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  padding: '8px'
};

const defaultDotStyle = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  r: 4,
  fill: '#ffffff'
});

const defaultActiveDotStyle = (color: string) => ({
  stroke: color,
  strokeWidth: 2,
  r: 6,
  fill: '#ffffff'
});

interface LineConfig {
  dataKey: string;
  color: string;
  name: string;
  yAxisId?: string;
}

interface StyledLineChartProps {
  data: any[];
  lines: LineConfig[];
  xAxisDataKey: string;
  xAxisFormatter?: (value: any) => string;
  yAxisFormatter?: (value: any) => string;
  tooltipLabelFormatter?: (value: any) => string;
  height?: number;
  onClick?: (data: any) => void;
}

export function StyledLineChart({
  data,
  lines,
  xAxisDataKey,
  xAxisFormatter,
  yAxisFormatter,
  tooltipLabelFormatter,
  height = 400,
  onClick
}: StyledLineChartProps) {
  return (
    <div style={{ height: `${height}px`, width: '100%' }}>
      <ResponsiveContainer>
        <LineChart data={data} onClick={onClick}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xAxisDataKey}
            stroke="#6b7280"
            tickFormatter={xAxisFormatter}
          />
          <YAxis
            yAxisId="left"
            stroke="#6b7280"
            tickFormatter={yAxisFormatter}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#6b7280"
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
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="linear"
              dataKey={line.dataKey}
              stroke={line.color}
              name={line.name}
              yAxisId={line.yAxisId || "left"}
              strokeWidth={2}
              dot={defaultDotStyle(line.color)}
              activeDot={defaultActiveDotStyle(line.color)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}