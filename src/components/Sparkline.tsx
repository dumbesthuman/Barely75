interface SparklineProps {
  data: number[];
  target: number;
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline = ({ data, target, width = 80, height = 28, color }: SparklineProps) => {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden="true">
        <line
          x1={0} y1={height / 2}
          x2={width} y2={height / 2}
          stroke="var(--color-divider)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
      </svg>
    );
  }

  const min = 0;
  const max = 100;
  const range = max - min;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y, value };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  // Area fill path
  const areaD =
    pathD +
    ` L ${points[points.length - 1]!.x} ${height} L ${points[0]!.x} ${height} Z`;

  const targetY = height - ((target - min) / range) * height;
  const lineColor = color ?? "var(--color-primary)";
  const lastPoint = points[points.length - 1]!;
  const isAboveTarget = (lastPoint.value ?? 0) >= target;

  return (
    <svg width={width} height={height} aria-hidden="true" style={{ overflow: "visible" }}>
      {/* Target line */}
      <line
        x1={0}
        y1={targetY}
        x2={width}
        y2={targetY}
        stroke={isAboveTarget ? "var(--color-success)" : "var(--color-danger)"}
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity={0.5}
      />

      {/* Area gradient fill */}
      <defs>
        <linearGradient id={`sparkline-fill-${color ?? "default"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path
        d={areaD}
        fill={`url(#sparkline-fill-${color ?? "default"})`}
      />

      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Last data point dot */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r={2.5}
        fill={lineColor}
      />
    </svg>
  );
};
