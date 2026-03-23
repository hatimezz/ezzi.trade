'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type ChartDataPoint = Record<string, string | number>;

interface SeriesConfig {
  key: string;
  color: string;
  name?: string;
}

interface AdminChartProps {
  type: 'area' | 'bar' | 'line';
  data: ChartDataPoint[];
  series: SeriesConfig[];
  xKey: string;
  height?: number;
  stacked?: boolean;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

interface AdminPieChartProps {
  data: PieDataPoint[];
  height?: number;
}

const TOOLTIP_STYLE = {
  background: '#08081a',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  color: '#e8eaf0',
  fontSize: '12px',
};

export function AdminChart({
  type,
  data,
  series,
  xKey,
  height = 280,
  stacked = false,
}: AdminChartProps) {
  const common = {
    margin: { top: 5, right: 10, left: -10, bottom: 5 },
  };

  const axisProps = {
    tick: { fill: '#4a5568', fontSize: 11, fontFamily: 'Space Mono, monospace' },
    axisLine: { stroke: 'rgba(255,255,255,0.05)' },
    tickLine: false as const,
  };

  const gridProps = {
    strokeDasharray: '3 3' as const,
    stroke: 'rgba(255,255,255,0.04)',
    vertical: false,
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'area' ? (
        <AreaChart data={data} {...common}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#8892a0' }} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name ?? s.key}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </AreaChart>
      ) : type === 'bar' ? (
        <BarChart data={data} {...common}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#8892a0' }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name ?? s.key}
              fill={s.color}
              radius={[3, 3, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </BarChart>
      ) : (
        <LineChart data={data} {...common}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={xKey} {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#8892a0' }} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name ?? s.key}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}

export function AdminPieChart({ data, height = 260 }: AdminPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="75%"
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={`cell-${i}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#8892a0' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
