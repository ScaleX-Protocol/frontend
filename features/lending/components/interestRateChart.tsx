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

export default function InterestRateChart({ interestRateParams }: InterestRateChartProps) {
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
    const data = [];

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

    console.log('Chart data:', data);
    return data;
  }, [interestRateParams]);

  // Find the rate at optimal utilization for the kink point
  const optimalUtilValue = parseFloat(interestRateParams.optimalUtilization.replace('%', ''));
  const baseRateNum = parseFloat(interestRateParams.baseRate.replace('%', ''));
  const slope1 = parseFloat(interestRateParams.rateSlope1.replace('%', ''));
  const rateAtOptimal = baseRateNum + (optimalUtilValue * slope1 / 100);

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 40,
            bottom: 40,
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
            label={{ value: 'Interest Rate (%)', angle: -90, position: 'insideLeft', offset: -10, fill: '#9CA3AF', fontSize: 13 }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Reference line for optimal utilization */}
          <ReferenceLine
            x={optimalUtilValue}
            stroke="#F59E0B"
            strokeDasharray="5 5"
            label={{
              value: "Optimal",
              position: "top",
              fill: "#F59E0B",
              fontSize: 12,
            }}
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

          {/* Main line with kink */}
          <Line
            type="linear"
            data={chartData}
            dataKey="borrowRate"
            stroke="#10B981"
            strokeWidth={3}
            dot={false}
            name="Borrow Rate"
            connectNulls={false}
          />

          {/* Highlight the kink point (optimal utilization) */}
          <Line
            data={[{
              utilization: optimalUtilValue,
              borrowRate: rateAtOptimal
            }]}
            type="monotone"
            dataKey="borrowRate"
            stroke="#10B981"
            strokeWidth={0}
            dot={{ fill: "#F59E0B", r: 6, strokeWidth: 2, stroke: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend for the parameters */}
      <div className="mt-4 bg-[#1A1A1A] rounded-lg p-3">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs mb-1">Base Rate</span>
            <span className="text-white font-medium">{interestRateParams.baseRate}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs mb-1">Optimal Utl</span>
            <span className="text-white font-medium">{interestRateParams.optimalUtilization}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs mb-1">Slope 1</span>
            <span className="text-white font-medium">{interestRateParams.rateSlope1}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs mb-1">Slope 2</span>
            <span className="text-white font-medium">{interestRateParams.rateSlope2}</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-[#3A3A3A] text-xs text-gray-400">
          <p>• Below optimal: Base Rate + (Util × Slope 1)</p>
          <p>• Above optimal: Rate at Optimal + (Excess Util × Slope 2)</p>
        </div>
      </div>
    </div>
  );
}