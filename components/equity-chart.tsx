import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Line, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useColors } from '@/hooks/use-colors';

interface ChartDataPoint {
  date: string;
  equity: number;
  pnl?: number;
}

interface EquityChartProps {
  data: ChartDataPoint[];
  width: number;
  height?: number;
  showArea?: boolean;
}

export function EquityChart({ data, width, height = 200, showArea = true }: EquityChartProps) {
  const colors = useColors();
  const padding = { top: 20, right: 16, bottom: 30, left: 60 };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const equities = data.map(d => d.equity);
    const minY = Math.min(...equities);
    const maxY = Math.max(...equities);
    const range = maxY - minY || 1;
    const yPadding = range * 0.1;

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const adjustedMin = minY - yPadding;
    const adjustedMax = maxY + yPadding;
    const adjustedRange = adjustedMax - adjustedMin;

    const points = data.map((d, i) => ({
      x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
      y: padding.top + chartHeight - ((d.equity - adjustedMin) / adjustedRange) * chartHeight,
      ...d,
    }));

    // Line path
    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    // Area path
    const areaPath = linePath +
      ` L ${points[points.length - 1].x} ${padding.top + chartHeight}` +
      ` L ${points[0].x} ${padding.top + chartHeight} Z`;

    // Y axis labels (5 ticks)
    const yLabels = Array.from({ length: 5 }, (_, i) => {
      const value = adjustedMin + (adjustedRange * i) / 4;
      const y = padding.top + chartHeight - (i / 4) * chartHeight;
      return { value, y };
    });

    // X axis labels (max 5)
    const step = Math.max(1, Math.floor(data.length / 4));
    const xLabels = data
      .filter((_, i) => i % step === 0 || i === data.length - 1)
      .map((d) => ({
        label: d.date.slice(5), // MM-DD
        x: padding.left + ((data.indexOf(d)) / Math.max(data.length - 1, 1)) * chartWidth,
      }));

    // Overall trend
    const isPositive = data[data.length - 1].equity >= data[0].equity;

    return { points, linePath, areaPath, yLabels, xLabels, chartWidth, chartHeight, isPositive };
  }, [data, width, height]);

  if (!chartData) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>데이터 없음</Text>
      </View>
    );
  }

  const lineColor = chartData.isPositive ? colors.success : colors.error;

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {chartData.yLabels.map((label, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={label.y}
            x2={padding.left + chartData.chartWidth}
            y2={label.y}
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}

        {/* Area fill */}
        {showArea && (
          <Path d={chartData.areaPath} fill="url(#areaGradient)" />
        )}

        {/* Line */}
        <Path d={chartData.linePath} stroke={lineColor} strokeWidth={2} fill="none" />

        {/* Y axis labels */}
        {chartData.yLabels.map((label, i) => (
          <SvgText
            key={i}
            x={padding.left - 8}
            y={label.y + 4}
            fill={colors.muted}
            fontSize={10}
            textAnchor="end"
          >
            {formatCompactNumber(label.value)}
          </SvgText>
        ))}

        {/* X axis labels */}
        {chartData.xLabels.map((label, i) => (
          <SvgText
            key={i}
            x={label.x}
            y={height - 8}
            fill={colors.muted}
            fontSize={10}
            textAnchor="middle"
          >
            {label.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

function formatCompactNumber(n: number): string {
  if (Math.abs(n) >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (Math.abs(n) >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString();
}
