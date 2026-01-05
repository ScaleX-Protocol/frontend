import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { InterestRateParams } from '../types/lending.types';

interface InterestRateChartProps {
  interestRateParams: InterestRateParams;
  currentUtilizationRate?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      utilization: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  if (active && payload && payload[0]) {
    return (
      <div className="bg-[#2C2C2C] border border-[#3A3A3A] rounded-lg p-3">
        <p className="text-white text-sm">
          Utilization: {payload[0].payload.utilization}%
        </p>
        <p className="text-green-400 text-sm font-medium">
          Borrow Rate: {formatPercent(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function InterestRateChart({ interestRateParams, currentUtilizationRate }: InterestRateChartProps) {
  const chartData = useMemo(() => {
    const { baseRate, optimalUtilization, rateSlope1, rateSlope2 } = interestRateParams;

    // Parse percentage strings to decimal values
    const baseRateNum = parseFloat(baseRate.replace('%', ''));
    const optimalUtil = parseFloat(optimalUtilization.replace('%', ''));
    const slope1 = parseFloat(rateSlope1.replace('%', ''));
    const slope2 = parseFloat(rateSlope2.replace('%', ''));

    // Calculate rate at optimal utilization
    // The slope represents how much the rate increases per 100% utilization above base rate
    const rateAtOptimal = baseRateNum + (optimalUtil * slope1 / 100);

    console.log('Parsed values:', { baseRateNum, optimalUtil, slope1, slope2, rateAtOptimal });

    // Generate more points for smoother visualization of the kink
    const data: { utilization: number; borrowRate: number }[] = [];

    // Points from 0% to just before optimal
    for (let util = 0; util <= optimalUtil - 0.1; util += 5) {
      const rate = baseRateNum + (util * slope1 / 100);
      data.push({
        utilization: util,
        borrowRate: rate,
      });
    }

    // Kink point
    data.push({
      utilization: optimalUtil,
      borrowRate: rateAtOptimal,
    });

    // Points from just after optimal to 100%
    for (let util = optimalUtil + 0.1; util <= 100; util += 5) {
      const excessUtil = util - optimalUtil;
      const rate = rateAtOptimal + (excessUtil * slope2 / 100);
      data.push({
        utilization: util,
        borrowRate: rate,
      });
    }

    // Add the exact end point
    data.push({
      utilization: 100,
      borrowRate: rateAtOptimal + ((100 - optimalUtil) * slope2 / 100),
    });

    return data;
  }, [interestRateParams]);

  // Prepare enhanced chart data with marker points
  const chartDataWithMarkers = useMemo(() => {
    const data = [...chartData];

    // Add optimal utilization marker
    const baseRateNum = parseFloat(interestRateParams.baseRate.replace('%', ''));
    const optimalUtilValue = parseFloat(interestRateParams.optimalUtilization.replace('%', ''));
    const slope1 = parseFloat(interestRateParams.rateSlope1.replace('%', ''));
    const rateAtOptimal = baseRateNum + (optimalUtilValue * slope1 / 100);

    data.push({
      utilization: optimalUtilValue,
      borrowRate: rateAtOptimal,
      marker: 'optimal' as const,
    } as { utilization: number; borrowRate: number; marker?: 'optimal' | 'current' });

    // Add current utilization marker if available
    const currentUtil = currentUtilizationRate
      ? parseFloat(String(currentUtilizationRate).replace('%', '').trim())
      : null;

    if (currentUtil !== null && !isNaN(currentUtil)) {
      const slope2 = parseFloat(interestRateParams.rateSlope2.replace('%', ''));
      const currentRate = currentUtil <= optimalUtilValue
        ? baseRateNum + (currentUtil * slope1 / 100)
        : rateAtOptimal + ((currentUtil - optimalUtilValue) * slope2 / 100);

      data.push({
        utilization: currentUtil,
        borrowRate: currentRate,
        marker: 'current' as const,
      } as { utilization: number; borrowRate: number; marker?: 'optimal' | 'current' });
    }

    return data.sort((a, b) => a.utilization - b.utilization);
  }, [chartData, interestRateParams, currentUtilizationRate]);

  // Calculate current utilization for display
  const currentUtilData = useMemo(() => {
    const currentUtil = currentUtilizationRate
      ? parseFloat(String(currentUtilizationRate).replace('%', '').trim())
      : null;

    if (currentUtil === null || isNaN(currentUtil)) return [];

    const baseRateNum = parseFloat(interestRateParams.baseRate.replace('%', ''));
    const optimalUtilValue = parseFloat(interestRateParams.optimalUtilization.replace('%', ''));
    const slope1 = parseFloat(interestRateParams.rateSlope1.replace('%', ''));
    const slope2 = parseFloat(interestRateParams.rateSlope2.replace('%', ''));
    const rateAtOptimal = baseRateNum + (optimalUtilValue * slope1 / 100);

    const currentRate = currentUtil <= optimalUtilValue
      ? baseRateNum + (currentUtil * slope1 / 100)
      : rateAtOptimal + ((currentUtil - optimalUtilValue) * slope2 / 100);

    return [{
      utilization: currentUtil,
      borrowRate: currentRate,
    }];
  }, [interestRateParams, currentUtilizationRate]);

  // Find the rate at optimal utilization for the kink point
  const optimalUtilValue = parseFloat(interestRateParams.optimalUtilization.replace('%', ''));
  const baseRateNum = parseFloat(interestRateParams.baseRate.replace('%', ''));

  return (
    <div className="w-full">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartDataWithMarkers}
          margin={{
            top: 10,
            right: 20,
            left: 10,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#3A3A3A" />
          <XAxis
            dataKey="utilization"
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            label={{ value: 'Pool Utilization (%)', position: 'insideBottom', offset: -10, fill: '#9CA3AF', fontSize: 13 }}
          />
          <YAxis
            stroke="#9CA3AF"
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(value) => `${value}%`}
            domain={[0, 'auto']}
            allowDataOverflow={false}
            label={{ value: 'Interest Rate (%)', angle: -90, position: 'insideLeft', offset: 10, fill: '#9CA3AF', fontSize: 13 }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Reference line for current utilization */}
          {currentUtilData.length > 0 && (
            <ReferenceLine
              x={currentUtilData[0].utilization}
              stroke="#8B5CF6"
              strokeDasharray="3 3"
            />
          )}

          {/* Reference line for optimal utilization */}
          <ReferenceLine
            x={optimalUtilValue}
            stroke="#F59E0B"
            strokeDasharray="5 5"
          />

          {/* Reference line for base rate */}
          <ReferenceLine
            y={baseRateNum}
            stroke="#6366F1"
            strokeDasharray="3 3"
            label={{
              value: `Base: ${interestRateParams.baseRate}`,
              position: "left",
              fill: "#6366F1",
              fontSize: 11,
            }}
          />

          {/* Main line with kink and markers */}
          <Line
            type="linear"
            dataKey="borrowRate"
            stroke="#10B981"
            strokeWidth={3}
            name="Borrow Rate"
            connectNulls={false}
            dot={(props: { cx?: number; cy?: number; payload?: { isKink?: boolean; isCurrent?: boolean; marker?: 'optimal' | 'current' } }) => {
              const { cx, cy, payload } = props;

              // Show colored dots only for marker points
              if (payload?.marker === 'optimal') {
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#F59E0B"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }

              if (payload?.marker === 'current') {
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#8B5CF6"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }

              // No dot for regular points
              return null;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>

      {/* Legend and Parameters */}
      <div className="mt-2 bg-[#1A1A1A] rounded-lg p-2.5">
        {/* Chart Markers Legend */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs mb-2 pb-2 border-b border-[#3A3A3A]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] border-2 border-white"></div>
            <span className="text-gray-400 whitespace-nowrap">
              Current {currentUtilData.length > 0 ? `(${currentUtilData[0].utilization.toFixed(1)}%)` : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] border-2 border-white"></div>
            <span className="text-gray-400 whitespace-nowrap">
              Optimal ({optimalUtilValue}%)
            </span>
          </div>
        </div>

        {/* Interest Rate Parameters */}
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">Base Rate</span>
            <span className="text-white font-medium">{interestRateParams.baseRate}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">Optimal Util</span>
            <span className="text-white font-medium">{interestRateParams.optimalUtilization}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">Slope 1</span>
            <span className="text-white font-medium">{interestRateParams.rateSlope1}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-400">Slope 2</span>
            <span className="text-white font-medium">{interestRateParams.rateSlope2}</span>
          </div>
        </div>
      </div>
    </div>
  );
}